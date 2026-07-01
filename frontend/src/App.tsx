import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Home from './modules/home/Home';
import Login from './modules/identity/Login';
import ForgotPassword from './modules/identity/ForgotPassword';
import ResetPassword from './modules/identity/ResetPassword';
import Dashboard from './modules/dashboard/Dashboard';
import Vendors from './modules/procurement/Vendors';
import VendorDetail from './modules/procurement/VendorDetail';
import PurchaseRequests from './modules/procurement/PurchaseRequests';
import PurchaseOrders from './modules/procurement/PurchaseOrders';
import Contracts from './modules/procurement/Contracts';
import Invoices from './modules/finance/Invoices';
import InvoiceDashboard from './modules/finance/InvoiceDashboard';
import Customers from './modules/finance/Customers';
import Payments from './modules/finance/Payments';
import Purchases from './modules/finance/Purchases';
import Documents from './modules/document/Documents';
import Notifications from './modules/document/Notifications';
import AuditLogs from './modules/document/AuditLogs';
import Reports from './modules/dashboard/Reports';
import UserManagement from './modules/identity/UserManagement';
import Settings from './modules/identity/Settings';
import LoadingScreen from './components/common/LoadingScreen';

// Role sets mirror the Sidebar visibility so direct-URL access matches the menu.
const PROCUREMENT_ROLES = ['admin', 'procurement_manager', 'auditor'];
const ORDER_ROLES = ['admin', 'procurement_manager', 'finance', 'auditor', 'vendor'];
const INVOICE_ROLES = ['admin', 'finance', 'procurement_manager', 'auditor', 'vendor'];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) {
    // The root path is the only one with a public face — render the landing
    // page in place of the app shell rather than bouncing to /login.
    if (location.pathname === '/') return <Home />;
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RoleRoute: React.FC<{ children: React.ReactNode; roles: string[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Main Dashboard */}
        <Route index element={<Dashboard />} />

        {/* Procurement */}
        <Route path="vendors" element={<RoleRoute roles={PROCUREMENT_ROLES}><Vendors /></RoleRoute>} />
        <Route path="vendors/:id" element={<RoleRoute roles={PROCUREMENT_ROLES}><VendorDetail /></RoleRoute>} />
        <Route path="purchase-requests" element={<RoleRoute roles={PROCUREMENT_ROLES}><PurchaseRequests /></RoleRoute>} />
        <Route path="purchase-orders" element={<RoleRoute roles={ORDER_ROLES}><PurchaseOrders /></RoleRoute>} />
        <Route path="contracts" element={<RoleRoute roles={ORDER_ROLES}><Contracts /></RoleRoute>} />

        {/* Finance */}
        <Route path="invoice-dashboard" element={<RoleRoute roles={INVOICE_ROLES}><InvoiceDashboard /></RoleRoute>} />
        <Route path="invoices" element={<RoleRoute roles={INVOICE_ROLES}><Invoices /></RoleRoute>} />
        <Route path="purchases" element={
          <RoleRoute roles={['admin', 'finance']}>
            <Purchases />
          </RoleRoute>
        } />
        <Route path="customers" element={
          <RoleRoute roles={['admin', 'finance']}>
            <Customers />
          </RoleRoute>
        } />
        <Route path="payments" element={
          <RoleRoute roles={['admin', 'finance', 'auditor']}>
            <Payments />
          </RoleRoute>
        } />

        {/* HR & Payroll — temporarily removed from scope; redirect any stale links */}
        <Route path="hr/*" element={<Navigate to="/" replace />} />

        {/* Documents & System */}
        <Route path="documents" element={<Documents />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="audit-logs" element={<RoleRoute roles={['admin', 'auditor']}><AuditLogs /></RoleRoute>} />
        <Route path="reports" element={<RoleRoute roles={['admin', 'procurement_manager', 'finance', 'auditor']}><Reports /></RoleRoute>} />
        <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
