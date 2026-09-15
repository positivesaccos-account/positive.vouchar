import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, Search, ShieldCheck, Filter } from 'lucide-react';

export const AuditTrailView = () => {
  const { token, t, lang } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (actionFilter) query.append('action', actionFilter);
      if (entityFilter) query.append('entity_type', entityFilter);

      const res = await fetch(`/api/reports/audit-trail?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={22} color="var(--primary-600)" />
          <span>पूर्ण लेखापरीक्षण इतिहास (Immutable Audit Trail)</span>
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>
          प्रणालीमा भएका सबै कार्यहरूको अपरिवर्तनीय डिजिटल अभिलेख (Audit Log)
        </p>
      </div>

      {/* Filter Bar */}
      <div className="data-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="प्रयोगकर्ता नाम वा विवरण खोज्नुहोस्..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select className="form-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="">-- सबै कार्यहरू (All Actions) --</option>
            <option value="LOGIN_SUCCESS">लगइन (LOGIN)</option>
            <option value="CREATE">सिर्जना (CREATE)</option>
            <option value="APPROVE">स्वीकृति (APPROVE)</option>
            <option value="REJECT">अस्वीकृति (REJECT)</option>
            <option value="VERIFY">प्रमाणीकरण (VERIFY)</option>
            <option value="PRINT">मुद्रण (PRINT)</option>
            <option value="REPRINT">पुनःमुद्रण (REPRINT)</option>
            <option value="CANCEL">रद्द (CANCEL)</option>
            <option value="REVERSE">उल्ट्याइएको (REVERSE)</option>
          </select>

          <select className="form-select" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            <option value="">-- सबै क्षेत्र (Entity) --</option>
            <option value="VOUCHER">भौचर (VOUCHER)</option>
            <option value="USER">प्रयोगकर्ता (USER)</option>
            <option value="SETTING">सेटिङ (SETTING)</option>
            <option value="AUTH">प्रमाणीकरण (AUTH)</option>
            <option value="BACKUP">ब्याकअप (BACKUP)</option>
          </select>

          <button type="submit" className="btn btn-primary" style={{ padding: '9px 18px' }}>
            <Search size={15} />
            <span>खोजी गर्नुहोस्</span>
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>मिति तथा समय</th>
                <th>क्षेत्र (Entity)</th>
                <th>कार्य (Action)</th>
                <th>प्रयोगकर्ता (User)</th>
                <th>भूमिका (Role)</th>
                <th>IP ठेगाना</th>
                <th>विवरण (Details)</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--navy-500)' }}>
                    कुनै लेखापरीक्षण विवरण फेला परेन।
                  </td>
                </tr>
              ) : (
                logs.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy-700)' }}>
                        {l.entity_type} {l.entity_id ? `(#${l.entity_id})` : ''}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${
                        l.action === 'APPROVE' || l.action === 'VERIFY' ? 'status-approved' :
                        l.action === 'REJECT' || l.action === 'CANCEL' ? 'status-rejected' :
                        l.action === 'PRINT' || l.action === 'REPRINT' ? 'status-pending-review' :
                        'status-posted'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{l.username || 'System'}</td>
                    <td><span style={{ fontSize: '11px' }}>{l.user_role}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{l.ip_address}</td>
                    <td style={{ fontSize: '11.5px', color: 'var(--navy-600)', maxWidth: '300px', wordBreak: 'break-all' }}>
                      {l.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
