import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, CheckCircle, FolderTree } from 'lucide-react';

export const AccountsView = () => {
  const { token, t, lang } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  useEffect(() => {
    fetch('/api/vouchers/accounts', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) setAccounts(data.accounts);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = accounts.filter(a => {
    const matchesSearch = !search ||
      a.account_code.includes(search) ||
      a.name_en.toLowerCase().includes(search.toLowerCase()) ||
      a.name_ne.includes(search);
    const matchesCat = !selectedCat || a.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={22} color="var(--primary-600)" />
            <span>खाता संरचना (Chart of Accounts)</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>
            सहकारीका सम्पत्ति, दायित्व, पूँजी, आम्दानी तथा खर्च खाताहरूको सूची
          </p>
        </div>
      </div>

      <div className="data-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="खाता कोड वा नाम खोज्नुहोस्..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select className="form-select" value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
            <option value="">-- सबै वर्ग (All Categories) --</option>
            <option value="ASSET">सम्पत्ति (ASSET)</option>
            <option value="LIABILITY">दायित्व (LIABILITY)</option>
            <option value="EQUITY">पूँजी तथा कोष (EQUITY)</option>
            <option value="INCOME">आम्दानी (INCOME)</option>
            <option value="EXPENSE">खर्च (EXPENSE)</option>
          </select>
        </div>
      </div>

      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>खाता कोड</th>
                <th>खाताको नाम (नेपाली)</th>
                <th>Account Name (English)</th>
                <th>वर्ग (Category)</th>
                <th>उप-वर्ग (Sub-Category)</th>
                <th style={{ textAlign: 'center' }}>नगद/बैंक</th>
                <th style={{ textAlign: 'center' }}>स्थिति</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--navy-900)' }}>
                    {a.account_code}
                  </td>
                  <td style={{ fontWeight: 600 }}>{a.name_ne}</td>
                  <td>{a.name_en}</td>
                  <td>
                    <span style={{
                      backgroundColor: a.category === 'ASSET' ? 'var(--primary-100)' :
                        a.category === 'LIABILITY' ? 'var(--gold-100)' :
                        a.category === 'EQUITY' ? 'var(--purple-100)' :
                        a.category === 'INCOME' ? '#e0f2fe' : 'var(--danger-100)',
                      color: a.category === 'ASSET' ? 'var(--primary-700)' :
                        a.category === 'LIABILITY' ? 'var(--gold-600)' :
                        a.category === 'EQUITY' ? 'var(--purple-600)' :
                        a.category === 'INCOME' ? '#0369a1' : 'var(--danger-600)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      {a.category}
                    </span>
                  </td>
                  <td>{a.sub_category || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {a.is_cash_or_bank === 1 ? '✓' : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="status-pill status-approved">सक्रिय</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
