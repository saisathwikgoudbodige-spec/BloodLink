import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#dc2626', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Verifying session credentials...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const isOrdinaryUser = role === 'USER' || role === 'REQUESTER' || role === 'DONOR';
    const isAllowed =
      allowedRoles.includes(role) ||
      (isOrdinaryUser && (allowedRoles.includes('USER') || allowedRoles.includes('REQUESTER') || allowedRoles.includes('DONOR'))) ||
      (role === 'ADMIN'); // Admin can view all portals

    if (!isAllowed) {
      if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
      return <Navigate to="/requester/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
