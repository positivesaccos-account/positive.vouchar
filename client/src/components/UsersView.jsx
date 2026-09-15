import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield, Key, CheckCircle, XCircle, Edit3, X } from 'lucide-react';

export const UsersView = () => {
  const { token, t, lang, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name_en: '',
    full_name_ne: '',
    mobile: '',
    email: '',
    branch: 'Head Office',
    role_id: '',
    custom_permissions: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, pRes] = await Promise.all([
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users/roles', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users/permissions', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [uData, rData, pData] = await Promise.all([uRes.json(), rRes.json(), pRes.json()]);

      if (uData.success) setUsers(uData.users);
      if (rData.success) {
        setRoles(rData.roles);
        if (rData.roles.length > 0 && !formData.role_id) {
          setFormData(prev => ({ ...prev, role_id: rData.roles[0].id }));
        }
      }
      if (pData.success) setPermissions(pData.permissions);
    } catch (err) {
      setMsg({ type: 'error', text: 'डाटा लोड गर्दा समस्या आयो।' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (targetUser) => {
    if (targetUser.id === currentUser.id) {
      alert('तपाईं आफ्नै सक्रिय खाता निष्क्रिय गर्न सक्नुहुन्न।');
      return;
    }

    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: targetUser.is_active === 1 ? 0 : 1 })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        setMsg({ type: 'success', text: 'प्रयोगकर्ता स्थिति अद्यावधिक भयो।' });
      } else {
        setMsg({ type: 'error', text: data.error });
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'त्रुटि देखा पर्यो।' });
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.full_name_en) {
      alert('कृपया सबै आवश्यक विवरण भर्नुहोस्।');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setFormData({
          username: '',
          password: '',
          full_name_en: '',
          full_name_ne: '',
          mobile: '',
          email: '',
          branch: 'Head Office',
          role_id: roles[0]?.id || '',
          custom_permissions: []
        });
        fetchData();
        setMsg({ type: 'success', text: `प्रयोगकर्ता '${formData.username}' सफलतापूर्वक सिर्जना गरियो।` });
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('प्रयोगकर्ता सिर्जना गर्न सकिएन।');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ।');
      return;
    }

    try {
      const res = await fetch(`/api/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPwdModalOpen(false);
        setNewPassword('');
        setMsg({ type: 'success', text: 'पासवर्ड परिवर्तन सफल भयो।' });
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('पासवर्ड परिवर्तन गर्न सकिएन।');
    }
  };

  const handlePermCheck = (code) => {
    setFormData(prev => {
      const exists = prev.custom_permissions.includes(code);
      const updated = exists
        ? prev.custom_permissions.filter(c => c !== code)
        : [...prev.custom_permissions, code];
      return { ...prev, custom_permissions: updated };
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)' }}>{t.users.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>{t.users.subtitle}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <UserPlus size={16} />
          <span>{t.users.addUser}</span>
        </button>
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

      {/* Users Table */}
      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>प्रयोगकर्ता नाम</th>
                <th>पूरा नाम (Full Name)</th>
                <th>भूमिका (Role)</th>
                <th>सम्पर्क (Mobile)</th>
                <th>शाखा (Branch)</th>
                <th>पछिल्लो लगइन</th>
                <th style={{ textAlign: 'center' }}>स्थिति (Status)</th>
                <th style={{ textAlign: 'right' }}>कार्य (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{u.username}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{lang === 'ne' ? u.full_name_ne : u.full_name_en}</div>
                    <div style={{ fontSize: '11px', color: 'var(--navy-500)' }}>{u.email || '-'}</div>
                  </td>
                  <td>
                    <span style={{
                      backgroundColor: u.role_code === 'SUPER_ADMIN' ? 'var(--purple-100)' :
                        u.role_code === 'MANAGER' ? 'var(--primary-100)' :
                        u.role_code === 'CASHIER' ? 'var(--gold-100)' : 'var(--navy-100)',
                      color: u.role_code === 'SUPER_ADMIN' ? 'var(--purple-600)' :
                        u.role_code === 'MANAGER' ? 'var(--primary-700)' :
                        u.role_code === 'CASHIER' ? 'var(--gold-600)' : 'var(--navy-700)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      {lang === 'ne' ? u.role_name_ne : u.role_name_en}
                    </span>
                  </td>
                  <td>{u.mobile || '-'}</td>
                  <td>{u.branch}</td>
                  <td style={{ fontSize: '12px', color: 'var(--navy-500)' }}>
                    {u.last_login ? new Date(u.last_login).toLocaleString() : 'पहिलो पटक'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(u)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: u.is_active === 1 ? 'var(--primary-600)' : 'var(--danger-600)'
                      }}
                    >
                      {u.is_active === 1 ? (
                        <>
                          <CheckCircle size={15} />
                          <span>{t.users.activeStatus}</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={15} />
                          <span>{t.users.inactiveStatus}</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={() => {
                        setSelectedUser(u);
                        setPwdModalOpen(true);
                      }}
                      title="पासवर्ड परिवर्तन"
                    >
                      <Key size={13} />
                      <span>{t.users.resetPassword}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Staff User */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{t.users.addUser}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">{t.users.fullNameEn} *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.full_name_en}
                      onChange={e => setFormData({ ...formData, full_name_en: e.target.value })}
                      placeholder="e.g. Sita Kumari Sharma"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.users.fullNameNe}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.full_name_ne}
                      onChange={e => setFormData({ ...formData, full_name_ne: e.target.value })}
                      placeholder="जस्तै: सीता कुमारी शर्मा"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">{t.username} *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. cashier2"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.password} *</label>
                    <input
                      type="password"
                      className="form-input"
                      required
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="कम्तिमा ६ अक्षर"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">{t.users.role} *</label>
                    <select
                      className="form-select"
                      value={formData.role_id}
                      onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>
                          {lang === 'ne' ? r.name_ne : r.name_en} ({r.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">सम्पर्क फोन (Mobile)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="98XXXXXXXX"
                    />
                  </div>
                </div>

                {/* Granular Permissions Overrides */}
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--navy-200)', paddingTop: '16px' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    {t.users.permissionsTitle}
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--navy-500)', marginBottom: '12px' }}>
                    {t.users.permissionsDesc}
                  </p>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {permissions.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.custom_permissions.includes(p.code)}
                          onChange={() => handlePermCheck(p.code)}
                        />
                        <span>{lang === 'ne' ? p.name_ne : p.name_en}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  रद्द गर्नुहोस्
                </button>
                <button type="submit" className="btn btn-primary">
                  {t.users.saveUser}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Password Reset */}
      {pwdModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>पासवर्ड परिवर्तन: {selectedUser.username}</h3>
              <button onClick={() => setPwdModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePasswordReset}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">नयाँ गोप्य पासवर्ड (New Password) *</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="कम्तिमा ६ अक्षर"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setPwdModalOpen(false)}>
                  रद्द गर्नुहोस्
                </button>
                <button type="submit" className="btn btn-primary">
                  पासवर्ड अद्यावधिक गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
