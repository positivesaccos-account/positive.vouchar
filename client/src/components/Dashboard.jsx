import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckSquare,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const Dashboard = ({ stats, setActiveTab, onQuickVoucher }) => {
  const { t, lang, orgSettings, user } = useAuth();
  const curr = orgSettings?.currency_symbol || 'रु.';

  const formatAmount = (val) => {
    return Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div>
      {/* 1. Statistics Grid */}
      <div className="dashboard-grid">
        {/* Today's Vouchers */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">{t.dash.todayVouchers}</span>
            <div className="stat-icon-box icon-navy">
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-value">{stats?.totalVouchersToday || 0}</div>
          <div className="stat-subtext">आ.व. {stats?.activeFiscalYear}</div>
        </div>

        {/* Today's Cash Receipts */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">{t.dash.todayReceipt}</span>
            <div className="stat-icon-box icon-emerald">
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <div className="stat-value">{curr} {formatAmount(stats?.cashReceiptToday)}</div>
          <div className="stat-subtext" style={{ color: 'var(--primary-600)' }}>नगद दाखिला रकम</div>
        </div>

        {/* Today's Cash Payments */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">{t.dash.todayPayment}</span>
            <div className="stat-icon-box icon-red">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="stat-value">{curr} {formatAmount(stats?.cashPaymentToday)}</div>
          <div className="stat-subtext" style={{ color: 'var(--danger-600)' }}>नगद भुक्तानी रकम</div>
        </div>

        {/* Total Volume */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">{t.dash.todayVolume}</span>
            <div className="stat-icon-box icon-purple">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">{curr} {formatAmount(stats?.totalVolumeToday)}</div>
          <div className="stat-subtext">आजको कुल कारोबार</div>
        </div>
      </div>

      {/* Internal Control / Maker-Checker Alert Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* Pending Approval (> Threshold) */}
        <div
          className="stat-card"
          style={{
            borderLeft: '5px solid var(--danger-600)',
            cursor: 'pointer',
            backgroundColor: stats?.pendingApprovalsCount > 0 ? '#fff5f5' : '#ffffff'
          }}
          onClick={() => setActiveTab('pending-approval')}
        >
          <div className="stat-card-top">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="stat-label" style={{ color: 'var(--danger-600)', fontWeight: 700 }}>
                  {t.dash.pendingApprovalCount}
                </span>
                {stats?.pendingApprovalsCount > 0 && (
                  <AlertTriangle size={16} color="var(--danger-600)" />
                )}
              </div>
              <div className="stat-subtext">
                सीमा (रु. {Number(orgSettings?.approval_threshold || 50000).toLocaleString()}) भन्दा माथिका भौचरहरू
              </div>
            </div>
            <div className="stat-icon-box icon-red">
              <Clock size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: stats?.pendingApprovalsCount > 0 ? 'var(--danger-600)' : 'inherit' }}>
            {stats?.pendingApprovalsCount || 0}
          </div>
          <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--navy-600)' }}>
            व्यवस्थापकको अनिवार्य पूर्व-स्वीकृति बिना छाप्न नमिल्ने
          </div>
        </div>

        {/* Pending Manager Review (Within Threshold) */}
        <div
          className="stat-card"
          style={{
            borderLeft: '5px solid var(--gold-500)',
            cursor: 'pointer',
            backgroundColor: stats?.pendingReviewsCount > 0 ? '#fffdf5' : '#ffffff'
          }}
          onClick={() => setActiveTab('pending-review')}
        >
          <div className="stat-card-top">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="stat-label" style={{ color: 'var(--gold-600)', fontWeight: 700 }}>
                  {t.dash.pendingReviewCount}
                </span>
                <ShieldCheck size={16} color="var(--gold-600)" />
              </div>
              <div className="stat-subtext">
                क्यासियरद्वारा जारी भई व्यवस्थापक समीक्षा पर्खिरहेका भौचरहरू
              </div>
            </div>
            <div className="stat-icon-box icon-gold">
              <CheckSquare size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ color: stats?.pendingReviewsCount > 0 ? 'var(--gold-600)' : 'inherit' }}>
            {stats?.pendingReviewsCount || 0}
          </div>
          <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--navy-600)' }}>
            आन्तरिक लेखा नियन्त्रण (Post-Review Audit Control)
          </div>
        </div>
      </div>

      {/* 2. Quick Action Bar */}
      <div className="quick-action-bar">
        <div className="quick-action-title">
          <h2>{t.dash.quickActions}</h2>
          <p>हस्तलिखित भौचरको सट्टा सिधै डिजिटल प्रविष्टि गरी प्रिन्ट गर्नुहोस्</p>
        </div>

        <div className="quick-action-buttons">
          <button
            className="btn btn-primary"
            onClick={() => onQuickVoucher('CRV')}
          >
            <PlusCircle size={16} />
            <span>+ नगद आम्दानी (CRV)</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onQuickVoucher('CPV')}
          >
            <PlusCircle size={16} />
            <span>+ नगद भुक्तानी (CPV)</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onQuickVoucher('BPV')}
          >
            <PlusCircle size={16} />
            <span>+ बैंक भुक्तानी (BPV)</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => onQuickVoucher('JV')}
          >
            <PlusCircle size={16} />
            <span>+ जर्नल भौचर (JV)</span>
          </button>
        </div>
      </div>

      {/* 3. Recent Vouchers Table */}
      <div className="data-card">
        <div className="data-card-header">
          <h3>{t.dash.recentVouchers}</h3>
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            onClick={() => setActiveTab('voucher-register')}
          >
            <span>{t.dash.viewAll}</span>
            <ExternalLink size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t.dash.voucherNo}</th>
                <th>{t.dash.date}</th>
                <th>{t.dash.type}</th>
                <th>{t.dash.party}</th>
                <th style={{ textAlign: 'right' }}>{t.dash.amount}</th>
                <th style={{ textAlign: 'center' }}>{t.dash.statusHeader}</th>
                <th>{t.dash.preparedBy}</th>
              </tr>
            </thead>
            <tbody>
              {(!stats?.recentVouchers || stats.recentVouchers.length === 0) ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--navy-500)' }}>
                    {t.dash.noVouchers}
                  </td>
                </tr>
              ) : (
                stats.recentVouchers.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{v.voucher_number}</td>
                    <td>{v.voucher_date_bs}</td>
                    <td>{v.voucher_type_title || v.voucher_type_code}</td>
                    <td>{v.member_name || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {curr} {formatAmount(v.total_amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill ${
                        v.status === 'APPROVED' ? 'status-approved' :
                        v.status === 'PENDING_APPROVAL' ? 'status-pending-approval' :
                        v.status === 'PENDING_MANAGER_REVIEW' ? 'status-pending-review' :
                        v.status === 'POSTED' ? 'status-posted' :
                        v.status === 'REJECTED' ? 'status-rejected' : 'status-cancelled'
                      }`}>
                        {t.status[v.status] || v.status}
                      </span>
                    </td>
                    <td>{v.prepared_by_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
