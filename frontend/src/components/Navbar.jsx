import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Droplet, Bell, LogOut, User as UserIcon, Shield, Activity, PlusCircle, List, Radio } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { unreadCount, connected } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <Link to="/" className="nav-brand">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#dc2626', borderRadius: '8px', color: 'white' }}>
            <Droplet size={22} fill="white" />
          </div>
          <span>BLOODLINK</span>
          <span className="brand-badge">Emergency</span>
        </Link>

        {/* Role Navigation */}
        <nav className="nav-links">
          {!isAuthenticated && (
            <>
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
              <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>About & Rules</Link>
            </>
          )}

          {isAuthenticated && role === 'REQUESTER' && (
            <>
              <Link to="/requester/dashboard" className={`nav-link ${isActive('/requester/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/requester/create-request" className={`nav-link ${isActive('/requester/create-request') ? 'active' : ''}`}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <PlusCircle size={15} /> Create Request
                </span>
              </Link>
              <Link to="/requester/requests" className={`nav-link ${isActive('/requester/requests') ? 'active' : ''}`}>My Requests</Link>
            </>
          )}

          {isAuthenticated && role === 'DONOR' && (
            <>
              <Link to="/donor/dashboard" className={`nav-link ${isActive('/donor/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/donor/matches" className={`nav-link ${isActive('/donor/matches') ? 'active' : ''}`}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Radio size={15} /> Potential Matches
                </span>
              </Link>
              <Link to="/donor/profile" className={`nav-link ${isActive('/donor/profile') ? 'active' : ''}`}>Donor Profile</Link>
            </>
          )}

          {isAuthenticated && role === 'ADMIN' && (
            <>
              <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>Admin Dashboard</Link>
              <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>Users</Link>
              <Link to="/admin/requests" className={`nav-link ${isActive('/admin/requests') ? 'active' : ''}`}>Requests Monitor</Link>
              <Link to="/admin/duplicates" className={`nav-link ${isActive('/admin/duplicates') ? 'active' : ''}`}>Duplicates Review</Link>
              <Link to="/admin/audit-logs" className={`nav-link ${isActive('/admin/audit-logs') ? 'active' : ''}`}>Audit Logs</Link>
            </>
          )}
        </nav>

        {/* Right side Actions */}
        <div className="nav-actions">
          {/* Real-time connection indicator */}
          {isAuthenticated && (
            <span
              title={connected ? "Real-time WebSocket active" : "WebSocket reconnecting..."}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: connected ? '#16a34a' : '#cbd5e1',
                boxShadow: connected ? '0 0 6px #16a34a' : 'none'
              }}
            />
          )}

          {/* Notifications button */}
          {isAuthenticated && (
            <Link
              to={role === 'REQUESTER' ? '/requester/notifications' : role === 'DONOR' ? '/donor/notifications' : '/admin/dashboard'}
              className="btn btn-secondary btn-sm"
              style={{ position: 'relative', padding: '8px 10px', borderRadius: '8px' }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white'
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Authenticated user menu or Login buttons */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)' }}>{user?.name}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {role === 'ADMIN' ? '🛡️ ADMIN' : role === 'DONOR' ? '❤️ DONOR' : '📋 REQUESTER'}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
