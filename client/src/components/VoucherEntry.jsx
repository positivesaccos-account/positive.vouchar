import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FilePlus,
  Save,
  Send,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  X,
  FileText,
  Building2,
  Calendar
} from 'lucide-react';

export const VoucherEntry = ({ onVoucherCreated, initialTypeCode = 'CRV' }) => {
  const { token, t, lang, orgSettings } = useAuth();
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Form State
  const [voucherTypeId, setVoucherTypeId] = useState('');
  const [voucherDateBs, setVoucherDateBs] = useState('2082-06-15');
  const [voucherDateAd, setVoucherDateAd] = useState(new Date().toISOString().split('T')[0]);
  const [memberName, setMemberName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [remarks, setRemarks] = useState('');

  // Multi-line items
  const [lines, setLines] = useState([
    { account_id: '', particulars: '', debit_amount: '', credit_amount: '' },
    { account_id: '', particulars: '', debit_amount: '', credit_amount: '' }
  ]);

  // Load initial dropdowns
  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const [tRes, aRes, mRes] = await Promise.all([
        fetch('/api/vouchers/types', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/vouchers/accounts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/vouchers/members', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [tData, aData, mData] = await Promise.all([tRes.json(), aRes.json(), mRes.json()]);

      if (tData.success) {
        setVoucherTypes(tData.voucherTypes);
        const match = tData.voucherTypes.find(vt => vt.code === initialTypeCode);
        if (match) {
          setVoucherTypeId(match.id);
          setPaymentMode(match.default_payment_mode || 'CASH');
        } else if (tData.voucherTypes.length > 0) {
          setVoucherTypeId(tData.voucherTypes[0].id);
        }
      }
      if (aData.success) setAccounts(aData.accounts);
      if (mData.success) setMembers(mData.members);
    } catch (e) {
      setError('डाटा लोड गर्न सकिएन।');
    } finally {
      setLoading(false);
    }
  };

  // When voucher type changes, set sensible defaults
  const handleVoucherTypeChange = (e) => {
    const id = parseInt(e.target.value);
    setVoucherTypeId(id);
    const vt = voucherTypes.find(v => v.id === id);
    if (!vt) return;

    setPaymentMode(vt.default_payment_mode || 'CASH');

    const cashAcc = accounts.find(a => a.account_code === '1001');
    const bankAcc = accounts.find(a => a.account_code === '1002');
    const savAcc = accounts.find(a => a.account_code === '2001');
    const statAcc = accounts.find(a => a.account_code === '5005');

    // Intelligent default lines setup
    if (vt.code === 'CRV' || vt.code === 'SAV_DEP') {
      // Cash Receipt: Debit Cash, Credit Member Savings/Income
      setLines([
        { account_id: cashAcc ? cashAcc.id : '', particulars: 'नगद दाखिला', debit_amount: '', credit_amount: '' },
        { account_id: savAcc ? savAcc.id : '', particulars: 'बचत आम्दानी', debit_amount: '', credit_amount: '' }
      ]);
    } else if (vt.code === 'CPV' || vt.code === 'EXP_PAY') {
      // Cash Payment: Debit Expense, Credit Cash
      setLines([
        { account_id: statAcc ? statAcc.id : '', particulars: 'खर्च भुक्तानी', debit_amount: '', credit_amount: '' },
        { account_id: cashAcc ? cashAcc.id : '', particulars: 'नगद भुक्तानी', debit_amount: '', credit_amount: '' }
      ]);
    } else if (vt.code === 'BPV' || vt.code === 'LOAN_DISB') {
      // Bank Payment: Debit Account, Credit Bank
      setLines([
        { account_id: '', particulars: 'भुक्तानी', debit_amount: '', credit_amount: '' },
        { account_id: bankAcc ? bankAcc.id : '', particulars: 'बैंक खाता मार्फत चेक भुक्तानी', debit_amount: '', credit_amount: '' }
      ]);
    }
  };

  // Line handlers
  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;

    // If entering debit, auto-clear credit on the same line if desired, or let user enter
    if (field === 'debit_amount' && value > 0) {
      updated[index].credit_amount = '';
    } else if (field === 'credit_amount' && value > 0) {
      updated[index].debit_amount = '';
    }

    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, { account_id: '', particulars: '', debit_amount: '', credit_amount: '' }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 2) {
      alert('दोहोरो लेखाका लागि कम्तिमा २ वटा हरफ (Lines) आवश्यक पर्दछ।');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  // Real-time totals
  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit_amount) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit_amount) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit > 0 && diff < 0.01;

  const currentVt = voucherTypes.find(v => v.id === voucherTypeId);
  const threshold = orgSettings?.approval_threshold || 50000;
  const isAboveThreshold = totalDebit > threshold;

  const handleMemberSelect = (e) => {
    const memNo = e.target.value;
    setMemberId(memNo);
    const m = members.find(item => item.member_no === memNo);
    if (m) {
      setMemberName(lang === 'ne' ? m.name_ne : m.name_en);
    }
  };

  const handleSubmit = async (isDraft = false) => {
    setError('');

    if (!isBalanced && !isDraft) {
      setError(`दोहोरो लेखा असन्तुलित छ: कुल डेबिट (रु. ${totalDebit.toFixed(2)}) र कुल क्रेडिट (रु. ${totalCredit.toFixed(2)}) बराबर हुनुपर्छ।`);
      return;
    }

    if (currentVt?.requires_remarks === 1 && !remarks.trim()) {
      setError(`यस प्रकारको भौचर (${currentVt.title_ne}) का लागि कैफियत (Remarks) अनिवार्य छ।`);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        voucher_type_id: voucherTypeId,
        voucher_date_bs: voucherDateBs,
        voucher_date_ad: voucherDateAd,
        member_name: memberName,
        member_id: memberId,
        reference_no: referenceNo,
        cheque_no: chequeNo,
        payment_mode: paymentMode,
        remarks,
        is_draft: isDraft,
        lines: lines
          .filter(l => l.account_id && ((parseFloat(l.debit_amount) || 0) > 0 || (parseFloat(l.credit_amount) || 0) > 0))
          .map(l => ({
            account_id: parseInt(l.account_id),
            particulars: l.particulars,
            debit_amount: parseFloat(l.debit_amount) || 0,
            credit_amount: parseFloat(l.credit_amount) || 0
          }))
      };

      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        // Upload attachment if selected
        if (selectedFile && data.voucherId) {
          const formFile = new FormData();
          formFile.append('document', selectedFile);
          await fetch(`/api/vouchers/${data.voucherId}/attachments`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formFile
          });
        }

        alert(`भौचर ${data.voucherNumber} सफलतापूर्वक प्रविष्टि भयो!\nस्थिति: ${data.status}`);
        if (onVoucherCreated) onVoucherCreated(data.voucherId);
      } else {
        setError(data.error || 'भौचर सिर्जना गर्न सकिएन।');
      }
    } catch (e) {
      setError('सर्भरसँग सम्पर्क हुन सकेन।');
    } finally {
      setSubmitting(false);
    }
  };

  // Group voucher types by category
  const categories = [...new Set(voucherTypes.map(v => v.category))];

  return (
    <div className="data-card" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--navy-200)', paddingBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilePlus size={22} color="var(--primary-600)" />
            <span>डिजिटल भौचर प्रविष्टि (Digital Voucher Entry)</span>
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--navy-500)' }}>
            हस्तलिखित भौचरको सट्टा सिधै डिजिटल प्रविष्टि गरी प्रिन्ट गर्नुहोस्
          </p>
        </div>

        {/* Threshold Policy Banner */}
        <div style={{
          backgroundColor: isAboveThreshold ? '#fee2e2' : '#ecfdf5',
          border: `1px solid ${isAboveThreshold ? '#fca5a5' : '#a7f3d0'}`,
          borderRadius: 'var(--radius-md)',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 600,
          color: isAboveThreshold ? '#dc2626' : '#047857'
        }}>
          {isAboveThreshold ? (
            <span>⚠️ स्वीकृति आवश्यक (&gt; रु. {Number(threshold).toLocaleString()}) - व्यवस्थापक पूर्व-स्वीकृति</span>
          ) : (
            <span>✓ सीमा भित्र (क्यासियर सिधै जारी + व्यवस्थापक समीक्षा)</span>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'var(--danger-50)',
          border: '1px solid var(--danger-100)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--danger-600)',
          fontSize: '13.5px'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Voucher Type, Date BS, Date AD */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 700 }}>
            भौचर प्रकार (Voucher Type) *
          </label>
          <select
            className="form-select"
            style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-900)' }}
            value={voucherTypeId}
            onChange={handleVoucherTypeChange}
          >
            {categories.map(cat => (
              <optgroup key={cat} label={`── ${cat} ──`}>
                {voucherTypes.filter(vt => vt.category === cat).map(vt => (
                  <option key={vt.id} value={vt.id}>
                    {lang === 'ne' ? vt.title_ne : vt.title_en} ({vt.code})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">मिति (वि.सं. BS) *</label>
          <input
            type="text"
            className="form-input"
            value={voucherDateBs}
            onChange={e => setVoucherDateBs(e.target.value)}
            placeholder="2082-06-15"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date (A.D.)</label>
          <input
            type="date"
            className="form-input"
            value={voucherDateAd}
            onChange={e => setVoucherDateAd(e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Member Select / Party Name, Payment Mode, Cheque / Ref No */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group">
          <label className="form-label">सदस्य छनोट (Member ID)</label>
          <select className="form-select" value={memberId} onChange={handleMemberSelect}>
            <option value="">-- नयाँ / गैर-सदस्य --</option>
            {members.map(m => (
              <option key={m.member_no} value={m.member_no}>
                {m.member_no} - {lang === 'ne' ? m.name_ne : m.name_en}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">सदस्य / सम्बन्धित पक्षको नाम (Party Name)</label>
          <input
            type="text"
            className="form-input"
            value={memberName}
            onChange={e => setMemberName(e.target.value)}
            placeholder="e.g. Ram Bahadur Thapa"
          />
        </div>

        <div className="form-group">
          <label className="form-label">भुक्तानी माध्यम (Mode)</label>
          <select className="form-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
            <option value="CASH">नगद (CASH)</option>
            <option value="BANK">बैंक (BANK)</option>
            <option value="CHEQUE">चेक (CHEQUE)</option>
            <option value="TRANSFER">रकमान्तर (TRANSFER)</option>
            <option value="ADJUSTMENT">समायोजन (ADJUSTMENT)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">चेक नं. / बिल नं. (Ref)</label>
          <input
            type="text"
            className="form-input"
            value={chequeNo || referenceNo}
            onChange={e => {
              setChequeNo(e.target.value);
              setReferenceNo(e.target.value);
            }}
            placeholder="e.g. CHQ-10495"
          />
        </div>
      </div>

      {/* Row 3: Double-Entry Transaction Lines Grid */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
            दोहोरो लेखा प्रविष्टि (Double-Entry Accounting Lines) *
          </label>
          <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={addLine}>
            <Plus size={14} />
            <span>+ थप हरफ (Add Line)</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ border: '1px solid var(--navy-200)' }}>
            <thead>
              <tr>
                <th style={{ width: '35%' }}>खाता शीर्षक (Account Head) *</th>
                <th>विवरण (Particulars)</th>
                <th style={{ width: '18%', textAlign: 'right' }}>डेबिट रकम (Debit रु.)</th>
                <th style={{ width: '18%', textAlign: 'right' }}>क्रेडिट रकम (Credit रु.)</th>
                <th style={{ width: '45px', textAlign: 'center' }}>हटाउने</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      className="form-select"
                      style={{ fontSize: '13px', padding: '6px 8px' }}
                      value={line.account_id}
                      onChange={e => handleLineChange(idx, 'account_id', e.target.value)}
                    >
                      <option value="">-- खाता छान्नुहोस् --</option>
                      {['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'].map(cat => (
                        <optgroup key={cat} label={cat}>
                          {accounts.filter(a => a.category === cat).map(a => (
                            <option key={a.id} value={a.id}>
                              {a.account_code} - {lang === 'ne' ? a.name_ne : a.name_en}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px' }}
                      placeholder="विवरण..."
                      value={line.particulars}
                      onChange={e => handleLineChange(idx, 'particulars', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}
                      placeholder="0.00"
                      value={line.debit_amount}
                      onChange={e => handleLineChange(idx, 'debit_amount', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}
                      placeholder="0.00"
                      value={line.credit_amount}
                      onChange={e => handleLineChange(idx, 'credit_amount', e.target.value)}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger-600)', cursor: 'pointer' }}
                      title="हटाउनुहोस्"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Total Balance Row */}
              <tr style={{ backgroundColor: 'var(--navy-50)', fontWeight: 700, borderTop: '2px solid var(--navy-300)' }}>
                <td colSpan={2} style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span>कुल रकम (Total):</span>
                    {isBalanced ? (
                      <span className="status-pill status-approved">
                        <CheckCircle2 size={12} /> सन्तुलित (Balanced)
                      </span>
                    ) : (
                      <span className="status-pill status-pending-approval">
                        <AlertTriangle size={12} /> फरक: रु. {diff.toFixed(2)} (Unbalanced)
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontSize: '14px', color: 'var(--navy-900)' }}>
                  रु. {totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'right', fontSize: '14px', color: 'var(--navy-900)' }}>
                  रु. {totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Remarks (Mandatory check) & File Attachment */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="form-group">
          <label className="form-label">
            कैफियत (Remarks) {currentVt?.requires_remarks === 1 && <span style={{ color: 'var(--danger-600)' }}>* (अनिवार्य)</span>}
          </label>
          <textarea
            className="form-textarea"
            rows="2"
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="भौचरको उद्देश्य वा कारोबारको कारण (जस्तै: कार्यालय मसलन्द खरिद, मासिक बचत दाखिला आदि)"
          />
        </div>

        <div className="form-group">
          <label className="form-label">प्रमाण कागजात (Attachment)</label>
          <div style={{ border: '1px dashed var(--navy-300)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center', backgroundColor: '#fafafa' }}>
            <input
              type="file"
              id="file-input"
              style={{ display: 'none' }}
              onChange={e => setSelectedFile(e.target.files[0])}
            />
            <label htmlFor="file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--navy-600)' }}>
              <Paperclip size={18} color="var(--primary-600)" />
              <span>{selectedFile ? selectedFile.name : 'बिल/भौचर कागजात अपलोड (PDF, JPG)'}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--navy-200)', paddingTop: '16px' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
        >
          <Save size={16} />
          <span>ड्राफ्ट सुरक्षित गर्नुहोस् (Save Draft)</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleSubmit(false)}
          disabled={submitting || !isBalanced}
          style={{
            opacity: !isBalanced ? 0.6 : 1,
            cursor: !isBalanced ? 'not-allowed' : 'pointer',
            padding: '10px 24px',
            fontSize: '14px'
          }}
        >
          <Send size={16} />
          <span>{submitting ? 'प्रविष्टि हुँदैछ...' : 'भौचर जारी तथा पेस गर्नुहोस् (Post & Issue)'}</span>
        </button>
      </div>
    </div>
  );
};
