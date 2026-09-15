import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('pos_token') || null);
  const [lang, setLang] = useState(() => localStorage.getItem('pos_lang') || 'ne');
  const [orgSettings, setOrgSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = translations[lang] || translations.ne;

  const toggleLanguage = () => {
    const nextLang = lang === 'ne' ? 'en' : 'ne';
    setLang(nextLang);
    localStorage.setItem('pos_lang', nextLang);
  };

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('pos_user', JSON.stringify(userData));
    localStorage.setItem('pos_token', authToken);
  };

  const logout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_token');
  };

  // Fetch organization settings
  const fetchOrgSettings = async () => {
    try {
      const res = await fetch('/api/settings/organization', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setOrgSettings(data.organization);
      }
    } catch (e) {
      console.error('Failed to load org settings:', e);
    }
  };

  // Verify token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(data.user);
            localStorage.setItem('pos_user', JSON.stringify(data.user));
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    fetchOrgSettings();
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      lang,
      t,
      toggleLanguage,
      login,
      logout,
      orgSettings,
      fetchOrgSettings,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
