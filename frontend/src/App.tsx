import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/route-guards';
import ManagerLayout from './components/manager-layout';
import CustomerPage from './pages/customer-page';
import FloorPage from './pages/floor-page';
import KitchenPage from './pages/kitchen-page';
import LoginPage from './pages/login-page';
import ManagerBillingPage from './pages/manager/manager-billing-page';
import ManagerDashboardPage from './pages/manager/manager-dashboard-page';
import ManagerMenuPage from './pages/manager/manager-menu-page';
import ManagerOrdersPage from './pages/manager/manager-orders-page';
import ManagerQrPage from './pages/manager/manager-qr-page';
import ManagerUsersPage from './pages/manager/manager-users-page';

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
