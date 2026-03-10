import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../stores/auth.context";

import AppLayout from "../components/Layout/AppLayout";
import Login from "../pages/Login";
import Overview from "../pages/Overview/Overview";
import InvoiceDetail from "../pages/Invoices/InvoiceDetail";
import AddExpense from "../pages/Expenses/AddExpense";
import PeriodList from "../pages/Periods/PeriodList";
import Profile from "../pages/Settings/Profile";
import AdminUsers from "../pages/Admin/Users";
import SubscriptionList from "../pages/Subscriptions/SubscriptionList";
import ImportPage from "../pages/Import/ImportPage";
import SettlementPage from "../pages/Settlement/SettlementPage";

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading && !isAuthenticated) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading && !isAuthenticated) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/overview" replace />;
  return <>{children}</>;
}

/** Redirect /periods/:id → /overview?period=:id */
function PeriodToOverviewRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/overview?period=${id}`} replace />;
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
        {/* Overview — unified Dashboard + Expenses */}
        <Route path="/overview" element={<Overview />} />

        {/* Legacy routes → redirect to Overview */}
        <Route
          path="/dashboard"
          element={<Navigate to="/overview" replace />}
        />
        <Route path="/invoices" element={<Navigate to="/overview" replace />} />

        {/* Expense add / detail / edit routes still work */}
        <Route path="/invoices/add" element={<AddExpense />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/invoices/:id/edit" element={<AddExpense />} />

        <Route path="/subscriptions" element={<SubscriptionList />} />
        <Route path="/subscriptions/add" element={<AddExpense />} />
        <Route path="/subscriptions/:id/edit" element={<AddExpense />} />
        <Route path="/import-export" element={<ImportPage />} />
        <Route
          path="/oppgjor"
          element={<Navigate to="/oppgjor/overforing" replace />}
        />
        <Route path="/oppgjor/:tab" element={<SettlementPage />} />
        <Route
          path="/import"
          element={<Navigate to="/import-export" replace />}
        />

        {/* Periods list stays; detail redirects to Overview with period param */}
        <Route path="/periods" element={<PeriodList />} />
        <Route path="/periods/:id" element={<PeriodToOverviewRedirect />} />

        <Route path="/settings" element={<Profile />} />
        <Route path="/" element={<Navigate to="/overview" replace />} />
      </Route>

      <Route
        element={
          <AdminRoute>
            <AppLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route
          path="/admin/settings"
          element={<Navigate to="/settings" replace />}
        />
      </Route>

      {/* Authenticated users land on /overview; unauthenticated on /login */}
      <Route path="*" element={<CatchAll />} />
    </Routes>
  );
}

function CatchAll() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  return <Navigate to={isAuthenticated ? "/overview" : "/login"} replace />;
}
