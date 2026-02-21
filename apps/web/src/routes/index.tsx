import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../stores/auth.context';

import AppLayout from '../components/Layout/AppLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import InvoiceList from '../pages/Invoices/InvoiceList';
import InvoiceDetail from '../pages/Invoices/InvoiceDetail';
import AddInvoice from '../pages/Invoices/AddInvoice';
import PeriodList from '../pages/Periods/PeriodList';

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  // Only block with spinner on initial load when not yet authenticated
  if (isLoading && !isAuthenticated) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading && !isAuthenticated) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/add" element={<AddInvoice />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/invoices/:id/edit" element={<AddInvoice />} />
        <Route path="/periods" element={<PeriodList />} />
        <Route path="/periods/:id" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
