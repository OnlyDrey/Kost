import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../stores/auth.context';
import { CircularProgress, Box } from '@mui/material';

// Layouts
import AppLayout from '../components/Layout/AppLayout';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import InvoiceList from '../pages/Invoices/InvoiceList';
import InvoiceDetail from '../pages/Invoices/InvoiceDetail';
import AddInvoice from '../pages/Invoices/AddInvoice';
import PeriodList from '../pages/Periods/PeriodList';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Invoice Routes */}
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/add" element={<AddInvoice />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/invoices/:id/edit" element={<AddInvoice />} />

        {/* Period Routes */}
        <Route path="/periods" element={<PeriodList />} />
        <Route path="/periods/:id" element={<Dashboard />} /> {/* Simplified - could be detailed stats page */}

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
