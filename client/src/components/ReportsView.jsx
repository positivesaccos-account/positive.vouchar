import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart3, BookOpen, Calendar, Download, Printer, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ReportsView = () => {
  const { token, t, lang, orgSettings } = useAuth();
  const [activeReport, setActiveReport] = useState('trial-balance'); // trial-balance, cash-book, bank-book, day-book
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dayDate, setDayDate] = useState('2082-06-15');

  const curr = orgSettings?.currency_symbol || 'रु.';

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '';
      if (activeReport === 'trial-balance') {
        url = '/api/reports/trial-balance';
      } else if (activeReport === 'cash-book') {
        url = `/api/reports/cash-book?start_date=${startDate}&end_date=${endDate}`;
      } else if (activeReport === 'bank-book') {
        url = `/api/reports/bank-book?start_date=${startDate}&end_date=${endDate}`;
      } else if (activeReport === 'day-book') {
        url = `/api/reports/day-book?date_bs=${dayDate}`;
      }

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, dayDate]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={22} color="var(--primary-600)" />
            <span>वित्तीय तथा लेखा प्रतिवेदनहरू (Financial Accounting Reports)</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>
            रोकड खाता, बैंक खाता, दैनिक खाता तथा सन्तुलन परीक्षण (Trial Balance)
          </p>
        </div>

        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={15} />
          <span>प्रतिवेदन छाप्नुहोस् (Print)</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--navy-200)', marginBottom: '20px' }}>
        {[
          { id: 'trial-balance', label: 'सन्तुलन परीक्षण (Trial Balance)' },
          { id: 'cash-book', label: 'रोकड खाता (Cash Book)' },
          { id: 'bank-book', label: 'बैंक खाता (Bank Book)' },
          { id: 'day-book', label: 'दैनिक खाता (Day Book)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: activeReport === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
              color: activeReport === tab.id ? 'var(--primary-700)' : 'var(--navy-600)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report 1: Trial Balance */}
      {activeReport === 'trial-balance' && data?.rows && (
        <div className="data-card">
          <div className="data-card-header">
            <h3>सन्तुलन परीक्षण विवरण (Trial Balance)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {data.isBalanced ? (
                <span className="status-pill status-approved">
                  <CheckCircle2 size={13} /> दोहोरो लेखा पूर्ण सन्तुलित (Balanced)
                </span>
              ) : (
                <span className="status-pill status-pending-approval">
                  <AlertTriangle size={13} /> असन्तुलित (फरक: {curr} {data.difference.toFixed(2)})
                </span>
              )}
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>खाता कोड</th>
                  <th>खाता शीर्षक (Account Name)</th>
                  <th>वर्ग (Category)</th>
                  <th style={{ textAlign: 'right' }}>कुल डेबिट (Debit रु.)</th>
                  <th style={{ textAlign: 'right' }}>कुल क्रेडिट (Credit रु.)</th>
                  <th style={{ textAlign: 'right' }}>बाँकी डेबिट (Net Debit)</th>
                  <th style={{ textAlign: 'right' }}>बाँकी क्रेडिट (Net Credit)</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.account_code}</td>
                    <td style={{ fontWeight: 600 }}>{lang === 'ne' ? r.name_ne : r.name_en}</td>
                    <td><span style={{ fontSize: '11px', color: 'var(--navy-600)' }}>{r.category}</span></td>
                    <td style={{ textAlign: 'right' }}>{r.total_debit > 0 ? Number(r.total_debit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                    <td style={{ textAlign: 'right' }}>{r.total_credit > 0 ? Number(r.total_credit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.net_debit > 0 ? Number(r.net_debit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.net_credit > 0 ? Number(r.net_credit).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr style={{ backgroundColor: 'var(--navy-100)', fontWeight: 800, fontSize: '14px', borderTop: '2px solid var(--navy-400)' }}>
                  <td colSpan={3} style={{ textAlign: 'right' }}>कुल सन्तुलन योग (Grand Total):</td>
                  <td style={{ textAlign: 'right' }}>{curr} {Number(data.grandTotalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>{curr} {Number(data.grandTotalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Cash Book */}
      {activeReport === 'cash-book' && data?.transactions && (
        <div className="data-card">
          <div className="data-card-header">
            <h3>रोकड खाता (Cash Book)</h3>
            <div>
              अन्तिम नगद मौज्दात: <strong>{curr} {Number(data.closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>भौचर नं.</th>
                  <th>मिति (BS)</th>
                  <th>सदस्य / पक्ष</th>
                  <th>विवरण (Particulars)</th>
                  <th style={{ textAlign: 'right' }}>नगद आम्दानी (Receipts रु.)</th>
                  <th style={{ textAlign: 'right' }}>नगद भुक्तानी (Payments रु.)</th>
                  <th style={{ textAlign: 'right' }}>मौज्दात (Balance रु.)</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px' }}>कुनै कारोबार फेला परेन।</td></tr>
                ) : (
                  data.transactions.map((t, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.voucher_number}</td>
                      <td>{t.voucher_date_bs}</td>
                      <td>{t.member_name || '-'}</td>
                      <td>{t.particulars}</td>
                      <td style={{ textAlign: 'right', color: 'var(--primary-700)', fontWeight: t.receipt_amount > 0 ? 700 : 400 }}>
                        {t.receipt_amount > 0 ? Number(t.receipt_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--danger-600)', fontWeight: t.payment_amount > 0 ? 700 : 400 }}>
                        {t.payment_amount > 0 ? Number(t.payment_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {Number(t.running_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
                {/* Total Row */}
                <tr style={{ backgroundColor: 'var(--navy-50)', fontWeight: 700 }}>
                  <td colSpan={4} style={{ textAlign: 'right' }}>कुल जम्मा:</td>
                  <td style={{ textAlign: 'right', color: 'var(--primary-700)' }}>{curr} {Number(data.totalReceipts).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right', color: 'var(--danger-600)' }}>{curr} {Number(data.totalPayments).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'right' }}>{curr} {Number(data.closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Bank Book */}
      {activeReport === 'bank-book' && data?.transactions && (
        <div className="data-card">
          <div className="data-card-header">
            <h3>बैंक खाता (Bank Book)</h3>
            <div>
              अन्तिम बैंक मौज्दात: <strong>{curr} {Number(data.closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>भौचर नं.</th>
                  <th>मिति (BS)</th>
                  <th>बैंक नाम</th>
                  <th>चेक नं.</th>
                  <th>विवरण</th>
                  <th style={{ textAlign: 'right' }}>दाखिला (Deposits रु.)</th>
                  <th style={{ textAlign: 'right' }}>झिकिएको (Withdrawals रु.)</th>
                  <th style={{ textAlign: 'right' }}>मौज्दात (Balance रु.)</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>कुनै बैंक कारोबार फेला परेन।</td></tr>
                ) : (
                  data.transactions.map((t, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.voucher_number}</td>
                      <td>{t.voucher_date_bs}</td>
                      <td>{t.bank_name}</td>
                      <td>{t.cheque_no || '-'}</td>
                      <td>{t.particulars}</td>
                      <td style={{ textAlign: 'right', color: 'var(--primary-700)' }}>{t.deposit_amount > 0 ? Number(t.deposit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                      <td style={{ textAlign: 'right', color: 'var(--danger-600)' }}>{t.withdrawal_amount > 0 ? Number(t.withdrawal_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(t.running_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: Day Book */}
      {activeReport === 'day-book' && data?.vouchers && (
        <div className="data-card">
          <div className="data-card-header">
            <h3>दैनिक खाता (Day Book)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px' }}>मिति (वि.सं.):</label>
              <input
                type="text"
                className="form-input"
                style={{ width: '130px', padding: '4px 8px', fontSize: '13px' }}
                value={dayDate}
                onChange={e => setDayDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--navy-600)' }}>
              कुल भौचर संख्या: <strong>{data.totalVouchers}</strong> | कुल कारोबार रकम: <strong>{curr} {Number(data.totalVolume).toLocaleString()}</strong>
            </div>

            {data.vouchers.map(v => (
              <div key={v.id} style={{ border: '1px solid var(--navy-200)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '12px', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-700)' }}>
                    {v.voucher_number} - {v.voucher_type_title}
                  </strong>
                  <span>सदस्य: <strong>{v.member_name || '-'}</strong> | रकम: <strong>{curr} {Number(v.total_amount).toLocaleString()}</strong></span>
                </div>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    {v.lines.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '3px 6px', fontWeight: 600 }}>{l.account_name_ne || l.account_name_en}</td>
                        <td style={{ padding: '3px 6px', color: '#64748b' }}>{l.particulars}</td>
                        <td style={{ padding: '3px 6px', textAlign: 'right', width: '120px' }}>
                          {l.debit_amount > 0 ? `डेबिट: ${Number(l.debit_amount).toLocaleString()}` : ''}
                        </td>
                        <td style={{ padding: '3px 6px', textAlign: 'right', width: '120px' }}>
                          {l.credit_amount > 0 ? `क्रेडिट: ${Number(l.credit_amount).toLocaleString()}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
