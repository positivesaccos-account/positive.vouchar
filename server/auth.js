const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'positive_saccos_secure_key_2082_nepal_audit_control';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role_code,
      fullName: user.full_name_en,
      fullNameNe: user.full_name_ne
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please login.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Session expired or invalid token.' });
    }

    // Fetch fresh user data with role and permissions
    const user = db.prepare(`
      SELECT u.id, u.username, u.full_name_en, u.full_name_ne, u.mobile, u.email, 
             u.role_id, r.code as role_code, r.name_en as role_name_en, r.name_ne as role_name_ne,
             u.is_active, u.branch, u.custom_permissions_json
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(decoded.id);

    if (!user || user.is_active !== 1) {
      return res.status(403).json({ success: false, error: 'User account is inactive or disabled.' });
    }

    // Get assigned role permissions
    const rolePerms = db.prepare(`
      SELECT p.code FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `).all(user.role_id).map(p => p.code);

    // Merge with user custom permissions
    let customPerms = [];
    try {
      customPerms = JSON.parse(user.custom_permissions_json || '[]');
    } catch (e) {
      customPerms = [];
    }

    // Super Admin has all permissions automatically
    const isSuperAdmin = user.role_code === 'SUPER_ADMIN';
    const effectivePermissions = new Set(rolePerms.concat(customPerms));

    req.user = {
      ...user,
      isSuperAdmin,
      permissions: Array.from(effectivePermissions),
      hasPermission: (perm) => isSuperAdmin || effectivePermissions.has(perm)
    };

    next();
  });
}

function requirePermission(permCode) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    if (req.user.hasPermission(permCode)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: `Permission denied. Required privilege: [${permCode}]`
    });
  };
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }
    if (allowed.includes(req.user.role_code) || req.user.role_code === 'SUPER_ADMIN') {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: `Access restricted to role: ${allowed.join(' or ')}`
    });
  };
}

// Immutable Audit Trail Helper
function logAudit(entityType, entityId, action, req, detailsObj = {}) {
  try {
    const userId = req && req.user ? req.user.id : null;
    const username = req && req.user ? req.user.username : 'SYSTEM';
    const userRole = req && req.user ? req.user.role_code : 'SYSTEM';
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '127.0.0.1';

    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, action, user_id, username, user_role, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAudit.run(
      entityType,
      String(entityId || ''),
      action,
      userId,
      username,
      userRole,
      JSON.stringify(detailsObj),
      ip
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = {
  generateToken,
  authenticateToken,
  requirePermission,
  requireRole,
  logAudit
};
