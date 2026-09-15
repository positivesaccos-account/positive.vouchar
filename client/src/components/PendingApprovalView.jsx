import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, XCircle, Eye, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { VoucherPrintModal } from './VoucherPrintModal';

export const PendingApprovalView = ({ onActionCompleted }) => {
  const { token, t, lang, user, orgSettings } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printId, setPrintId] = useState(null);
  const [dialog, setDialog] = useState({ open: false, type: '', voucher: null, reason: '' });

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vouchers?status=PENDING_APPROVAL', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVouchers(data.vouchers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async () => {
    const { type, voucher, reason } = dialog;
    if (type === 'reject' && !reason.trim()) {
      alert('कृपया अस्वीकृत गर्नुको कारण उल्लेख गर्नुहोस्।');
      return;
    }

    try {
      const endpoint = `/api/vouchers/${voucher.id}/${type}`;
      const body = type === 'reject' ? { rejection_reason: reason } : {};

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
        setDialog({ open: false, type: '', voucher: null, reason: '' });
        fetchPending();
        if (onActionCompleted) onActionCompleted();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('कार्य सम्पन्न गर्न सकिएन।');
    }
  };

  const curr = orgSettings?.currency_symbol || 'रु.';
  const threshold = orgSettings?.approval_threshold || 50000;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={22} />
            <span>स्वीकृति आवश्यक भौचरहरू (Maker-Checker Approval Queue)</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>
            स्वीकृति सीमा ({curr} {Number(threshold).toLocaleString()}) भन्दा माथिका भौचरहरू - व्यवस्थापकको पूर्व-स्वीकृति अनिवार्य
          </p>
        </div>

        <div className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '13px', padding: '6px 14px' }}>
          कुल बाँकी: {vouchers.length}
        </div>
      </div>

      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>भौचर नं.</th>
                <th>मिति (BS)</th>
                <th>प्रकार</th>
                <th>सदस्य / सम्बन्धित पक्ष</th>
                <th style={{ textAlign: 'right' }}>रकम (रु.)</th>
                <th>तयार गर्ने क्यासियर</th>
                <th>कैफियत (Remarks)</th>
                <th style={{ textAlign: 'right' }}>निर्णय (Decision)</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--navy-500)' }}>
                    हाल कुनै पनि भौचर स्वीकृति पर्खिरहेको छैन। सबै ठूला रकमका भौचरहरू स्वीकृत भइसकेका छन्।
                  </td>
                </tr>
              ) : (
                vouchers.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v.voucher_number}</td>
                    <td>{v.voucher_date_bs}</td>
                    <td>{v.voucher_type_title_ne || v.voucher_type_code}</td>
                    <td>{v.member_name || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger-600)' }}>
                      {curr} {Number(v.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>{v.prepared_by_name}</td>
                    <td style={{ fontSize: '12px', color: 'var(--navy-600)', maxWidth: '200px' }}>
                      {v.remarks || '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => setPrintId(v.id)}
                          title="विवरण हेर्नुहोस्"
                        >
                          <Eye size={14} />
                          <span>हेर्नुहोस्</span>
                        </button>

                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 12px', fontSize: '12px', backgroundColor: '#059669' }}
                          onClick={() => setDialog({ open: true, type: 'approve', voucher: v, reason: '' })}
                        >
                          <CheckCircle size={14} />
                          <span>स्वीकृत</span>
                        </button>

                        <button
                          className="btn btn-danger"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => setDialog({ open: true, type: 'reject', voucher: v, reason: '' })}
                        >
                          <XCircle size={14} />
                          <span>अस्वीकृत</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {printId && (
        <VoucherPrintModal voucherId={printId} onClose={() => setPrintId(null)} />
      )}

      {dialog.open && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{dialog.type === 'approve' ? 'भौचर स्वीकृत गर्नुहोस्' : 'भौचर अस्वीकृत गर्नुहोस्'}</h3>
              <button onClick={() => setDialog({ open: false, type: '', voucher: null, reason: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', marginBottom: '14px' }}>
                भौचर नं: <strong>{dialog.voucher.voucher_number}</strong><br />
                रकम: <strong>{curr} {Number(dialog.voucher.total_amount).toLocaleString()}</strong><br />
                तयार गर्ने: <strong>{dialog.voucher.prepared_by_name}</strong>
              </p>

              {dialog.type === 'reject' && (
                <div className="form-group">
                  <label className="form-label">अस्वीकृत गर्नुको कारण (Reason) *</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    required
                    placeholder="जस्तै: आवश्यक कागजात अपुग भएको, रकम फरक परेको आदि..."
                    value={dialog.reason}
                    onChange={e => setDialog({ ...dialog, reason: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDialog({ open: false, type: '', voucher: null, reason: '' })}>
                रद्द
              </button>
              <button
                className={`btn ${dialog.type === 'reject' ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleAction}
              >
                {dialog.type === 'approve' ? 'स्वीकृत गर्नुहोस्' : 'अस्वीकृत गर्नुहोस्'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
