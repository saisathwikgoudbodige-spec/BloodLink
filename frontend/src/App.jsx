import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Requester Pages
import RequesterDashboard from './pages/requester/RequesterDashboard';
import CreateBloodRequestPage from './pages/requester/CreateBloodRequestPage';
import RequesterRequestsPage from './pages/requester/RequesterRequestsPage';
import RequestDetailsPage from './pages/requester/RequestDetailsPage';
import RequesterNotificationsPage from './pages/requester/RequesterNotificationsPage';
import RequesterProfilePage from './pages/requester/RequesterProfilePage';

// Donor Pages
import DonorDashboard from './pages/donor/DonorDashboard';
import DonorMatchesPage from './pages/donor/DonorMatchesPage';
import DonorProfilePage from './pages/donor/DonorProfilePage';
import DonorNotificationsPage from './pages/donor/DonorNotificationsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminDuplicatesPage from './pages/admin/AdminDuplicatesPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <Routes>
            <Route element={<AppLayout />}>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Requester Routes - accessible to all approved users */}
              <Route element={<ProtectedRoute allowedRoles={['USER', 'REQUESTER', 'DONOR']} />}>
                <Route path="/requester/dashboard" element={<RequesterDashboard />} />
                <Route path="/requester/create-request" element={<CreateBloodRequestPage />} />
                <Route path="/requester/requests" element={<RequesterRequestsPage />} />
                <Route path="/requester/requests/:id" element={<RequestDetailsPage />} />
                <Route path="/requester/notifications" element={<RequesterNotificationsPage />} />
                <Route path="/requester/profile" element={<RequesterProfilePage />} />
              </Route>

              {/* Donor Routes - accessible to all approved users */}
              <Route element={<ProtectedRoute allowedRoles={['USER', 'REQUESTER', 'DONOR']} />}>
                <Route path="/donor/dashboard" element={<DonorDashboard />} />
                <Route path="/donor/matches" element={<DonorMatchesPage />} />
                <Route path="/donor/matches/:id" element={<DonorMatchesPage />} />
                <Route path="/donor/profile" element={<DonorProfilePage />} />
                <Route path="/donor/notifications" element={<DonorNotificationsPage />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/requests" element={<AdminRequestsPage />} />
                <Route path="/admin/duplicates" element={<AdminDuplicatesPage />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
