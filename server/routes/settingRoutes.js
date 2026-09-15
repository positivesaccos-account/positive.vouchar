const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requirePermission, logAudit } = require('../auth');

// GET /api/settings/organization - Public / Authenticated read
router.get('/organization', (req, res) => {
  const org = db.prepare(`
    SELECT id, name_en, name_ne, registration_no, pan_no, address_en, address_ne,
           phone, email, logo_url, currency_symbol, approval_threshold, auto_manager_review, updated_at
    FROM organizations
    ORDER BY id ASC LIMIT 1
  `).get();

  return res.json({ success: true, organization: org });
});

// PUT /api/settings/organization - Update cooperative settings & threshold
router.put('/organization', authenticateToken, requirePermission('settings:manage'), (req, res) => {
  const {
    name_en, name_ne, registration_no, pan_no, address_en, address_ne,
    phone, email, logo_url, currency_symbol, approval_threshold, auto_manager_review
  } = req.body;

  const current = db.prepare('SELECT * FROM organizations LIMIT 1').get();

  const thresholdVal = parseFloat(approval_threshold) >= 0 ? parseFloat(approval_threshold) : 50000;

  db.prepare(`
    UPDATE organizations SET
      name_en = ?,
      name_ne = ?,
      registration_no = ?,
      pan_no = ?,
      address_en = ?,
      address_ne = ?,
      phone = ?,
      email = ?,
      logo_url = ?,
      currency_symbol = ?,
      approval_threshold = ?,
      auto_manager_review = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name_en || current.name_en,
    name_ne || current.name_ne,
    registration_no || current.registration_no,
    pan_no || current.pan_no,
    address_en || current.address_en,
    address_ne || current.address_ne,
    phone || current.phone,
    email || current.email,
    logo_url !== undefined ? logo_url : current.logo_url,
    currency_symbol || current.currency_symbol,
    thresholdVal,
    auto_manager_review !== undefined ? (auto_manager_review ? 1 : 0) : current.auto_manager_review,
    current.id
  );

  logAudit('SETTING', current.id, 'UPDATE_ORGANIZATION', req, {
    old_threshold: current.approval_threshold,
    new_threshold: thresholdVal,
    changes: req.body
  });

  const updated = db.prepare('SELECT * FROM organizations WHERE id = ?').get(current.id);
  return res.json({ success: true, message: 'Settings updated successfully.', organization: updated });
});

// GET /api/settings/fiscal-years - List fiscal years
router.get('/fiscal-years', authenticateToken, (req, res) => {
  const fiscalYears = db.prepare(`
    SELECT id, code, start_date_bs, end_date_bs, start_date_ad, end_date_ad, is_active, is_closed, created_at
    FROM fiscal_years
    ORDER BY code DESC
  `).all();

  return res.json({ success: true, fiscalYears });
});

// POST /api/settings/fiscal-years - Create new fiscal year
router.post('/fiscal-years', authenticateToken, requirePermission('settings:manage'), (req, res) => {
  const { code, start_date_bs, end_date_bs, start_date_ad, end_date_ad } = req.body;

  if (!code || !start_date_bs || !end_date_bs) {
    return res.status(400).json({ success: false, error: 'Fiscal year code and start/end dates are required.' });
  }

  const existing = db.prepare('SELECT id FROM fiscal_years WHERE code = ?').get(code.trim());
  if (existing) {
    return res.status(400).json({ success: false, error: `Fiscal year ${code} already exists.` });
  }

  const result = db.prepare(`
    INSERT INTO fiscal_years (code, start_date_bs, end_date_bs, start_date_ad, end_date_ad, is_active, is_closed)
    VALUES (?, ?, ?, ?, ?, 0, 0)
  `).run(code.trim(), start_date_bs, end_date_bs, start_date_ad || '', end_date_ad || '');

  logAudit('FISCAL_YEAR', result.lastInsertRowid, 'CREATE', req, { code });

  return res.json({ success: true, message: `Fiscal year ${code} created successfully.` });
});

// PUT /api/settings/fiscal-years/:id/activate - Switch active fiscal year
router.put('/fiscal-years/:id/activate', authenticateToken, requirePermission('settings:manage'), (req, res) => {
  const { id } = req.params;

  const target = db.prepare('SELECT * FROM fiscal_years WHERE id = ?').get(id);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Fiscal year not found.' });
  }

  if (target.is_closed === 1) {
    return res.status(400).json({ success: false, error: 'Closed fiscal years cannot be activated.' });
  }

  // Deactivate all others, activate this one
  db.transaction(() => {
    db.prepare('UPDATE fiscal_years SET is_active = 0').run();
    db.prepare('UPDATE fiscal_years SET is_active = 1 WHERE id = ?').run(id);
  })();

  logAudit('FISCAL_YEAR', id, 'ACTIVATE', req, { code: target.code });

  return res.json({ success: true, message: `Fiscal year ${target.code} is now active.` });
});

// PUT /api/settings/fiscal-years/:id/close - Close fiscal year (prevent normal edits)
router.put('/fiscal-years/:id/close', authenticateToken, requirePermission('settings:manage'), (req, res) => {
  const { id } = req.params;

  const target = db.prepare('SELECT * FROM fiscal_years WHERE id = ?').get(id);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Fiscal year not found.' });
  }

  db.prepare('UPDATE fiscal_years SET is_closed = 1, is_active = 0 WHERE id = ?').run(id);

  logAudit('FISCAL_YEAR', id, 'CLOSE', req, { code: target.code });

  return res.json({ success: true, message: `Fiscal year ${target.code} has been closed.` });
});

module.exports = router;
