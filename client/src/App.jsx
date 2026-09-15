import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { VoucherEntry } from './components/VoucherEntry';
import { VoucherRegister } from './components/VoucherRegister';
import { PendingApprovalView } from './components/PendingApprovalView';
import { PendingReviewView } from './components/PendingReviewView';
import { AccountsView } from './components/AccountsView';
import { MembersView } from './components/MembersView';
import { ReportsView } from './components/ReportsView';
import { AuditTrailView } from './components/AuditTrailView';
import { BackupView } from './components/BackupView';
import { UsersView } from './components/UsersView';
import { SettingsView } from './components/SettingsView';

function AppContent() {
  const { user, token, loading, t, lang } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [initialVoucherType, setInitialVoucherType] = useState('CRV');

  const fetchDashboardStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load dashboard stats:', e);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    const timer = setInterval(fetchDashboardStats, 20000); // 20s auto-refresh
    return () => clearInterval(timer);
  }, [token]);

  const handleQuickVoucher = (typeCode) => {
    setInitialVoucherType(typeCode);
    setActiveTab('new-voucher');
  };

  const handleVoucherCreated = (voucherId) => {
    fetchDashboardStats();
    setActiveTab('voucher-register');
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--navy-950)',
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: 600
      }}>
        लोड हुँदैछ... कृपया पर्खनुहोस्।
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* 1. Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dashboardStats={dashboardStats}
      />

      {/* 2. Main Executive Workspace */}
      <div className="app-main">
        <Navbar dashboardStats={dashboardStats} />

        <div className="content-viewport">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={dashboardStats}
              setActiveTab={setActiveTab}
              onQuickVoucher={handleQuickVoucher}
            />
          )}

          {activeTab === 'new-voucher' && (
            <VoucherEntry
              initialTypeCode={initialVoucherType}
              onVoucherCreated={handleVoucherCreated}
            />
          )}

          {activeTab === 'voucher-register' && (
            <VoucherRegister
              onNewVoucherClick={() => setActiveTab('new-voucher')}
            />
          )}

          {activeTab === 'pending-approval' && (
            <PendingApprovalView
              onActionCompleted={fetchDashboardStats}
            />
          )}

          {activeTab === 'pending-review' && (
            <PendingReviewView
              onActionCompleted={fetchDashboardStats}
            />
          )}

          {activeTab === 'accounts' && <AccountsView />}

          {activeTab === 'members' && <MembersView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'audit-trail' && <AuditTrailView />}

          {activeTab === 'backup' && <BackupView />}

          {activeTab === 'users' && <UsersView />}

          {activeTab === 'settings' && (
            <SettingsView onSettingsSaved={fetchDashboardStats} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
