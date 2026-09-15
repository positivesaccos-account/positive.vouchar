import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, X, Download, ShieldCheck, AlertCircle, Scissors } from 'lucide-react';

export const VoucherPrintModal = ({ voucherId, onClose, onPrintSuccess }) => {
  const { token, t, lang, orgSettings } = useAuth();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState('BOTH'); // BOTH, CUSTOMER_ONLY, OFFICE_ONLY
  const [isReprint, setIsReprint] = useState(false);
  const [reprintNumber, setReprintNumber] = useState(0);

  useEffect(() => {
    fetchVoucher();
  }, [voucherId]);

  const fetchVoucher = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vouchers/${voucherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVoucher(data.voucher);
        if (data.voucher.printLogs && data.voucher.printLogs.length > 0) {
          setIsReprint(true);
          setReprintNumber(data.voucher.printLogs.length);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const res = await fetch(`/api/vouchers/${voucherId}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ print_type: printMode })
      });
      const data = await res.json();
      if (data.success) {
        setIsReprint(data.isReprint);
        setReprintNumber(data.reprintNumber);
        if (onPrintSuccess) onPrintSuccess();
        window.print();
      } else {
        alert(data.error || 'भौचर छाप्न अनुमति छैन।');
      }
    } catch (e) {
      alert('प्रिन्ट लग रेकर्ड गर्दा त्रुटि देखा पर्यो।');
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-card" style={{ padding: '30px', textAlign: 'center' }}>
          भौचर लोड हुँदैछ... कृपया पर्खनुहोस्।
        </div>
      </div>
    );
  }

  if (!voucher) return null;

  const org = orgSettings || {
    name_ne: 'पोजिटिभ बचत तथा ऋण सहकारी संस्था लि.',
    name_en: 'Positive Saving & Credit Co-operative Ltd.',
    registration_no: 'दर्ता नं. १७/०७९/८०, गोकर्णेश्वर नगरपालिका वडा नं. ८',
    pan_no: '६२४३३८४७१',
    address_ne: 'गोकर्णेश्वर नगरपालिका-८, जोरपाटी, नेपाल',
    phone: '+977-1-9768595892',
    email: 'positivesaccos@gmail.com'
  };

  const isLocked = voucher.requires_approval === 1 && voucher.status !== 'APPROVED' && voucher.status !== 'PRINTED' && voucher.status !== 'VERIFIED';

  const renderVoucherCopy = (copyType) => {
    const isCustomer = copyType === 'CUSTOMER';
    const copyTitle = isCustomer ? 'ग्राहक प्रति (CUSTOMER COPY)' : 'कार्यालय प्रति (OFFICE COPY)';

    return (
      <div className="voucher-half-sheet" style={{
        position: 'relative',
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '4px',
        fontSize: '11.5px',
        color: '#0f172a',
        lineHeight: 1.35
      }}>
        {/* Reprint Watermark / Badge */}
        {isReprint && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '18px',
            border: '2px solid #dc2626',
            color: '#dc2626',
            fontWeight: 800,
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '4px',
            transform: 'rotate(-4deg)',
            backgroundColor: '#fee2e2',
            zIndex: 10
          }}>
            प्रतिलिपि (REPRINT #{reprintNumber})
          </div>
        )}

        {/* Top Header Row with Copy Badge & Slogan */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: isCustomer ? '#dbeafe' : '#fef3c7',
            color: isCustomer ? '#1e40af' : '#92400e',
            fontWeight: 700,
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px solid ${isCustomer ? '#bfdbfe' : '#fde68a'}`
          }}>
            {copyTitle}
          </div>
          <div style={{ fontSize: '10px', color: '#065f46', fontWeight: 700, fontStyle: 'italic' }}>
            “साझा बचत, साझा समृद्धि”
          </div>
        </div>

        {/* Organization Brand Header with Official Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
          borderBottom: '2px solid #064e3b',
          paddingBottom: '6px'
        }}>
          {/* Logo on Left */}
          <div style={{ flexShrink: 0, width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={org.logo_url || '/logo.png'}
              alt="Positive SACCOS Logo"
              style={{ width: '62px', height: '62px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Central Title & Full Legal Details */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h2 style={{ fontSize: '15.5px', fontWeight: 800, color: '#064e3b', margin: 0, letterSpacing: '0.2px' }}>
              {org.name_ne || 'पोजिटिभ बचत तथा ऋण सहकारी संस्था लि.'}
            </h2>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginTop: '1px' }}>
              {org.name_en || 'Positive Saving & Credit Co-operative Ltd.'}
            </div>
            <div style={{ fontSize: '10px', color: '#334155', marginTop: '2px' }}>
              {org.address_ne || 'गोकर्णेश्वर नगरपालिका-८, जोरपाटी, नेपाल'} | फोन: {org.phone || '+977-1-9768595892'} | इमेल: {org.email || 'positivesaccos@gmail.com'}
            </div>
            <div style={{ fontSize: '9.5px', color: '#475569', marginTop: '1px', fontWeight: 600 }}>
              {org.registration_no || 'दर्ता नं. १७/०७९/८०, गोकर्णेश्वर नगरपालिका वडा नं. ८'} | स्थायी लेखा नं. (PAN): {org.pan_no || '६२४३३८४७१'}
            </div>
          </div>

          {/* Estd & Tagline Info on Right */}
          <div style={{ flexShrink: 0, textAlign: 'right', fontSize: '10px', color: '#064e3b', minWidth: '70px' }}>
            <div style={{
              display: 'inline-block',
              padding: '2px 6px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '4px',
              fontWeight: 700
            }}>
              स्था. २०७९
            </div>
            <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '2px' }}>
              Estd. 2022
            </div>
          </div>
        </div>

        {/* Voucher Title & Meta Grid */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          padding: '4px 10px',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          marginBottom: '8px'
        }}>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>भौचर प्रकार: </span>
            <strong style={{ fontSize: '12px', color: '#0f172a' }}>
              {voucher.voucher_type_title_ne || voucher.voucher_type_title_en} ({voucher.voucher_type_code})
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>भौचर नं: </span>
            <strong style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#064e3b' }}>
              {voucher.voucher_number}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>मिति (वि.सं.): </span>
            <strong>{voucher.voucher_date_bs}</strong> ({voucher.voucher_date_ad})
          </div>
        </div>

        {/* Member / Reference Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
          <div>
            <span style={{ color: '#64748b' }}>सदस्य / सम्बन्धित पक्ष: </span>
            <strong>{voucher.member_name || '-'}</strong>
            {voucher.member_id && <span style={{ color: '#64748b' }}> (सदस्य नं.: {voucher.member_id})</span>}
          </div>
          <div>
            <span style={{ color: '#64748b' }}>भुक्तानी माध्यम: </span>
            <strong>{voucher.payment_mode}</strong>
            {voucher.cheque_no && <span> | चेक नं.: <strong>{voucher.cheque_no}</strong></span>}
            {voucher.reference_no && <span> | बिल नं.: <strong>{voucher.reference_no}</strong></span>}
          </div>
        </div>

        {/* Accounting Lines Table */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '6px',
          fontSize: '11px',
          border: '1px solid #cbd5e1'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '4px 8px', textAlign: 'left', width: '35px' }}>क्र.सं.</th>
              <th style={{ padding: '4px 8px', textAlign: 'left' }}>खाता शीर्षक (Account Head)</th>
              <th style={{ padding: '4px 8px', textAlign: 'left' }}>विवरण (Particulars)</th>
              <th style={{ padding: '4px 8px', textAlign: 'right', width: '90px' }}>डेबिट (Debit रु.)</th>
              <th style={{ padding: '4px 8px', textAlign: 'right', width: '90px' }}>क्रेडिट (Credit रु.)</th>
            </tr>
          </thead>
          <tbody>
            {voucher.lines.map((l, i) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '3px 8px' }}>{i + 1}</td>
                <td style={{ padding: '3px 8px', fontWeight: 600 }}>
                  {l.account_name_ne || l.account_name_en} ({l.account_code})
                </td>
                <td style={{ padding: '3px 8px', color: '#475569' }}>{l.particulars || '-'}</td>
                <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: l.debit_amount > 0 ? 600 : 400 }}>
                  {l.debit_amount > 0 ? Number(l.debit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                </td>
                <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: l.credit_amount > 0 ? 600 : 400 }}>
                  {l.credit_amount > 0 ? Number(l.credit_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr style={{ backgroundColor: '#f8fafc', fontWeight: 700, borderTop: '1px solid #94a3b8' }}>
              <td colSpan={3} style={{ padding: '4px 8px', textAlign: 'right' }}>कुल रकम (Total Amount):</td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                रु. {Number(voucher.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                रु. {Number(voucher.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words */}
        <div style={{
          backgroundColor: '#fafafa',
          border: '1px solid #e5e7eb',
          padding: '4px 8px',
          borderRadius: '3px',
          marginBottom: '8px',
          fontSize: '11px'
        }}>
          <div><strong>अक्षरमा: </strong>{voucher.amount_in_words_ne}</div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>In Words: {voucher.amount_in_words_en}</div>
        </div>

        {/* Remarks */}
        {voucher.remarks && (
          <div style={{ fontSize: '10.5px', marginBottom: '8px', color: '#334155' }}>
            <strong>कैफियत (Remarks): </strong>{voucher.remarks}
          </div>
        )}

        {/* Signatures & Office Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: '14px',
          paddingTop: '6px',
          fontSize: '10.5px'
        }}>
          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <div style={{ borderTop: '1px solid #64748b', paddingTop: '3px', fontWeight: 600 }}>
              तयार गर्ने (Prepared By)
            </div>
            <div style={{ fontSize: '9.5px', color: '#64748b' }}>{voucher.prepared_by_name_en}</div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <div style={{ borderTop: '1px solid #64748b', paddingTop: '3px', fontWeight: 600 }}>
              जाँच गर्ने (Checked By)
            </div>
            <div style={{ fontSize: '9.5px', color: '#64748b' }}>लेखा अधिकृत</div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <div style={{ borderTop: '1px solid #64748b', paddingTop: '3px', fontWeight: 600 }}>
              स्वीकृत गर्ने (Approved By)
            </div>
            <div style={{ fontSize: '9.5px', color: '#64748b' }}>
              {voucher.approved_by_name_en || (voucher.requires_approval ? 'व्यवस्थापक' : 'स्वतः सीमा समीक्षा')}
            </div>
          </div>

          {isCustomer ? (
            <div style={{ textAlign: 'center', minWidth: '90px' }}>
              <div style={{ borderTop: '1px solid #64748b', paddingTop: '3px', fontWeight: 600 }}>
                बुझिलिने (Receiver)
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b' }}>हस्ताक्षर / ल्याप्चे</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', minWidth: '90px' }}>
              <div style={{ borderTop: '1px solid #64748b', paddingTop: '3px', fontWeight: 600 }}>
                व्यवस्थापक प्रमाणीकरण
              </div>
              <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                {voucher.verified_by_name_en ? 'प्रमाणीकृत' : 'Post-Review'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', overflowY: 'auto', paddingTop: '30px' }}>
      <div className="modal-card" style={{ maxWidth: '880px', margin: '0 auto 30px' }}>
        {/* Modal Controls Header */}
        <div className="modal-header" style={{ padding: '12px 20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>A4 दुई-भाग मुद्रण पूर्वावलोकन (A4 Two-Part Print Preview)</span>
              {isReprint && (
                <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  REPRINT #{reprintNumber}
                </span>
              )}
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--navy-500)' }}>
              A4 पानालाई ठीक बीचबाट दुई भागमा विभाजन गरिएको: माथि ग्राहक प्रति र तल कार्यालय प्रति।
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
              value={printMode}
              onChange={e => setPrintMode(e.target.value)}
            >
              <option value="BOTH">दुवै प्रतिहरू (Both Copies - Top & Bottom)</option>
              <option value="CUSTOMER_ONLY">ग्राहक प्रति मात्र (Customer Copy Only)</option>
              <option value="OFFICE_ONLY">कार्यालय प्रति मात्र (Office Copy Only)</option>
            </select>

            <button
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={handlePrint}
              disabled={isLocked}
            >
              <Printer size={15} />
              <span>प्रिन्ट गर्नुहोस् (Print A4)</span>
            </button>

            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Lock Alert if approval required and not approved */}
        {isLocked && (
          <div style={{
            backgroundColor: '#fee2e2',
            borderBottom: '1px solid #fca5a5',
            padding: '10px 20px',
            color: '#dc2626',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600
          }}>
            <AlertCircle size={18} />
            <span>
              मुद्रण रोकिएको छ: यो भौचर रकम स्वीकृति सीमा (रु. ५०,०००) भन्दा माथि छ। व्यवस्थापकको स्वीकृति बिना यो भौचर छाप्न पाइने छैन।
            </span>
          </div>
        )}

        {/* The Printable A4 Sheet Container */}
        <div id="printable-a4-sheet" className="modal-body" style={{ backgroundColor: '#f8fafc', padding: '16px' }}>
          {/* Top Half: Customer Copy */}
          {(printMode === 'BOTH' || printMode === 'CUSTOMER_ONLY') && (
            renderVoucherCopy('CUSTOMER')
          )}

          {/* Cutting Line Divider */}
          {printMode === 'BOTH' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '12px 0',
              color: '#94a3b8',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              <div style={{ flex: 1, borderTop: '1px dashed #94a3b8' }} />
              <Scissors size={14} style={{ transform: 'rotate(90deg)' }} />
              <span>यहाँबाट काट्नुहोस् (Cut along this line)</span>
              <div style={{ flex: 1, borderTop: '1px dashed #94a3b8' }} />
            </div>
          )}

          {/* Bottom Half: Office Copy */}
          {(printMode === 'BOTH' || printMode === 'OFFICE_ONLY') && (
            renderVoucherCopy('OFFICE')
          )}
        </div>
      </div>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-a4-sheet, #printable-a4-sheet * {
            visibility: visible;
          }
          #printable-a4-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .voucher-half-sheet {
            border: 1px solid #94a3b8 !important;
            page-break-inside: avoid;
            margin-bottom: 6px;
          }
          @page {
            size: A4 portrait;
            margin: 8mm 8mm;
          }
        }
      `}</style>
    </div>
  );
};
