import { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { theme } from './theme.js';
import { Spinner } from './components/UI.jsx';

// ── Pages ─────────────────────────────────────────────────────────
import LoginPage           from './pages/LoginPage.jsx';
import DashboardPage       from './pages/DashboardPage.jsx';
import VoucherFormPage     from './pages/VoucherFormPage.jsx';
import VoucherViewPage     from './pages/VoucherViewPage.jsx';
import ManagerApprovalsPage from './pages/ManagerApprovalsPage.jsx';
import CashierPage         from './pages/CashierPage.jsx';
import AdminPage           from './pages/AdminPage.jsx';
import {
  DivisionsPage, DepartmentsPage, ProjectsPage,
  ExpenseTypesPage, EmployeesPage,
} from './pages/MasterPages.jsx';

// ── Nav items config ──────────────────────────────────────────────
function buildNav(user) {
  if (!user) return [];
  const items = [];
  const fns   = user.system_functions || [];
  const isAdmin = user.is_admin;

  const hasPCH  = isAdmin || fns.includes('petty_cash_holder');
  const isMgr   = isAdmin || user.is_manager;
  const isCA    = isAdmin || fns.includes('chief_accountant');
  const isCash  = isAdmin || fns.includes('cashier');
  const hasEmpDef = isAdmin || fns.includes('employee_definition');

  // Cashier-only users skip the dashboard
  const cashierOnly = isCash && !hasPCH && !isMgr && !isCA && !isAdmin;

  if (!cashierOnly) {
    items.push({ id: 'dashboard',   label: '📊 Dashboard',    show: true });
  }
  if (hasPCH) {
    items.push({ id: 'new-voucher', label: '➕ New Voucher',   show: true });
  }
  if (isMgr) {
    items.push({ id: 'approvals',   label: '✅ Approvals',     show: true });
  }
  if (isCA) {
    items.push({ id: 'ca-queue',    label: '🔍 CA Review',     show: true });
  }
  if (isCash) {
    items.push({ id: 'cashier',     label: '💰 Cashier',       show: true });
  }

  // Admin / maintenance
  if (isAdmin) {
    items.push(
      { id: 'sep1',         label: '─────────────',            show: true, separator: true },
      { id: 'admin-users',  label: '👤 Users',                 show: true },
      { id: 'employees',    label: '🧑‍💼 Employees',            show: true },
      { id: 'divisions',    label: '🏢 Divisions',             show: true },
      { id: 'departments',  label: '🗂 Departments',           show: true },
      { id: 'projects',     label: '📁 Projects',              show: true },
      { id: 'expense-types',label: '🏷 Expense Types',         show: true },
    );
  } else if (hasEmpDef) {
    items.push(
      { id: 'sep1',      label: '─────────────', show: true, separator: true },
      { id: 'employees', label: '🧑‍💼 Employees', show: true },
    );
  }

  return items.filter(i => i.show);
}

// ── Sidebar ───────────────────────────────────────────────────────
function Sidebar({ nav, activeId, onNav, user, onLogout, collapsed, onToggle }) {
  const W = collapsed ? 56 : 220;
  return (
    <aside style={{
      width: W, minHeight: '100vh',
      background: theme.primary,
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.2s',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: collapsed ? '20px 8px' : '20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>💰</span>
        {!collapsed && (
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>PettyCash</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>AL-Dhow Group</div>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16,
            flexShrink: 0,
          }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        {nav.map(item => {
          if (item.separator) return (
            <div key={item.id} style={{
              margin: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.12)',
            }} />
          );
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              title={collapsed ? item.label.replace(/^[^\w]*/, '') : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: collapsed ? '10px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                border: 'none', cursor: 'pointer',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.72)',
                fontWeight: active ? 700 : 400,
                fontSize: 13,
                borderLeft: active ? `3px solid ${theme.secondary}` : '3px solid transparent',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.label.split(' ')[0]}</span>
              {!collapsed && <span>{item.label.split(' ').slice(1).join(' ')}</span>}
            </button>
          );
        })}
      </nav>

      {/* User / logout */}
      <div style={{
        padding: collapsed ? '12px 8px' : '14px 16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        {!collapsed && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{user?.full_name}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{user?.username}</div>
          </div>
        )}
        <button
          onClick={onLogout}
          title="Logout"
          style={{
            width: '100%', padding: '7px 0', borderRadius: 6,
            background: 'rgba(255,255,255,0.1)', border: 'none',
            color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
            fontSize: 13, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
          }}
        >
          🚪 {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const { user, loading, logout } = useAuth();

  // Navigation state
  const [page,      setPage]      = useState('dashboard');
  const [voucherId, setVoucherId] = useState(null); // for view/edit
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const nav = buildNav(user);

  // Default landing page based on role
  const defaultPage = (() => {
    const fns = user.system_functions || [];
    const cashierOnly = (user.is_admin || fns.includes('cashier')) &&
      !fns.includes('petty_cash_holder') && !user.is_manager &&
      !fns.includes('chief_accountant') && !user.is_admin;
    return cashierOnly ? 'cashier' : 'dashboard';
  })();

  const activePage = page || defaultPage;

  const navigate = (id) => {
    setPage(id);
    setVoucherId(null);
  };

  const openVoucher = (id) => {
    setVoucherId(id);
    setPage('voucher-view');
  };

  const editVoucher = (id) => {
    setVoucherId(id);
    setPage('voucher-edit');
  };

  // ── Render current page ──────────────────────────────────────────
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onSelectVoucher={openVoucher} />;

      case 'new-voucher':
        return (
          <VoucherFormPage
            onSaved={(id) => openVoucher(id)}
            onCancel={() => navigate('dashboard')}
          />
        );

      case 'voucher-edit':
        return (
          <VoucherFormPage
            voucherId={voucherId}
            onSaved={(id) => openVoucher(id)}
            onCancel={() => {
              if (voucherId) { setPage('voucher-view'); }
              else navigate('dashboard');
            }}
          />
        );

      case 'voucher-view':
        return (
          <VoucherViewPage
            voucherId={voucherId}
            onBack={() => navigate('dashboard')}
            onEdit={editVoucher}
            onReload={() => {}}
          />
        );

      case 'approvals':
      case 'ca-queue':
        return <ManagerApprovalsPage onSelectVoucher={openVoucher} />;

      case 'cashier':
        return <CashierPage onSelectVoucher={openVoucher} />;

      case 'admin-users':
        return <AdminPage />;

      case 'employees':
        return <EmployeesPage />;

      case 'divisions':
        return <DivisionsPage />;

      case 'departments':
        return <DepartmentsPage />;

      case 'projects':
        return <ProjectsPage />;

      case 'expense-types':
        return <ExpenseTypesPage />;

      default:
        return <DashboardPage onSelectVoucher={openVoucher} />;
    }
  };

  // Page title
  const pageTitle = {
    dashboard:     'Dashboard',
    'new-voucher': 'New Voucher',
    'voucher-view':'Voucher Detail',
    'voucher-edit':'Edit Voucher',
    approvals:     'Manager Approvals',
    'ca-queue':    'Chief Accountant Review',
    cashier:       'Cashier',
    'admin-users': 'User Administration',
    employees:     'Employees',
    divisions:     'Divisions',
    departments:   'Departments',
    projects:      'Projects',
    'expense-types':'Expense Types',
  }[activePage] || 'PettyCash';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg }}>
      <Sidebar
        nav={nav}
        activeId={activePage}
        onNav={navigate}
        user={user}
        onLogout={logout}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          height: 52, background: '#fff',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12,
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: theme.primary }}>{pageTitle}</h1>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Role badges */}
            {user.is_admin && (
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: theme.primary, color: '#fff', fontWeight: 600 }}>
                Admin
              </span>
            )}
            {(user.system_functions || []).map(r => (
              <span key={r} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: theme.infoBg, color: theme.info, fontWeight: 600 }}>
                {r.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
