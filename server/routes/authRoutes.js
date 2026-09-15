const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateToken, authenticateToken, logAudit } = require('../auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' });
  }

  const user = db.prepare(`
    SELECT u.id, u.username, u.password_hash, u.full_name_en, u.full_name_ne, u.mobile, u.email,
           u.role_id, r.code as role_code, r.name_en as role_name_en, r.name_ne as role_name_ne,
           u.is_active, u.branch, u.custom_permissions_json
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE LOWER(u.username) = LOWER(?)
  `).get(username.trim());

  if (!user) {
    logAudit('AUTH', username, 'LOGIN_FAILED', req, { reason: 'User not found' });
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  if (user.is_active !== 1) {
    logAudit('AUTH', username, 'LOGIN_BLOCKED', req, { reason: 'Account disabled' });
    return res.status(403).json({ success: false, error: 'Account is deactivated. Contact administrator.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    logAudit('AUTH', username, 'LOGIN_FAILED', req, { reason: 'Incorrect password' });
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  }

  // Update last login
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  // Collect effective permissions
  const rolePerms = db.prepare(`
    SELECT p.code FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `).all(user.role_id).map(p => p.code);

  let customPerms = [];
  try {
    customPerms = JSON.parse(user.custom_permissions_json || '[]');
  } catch (e) {
    customPerms = [];
  }

  const isSuperAdmin = user.role_code === 'SUPER_ADMIN';
  const effectivePermissions = isSuperAdmin ? ['*'] : Array.from(new Set(rolePerms.concat(customPerms)));

  const token = generateToken(user);

  logAudit('AUTH', user.id, 'LOGIN_SUCCESS', { user, headers: req.headers, socket: req.socket }, {
    username: user.username,
    role: user.role_code
  });

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      fullNameEn: user.full_name_en,
      fullNameNe: user.full_name_ne,
      roleCode: user.role_code,
      roleNameEn: user.role_name_en,
      roleNameNe: user.role_name_ne,
      branch: user.branch,
      email: user.email,
      mobile: user.mobile,
      isSuperAdmin,
      permissions: effectivePermissions
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      fullNameEn: req.user.full_name_en,
      fullNameNe: req.user.full_name_ne,
      roleCode: req.user.role_code,
      roleNameEn: req.user.role_name_en,
      roleNameNe: req.user.role_name_ne,
      branch: req.user.branch,
      email: req.user.email,
      mobile: req.user.mobile,
      isSuperAdmin: req.user.isSuperAdmin,
      permissions: req.user.permissions
    }
  });
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  logAudit('AUTH', req.user.id, 'LOGOUT', req, { username: req.user.username });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
