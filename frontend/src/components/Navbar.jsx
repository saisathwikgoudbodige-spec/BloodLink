import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  Droplet,
  Bell,
  LogOut,
  Shield,
  Activity,
  PlusCircle,
  List,
  Radio,
  Heart,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const { unreadCount, connected } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever location/route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isRequesterPortal = location.pathname.startsWith('/requester');
  const isDonorPortal = location.pathname.startsWith('/donor');

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <Link to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            background: '#dc2626',
            borderRadius: '8px',
            color: 'white',
            flexShrink: 0
          }}>
            <Droplet size={22} fill="white" />
          </div>
          <span>BLOODLINK</span>
          <span className="brand-badge">Emergency</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-only">
          {!isAuthenticated && (
            <>
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
              <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>About & Rules</Link>
            </>
          )}

          {isAuthenticated && role !== 'ADMIN' && (
            <div className="nav-member-cluster">
              {/* Dual Portal Switcher Tabs */}
              <div className="portal-switcher">
                <Link
                  to="/requester/dashboard"
                  className={`portal-tab ${isRequesterPortal ? 'active requester' : ''}`}
                  title="Switch to Emergency Requester Portal"
                >
                  <Droplet size={13} fill={isRequesterPortal ? '#dc2626' : 'none'} />
                  <span>Requester Portal</span>
                </Link>
                <Link
                  to="/donor/dashboard"
                  className={`portal-tab ${isDonorPortal ? 'active donor' : ''}`}
                  title="Switch to Volunteer Donor Portal"
                >
                  <Heart size={13} fill={isDonorPortal ? '#16a34a' : 'none'} />
                  <span>Donor Portal</span>
                </Link>
              </div>

              {/* Portal-specific sublinks */}
              {isRequesterPortal ? (
                <div className="nav-sublinks">
                  <Link to="/requester/dashboard" className={`nav-link ${isActive('/requester/dashboard') ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/requester/create-request" className={`nav-link ${isActive('/requester/create-request') ? 'active' : ''}`}>
                    <PlusCircle size={14} />
                    <span>Create Request</span>
                  </Link>
                  <Link to="/requester/requests" className={`nav-link ${isActive('/requester/requests') ? 'active' : ''}`}>
                    My Requests
                  </Link>
                </div>
              ) : (
                <div className="nav-sublinks">
                  <Link to="/donor/dashboard" className={`nav-link ${isActive('/donor/dashboard') ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/donor/matches" className={`nav-link ${isActive('/donor/matches') ? 'active' : ''}`}>
                    <Radio size={14} />
                    <span>Potential Matches</span>
                  </Link>
                  <Link to="/donor/profile" className={`nav-link ${isActive('/donor/profile') ? 'active' : ''}`}>
                    Donor Profile
                  </Link>
                </div>
              )}
            </div>
          )}

          {isAuthenticated && role === 'ADMIN' && (
            <div className="nav-sublinks">
              <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>
                Users & Approvals
              </Link>
              <Link to="/admin/requests" className={`nav-link ${isActive('/admin/requests') ? 'active' : ''}`}>
                Requests Monitor
              </Link>
              <Link to="/admin/duplicates" className={`nav-link ${isActive('/admin/duplicates') ? 'active' : ''}`}>
                Duplicates
              </Link>
              <Link to="/admin/audit-logs" className={`nav-link ${isActive('/admin/audit-logs') ? 'active' : ''}`}>
                Audit Logs
              </Link>
            </div>
          )}
        </nav>

        {/* Right side Actions (Desktop & Quick Mobile Controls) */}
        <div className="nav-actions">
          {/* Real-time WebSocket connection indicator */}
          {isAuthenticated && (
            <span
              className="ws-status-dot"
              title={connected ? "Real-time WebSocket active" : "WebSocket reconnecting..."}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: connected ? '#16a34a' : '#cbd5e1',
                boxShadow: connected ? '0 0 6px #16a34a' : 'none',
                flexShrink: 0
              }}
            />
          )}

          {/* Notifications button */}
          {isAuthenticated && (
            <Link
              to={role === 'ADMIN' ? '/admin/dashboard' : '/requester/notifications'}
              className="btn btn-secondary btn-sm nav-notif-btn"
              style={{ position: 'relative', padding: '7px 9px', borderRadius: '8px' }}
              title="Notifications"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
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

          {/* Desktop User badge & Logout */}
          {isAuthenticated ? (
            <div className="desktop-user-menu desktop-only">
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                  {user?.name}
                </span>
                <span style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {role === 'ADMIN' ? '🛡️ SYSTEM ADMIN' : '👤 MEMBER (Dual Portal)'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Sign out"
                style={{ padding: '7px 10px', borderRadius: '8px' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="desktop-auth-btns desktop-only">
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          <div className="mobile-drawer-content">
            {isAuthenticated ? (
              <>
                {/* User Summary Card */}
                <div className="mobile-user-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#fee2e2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800
                    }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-navy)' }}>
                        {user?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <span className="badge badge-responded" style={{ fontSize: '0.7rem' }}>
                      {role === 'ADMIN' ? '🛡️ ADMIN' : '👤 MEMBER (Requester + Donor)'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: connected ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? '#16a34a' : '#94a3b8' }} />
                      {connected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Member Portal Switcher (Mobile) */}
                {role !== 'ADMIN' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      Active Portal
                    </div>
                    <div className="portal-switcher mobile-portal-switcher">
                      <Link
                        to="/requester/dashboard"
                        className={`portal-tab ${isRequesterPortal ? 'active requester' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Droplet size={14} fill={isRequesterPortal ? '#dc2626' : 'none'} />
                        <span>Requester Portal</span>
                      </Link>
                      <Link
                        to="/donor/dashboard"
                        className={`portal-tab ${isDonorPortal ? 'active donor' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart size={14} fill={isDonorPortal ? '#16a34a' : 'none'} />
                        <span>Donor Portal</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Navigation Links (Mobile) */}
                <div className="mobile-nav-links-list">
                  <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    {role === 'ADMIN' ? 'Administrative Navigation' : isRequesterPortal ? 'Requester Features' : 'Donor Features'}
                  </div>

                  {role !== 'ADMIN' && isRequesterPortal && (
                    <>
                      <Link to="/requester/dashboard" className={`mobile-nav-item ${isActive('/requester/dashboard') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Activity size={16} /> <span>Requester Dashboard</span>
                      </Link>
                      <Link to="/requester/create-request" className={`mobile-nav-item ${isActive('/requester/create-request') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <PlusCircle size={16} /> <span>Create Blood Request</span>
                      </Link>
                      <Link to="/requester/requests" className={`mobile-nav-item ${isActive('/requester/requests') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <List size={16} /> <span>My Blood Requests</span>
                      </Link>
                    </>
                  )}

                  {role !== 'ADMIN' && isDonorPortal && (
                    <>
                      <Link to="/donor/dashboard" className={`mobile-nav-item ${isActive('/donor/dashboard') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Activity size={16} /> <span>Donor Dashboard</span>
                      </Link>
                      <Link to="/donor/matches" className={`mobile-nav-item ${isActive('/donor/matches') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Radio size={16} /> <span>Potential Matches</span>
                      </Link>
                      <Link to="/donor/profile" className={`mobile-nav-item ${isActive('/donor/profile') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Heart size={16} /> <span>Donor Volunteer Profile</span>
                      </Link>
                    </>
                  )}

                  {role === 'ADMIN' && (
                    <>
                      <Link to="/admin/dashboard" className={`mobile-nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Activity size={16} /> <span>Admin Overview Dashboard</span>
                      </Link>
                      <Link to="/admin/users" className={`mobile-nav-item ${isActive('/admin/users') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Shield size={16} /> <span>User Registrations & Approvals</span>
                      </Link>
                      <Link to="/admin/requests" className={`mobile-nav-item ${isActive('/admin/requests') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <List size={16} /> <span>All Blood Requests Monitor</span>
                      </Link>
                      <Link to="/admin/duplicates" className={`mobile-nav-item ${isActive('/admin/duplicates') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Activity size={16} /> <span>Duplicate Screening</span>
                      </Link>
                      <Link to="/admin/audit-logs" className={`mobile-nav-item ${isActive('/admin/audit-logs') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                        <Shield size={16} /> <span>Security Audit Logs</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile Logout Button */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{ width: '100%', color: '#b91c1c', borderColor: '#fca5a5' }}
                  >
                    <LogOut size={16} /> Sign Out of BloodLink
                  </button>
                </div>
              </>
            ) : (
              /* Public Mobile Menu */
              <div className="mobile-nav-links-list">
                <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link to="/about" className={`mobile-nav-item ${isActive('/about') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  Clinical Scope & Rules
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1.5rem' }}>
                  <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
