const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../auth');

// GET /api/dashboard/stats - Real-time operational metrics
router.get('/stats', authenticateToken, (req, res) => {
  // 1. Organization & Threshold
  const org = db.prepare(`
    SELECT name_en, name_ne, approval_threshold, currency_symbol, auto_manager_review
    FROM organizations LIMIT 1
  `).get() || { approval_threshold: 50000, currency_symbol: 'रु.' };

  // 2. Active Fiscal Year
  const activeFy = db.prepare(`
    SELECT id, code, start_date_bs, end_date_bs FROM fiscal_years WHERE is_active = 1 LIMIT 1
  `).get() || { code: '2082/83' };

  // 3. Today's Gregorian date in YYYY-MM-DD
  const todayAd = new Date().toISOString().split('T')[0];

  // 4. Today's voucher count and cash flow
  const todayStats = db.prepare(`
    SELECT 
      COUNT(*) as total_vouchers_today,
      SUM(CASE WHEN vt.code = 'CRV' OR vt.code LIKE '%RCPT%' THEN v.total_amount ELSE 0 END) as total_cash_receipt,
      SUM(CASE WHEN vt.code = 'CPV' OR vt.code LIKE '%PAY%' THEN v.total_amount ELSE 0 END) as total_cash_payment,
      SUM(v.total_amount) as total_volume_today
    FROM vouchers v
    JOIN voucher_types vt ON v.voucher_type_id = vt.id
    WHERE date(v.created_at) = date('now')
      AND v.status NOT IN ('CANCELLED', 'REVERSED')
  `).get() || { total_vouchers_today: 0, total_cash_receipt: 0, total_cash_payment: 0, total_volume_today: 0 };

  // 5. Pending approvals (> threshold)
  const pendingApprovalsCount = db.prepare(`
    SELECT COUNT(*) as count FROM vouchers WHERE status = 'PENDING_APPROVAL'
  `).get().count;

  // 6. Pending Manager Reviews (within threshold, waiting for manager post-review)
  const pendingReviewsCount = db.prepare(`
    SELECT COUNT(*) as count FROM vouchers WHERE status = 'PENDING_MANAGER_REVIEW'
  `).get().count;

  // 7. Recent Vouchers (last 8)
  const recentVouchers = db.prepare(`
    SELECT v.id, v.voucher_number, v.voucher_date_bs, v.member_name, v.total_amount, v.status,
           v.is_above_threshold, vt.code as voucher_type_code, vt.title_en as voucher_type_title,
           u.full_name_en as prepared_by_name, v.created_at
    FROM vouchers v
    JOIN voucher_types vt ON v.voucher_type_id = vt.id
    JOIN users u ON v.prepared_by = u.id
    ORDER BY v.id DESC
    LIMIT 8
  `).all();

  // 8. Staff counts
  const staffCounts = db.prepare(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN r.code = 'CASHIER' THEN 1 ELSE 0 END) as total_cashiers,
      SUM(CASE WHEN r.code = 'MANAGER' THEN 1 ELSE 0 END) as total_managers
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.is_active = 1
  `).get();

  // 9. Last backup info
  const lastBackup = db.prepare(`
    SELECT file_name, created_at FROM backup_logs ORDER BY id DESC LIMIT 1
  `).get();

  return res.json({
    success: true,
    stats: {
      orgName: org.name_en,
      orgNameNe: org.name_ne,
      currencySymbol: org.currency_symbol,
      approvalThreshold: org.approval_threshold,
      activeFiscalYear: activeFy.code,
      fiscalYearId: activeFy.id,
      todayDateAd: todayAd,
      totalVouchersToday: todayStats.total_vouchers_today || 0,
      cashReceiptToday: todayStats.total_cash_receipt || 0,
      cashPaymentToday: todayStats.total_cash_payment || 0,
      totalVolumeToday: todayStats.total_volume_today || 0,
      pendingApprovalsCount,
      pendingReviewsCount,
      recentVouchers,
      staffCounts,
      lastBackupDate: lastBackup ? lastBackup.created_at : 'No backup taken yet'
    }
  });
});

module.exports = router;
