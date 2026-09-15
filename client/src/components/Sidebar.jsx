import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Clock,
  CheckSquare,
  BookOpen,
  Users2,
  BarChart3,
  History,
  Database,
  UserCog,
  Settings
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, dashboardStats }) => {
  const { user, t, lang, orgSettings } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: t.menu.dashboard, icon: LayoutDashboard },
    { id: 'new-voucher', label: t.menu.newVoucher, icon: FilePlus, perm: 'voucher:create' },
    { id: 'voucher-register', label: t.menu.voucherRegister, icon: FileText, perm: 'report:view_voucher' },
    { 
      id: 'pending-approval', 
      label: t.menu.pendingApproval, 
      icon: Clock, 
      badge: dashboardStats?.pendingApprovalsCount,
      perm: 'voucher:approve' 
    },
    { 
      id: 'pending-review', 
      label: t.menu.pendingReview, 
      icon: CheckSquare, 
      badge: dashboardStats?.pendingReviewsCount,
      perm: 'voucher:verify' 
    },
    { id: 'accounts', label: t.menu.accounts, icon: BookOpen },
    { id: 'members', label: t.menu.members, icon: Users2 },
    { id: 'reports', label: t.menu.reports, icon: BarChart3, perm: 'report:view_books' },
    { id: 'audit-trail', label: t.menu.auditTrail, icon: History, perm: 'audit:view_trail' },
    { id: 'backup', label: t.menu.backup, icon: Database, perm: 'backup:export_daily' },
    { id: 'users', label: t.menu.users, icon: UserCog, perm: 'user:manage' },
    { id: 'settings', label: t.menu.settings, icon: Settings, perm: 'settings:manage' },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <div className="org-logo-badge" style={{ background: '#ffffff', padding: '2px', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 0 10px rgba(0,0,0,0.3)' }}>
          <img
            src="/logo.png"
            alt="Positive SACCOS Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="sidebar-title-box">
          <h1 style={{ fontSize: '13.5px', lineHeight: '1.2' }}>{lang === 'ne' ? 'पोजिटिभ साकोस' : 'Positive SACCOS'}</h1>
          <p style={{ fontSize: '10px', color: '#34d399', fontWeight: 600 }}>साझा बचत, साझा समृद्धि</p>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section-title">मुख्य मेनु (Navigation)</div>
        {menuItems.map(item => {
          // Check permission if specified
          if (item.perm && !user.isSuperAdmin && !user.permissions.includes(item.perm) && !user.permissions.includes('*')) {
            return null;
          }
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="badge">{item.badge}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="staff-profile-chip">
          <div className="staff-avatar">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="staff-info">
            <div className="staff-name">
              {lang === 'ne' ? user.fullNameNe : user.fullNameEn}
            </div>
            <div className="staff-role-pill">
              {t.roles[user.roleCode] || user.roleCode}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
