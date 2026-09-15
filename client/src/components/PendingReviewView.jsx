import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, ShieldCheck, Eye, X } from 'lucide-react';
import { VoucherPrintModal } from './VoucherPrintModal';

export const PendingReviewView = ({ onActionCompleted }) => {
  const { token, t, lang, user, orgSettings } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printId, setPrintId] = useState(null);

  const fetchReviewList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vouchers?status=PENDING_MANAGER_REVIEW', {
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
    fetchReviewList();
  }, []);

  const handleVerify = async (vId) => {
    try {
      const res = await fetch(`/api/vouchers/${vId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('भौचर व्यवस्थापकद्वारा सफलतापूर्वक प्रमाणीकृत भयो।');
        fetchReviewList();
        if (onActionCompleted) onActionCompleted();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('प्रमाणीकरण गर्न सकिएन।');
    }
  };

  const curr = orgSettings?.currency_symbol || 'रु.';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={22} />
            <span>व्यवस्थापक समीक्षा बाँकी भौचरहरू (Post-Review Verification)</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>
            स्वीकृति सीमा भित्र क्यासियरद्वारा सिधै जारी गरिएका भौचरहरूको आन्तरिक लेखा नियन्त्रण तथा प्रमाणीकरण
          </p>
        </div>

        <div className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '13px', padding: '6px 14px' }}>
          समीक्षा बाँकी: {vouchers.length}
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
                <th>कैफियत</th>
                <th style={{ textAlign: 'right' }}>प्रमाणीकरण (Verification)</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--navy-500)' }}>
                    सबै सामान्य सीमा भित्रका भौचरहरूको व्यवस्थापकीय समीक्षा तथा प्रमाणीकरण सम्पन्न भइसकेको छ।
                  </td>
                </tr>
              ) : (
                vouchers.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{v.voucher_number}</td>
                    <td>{v.voucher_date_bs}</td>
                    <td>{v.voucher_type_title_ne || v.voucher_type_code}</td>
                    <td>{v.member_name || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
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
                        >
                          <Eye size={14} />
                          <span>हेर्नुहोस्</span>
                        </button>

                        <button
                          className="btn btn-gold"
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                          onClick={() => handleVerify(v.id)}
                        >
                          <ShieldCheck size={14} />
                          <span>प्रमाणीकरण गर्नुहोस्</span>
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
    </div>
  );
};
