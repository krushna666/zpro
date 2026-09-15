import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { PlaceholderPage } from './components/PlaceholderPage';

const MODULE_ROUTES: Array<{ path: string; title: string; description: string }> = [
  { path: 'operators', title: 'Operators', description: 'Manage bus operators and their staff.' },
  { path: 'buses', title: 'Buses', description: 'Manage the fleet across all operators.' },
  { path: 'bus-layouts', title: 'Bus Layouts', description: 'Configure seat layouts for buses.' },
  { path: 'routes', title: 'Routes', description: 'Manage routes and intermediate stops.' },
  { path: 'trips', title: 'Trips', description: 'Schedule and monitor trips.' },
  { path: 'seats', title: 'Seats', description: 'Inspect live seat inventory per trip.' },
  { path: 'bookings', title: 'Bookings', description: 'View and manage customer bookings.' },
  { path: 'payments', title: 'Payments', description: 'Track payment transactions and reconciliation.' },
  { path: 'refunds', title: 'Refunds', description: 'Process and audit refunds.' },
  { path: 'coupons', title: 'Coupons', description: 'Manage discount coupons and campaigns.' },
  { path: 'offers', title: 'Offers', description: 'Manage promotional banners and campaigns.' },
  { path: 'users', title: 'Users', description: 'Manage customer accounts.' },
  { path: 'reviews', title: 'Reviews', description: 'Moderate operator and trip reviews.' },
  { path: 'support', title: 'Support', description: 'Handle customer support tickets.' },
  { path: 'notifications', title: 'Notifications', description: 'Manage push notification campaigns.' },
  { path: 'reports', title: 'Reports', description: 'Revenue, bookings, and route analytics.' },
  { path: 'audit-logs', title: 'Audit Logs', description: 'Review administrative actions.' },
  { path: 'settings', title: 'Settings', description: 'Configure platform-wide settings.' },
];

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          {MODULE_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<PlaceholderPage title={route.title} description={route.description} />}
            />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
