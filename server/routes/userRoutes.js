const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, requirePermission, logAudit } = require('../auth');

// GET /api/users - List users
router.get('/', authenticateToken, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.full_name_en, u.full_name_ne, u.mobile, u.email,
           u.role_id, r.code as role_code, r.name_en as role_name_en, r.name_ne as role_name_ne,
           u.is_active, u.branch, u.custom_permissions_json, u.last_login, u.created_at
    FROM users u
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.id ASC
  `).all();

  const formatted = users.map(u => {
    let customPerms = [];
    try {
      customPerms = JSON.parse(u.custom_permissions_json || '[]');
    } catch (e) {
      customPerms = [];
    }
    return { ...u, custom_permissions: customPerms };
  });

  return res.json({ success: true, users: formatted });
});

// GET /api/users/roles - List all roles
router.get('/roles', authenticateToken, (req, res) => {
  const roles = db.prepare('SELECT id, code, name_en, name_ne, description FROM roles ORDER BY id ASC').all();
  return res.json({ success: true, roles });
});

// GET /api/users/permissions - List all permissions grouped by category
router.get('/permissions', authenticateToken, (req, res) => {
  const perms = db.prepare('SELECT id, code, category, name_en, name_ne, description FROM permissions ORDER BY category, id').all();
  return res.json({ success: true, permissions: perms });
});

// POST /api/users - Create new user
router.post('/', authenticateToken, requirePermission('user:manage'), (req, res) => {
  const { username, password, full_name_en, full_name_ne, mobile, email, role_id, branch, custom_permissions } = req.body;

  if (!username || !password || !full_name_en || !role_id) {
    return res.status(400).json({ success: false, error: 'Username, password, full name, and role are required.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim());
  if (existing) {
    return res.status(400).json({ success: false, error: `Username '${username}' is already taken.` });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const customPermsJson = JSON.stringify(Array.isArray(custom_permissions) ? custom_permissions : []);

  const result = db.prepare(`
    INSERT INTO users (username, password_hash, full_name_en, full_name_ne, mobile, email, role_id, is_active, branch, custom_permissions_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    username.trim(),
    hash,
    full_name_en.trim(),
    (full_name_ne || full_name_en).trim(),
    mobile || '',
    email || '',
    role_id,
    branch || 'Head Office',
    customPermsJson
  );

  logAudit('USER', result.lastInsertRowid, 'CREATE_USER', req, {
    username,
    role_id,
    branch
  });

  return res.json({ success: true, message: `User '${username}' created successfully.`, userId: result.lastInsertRowid });
});

// PUT /api/users/:id - Update user details, role, status, and permissions
router.put('/:id', authenticateToken, requirePermission('user:manage'), (req, res) => {
  const { id } = req.params;
  const { full_name_en, full_name_ne, mobile, email, role_id, is_active, branch, custom_permissions } = req.body;

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!target) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  // Prevent disabling the current super admin user if it's the user editing themselves
  if (parseInt(id) === req.user.id && is_active === 0) {
    return res.status(400).json({ success: false, error: 'Cannot deactivate your own active session.' });
  }

  const customPermsJson = custom_permissions !== undefined 
    ? JSON.stringify(Array.isArray(custom_permissions) ? custom_permissions : [])
    : target.custom_permissions_json;

  db.prepare(`
    UPDATE users SET
      full_name_en = ?,
      full_name_ne = ?,
      mobile = ?,
      email = ?,
      role_id = ?,
      is_active = ?,
      branch = ?,
      custom_permissions_json = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    full_name_en || target.full_name_en,
    full_name_ne || target.full_name_ne,
    mobile !== undefined ? mobile : target.mobile,
    email !== undefined ? email : target.email,
    role_id || target.role_id,
    is_active !== undefined ? (is_active ? 1 : 0) : target.is_active,
    branch || target.branch,
    customPermsJson,
    id
  );

  logAudit('USER', id, 'UPDATE_USER', req, {
    target_username: target.username,
    updated_role_id: role_id,
    is_active
  });

  return res.json({ success: true, message: 'User updated successfully.' });
});

// PUT /api/users/:id/password - Reset password
router.put('/:id/password', authenticateToken, requirePermission('user:manage'), (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  const target = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  if (!target) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(new_password, salt);

  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, id);

  logAudit('USER', id, 'PASSWORD_RESET', req, { target_username: target.username });

  return res.json({ success: true, message: `Password for user '${target.username}' reset successfully.` });
});

module.exports = router;
