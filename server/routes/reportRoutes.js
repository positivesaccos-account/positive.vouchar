const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requirePermission } = require('../auth');

// GET /api/reports/cash-book - Cash transactions and running balance
router.get('/cash-book', authenticateToken, requirePermission('report:view_books'), (req, res) => {
  const { start_date, end_date } = req.query;

  // Find cash accounts (e.g. 1001)
  const cashAccounts = db.prepare("SELECT id FROM chart_of_accounts WHERE sub_category = 'Cash' OR account_code = '1001'").all();
  const cashAccIds = cashAccounts.map(a => a.id);

  if (cashAccIds.length === 0) {
    return res.json({ success: true, transactions: [], openingBalance: 0, closingBalance: 0 });
  }

  const inClause = cashAccIds.map(() => '?').join(',');

  let conditions = [`vl.account_id IN (${inClause})`, `v.status NOT IN ('CANCELLED', 'DRAFT')`];
  let params = [...cashAccIds];

  if (start_date) {
    conditions.push('v.voucher_date_bs >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('v.voucher_date_bs <= ?');
    params.push(end_date);
  }

  const sql = `
    SELECT vl.id, v.voucher_number, v.voucher_date_bs, v.voucher_date_ad,
           vt.code as voucher_type, v.member_name, vl.particulars,
           vl.debit_amount as receipt_amount,
           vl.credit_amount as payment_amount,
           ca.name_en as account_name,
           u.full_name_en as prepared_by_name
    FROM voucher_lines vl
    JOIN vouchers v ON vl.voucher_id = v.id
    JOIN voucher_types vt ON v.voucher_type_id = vt.id
    JOIN chart_of_accounts ca ON vl.account_id = ca.id
    JOIN users u ON v.prepared_by = u.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY v.voucher_date_bs ASC, v.id ASC
  `;

  const rows = db.prepare(sql).all(...params);

  // Calculate running balances
  let runningBalance = 0;
  const transactions = rows.map(r => {
    runningBalance += (r.receipt_amount - r.payment_amount);
    return { ...r, running_balance: runningBalance };
  });

  const totalReceipts = transactions.reduce((s, t) => s + t.receipt_amount, 0);
  const totalPayments = transactions.reduce((s, t) => s + t.payment_amount, 0);

  return res.json({
    success: true,
    transactions,
    totalReceipts,
    totalPayments,
    closingBalance: runningBalance
  });
});

// GET /api/reports/bank-book - Bank transactions
router.get('/bank-book', authenticateToken, requirePermission('report:view_books'), (req, res) => {
  const { bank_account_id, start_date, end_date } = req.query;

  let bankAccIds = [];
  if (bank_account_id) {
    bankAccIds = [parseInt(bank_account_id)];
  } else {
    const bankAccounts = db.prepare("SELECT id FROM chart_of_accounts WHERE sub_category = 'Bank'").all();
    bankAccIds = bankAccounts.map(a => a.id);
  }

  if (bankAccIds.length === 0) {
    return res.json({ success: true, transactions: [], totalReceipts: 0, totalPayments: 0, closingBalance: 0 });
  }

  const inClause = bankAccIds.map(() => '?').join(',');
  let conditions = [`vl.account_id IN (${inClause})`, `v.status NOT IN ('CANCELLED', 'DRAFT')`];
  let params = [...bankAccIds];

  if (start_date) {
    conditions.push('v.voucher_date_bs >= ?');
    params.push(start_date);
  }
  if (end_date) {
    conditions.push('v.voucher_date_bs <= ?');
    params.push(end_date);
  }

  const sql = `
    SELECT vl.id, v.voucher_number, v.voucher_date_bs, v.voucher_date_ad,
           vt.code as voucher_type, v.member_name, v.cheque_no, vl.particulars,
           vl.debit_amount as deposit_amount,
           vl.credit_amount as withdrawal_amount,
           ca.name_en as bank_name,
           u.full_name_en as prepared_by_name
    FROM voucher_lines vl
    JOIN vouchers v ON vl.voucher_id = v.id
    JOIN voucher_types vt ON v.voucher_type_id = vt.id
    JOIN chart_of_accounts ca ON vl.account_id = ca.id
    JOIN users u ON v.prepared_by = u.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY v.voucher_date_bs ASC, v.id ASC
  `;

  const rows = db.prepare(sql).all(...params);

  let runningBalance = 0;
  const transactions = rows.map(r => {
    runningBalance += (r.deposit_amount - r.withdrawal_amount);
    return { ...r, running_balance: runningBalance };
  });

  const totalDeposits = transactions.reduce((s, t) => s + t.deposit_amount, 0);
  const totalWithdrawals = transactions.reduce((s, t) => s + t.withdrawal_amount, 0);

  return res.json({
    success: true,
    transactions,
    totalDeposits,
    totalWithdrawals,
    closingBalance: runningBalance
  });
});

// GET /api/reports/day-book - Consolidated transactions day by day
router.get('/day-book', authenticateToken, requirePermission('report:view_books'), (req, res) => {
  const { date_bs } = req.query;
  const targetDate = date_bs || '2082-06-15';

  const vouchers = db.prepare(`
    SELECT v.id, v.voucher_number, v.voucher_date_bs, v.member_name, v.total_amount,
           vt.code as voucher_type_code, vt.title_en as voucher_type_title, v.status,
           u.full_name_en as prepared_by_name
    FROM vouchers v
    JOIN voucher_types vt ON v.voucher_type_id = vt.id
    JOIN users u ON v.prepared_by = u.id
    WHERE v.voucher_date_bs = ? AND v.status NOT IN ('CANCELLED', 'DRAFT')
    ORDER BY v.id ASC
  `).all(targetDate);

  const voucherIds = vouchers.map(v => v.id);
  let allLines = [];
  if (voucherIds.length > 0) {
    const inClause = voucherIds.map(() => '?').join(',');
    allLines = db.prepare(`
      SELECT vl.*, ca.account_code, ca.name_en as account_name_en, ca.name_ne as account_name_ne
      FROM voucher_lines vl
      JOIN chart_of_accounts ca ON vl.account_id = ca.id
      WHERE vl.voucher_id IN (${inClause})
      ORDER BY vl.voucher_id, vl.line_order ASC
    `).all(...voucherIds);
  }

  const enriched = vouchers.map(v => ({
    ...v,
    lines: allLines.filter(l => l.voucher_id === v.id)
  }));

  const totalDayVolume = enriched.reduce((s, v) => s + v.total_amount, 0);

  return res.json({
    success: true,
    dateBs: targetDate,
    totalVouchers: enriched.length,
    totalVolume: totalDayVolume,
    vouchers: enriched
  });
});

// GET /api/reports/trial-balance - Double-entry summary of all accounts
router.get('/trial-balance', authenticateToken, requirePermission('report:view_trial_balance'), (req, res) => {
  const { fiscal_year_id } = req.query;

  let fyFilter = '';
  let params = [];
  if (fiscal_year_id) {
    fyFilter = 'AND v.fiscal_year_id = ?';
    params.push(fiscal_year_id);
  }

  const sql = `
    SELECT ca.id, ca.account_code, ca.name_en, ca.name_ne, ca.category, ca.sub_category,
           COALESCE(SUM(vl.debit_amount), 0) as total_debit,
           COALESCE(SUM(vl.credit_amount), 0) as total_credit
    FROM chart_of_accounts ca
    LEFT JOIN voucher_lines vl ON ca.id = vl.account_id
    LEFT JOIN vouchers v ON vl.voucher_id = v.id AND v.status NOT IN ('CANCELLED', 'DRAFT') ${fyFilter}
    WHERE ca.is_active = 1
    GROUP BY ca.id
    ORDER BY ca.account_code ASC
  `;

  const accounts = db.prepare(sql).all(...params);

  // Compute net debit or net credit per accounting standards
  let grandTotalDebit = 0;
  let grandTotalCredit = 0;

  const trialRows = accounts.map(a => {
    grandTotalDebit += a.total_debit;
    grandTotalCredit += a.total_credit;

    const netDebit = a.total_debit > a.total_credit ? a.total_debit - a.total_credit : 0;
    const netCredit = a.total_credit > a.total_debit ? a.total_credit - a.total_debit : 0;

    return {
      ...a,
      net_debit: netDebit,
      net_credit: netCredit
    };
  });

  const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;

  return res.json({
    success: true,
    rows: trialRows,
    grandTotalDebit,
    grandTotalCredit,
    isBalanced,
    difference: Math.abs(grandTotalDebit - grandTotalCredit)
  });
});

// GET /api/reports/audit-trail - Full immutable audit log viewer
router.get('/audit-trail', authenticateToken, requirePermission('audit:view_trail'), (req, res) => {
  const { entity_type, action, search, limit = 100 } = req.query;

  let conditions = [];
  let params = [];

  if (entity_type) {
    conditions.push('entity_type = ?');
    params.push(entity_type);
  }
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  if (search && search.trim()) {
    conditions.push('(username LIKE ? OR entity_id LIKE ? OR details LIKE ?)');
    const t = `%${search.trim()}%`;
    params.push(t, t, t);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const logs = db.prepare(`
    SELECT id, entity_type, entity_id, action, user_id, username, user_role, details, ip_address, created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY id DESC
    LIMIT ?
  `).all(...params, parseInt(limit, 10));

  return res.json({ success: true, logs });
});

module.exports = router;
