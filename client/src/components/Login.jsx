import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Login = () => {
  const { login, t, lang, toggleLanguage, orgSettings } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('कृपया प्रयोगकर्ता नाम र पासवर्ड दुवै राख्नुहोस्।');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (data.success) {
        login(data.user, data.token);
      } else {
        setError(data.error || 'लगइन असफल भयो। विवरण जाँच गर्नुहोस्।');
      }
    } catch (err) {
      setError('सर्भरसँग सम्पर्क हुन सकेन। कृपया फेरि प्रयास गर्नुहोस्।');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button onClick={toggleLanguage} className="lang-toggle-btn" type="button">
            🌐 {t.switchLang}
          </button>
        </div>

        <div className="login-header">
          <div className="login-logo">
            <Shield size={34} color="white" />
          </div>
          <h1>{lang === 'ne' ? (orgSettings?.name_ne || t.appTitle) : (orgSettings?.name_en || t.appTitle)}</h1>
          <p>{t.appSubtitle}</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-50)',
            border: '1px solid var(--danger-100)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--danger-600)',
            fontSize: '13px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t.username}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / manager / cashier / auditor"
                style={{ paddingLeft: '40px' }}
                autoComplete="username"
              />
              <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--navy-400)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">{t.password}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '40px' }}
                autoComplete="current-password"
              />
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--navy-400)' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? t.loggingIn : t.loginBtn}
          </button>
        </form>

        {/* Quick Demo Staff Selector */}
        <div className="demo-roles-box">
          <div className="demo-roles-title">द्रुत परीक्षण खाताहरू (One-Click Staff Selection)</div>
          <div className="demo-roles-grid">
            <button
              type="button"
              className="demo-role-btn"
              onClick={() => handleQuickLogin('manager', 'Manager@123')}
            >
              👔 व्यवस्थापक (Manager)
            </button>
            <button
              type="button"
              className="demo-role-btn"
              onClick={() => handleQuickLogin('cashier', 'Cashier@123')}
            >
              💵 रोकड (Cashier)
            </button>
            <button
              type="button"
              className="demo-role-btn"
              onClick={() => handleQuickLogin('admin', 'Admin@123')}
            >
              ⚙️ सुपर प्रशासक (Admin)
            </button>
            <button
              type="button"
              className="demo-role-btn"
              onClick={() => handleQuickLogin('auditor', 'Auditor@123')}
            >
              🔍 लेखापरीक्षक (Auditor)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
