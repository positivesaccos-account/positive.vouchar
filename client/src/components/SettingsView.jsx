import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ShieldAlert, Calendar, Check, AlertCircle, Plus, X } from 'lucide-react';

export const SettingsView = ({ onSettingsSaved }) => {
  const { token, t, lang, orgSettings, fetchOrgSettings } = useAuth();
  const [activeTab, setActiveTab] = useState('org');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Organization form
  const [orgForm, setOrgForm] = useState({
    name_en: '',
    name_ne: '',
    registration_no: '',
    pan_no: '',
    address_en: '',
    address_ne: '',
    phone: '',
    email: '',
    currency_symbol: 'रु.',
    approval_threshold: 50000,
    auto_manager_review: 1
  });

  // Fiscal years list
  const [fiscalYears, setFiscalYears] = useState([]);
  const [newFyModal, setNewFyModal] = useState(false);
  const [newFyForm, setNewFyForm] = useState({
    code: '',
    start_date_bs: '',
    end_date_bs: '',
    start_date_ad: '',
    end_date_ad: ''
  });

  useEffect(() => {
    if (orgSettings) {
      setOrgForm({
        name_en: orgSettings.name_en || '',
        name_ne: orgSettings.name_ne || '',
        registration_no: orgSettings.registration_no || '',
        pan_no: orgSettings.pan_no || '',
        address_en: orgSettings.address_en || '',
        address_ne: orgSettings.address_ne || '',
        phone: orgSettings.phone || '',
        email: orgSettings.email || '',
        currency_symbol: orgSettings.currency_symbol || 'रु.',
        approval_threshold: orgSettings.approval_threshold || 50000,
        auto_manager_review: orgSettings.auto_manager_review ?? 1
      });
    }
  }, [orgSettings]);

  const fetchFiscalYears = async () => {
    try {
      const res = await fetch('/api/settings/fiscal-years', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFiscalYears(data.fiscalYears);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiscalYears();
  }, []);

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/settings/organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orgForm)
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: 'सहकारी सेटिङहरू सफलतापूर्वक अद्यावधिक गरियो।' });
        fetchOrgSettings();
        if (onSettingsSaved) onSettingsSaved();
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'सर्भरसँग सम्पर्क हुन सकेन।' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivateFy = async (id) => {
    try {
      const res = await fetch(`/api/settings/fiscal-years/${id}/activate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: data.message });
        fetchFiscalYears();
        if (onSettingsSaved) onSettingsSaved();
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'त्रुटि देखा पर्यो।' });
    }
  };

  const handleCreateFy = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/fiscal-years', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newFyForm)
      });
      const data = await res.json();
      if (data.success) {
        setNewFyModal(false);
        setNewFyForm({ code: '', start_date_bs: '', end_date_bs: '', start_date_ad: '', end_date_ad: '' });
        fetchFiscalYears();
        setMsg({ type: 'success', text: data.message });
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('नयाँ आर्थिक वर्ष सिर्जना गर्न सकिएन।');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)' }}>{t.settings.title}</h2>
        <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>{t.settings.subtitle}</p>
      </div>

      {msg.text && (
        <div style={{
          backgroundColor: msg.type === 'error' ? 'var(--danger-50)' : 'var(--primary-50)',
          border: `1px solid ${msg.type === 'error' ? 'var(--danger-100)' : 'var(--primary-100)'}`,
          color: msg.type === 'error' ? 'var(--danger-600)' : 'var(--primary-700)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--navy-200)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('org')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'org' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'org' ? 'var(--primary-700)' : 'var(--navy-600)'
          }}
        >
          {t.settings.orgTab}
        </button>

        <button
          onClick={() => setActiveTab('threshold')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'threshold' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'threshold' ? 'var(--primary-700)' : 'var(--navy-600)'
          }}
        >
          {t.settings.thresholdTab}
        </button>

        <button
          onClick={() => setActiveTab('fy')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'fy' ? '2px solid var(--primary-600)' : '2px solid transparent',
            color: activeTab === 'fy' ? 'var(--primary-700)' : 'var(--navy-600)'
          }}
        >
          {t.settings.fyTab}
        </button>
      </div>

      {/* Tab 1: Organization Details */}
      {activeTab === 'org' && (
        <form onSubmit={handleSaveOrg} className="data-card" style={{ padding: '24px', maxWidth: '800px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">{t.settings.orgNameNe} *</label>
              <input
                type="text"
                className="form-input"
                required
                value={orgForm.name_ne}
                onChange={e => setOrgForm({ ...orgForm, name_ne: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.settings.orgNameEn} *</label>
              <input
                type="text"
                className="form-input"
                required
                value={orgForm.name_en}
                onChange={e => setOrgForm({ ...orgForm, name_en: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">{t.settings.regNo}</label>
              <input
                type="text"
                className="form-input"
                value={orgForm.registration_no}
                onChange={e => setOrgForm({ ...orgForm, registration_no: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.settings.panNo}</label>
              <input
                type="text"
                className="form-input"
                value={orgForm.pan_no}
                onChange={e => setOrgForm({ ...orgForm, pan_no: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">{t.settings.addressNe}</label>
              <input
                type="text"
                className="form-input"
                value={orgForm.address_ne}
                onChange={e => setOrgForm({ ...orgForm, address_ne: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.settings.addressEn}</label>
              <input
                type="text"
                className="form-input"
                value={orgForm.address_en}
                onChange={e => setOrgForm({ ...orgForm, address_en: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label">{t.settings.phone}</label>
              <input
                type="text"
                className="form-input"
                value={orgForm.phone}
                onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t.settings.email}</label>
              <input
                type="email"
                className="form-input"
                value={orgForm.email}
                onChange={e => setOrgForm({ ...orgForm, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t.settings.saving : t.settings.saveSettings}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Configurable Approval Threshold (Maker-Checker Rule) */}
      {activeTab === 'threshold' && (
        <form onSubmit={handleSaveOrg} className="data-card" style={{ padding: '24px', maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
            <div className="stat-icon-box icon-gold" style={{ width: '48px', height: '48px', flexShrink: 0 }}>
              <ShieldAlert size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--navy-900)' }}>
                {t.settings.thresholdTitle}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--navy-600)', marginTop: '4px', lineHeight: 1.6 }}>
                {t.settings.thresholdDesc}
              </p>
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '360px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>
              {t.settings.thresholdAmount}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '10px', fontWeight: 700, color: 'var(--navy-500)' }}>
                {orgForm.currency_symbol}
              </span>
              <input
                type="number"
                step="1000"
                min="0"
                className="form-input"
                style={{ paddingLeft: '44px', fontSize: '16px', fontWeight: 700 }}
                value={orgForm.approval_threshold}
                onChange={e => setOrgForm({ ...orgForm, approval_threshold: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--navy-500)', marginTop: '6px' }}>
              प्रारम्भिक मान: रु. ५०,००० (संस्थाको आन्तरिक नीति बमोजिम जुनसुकै बेला परिवर्तन गर्न सकिने)
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t.settings.saving : t.settings.saveSettings}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Fiscal Years Management */}
      {activeTab === 'fy' && (
        <div className="data-card" style={{ maxWidth: '850px' }}>
          <div className="data-card-header">
            <h3>{t.settings.fyTitle}</h3>
            <button className="btn btn-primary" onClick={() => setNewFyModal(true)} style={{ fontSize: '12px', padding: '6px 14px' }}>
              <Plus size={15} />
              <span>{t.settings.addFy}</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>आर्थिक वर्ष कोड</th>
                  <th>सुरु मिति (वि.सं.)</th>
                  <th>अन्त्य मिति (वि.सं.)</th>
                  <th style={{ textAlign: 'center' }}>स्थिति (Status)</th>
                  <th style={{ textAlign: 'right' }}>कार्य (Action)</th>
                </tr>
              </thead>
              <tbody>
                {fiscalYears.map(fy => (
                  <tr key={fy.id}>
                    <td style={{ fontWeight: 700, fontSize: '14px' }}>{fy.code}</td>
                    <td>{fy.start_date_bs}</td>
                    <td>{fy.end_date_bs}</td>
                    <td style={{ textAlign: 'center' }}>
                      {fy.is_active === 1 ? (
                        <span className="status-pill status-approved">
                          <Check size={12} /> {t.settings.active}
                        </span>
                      ) : fy.is_closed === 1 ? (
                        <span className="status-pill status-cancelled">
                          {t.settings.closed}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--navy-500)' }}>निष्क्रिय</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {fy.is_active !== 1 && fy.is_closed !== 1 && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => handleActivateFy(fy.id)}
                        >
                          {t.settings.activate}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add New Fiscal Year */}
      {newFyModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{t.settings.addFy}</h3>
              <button onClick={() => setNewFyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateFy}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">{t.settings.fyCode} *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. 2084/85"
                    value={newFyForm.code}
                    onChange={e => setNewFyForm({ ...newFyForm, code: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">{t.settings.startDateBs} *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="2084-04-01"
                      value={newFyForm.start_date_bs}
                      onChange={e => setNewFyForm({ ...newFyForm, start_date_bs: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.settings.endDateBs} *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="2085-03-31"
                      value={newFyForm.end_date_bs}
                      onChange={e => setNewFyForm({ ...newFyForm, end_date_bs: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setNewFyModal(false)}>
                  रद्द गर्नुहोस्
                </button>
                <button type="submit" className="btn btn-primary">
                  आर्थिक वर्ष सिर्जना गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
