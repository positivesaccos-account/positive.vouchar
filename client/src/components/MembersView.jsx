import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users2, Search, Phone, MapPin } from 'lucide-react';

export const MembersView = () => {
  const { token, t, lang } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/vouchers/members', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) setMembers(data.members);
      });
  }, []);

  const filtered = members.filter(m =>
    !search ||
    m.member_no.toLowerCase().includes(search.toLowerCase()) ||
    m.name_en.toLowerCase().includes(search.toLowerCase()) ||
    m.name_ne.includes(search) ||
    (m.phone && m.phone.includes(search))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users2 size={22} color="var(--primary-600)" />
            <span>सदस्य तथा सम्बन्धित पक्षहरू (Members / Parties Reference)</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>
            भौचर प्रविष्टिका लागि सन्दर्भ सदस्य तथा पक्षहरूको सूची
          </p>
        </div>
      </div>

      <div className="data-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="सदस्य नं., नाम वा फोन खोज्नुहोस्..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>सदस्य नं. (ID)</th>
                <th>सदस्यको नाम (नेपाली)</th>
                <th>Member Name (English)</th>
                <th>सम्पर्क फोन</th>
                <th>ठेगाना</th>
                <th style={{ textAlign: 'center' }}>स्थिति</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-700)' }}>
                    {m.member_no}
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.name_ne}</td>
                  <td>{m.name_en}</td>
                  <td>
                    {m.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <Phone size={13} color="var(--navy-400)" />
                        <span>{m.phone}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {m.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                        <MapPin size={13} color="var(--navy-400)" />
                        <span>{m.address}</span>
                      </div>
                    )}
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
