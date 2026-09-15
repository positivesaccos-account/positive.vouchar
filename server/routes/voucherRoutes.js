const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken, requirePermission, logAudit } = require('../auth');
const { amountToNepaliWords, amountToEnglishWords } = require('../utils/nepaliWords');

// Configure multer for file attachments (bills, invoices, receipts)
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// GET /api/vouchers/types - Get all voucher types grouped by category
router.get('/types', authenticateToken, (req, res) => {
  const types = db.prepare(`
    SELECT id, code, prefix, category, title_en, title_ne, default_payment_mode, requires_remarks, is_active
    FROM voucher_types
    WHERE is_active = 1
    ORDER BY sort_order ASC, id ASC
  `).all();

  return res.json({ success: true, voucherTypes: types });
});

// GET /api/vouchers/accounts - Get Chart of Accounts for debit/credit selection
router.get('/accounts', authenticateToken, (req, res) => {
  const accounts = db.prepare(`
    SELECT id, account_code, name_en, name_ne, category, sub_category, is_cash_or_bank, is_active
    FROM chart_of_accounts
    WHERE is_active = 1
    ORDER BY category, account_code ASC
  `).all();

  return res.json({ success: true, accounts });
});

// GET /api/vouchers/members - Autocomplete/search members list
router.get('/members', authenticateToken, (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT id, member_no, name_en, name_ne, phone, address FROM members WHERE is_active = 1';
  let params = [];

  if (search && search.trim()) {
    sql += ' AND (member_no LIKE ? OR name_en LIKE ? OR name_ne LIKE ? OR phone LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  sql += ' ORDER BY id ASC LIMIT 25';
  const members = db.prepare(sql).all(...params);
  return res.json({ success: true, members });
});

// Helper: Concurrency-safe sequential voucher number generator
function generateVoucherNumber(voucherTypeCode, fiscalYearId) {
  const vt = db.prepare('SELECT prefix FROM voucher_types WHERE code = ? OR id = ?').get(voucherTypeCode, voucherTypeCode);
  const fy = db.prepare('SELECT code FROM fiscal_years WHERE id = ?').get(fiscalYearId);

  const prefix = vt ? vt.prefix : 'VCH';
  // Extract fiscal year year part e.g. 2082 from 2082/83
  const fyPart = fy ? fy.code.split('/')[0] : new Date().getFullYear();

  // Find max sequential number for this prefix and fiscal year
  const searchPattern = `${prefix}-${fyPart}-%`;
  const latest = db.prepare(`
    SELECT voucher_number FROM vouchers
    WHERE voucher_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(searchPattern);

  let nextSeq = 1;
  if (latest && latest.voucher_number) {
    const parts = latest.voucher_number.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  const seqStr = String(nextSeq).padStart(6, '0');
  return `${prefix}-${fyPart}-${seqStr}`;
}

// GET /api/vouchers - Search and list vouchers with filters
router.get('/', authenticateToken, (req, res) => {
  const {
    fiscal_year_id,
    voucher_type_id,
    status,
    search,
    start_date,
    end_date,
    limit = 50,
    offset = 0
  } = req.query;

  let conditions = [];
  let params = [];

  if (fiscal_year_id) {
    conditions.push('v.fiscal_year_id = ?');
    params.push(fiscal_year_id);
  }

  if (voucher_type_id) {
    conditions.push('v.voucher_type_id = ?');
    params.push(voucher_type_id);
  }

  if (status) {
    conditions.push('v.status = ?');
    params.push(status);
  }

  if (start_date) {
    conditions.push('v.voucher_date_bs >= ?');
    params.push(start_date);
  }

  if (end_date) {
    conditions.push('v.voucher_date_bs <= ?');
    params.push(end_date);
  }

  if (search && search.trim()) {
    conditions.push('(v.voucher_number LIKE ? OR v.member_name LIKE ? OR v.member_id LIKE ? OR v.reference_no LIKE ? OR v.remarks LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const totalCount = db.prepare(`SELECT COUNT(*) as count FROM vouchers v ${whereClause}`).get(...params).count;

  const sql = `
    SELECT v.id, v.voucher_number, v.fiscal_year_id, v.voucher_type_id,
           v.voucher_date_bs, v.voucher_date_ad, v.member_name, v.member_id,
           v.total_amount, v.status, v.is_above_threshold, v.requires_approval,
           v.reference_no, v.cheque_no, v.payment_mode, v.remarks,
           vt.code as voucher_type_code, vt.title_en as voucher_type_title_en, vt.title_ne as voucher_type_title_ne,
           u1.full_name_en as prepared_by_name,
           u2.full_name_en as approved_by_name,
           u3.full_name_en as verified_by_name,
           v.created_at
    FROM vouchers v
    JOIN voucher_types vt ON v.voucher_type_id = vt.id
    JOIN users u1 ON v.prepared_by = u1.id
    LEFT JOIN users u2 ON v.approved_by = u2.id
    LEFT JOIN users u3 ON v.verified_by = u3.id
    ${whereClause}
    ORDER BY v.id DESC
    LIMIT ? OFFSET ?
  `;

  const vouchers = db.prepare(sql).all(...params, parseInt(limit, 10), parseInt(offset, 10));

  return res.json({
    success: true,
    total: totalCount,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    vouchers
  });
});

// GET /api/vouchers/:id - Complete voucher details, lines, attachments, print logs
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const voucher = db.prepare(`
    SELECT v.*,
           vt.code as voucher_type_code, vt.prefix as voucher_prefix,
           vt.title_en as voucher_type_title_en, vt.title_ne as voucher_type_title_ne,
           fy.code as fiscal_year_code,
           u1.full_name_en as prepared_by_name_en, u1.full_name_ne as prepared_by_name_ne,
           u2.full_name_en as approved_by_name_en, u2.full_name_ne as approved_by_name_ne,
           u3.full_name_en as verified_by_name_en, u3.full_name_ne as verified_by_name_ne
    FROM vouchers v
    JOIN voucher_types vt ON v.voucher_type_id = vt.id
    JOIN fiscal_years fy ON v.fiscal_year_id = fy.id
    JOIN users u1 ON v.prepared_by = u1.id
    LEFT JOIN users u2 ON v.approved_by = u2.id
    LEFT JOIN users u3 ON v.verified_by = u3.id
    WHERE v.id = ?
  `).get(id);

  if (!voucher) {
    return res.status(404).json({ success: false, error: 'Voucher not found.' });
  }

  // Lines
  const lines = db.prepare(`
    SELECT vl.*, ca.account_code, ca.name_en as account_name_en, ca.name_ne as account_name_ne, ca.category as account_category
    FROM voucher_lines vl
    JOIN chart_of_accounts ca ON vl.account_id = ca.id
    WHERE vl.voucher_id = ?
    ORDER BY vl.line_order ASC, vl.id ASC
  `).all(id);

  // Attachments
  const attachments = db.prepare(`
    SELECT a.*, u.full_name_en as uploaded_by_name
    FROM attachments a
    JOIN users u ON a.uploaded_by = u.id
    WHERE a.voucher_id = ?
    ORDER BY a.id ASC
  `).all(id);

  // Print Logs & Reprint counts
  const printLogs = db.prepare(`
    SELECT pl.*, u.full_name_en as printed_by_name
    FROM print_logs pl
    JOIN users u ON pl.printed_by = u.id
    WHERE pl.voucher_id = ?
    ORDER BY pl.id ASC
  `).all(id);

  // Audit history
  const auditLogs = db.prepare(`
    SELECT * FROM audit_logs
    WHERE entity_type = 'VOUCHER' AND entity_id = ?
    ORDER BY id ASC
  `).all(String(id));

  return res.json({
    success: true,
    voucher: {
      ...voucher,
      lines,
      attachments,
      printLogs,
      reprintCount: printLogs.length > 1 ? printLogs.length - 1 : 0,
      auditLogs
    }
  });
});

// POST /api/vouchers - Create new voucher with double-entry validation
router.post('/', authenticateToken, requirePermission('voucher:create'), (req, res) => {
  const {
    voucher_type_id,
    fiscal_year_id,
    voucher_date_bs,
    voucher_date_ad,
    member_name,
    member_id,
    reference_no,
    cheque_no,
    payment_mode,
    remarks,
    lines = [],
    is_draft = false
  } = req.body;

  // Validation 1: Required basic fields
  if (!voucher_type_id || !lines || lines.length === 0) {
    return res.status(400).json({ success: false, error: 'Voucher type and accounting lines are required.' });
  }

  // Fetch voucher type details
  const vt = db.prepare('SELECT * FROM voucher_types WHERE id = ?').get(voucher_type_id);
  if (!vt) {
    return res.status(400).json({ success: false, error: 'Invalid voucher type selected.' });
  }

  // Active Fiscal Year
  let fyId = fiscal_year_id;
  if (!fyId) {
    const activeFy = db.prepare('SELECT id FROM fiscal_years WHERE is_active = 1 LIMIT 1').get();
    if (!activeFy) return res.status(400).json({ success: false, error: 'No active fiscal year found.' });
    fyId = activeFy.id;
  }

  // Check if fiscal year is closed
  const fyRecord = db.prepare('SELECT is_closed FROM fiscal_years WHERE id = ?').get(fyId);
  if (fyRecord && fyRecord.is_closed === 1) {
    return res.status(400).json({ success: false, error: 'Selected fiscal year is closed. Transactions cannot be posted.' });
  }

  // Date defaults
  const dateBs = voucher_date_bs || '2082-06-01';
  const dateAd = voucher_date_ad || new Date().toISOString().split('T')[0];

  // Validation 2: Mandatory Remarks check
  if (vt.requires_remarks === 1 && (!remarks || !remarks.trim())) {
    return res.status(400).json({
      success: false,
      error: `Remarks are strictly mandatory for voucher type: ${vt.title_en} (${vt.title_ne}) for audit compliance.`
    });
  }

  // Validation 3: Double-Entry Accounting Rule: Total Debit == Total Credit
  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    if (!line.account_id) {
      return res.status(400).json({ success: false, error: 'Every transaction line must have an account head selected.' });
    }
    const debit = parseFloat(line.debit_amount) || 0;
    const credit = parseFloat(line.credit_amount) || 0;

    if (debit < 0 || credit < 0) {
      return res.status(400).json({ success: false, error: 'Debit and Credit amounts must be non-negative numbers.' });
    }
    if (debit === 0 && credit === 0) {
      return res.status(400).json({ success: false, error: 'Line amount cannot be zero for both Debit and Credit.' });
    }

    totalDebit += debit;
    totalCredit += credit;
  }

  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return res.status(400).json({
      success: false,
      error: `Accounting double-entry validation failed: Total Debit (रु. ${totalDebit.toFixed(2)}) must equal Total Credit (रु. ${totalCredit.toFixed(2)}). Difference: रु. ${Math.abs(totalDebit - totalCredit).toFixed(2)}`
    });
  }

  const voucherTotal = totalDebit; // or totalCredit (both equal)

  // Validation 4: Approval Threshold Evaluation
  const org = db.prepare('SELECT approval_threshold, auto_manager_review FROM organizations LIMIT 1').get() || { approval_threshold: 50000 };
  const threshold = org.approval_threshold || 50000;
  const isAboveThreshold = voucherTotal > threshold ? 1 : 0;

  // Determine Initial Status
  let status = 'DRAFT';
  let requiresApproval = 0;

  if (!is_draft) {
    if (isAboveThreshold) {
      // Must be approved by Manager before printing/issuing
      status = 'PENDING_APPROVAL';
      requiresApproval = 1;
    } else {
      // Within threshold: cashier processes, goes to Manager post-review
      status = 'PENDING_MANAGER_REVIEW';
      requiresApproval = 0;
    }
  }

  // Automatic Amount in Words
  const amountWordsNe = amountToNepaliWords(voucherTotal);
  const amountWordsEn = amountToEnglishWords(voucherTotal);

  // Execute atomic transactional insertion
  let voucherId;
  let voucherNumber;

  const createVoucherTx = db.transaction(() => {
    // Generate concurrency-safe sequential voucher number
    voucherNumber = generateVoucherNumber(vt.code, fyId);

    const result = db.prepare(`
      INSERT INTO vouchers (
        voucher_number, fiscal_year_id, voucher_type_id,
        voucher_date_bs, voucher_date_ad, member_name, member_id,
        total_amount, amount_in_words_ne, amount_in_words_en,
        reference_no, cheque_no, payment_mode, remarks,
        status, prepared_by, requires_approval, is_above_threshold
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      voucherNumber,
      fyId,
      vt.id,
      dateBs,
      dateAd,
      member_name || '',
      member_id || '',
      voucherTotal,
      amountWordsNe,
      amountWordsEn,
      reference_no || '',
      cheque_no || '',
      payment_mode || vt.default_payment_mode || 'CASH',
      remarks || '',
      status,
      req.user.id,
      requiresApproval,
      isAboveThreshold
    );

    voucherId = result.lastInsertRowid;

    // Insert voucher lines
    const insertLine = db.prepare(`
      INSERT INTO voucher_lines (voucher_id, account_id, particulars, debit_amount, credit_amount, line_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    lines.forEach((line, idx) => {
      insertLine.run(
        voucherId,
        line.account_id,
        line.particulars || '',
        parseFloat(line.debit_amount) || 0,
        parseFloat(line.credit_amount) || 0,
        idx + 1
      );
    });
  });

  try {
    createVoucherTx();
  } catch (err) {
    console.error('Transaction Failed:', err);
    return res.status(500).json({ success: false, error: 'Database transaction error: ' + err.message });
  }

  // Log to Audit Trail
  logAudit('VOUCHER', voucherId, 'CREATE', req, {
    voucher_number: voucherNumber,
    total_amount: voucherTotal,
    status,
    is_above_threshold: isAboveThreshold,
    lines_count: lines.length
  });

  return res.json({
    success: true,
    message: `Voucher ${voucherNumber} created successfully.`,
    voucherId,
    voucherNumber,
    status,
    isAboveThreshold,
    totalAmount: voucherTotal,
    amountWordsNe
  });
});

// POST /api/vouchers/:id/approve - Manager Approval Workflow
router.post('/:id/approve', authenticateToken, requirePermission('voucher:approve'), (req, res) => {
  const { id } = req.params;

  const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
  if (!voucher) {
    return res.status(404).json({ success: false, error: 'Voucher not found.' });
  }

  // Maker-Checker Protection: Cashier/Preparer CANNOT approve their own voucher
  if (voucher.prepared_by === req.user.id && !req.user.isSuperAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Maker-Checker Violation: You cannot approve your own voucher. A separate Manager must review and approve.'
    });
  }

  if (voucher.status !== 'PENDING_APPROVAL' && voucher.status !== 'SUBMITTED') {
    return res.status(400).json({
      success: false,
      error: `Voucher in status '${voucher.status}' cannot be approved.`
    });
  }

  db.prepare(`
    UPDATE vouchers SET
      status = 'APPROVED',
      approved_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, id);

  logAudit('VOUCHER', id, 'APPROVE', req, {
    voucher_number: voucher.voucher_number,
    approved_by: req.user.username,
    amount: voucher.total_amount
  });

  return res.json({
    success: true,
    message: `Voucher ${voucher.voucher_number} approved successfully. Printing is now authorized.`
  });
});

// POST /api/vouchers/:id/reject - Manager Rejection Workflow
router.post('/:id/reject', authenticateToken, requirePermission('voucher:reject'), (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;

  if (!rejection_reason || !rejection_reason.trim()) {
    return res.status(400).json({ success: false, error: 'A rejection reason is mandatory.' });
  }

  const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
  if (!voucher) {
    return res.status(404).json({ success: false, error: 'Voucher not found.' });
  }

  db.prepare(`
    UPDATE vouchers SET
      status = 'REJECTED',
      rejection_reason = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(rejection_reason.trim(), id);

  logAudit('VOUCHER', id, 'REJECT', req, {
    voucher_number: voucher.voucher_number,
    reason: rejection_reason.trim()
  });

  return res.json({
    success: true,
    message: `Voucher ${voucher.voucher_number} rejected.`
  });
});

// POST /api/vouchers/:id/verify - Manager Post-Review Verification (Within Threshold)
router.post('/:id/verify', authenticateToken, requirePermission('voucher:verify'), (req, res) => {
  const { id } = req.params;

  const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
  if (!voucher) {
    return res.status(404).json({ success: false, error: 'Voucher not found.' });
  }

  db.prepare(`
    UPDATE vouchers SET
      status = 'VERIFIED',
      verified_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, id);

  logAudit('VOUCHER', id, 'VERIFY', req, {
    voucher_number: voucher.voucher_number,
    verified_by: req.user.username
  });

  return res.json({
    success: true,
    message: `Voucher ${voucher.voucher_number} verified by Manager.`
  });
});

// POST /api/vouchers/:id/cancel - Cancellation Workflow (No silent delete)
router.post('/:id/cancel', authenticateToken, requirePermission('voucher:cancel'), (req, res) => {
  const { id } = req.params;
  const { cancellation_reason } = req.body;

  if (!cancellation_reason || !cancellation_reason.trim()) {
    return res.status(400).json({ success: false, error: 'A cancellation reason is strictly required.' });
  }

  const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
  if (!voucher) {
    return res.status(404).json({ success: false, error: 'Voucher not found.' });
  }

  db.prepare(`
    UPDATE vouchers SET
      status = 'CANCELLED',
      cancellation_reason = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(cancellation_reason.trim(), id);

  logAudit('VOUCHER', id, 'CANCEL', req, {
    voucher_number: voucher.voucher_number,
    reason: cancellation_reason.trim()
  });

  return res.json({
    success: true,
    message: `Voucher ${voucher.voucher_number} cancelled. Reason recorded in audit trail.`
  });
});

// POST /api/vouchers/:id/reverse - Reversal Voucher Workflow
router.post('/:id/reverse', authenticateToken, requirePermission('voucher:reverse'), (req, res) => {
  const { id } = req.params;
  const { reversal_reason } = req.body;

  const orig = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
  if (!orig) {
    return res.status(404).json({ success: false, error: 'Original voucher not found.' });
  }

  const origLines = db.prepare('SELECT * FROM voucher_lines WHERE voucher_id = ?').all(id);

  // Reversal voucher type (REV)
  const revVt = db.prepare("SELECT * FROM voucher_types WHERE code = 'REV' LIMIT 1").get() || { id: 12, code: 'REV', prefix: 'REV' };

  let newVoucherId;
  let newVoucherNumber;

  const reverseTx = db.transaction(() => {
    newVoucherNumber = generateVoucherNumber(revVt.code, orig.fiscal_year_id);

    const result = db.prepare(`
      INSERT INTO vouchers (
        voucher_number, fiscal_year_id, voucher_type_id,
        voucher_date_bs, voucher_date_ad, member_name, member_id,
        total_amount, amount_in_words_ne, amount_in_words_en,
        reference_no, payment_mode, remarks,
        status, prepared_by, reversed_voucher_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'POSTED', ?, ?)
    `).run(
      newVoucherNumber,
      orig.fiscal_year_id,
      revVt.id,
      orig.voucher_date_bs,
      new Date().toISOString().split('T')[0],
      orig.member_name,
      orig.member_id,
      orig.total_amount,
      orig.amount_in_words_ne,
      orig.amount_in_words_en,
      `Reversal of ${orig.voucher_number}`,
      'ADJUSTMENT',
      `Reversal of Voucher ${orig.voucher_number}. Reason: ${reversal_reason || 'Correction reversal'}`,
      req.user.id,
      orig.id
    );

    newVoucherId = result.lastInsertRowid;

    // Swap Debit and Credit lines for reversal
    const insertLine = db.prepare(`
      INSERT INTO voucher_lines (voucher_id, account_id, particulars, debit_amount, credit_amount, line_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    origLines.forEach((l, idx) => {
      insertLine.run(
        newVoucherId,
        l.account_id,
        `Reversal: ${l.particulars || ''}`,
        l.credit_amount, // Swapped
        l.debit_amount,  // Swapped
        idx + 1
      );
    });

    // Mark original voucher as REVERSED
    db.prepare("UPDATE vouchers SET status = 'REVERSED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  });

  try {
    reverseTx();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Reversal failed: ' + err.message });
  }

  logAudit('VOUCHER', newVoucherId, 'REVERSE', req, {
    original_voucher_number: orig.voucher_number,
    new_voucher_number: newVoucherNumber,
    reason: reversal_reason
  });

  return res.json({
    success: true,
    message: `Reversal voucher ${newVoucherNumber} created. Original voucher ${orig.voucher_number} marked as REVERSED.`,
    reversalVoucherId: newVoucherId,
    reversalVoucherNumber: newVoucherNumber
  });
});

// POST /api/vouchers/:id/attachments - Upload document attachment
router.post('/:id/attachments', authenticateToken, upload.single('document'), (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }

  const voucher = db.prepare('SELECT id, voucher_number FROM vouchers WHERE id = ?').get(id);
  if (!voucher) {
    return res.status(404).json({ success: false, error: 'Voucher not found.' });
  }

  const result = db.prepare(`
    INSERT INTO attachments (voucher_id, file_name, original_name, file_size, mime_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    req.file.filename,
    req.file.originalname,
    req.file.size,
    req.file.mimetype,
    req.user.id
  );

  logAudit('VOUCHER', id, 'ATTACHMENT_UPLOAD', req, {
    file_name: req.file.originalname,
    size: req.file.size
  });

  return res.json({
    success: true,
    message: 'Attachment uploaded successfully.',
    attachmentId: result.lastInsertRowid,
    fileName: req.file.filename,
    originalName: req.file.originalname
  });
});

// DELETE /api/vouchers/:id/attachments/:attachmentId - Delete attachment
router.delete('/:id/attachments/:attachmentId', authenticateToken, (req, res) => {
  const { id, attachmentId } = req.params;

  const att = db.prepare('SELECT * FROM attachments WHERE id = ? AND voucher_id = ?').get(attachmentId, id);
  if (!att) {
    return res.status(404).json({ success: false, error: 'Attachment not found.' });
  }

  // Delete physical file
  const filePath = path.join(uploadsDir, att.file_name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM attachments WHERE id = ?').run(attachmentId);

  logAudit('VOUCHER', id, 'ATTACHMENT_DELETE', req, { file_name: att.original_name });

  return res.json({ success: true, message: 'Attachment deleted.' });
});

// POST /api/vouchers/:id/print - Print Authorization and Reprint Tracking
router.post('/:id/print', authenticateToken, requirePermission('voucher:print'), (req, res) => {
  const { id } = req.params;
  const { print_type = 'BOTH' } = req.body || {}; // BOTH, CUSTOMER_ONLY, OFFICE_ONLY

  const voucher = db.prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
  if (!voucher) {
    return res.status(404).json({ success: false, error: 'Voucher not found.' });
  }

  // Print lock check: If voucher requires approval and is not approved, lock printing!
  if (voucher.requires_approval === 1 && voucher.status !== 'APPROVED' && voucher.status !== 'PRINTED' && voucher.status !== 'VERIFIED') {
    return res.status(403).json({
      success: false,
      error: `Print Locked: This voucher amount exceeds the approval threshold (रु. 50,000) and is currently in status '${voucher.status}'. Manager approval is mandatory before printing.`
    });
  }

  // Check previous prints
  const prevPrints = db.prepare('SELECT COUNT(*) as count FROM print_logs WHERE voucher_id = ?').get(id).count;
  const isReprint = prevPrints > 0 ? 1 : 0;
  const reprintNumber = isReprint ? prevPrints : 0;

  // Insert print log
  db.prepare(`
    INSERT INTO print_logs (voucher_id, printed_by, print_type, is_reprint, reprint_number)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.user.id, print_type, isReprint, reprintNumber);

  // Update status if it was approved
  if (voucher.status === 'APPROVED') {
    db.prepare("UPDATE vouchers SET status = 'PRINTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
  }

  logAudit('VOUCHER', id, isReprint ? 'REPRINT' : 'PRINT', req, {
    voucher_number: voucher.voucher_number,
    print_type,
    is_reprint: Boolean(isReprint),
    reprint_number: reprintNumber
  });

  return res.json({
    success: true,
    isReprint: Boolean(isReprint),
    reprintNumber,
    message: isReprint
      ? `Reprint logged (Copy #${reprintNumber + 1}). Marked as REPRINT.`
      : 'Original voucher print authorized.'
  });
});

module.exports = router;
