import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, FileSpreadsheet, Download, RefreshCw, CheckCircle2, History, AlertCircle } from 'lucide-react';

export const BackupView = () => {
  const { token, t, lang, orgSettings } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateBs, setDateBs] = useState('2082-06-15');

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/backup/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownloadExcel = () => {
    // Open in browser download window
    window.location.href = `/api/backup/daily-excel?date_bs=${dateBs}`;
    setTimeout(fetchHistory, 2000);
  };

  const handleDownloadSnapshot = () => {
    window.location.href = `/api/backup/db-snapshot`;
    setTimeout(fetchHistory, 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={22} color="var(--primary-600)" />
          <span>दैनिक एक्सेल ब्याकअप तथा डेटाबेस व्यवस्थापन (Backup & Export)</span>
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--navy-500)' }}>
          दैनिक कारोबारको पूर्ण एक्सेल (.xlsx) ब्याकअप सुरक्षित राख्न र SQLite डेटाबेसको स्न्यापसट डाउनलोड गर्न सकिने सुविधा
        </p>
      </div>

      {/* Backup Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: Daily Excel Backup */}
        <div className="data-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div className="stat-icon-box icon-emerald" style={{ width: '44px', height: '44px' }}>
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>
                  दैनिक एक्सेल ब्याकअप निर्यात (.xlsx)
                </h3>
                <div style={{ fontSize: '11.5px', color: 'var(--navy-500)' }}>
                  ढाँचा: PSCCL_Voucher_Backup_YYYY-MM-DD.xlsx
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--navy-600)', marginBottom: '16px', lineHeight: 1.5 }}>
              प्रत्येक दिनको अन्तमा अनिवार्य रुपमा यो बटन थिचेर भौचर विवरण, लेखा शीर्षकहरू, डेबिट/क्रेडिट र कैफियत सहितको पूर्ण एक्सेल फाइल सुरक्षित गर्नुहोस्।
            </p>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>ब्याकअप मिति (Date BS):</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '13px', padding: '6px 10px' }}
                value={dateBs}
                onChange={e => setDateBs(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px' }}
            onClick={handleDownloadExcel}
          >
            <Download size={16} />
            <span>दैनिक एक्सेल डाउनलोड (Export Excel)</span>
          </button>
        </div>

        {/* Card 2: Database Snapshot Download */}
        <div className="data-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div className="stat-icon-box icon-navy" style={{ width: '44px', height: '44px' }}>
                <Database size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy-900)' }}>
                  सम्पूर्ण डेटाबेस स्न्यापसट (SQLite .db)
                </h3>
                <div style={{ fontSize: '11.5px', color: 'var(--navy-500)' }}>
                  ढाँचा: PSCCL_Database_Snapshot_...db
                </div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--navy-600)', marginBottom: '16px', lineHeight: 1.5 }}>
              सम्पूर्ण सहकारी प्रणालीको मूल डेटाबेस, प्रयोगकर्ता, भूमिका, लेखापरीक्षण विवरण र भौचरहरू सहितको पूर्ण डेटाबेस फाइल एक क्लिकमा सुरक्षित प्रतिलिपि डाउनलोड गर्नुहोस्।
            </p>
          </div>

          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '14px', backgroundColor: 'var(--navy-800)', color: 'white' }}
            onClick={handleDownloadSnapshot}
          >
            <Download size={16} />
            <span>डेटाबेस स्न्यापसट डाउनलोड (DB Snapshot)</span>
          </button>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="data-card">
        <div className="data-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} />
            <span>पछिल्ला ब्याकअपहरूको विवरण (Backup Logs)</span>
          </h3>
          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={fetchHistory}>
            <RefreshCw size={13} />
            <span>ताजा गर्नुहोस्</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>फाइल नाम (File Name)</th>
                <th>प्रकार (Type)</th>
                <th>साइज (Size)</th>
                <th>रेकर्ड संख्या</th>
                <th>सुरक्षित गर्ने प्रयोगकर्ता</th>
                <th>मिति तथा समय</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--navy-500)' }}>
                    हालसम्म कुनै ब्याकअप सुरक्षित गरिएको छैन। माथिका बटनहरू प्रयोग गरी ब्याकअप लिनुहोस्।
                  </td>
                </tr>
              ) : (
                history.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{h.file_name}</td>
                    <td>
                      <span className={`status-pill ${h.backup_type === 'DAILY_EXCEL' ? 'status-approved' : 'status-posted'}`}>
                        {h.backup_type}
                      </span>
                    </td>
                    <td>{Math.round((h.file_size || 0) / 1024)} KB</td>
                    <td>{h.records_count}</td>
                    <td>{h.created_by_name || 'System'}</td>
                    <td>{new Date(h.created_at).toLocaleString()}</td>
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
