import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from '@/features/auth/components/route-guards';
import LoginPage from '@/features/auth/pages/login-page';
import CustomerPage from '@/features/customer/pages/customer-page';
import FloorPage from '@/features/floor/pages/floor-page';
import KitchenPage from '@/features/kitchen/pages/kitchen-page';
import ManagerLayout from '@/features/manager/layouts/manager-layout';
import ManagerBillingPage from '@/features/manager/pages/billing-page';
import ManagerDashboardPage from '@/features/manager/pages/dashboard-page';
import ManagerMenuPage from '@/features/manager/pages/menu-page';
import ManagerOrdersPage from '@/features/manager/pages/orders-page';
import ManagerQrPage from '@/features/manager/pages/qr-page';
import ManagerUsersPage from '@/features/manager/pages/users-page';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/table/:tableId" element={<CustomerPage />} />

        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute role="manager">
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ManagerDashboardPage />} />
          <Route path="menu" element={<ManagerMenuPage />} />
          <Route path="qr" element={<ManagerQrPage />} />
          <Route path="orders" element={<ManagerOrdersPage />} />
          <Route path="billing" element={<ManagerBillingPage />} />
          <Route path="users" element={<ManagerUsersPage />} />
        </Route>
        <Route
          path="/floor"
          element={
            <ProtectedRoute role="floor">
              <FloorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute role="kitchen">
              <KitchenPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
