import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  FileText,
  ShoppingCart,
  FileCheck,
  Receipt,
  FolderOpen,
  Bell,
  Shield,
  BarChart3,
  Users,
  Settings,
  X,
  Hexagon,
  UserCircle,
  CreditCard,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Wallet,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  children?: NavItem[];
}

const NavItemComponent: React.FC<{ item: NavItem; onClose: () => void; depth?: number; collapsed?: boolean }> = ({
  item, onClose, depth = 0, collapsed = false,
}) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() =>
    item.children ? item.children.some(c => location.pathname.startsWith(c.path)) : false
  );
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          title={collapsed ? item.label : undefined}
          className={`nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${expanded ? 'nav-active' : ''} ${collapsed ? 'justify-center' : ''}`}
          style={{
            color: expanded ? 'var(--fg)' : 'var(--fg-muted)',
            background: expanded ? 'var(--glass-bg)' : 'transparent',
            paddingLeft: !collapsed && depth > 0 ? `${depth * 12 + 12}px` : undefined,
          }}
        >
          <span style={{ color: expanded ? 'var(--fg)' : 'var(--fg-faint)' }} className="shrink-0">
            {item.icon}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </>
          )}
        </button>
        {expanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => (
              <NavItemComponent key={child.path} item={child} onClose={onClose} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      onClick={onClose}
      title={collapsed ? item.label : undefined}
      className={({ isActive: active }) =>
        `nav-item flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${active ? 'nav-active' : ''} ${collapsed ? 'justify-center' : ''}`
      }
      style={({ isActive: active }) => ({
        background: active ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : 'transparent',
        color: active ? '#ffffff' : 'var(--fg-muted)',
        paddingLeft: !collapsed && depth > 0 ? `${depth * 12 + 12}px` : undefined,
      })}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && item.label}
    </NavLink>
  );
};

const NavGroup: React.FC<{ label: string; children: React.ReactNode; collapsed?: boolean }> = ({
  label, children, collapsed,
}) => (
  <div className="mb-4">
    {collapsed ? (
      <div className="mx-3 mb-2 border-t" style={{ borderColor: 'var(--glass-border)' }} />
    ) : (
      <p className="px-3 mb-1 text-[10px] font-semibold tracking-widest uppercase"
        style={{ color: 'var(--fg-faint)' }}>{label}</p>
    )}
    <div className="space-y-0.5">{children}</div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, collapsed = false, onToggleCollapse }) => {
  const { user } = useAuth();
  const role = user?.role || '';

  const procurementItems: NavItem[] = [
    { label: 'Vendors', path: '/vendors', icon: <Building2 size={18} />, roles: ['admin', 'procurement_manager', 'auditor'] },
    { label: 'Purchase Requests', path: '/purchase-requests', icon: <FileText size={18} />, roles: ['admin', 'procurement_manager', 'auditor'] },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: <ShoppingCart size={18} />, roles: ['admin', 'procurement_manager', 'finance', 'auditor', 'vendor'] },
    { label: 'Contracts', path: '/contracts', icon: <FileCheck size={18} />, roles: ['admin', 'procurement_manager', 'finance', 'auditor', 'vendor'] },
  ];

  const financeItems: NavItem[] = [
    { label: 'Invoice Dashboard', path: '/invoice-dashboard', icon: <Receipt size={18} />, roles: ['admin', 'finance', 'procurement_manager', 'auditor', 'vendor'] },
    { label: 'Invoices', path: '/invoices', icon: <FileText size={18} />, roles: ['admin', 'finance', 'procurement_manager', 'auditor', 'vendor'] },
    { label: 'Purchases', path: '/purchases', icon: <Wallet size={18} />, roles: ['admin', 'finance'] },
    { label: 'Customers', path: '/customers', icon: <UserCircle size={18} />, roles: ['admin', 'finance'] },
    { label: 'Payments', path: '/payments', icon: <CreditCard size={18} />, roles: ['admin', 'finance', 'auditor'] },
  ];

  const systemItems: NavItem[] = [
    { label: 'Documents', path: '/documents', icon: <FolderOpen size={18} />, roles: ['admin', 'procurement_manager', 'finance', 'vendor', 'auditor', 'employee'] },
    { label: 'Notifications', path: '/notifications', icon: <Bell size={18} />, roles: ['admin', 'procurement_manager', 'finance', 'vendor', 'auditor', 'employee'] },
    { label: 'Reports', path: '/reports', icon: <BarChart3 size={18} />, roles: ['admin', 'procurement_manager', 'finance', 'auditor'] },
    { label: 'Audit Logs', path: '/audit-logs', icon: <Shield size={18} />, roles: ['admin', 'auditor'] },
    { label: 'Users', path: '/users', icon: <Users size={18} />, roles: ['admin'] },
    { label: 'Settings', path: '/settings', icon: <Settings size={18} />, roles: ['admin', 'procurement_manager', 'finance', 'vendor', 'auditor', 'employee'] },
  ];

  const filter = (items: NavItem[]) => items.filter(item => !item.roles || item.roles.includes(role));

  const SidebarContent: React.FC<{ collapsed?: boolean; isMobile?: boolean }> = ({ collapsed: col = false, isMobile = false }) => (
    <>
      {/* Logo + collapse toggle */}
      <div
        className={`flex items-center h-16 shrink-0 ${col ? 'justify-center px-2' : 'px-4 gap-2'}`}
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <Hexagon size={22} style={{ color: 'var(--fg)' }} className="shrink-0" />
        {!col && (
          <span className="text-lg font-bold tracking-tight flex-1 truncate" style={{ color: 'var(--fg)' }}>
            ProcureFlow
          </span>
        )}
        {/* Collapse/expand chevron — desktop only */}
        {!isMobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg transition-colors shrink-0"
            style={{ color: 'var(--fg-faint)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--glass-bg)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={col ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {col ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-0">
        <div className="mb-4 space-y-0.5">
          <NavItemComponent
            item={{ label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> }}
            onClose={onClose}
            collapsed={col}
          />
        </div>

        {filter(procurementItems).length > 0 && (
          <NavGroup label="Procurement" collapsed={col}>
            {filter(procurementItems).map(item => (
              <NavItemComponent key={item.path} item={item} onClose={onClose} collapsed={col} />
            ))}
          </NavGroup>
        )}

        {filter(financeItems).length > 0 && (
          <NavGroup label="Finance" collapsed={col}>
            {filter(financeItems).map(item => (
              <NavItemComponent key={item.path} item={item} onClose={onClose} collapsed={col} />
            ))}
          </NavGroup>
        )}

        {filter(systemItems).length > 0 && (
          <NavGroup label="System" collapsed={col}>
            {filter(systemItems).map(item => (
              <NavItemComponent key={item.path} item={item} onClose={onClose} collapsed={col} />
            ))}
          </NavGroup>
        )}
      </nav>

      {/* User info */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div
          className={`flex items-center gap-3 px-3 py-2 ${col ? 'justify-center px-0' : ''}`}
          title={col ? `${user?.firstName} ${user?.lastName}` : undefined}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 keep-white"
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff' }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!col && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs truncate capitalize" style={{ color: 'var(--fg-faint)' }}>
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const sidebarStyle = {
    backgroundColor: 'var(--sidebar-bg)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRight: '1px solid var(--glass-border)',
  };

  return (
    <>
      {/* Mobile sidebar — z-50, slides in as drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 z-50 flex flex-col transform transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={sidebarStyle}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={onClose}
            className="p-1 rounded"
            style={{ color: 'var(--fg-muted)' }}
          >
            <X size={20} />
          </button>
        </div>
        <SidebarContent collapsed={false} isMobile={true} />
      </aside>

      {/* Desktop sidebar — z-[9] so it stays BELOW the main content wrapper (z-10),
          which means modals inside the main content always render on top. */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:flex-col lg:z-[9] transition-[width] duration-300 ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
        style={sidebarStyle}
      >
        <SidebarContent collapsed={collapsed} isMobile={false} />
      </aside>
    </>
  );
};

export default Sidebar;
