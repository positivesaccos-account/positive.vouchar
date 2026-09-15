import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, ShieldAlert, LogOut, Globe, Building2 } from 'lucide-react';

export const Navbar = ({ dashboardStats }) => {
  const { user, logout, lang, toggleLanguage, t, orgSettings } = useAuth();

  const threshold = orgSettings?.approval_threshold || 50000;
  const fyCode = dashboardStats?.activeFiscalYear || '2082/83';

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        {/* Branch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--navy-600)', fontWeight: 600 }}>
          <Building2 size={16} color="var(--primary-600)" />
          <span>{user.branch || t.headOffice}</span>
        </div>

        {/* Fiscal Year Badge */}
        <div className="fiscal-year-badge">
          <Calendar size={14} />
          <span>{t.fiscalYear}: <strong>{fyCode}</strong></span>
        </div>

        {/* Approval Threshold Badge */}
        <div className="threshold-badge">
          <ShieldAlert size={14} />
          <span>{t.threshold}: <strong>{orgSettings?.currency_symbol || 'रु.'} {Number(threshold).toLocaleString()}</strong></span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Language Switcher */}
        <button className="lang-toggle-btn" onClick={toggleLanguage} title="भाषा परिवर्तन / Toggle Language">
          <Globe size={15} />
          <span>{t.switchLang}</span>
        </button>

        {/* Logout */}
        <button className="logout-btn" onClick={logout} title={t.logout}>
          <LogOut size={15} />
          <span>{t.logout}</span>
        </button>
      </div>
    </header>
  );
};
