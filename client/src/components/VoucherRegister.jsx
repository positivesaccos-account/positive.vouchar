import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Search,
  Printer,
  CheckCircle,
  XCircle,
  RotateCcw,
  Ban,
  Eye,
  History,
  AlertCircle,
  X
} from 'lucide-react';
import { VoucherPrintModal } from './VoucherPrintModal';

export const VoucherRegister = ({ onViewVoucher, onNewVoucherClick }) => {
  const { token, t, lang, user, orgSettings } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [printVoucherId, setPrintVoucherId] = useState(null);
  const [auditVoucherId, setAuditVoucherId] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [actionModal, setActionModal] = useState({ open: false, type: '', voucher: null, reason: '' });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchTerm) query.append('search', searchTerm);
      if (selectedType) query.append('voucher_type_id', selectedType);
      if (selectedStatus) query.append('status', selectedStatus);
      if (startDate) query.append('start_date', startDate);
      if (endDate) query.append('end_date', endDate);

      const [vRes, tRes] = await Promise.all([
        fetch(`/api/vouchers?${query.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/vouchers/types', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [vData, tData] = await Promise.all([vRes.json(), tRes.json()]);

      if (vData.success) {
        setVouchers(vData.vouchers);
        setTotalCount(vData.total);
      }
      if (tData.success) setVoucherTypes(tData.voucherTypes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [selectedType, selectedStatus, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVouchers();
  };

  const openAuditTrail = async (vId) => {
    try {
      const res = await fetch(`/api/vouchers/${vId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAuditData(data.voucher.auditLogs || []);
        setAuditVoucherId(vId);
      }
    } catch (e) {
      alert('लेखापरीक्षण विवरण लोड गर्न सकिएन।');
    }
  };

  const handleExecuteAction = async () => {
    const { type, voucher, reason } = actionModal;
    if ((type === 'reject' || type === 'cancel' || type === 'reverse') && !reason.trim()) {
      alert('कृपया कारण (Reason) अनिवार्य रुपमा उल्लेख गर्नुहोस्।');
      return;
    }

    try {
      let endpoint = `/api/vouchers/${voucher.id}/${type}`;
      let body = {};
      if (type === 'reject') body = { rejection_reason: reason };
      if (type === 'cancel') body = { cancellation_reason: reason };
      if (type === 'reverse') body = { reversal_reason: reason };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setActionModal({ open: false, type: '', voucher: null, reason: '' });
        fetchVouchers();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('कार्य सम्पन्न गर्न सकिएन।');
    }
  };

  const curr = orgSettings?.currency_symbol || 'रु.';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} color="var(--primary-600)" />
            <span>भौचर दर्ता किताब (Voucher Register)</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>
            कुल रेकर्डहरू: {totalCount} भौचरहरू सुरक्षित डिजिटल भण्डारणमा
          </p>
        </div>

        <button className="btn btn-primary" onClick={onNewVoucherClick}>
          + नयाँ भौचर प्रविष्टि
        </button>
      </div>

      {/* Filter Bar */}
      <div className="data-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>खोजी (Voucher No / Member / Remarks)</label>
            <input
              type="text"
              className="form-input"
              placeholder="भौचर नं., सदस्य, बिल नं..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>भौचर प्रकार (Type)</label>
            <select className="form-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
              <option value="">-- सबै प्रकार --</option>
              {voucherTypes.map(vt => (
                <option key={vt.id} value={vt.id}>{vt.code} - {lang === 'ne' ? vt.title_ne : vt.title_en}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>स्थिति (Status)</label>
            <select className="form-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="">-- सबै स्थिति --</option>
              <option value="PENDING_APPROVAL">स्वीकृति पर्खिरहेको (Pending Approval)</option>
              <option value="APPROVED">स्वीकृत (Approved)</option>
              <option value="PENDING_MANAGER_REVIEW">व्यवस्थापक समीक्षा (Pending Review)</option>
              <option value="POSTED">जारी गरिएको (Posted)</option>
              <option value="PRINTED">मुद्रित (Printed)</option>
              <option value="REJECTED">अस्वीकृत (Rejected)</option>
              <option value="CANCELLED">रद्द गरिएको (Cancelled)</option>
              <option value="REVERSED">उल्ट्याइएको (Reversed)</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>सुरु मिति (From BS)</label>
            <input
              type="text"
              className="form-input"
              placeholder="2082-04-01"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '11px' }}>अन्त्य मिति (To BS)</label>
            <input
              type="text"
              className="form-input"
              placeholder="2083-03-31"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '9px 16px' }}>
            <Search size={15} />
            <span>फिल्टर</span>
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>भौचर नं.</th>
                <th>मिति (वि.सं.)</th>
                <th>प्रकार (Type)</th>
                <th>सदस्य / सम्बन्धित पक्ष</th>
                <th style={{ textAlign: 'right' }}>रकम (रु.)</th>
                <th style={{ textAlign: 'center' }}>स्थिति (Status)</th>
                <th>तयार गर्ने</th>
                <th style={{ textAlign: 'right' }}>कार्य (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--navy-500)' }}>
                    कुनै भौचर फेला परेन।
                  </td>
                </tr>
              ) : (
                vouchers.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--navy-900)' }}>
                      {v.voucher_number}
                    </td>
                    <td>{v.voucher_date_bs}</td>
                    <td>{v.voucher_type_title_ne || v.voucher_type_code}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.member_name || '-'}</div>
                      {v.member_id && <div style={{ fontSize: '10.5px', color: 'var(--navy-500)' }}>नं: {v.member_id}</div>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {curr} {Number(v.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-pill ${
                        v.status === 'APPROVED' ? 'status-approved' :
                        v.status === 'PENDING_APPROVAL' ? 'status-pending-approval' :
                        v.status === 'PENDING_MANAGER_REVIEW' ? 'status-pending-review' :
                        v.status === 'POSTED' ? 'status-posted' :
                        v.status === 'PRINTED' ? 'status-posted' :
                        v.status === 'REJECTED' ? 'status-rejected' : 'status-cancelled'
                      }`}>
                        {t.status[v.status] || v.status}
                      </span>
                    </td>
                    <td>{v.prepared_by_name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {/* Print Button */}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          title="A4 प्रिन्ट / पूर्वावलोकन"
                          onClick={() => setPrintVoucherId(v.id)}
                        >
                          <Printer size={14} />
                        </button>

                        {/* Audit Trail */}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          title="लेखापरीक्षण इतिहास (Audit Trail)"
                          onClick={() => openAuditTrail(v.id)}
                        >
                          <History size={14} />
                        </button>

                        {/* Manager Approve / Reject (Maker-Checker) */}
                        {v.status === 'PENDING_APPROVAL' && (user.isSuperAdmin || user.permissions.includes('voucher:approve')) && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#059669' }}
                              title="स्वीकृत गर्नुहोस्"
                              onClick={() => setActionModal({ open: true, type: 'approve', voucher: v, reason: '' })}
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              title="अस्वीकृत गर्नुहोस्"
                              onClick={() => setActionModal({ open: true, type: 'reject', voucher: v, reason: '' })}
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}

                        {/* Cancel & Reverse Actions */}
                        {v.status !== 'CANCELLED' && v.status !== 'REVERSED' && (user.isSuperAdmin || user.permissions.includes('voucher:cancel')) && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger-600)' }}
                            title="भौचर रद्द गर्नुहोस्"
                            onClick={() => setActionModal({ open: true, type: 'cancel', voucher: v, reason: '' })}
                          >
                            <Ban size={14} />
                          </button>
                        )}

                        {v.status !== 'CANCELLED' && v.status !== 'REVERSED' && (user.isSuperAdmin || user.permissions.includes('voucher:reverse')) && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--gold-600)' }}
                            title="भौचर उल्ट्याउनुहोस् (Reversal)"
                            onClick={() => setActionModal({ open: true, type: 'reverse', voucher: v, reason: '' })}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* A4 Two-Part Print Modal */}
      {printVoucherId && (
        <VoucherPrintModal
          voucherId={printVoucherId}
          onClose={() => setPrintVoucherId(null)}
          onPrintSuccess={fetchVouchers}
        />
      )}

      {/* Audit History Modal */}
      {auditVoucherId && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>पूर्ण लेखापरीक्षण विवरण (Audit Trail)</h3>
              <button onClick={() => setAuditVoucherId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {auditData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--navy-500)' }}>
                  कुनै लेखापरीक्षण रेकर्ड छैन।
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {auditData.map(log => (
                    <div key={log.id} style={{
                      backgroundColor: 'var(--navy-50)',
                      border: '1px solid var(--navy-200)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      fontSize: '12.5px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--primary-700)' }}>कार्य: {log.action}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--navy-500)' }}>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ color: 'var(--navy-700)' }}>
                        प्रयोगकर्ता: <strong>{log.username}</strong> ({log.user_role}) | IP: {log.ip_address}
                      </div>
                      {log.details && (
                        <div style={{ fontSize: '11px', color: 'var(--navy-500)', marginTop: '4px', wordBreak: 'break-all' }}>
                          विवरण: {log.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAuditVoucherId(null)}>
                बन्द गर्नुहोस्
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Dialog (Approve, Reject, Cancel, Reverse) */}
      {actionModal.open && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>
                {actionModal.type === 'approve' && 'भौचर स्वीकृति (Approve Voucher)'}
                {actionModal.type === 'reject' && 'भौचर अस्वीकृति (Reject Voucher)'}
                {actionModal.type === 'cancel' && 'भौचर रद्द (Cancel Voucher)'}
                {actionModal.type === 'reverse' && 'भौचर उल्ट्याउने (Reverse Voucher)'}
              </h3>
              <button onClick={() => setActionModal({ open: false, type: '', voucher: null, reason: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '14px', fontSize: '13px' }}>
                भौचर नं.: <strong>{actionModal.voucher.voucher_number}</strong><br />
                रकम: <strong>{curr} {Number(actionModal.voucher.total_amount).toLocaleString()}</strong>
              </div>

              {actionModal.type !== 'approve' && (
                <div className="form-group">
                  <label className="form-label">कारण (Reason) * अनिवार्य</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    required
                    placeholder="कृपया यो कार्य गर्नुको स्पष्ट कारण खुलाउनुहोस्..."
                    value={actionModal.reason}
                    onChange={e => setActionModal({ ...actionModal, reason: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActionModal({ open: false, type: '', voucher: null, reason: '' })}>
                रद्द
              </button>
              <button
                className={`btn ${actionModal.type === 'reject' || actionModal.type === 'cancel' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleExecuteAction}
              >
                पुष्टि गर्नुहोस्
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
