import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../../services/dashboardService';
import adminService from '../../services/adminService';
import { useWebSocket } from '../../context/WebSocketContext';
import { Shield, Users, Activity, Copy, RefreshCw, ArrowRight, UserCheck, CheckCircle2, Clock, Check, X } from 'lucide-react';
import { StatusBadge, UrgencyBadge, BloodBadge } from '../../components/Badges';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const { latestNotification } = useWebSocket();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashRes, sumRes, pendRes] = await Promise.all([
        dashboardService.getAdminDashboard(),
        adminService.getSummary(),
        adminService.getPendingUsers(),
      ]);

      if (dashRes.data) setData(dashRes.data);
      if (sumRes.data) setSummary(sumRes.data);
      if (pendRes.data) setPendingUsers(pendRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load administrative dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // When live WebSocket notification arrives (new registration or new request), auto-refresh!
  useEffect(() => {
    if (latestNotification) {
      fetchDashboard();
    }
  }, [latestNotification]);

  const handleApprove = async (user) => {
    try {
      setActionLoading(user.id);
      await adminService.approveUser(user.id);
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (summary) {
        setSummary((s) => ({
          ...s,
          pendingRegistrations: Math.max(0, s.pendingRegistrations - 1),
          approvedUsers: (s.approvedUsers || 0) + 1,
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to approve registration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (user) => {
    const reason = window.prompt(
      `Enter reason for rejecting ${user.name}:`,
      'Did not meet registration or verification requirements'
    );
    if (reason === null) return;

    try {
      setActionLoading(user.id);
      await adminService.rejectUser(user.id, reason);
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (summary) {
        setSummary((s) => ({
          ...s,
          pendingRegistrations: Math.max(0, s.pendingRegistrations - 1),
          rejectedUsers: (s.rejectedUsers || 0) + 1,
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to reject registration');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b' }}>Loading administrative dashboard...</p>
      </div>
    );
  }

  const pendingCount = summary?.pendingRegistrations ?? pendingUsers.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}>
            <Shield size={14} /> Full Administrative Authority
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            System Oversight & Approvals
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Review pending registrations, coordinate emergency requirements, and triage duplicate alerts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchDashboard} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh Metrics
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid-4">
        <div className="metric-card" style={pendingCount > 0 ? { border: '2px solid #f59e0b', background: '#fffbeb' } : {}}>
          <div className="metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-value">{pendingCount}</div>
            <div className="metric-label">Pending Approvals</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="metric-value">{summary?.totalUsers ?? data?.totalUsers ?? 0}</div>
            <div className="metric-label">Total Users</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="metric-value">{summary?.activeDonors ?? data?.activeDonors ?? 0}</div>
            <div className="metric-label">Active Donors</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Activity size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.activeRequests ?? 0}</div>
            <div className="metric-label">Active Requests</div>
          </div>
        </div>
      </div>

      {/* Urgent Action Banner: Pending Registrations Awaiting Review */}
      {pendingUsers.length > 0 && (
        <div className="card" style={{ border: '2px solid #f59e0b', background: '#ffffff', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Clock size={20} color="#d97706" /> Registrations Awaiting Administrator Approval ({pendingUsers.length})
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#78350f', margin: '2px 0 0 0' }}>
                New accounts require review before they can log in to use the Requester and Donor portals.
              </p>
            </div>
            <Link to="/admin/users" className="btn btn-secondary btn-sm">
              Manage All in Users Directory &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingUsers.slice(0, 5).map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.name} ({user.email})</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '12px', marginTop: '2px' }}>
                    <span>Phone: {user.phone || 'None'}</span>
                    {user.donorProfile && (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        🩸 Volunteer Donor: {user.donorProfile.bloodGroup} ({user.donorProfile.city})
                      </span>
                    )}
                    <span>Registered: {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApprove(user)}
                    className="btn btn-success btn-sm"
                    disabled={actionLoading === user.id}
                    style={{ fontWeight: 700 }}
                  >
                    <Check size={14} /> Approve Registration
                  </button>
                  <button
                    onClick={() => handleReject(user)}
                    className="btn btn-secondary btn-sm"
                    disabled={actionLoading === user.id}
                    style={{ color: '#dc2626' }}
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Administrative Shortcuts */}
      <div className="grid-3">
        <Link to="/admin/users" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>User & Approval Directory</h3>
            <Users size={20} color="#2563eb" />
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Approve or reject pending registrations, review donor profiles, and activate or deactivate accounts.
          </p>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Manage Users ({summary?.totalUsers ?? data?.totalUsers ?? 0}) <ArrowRight size={14} />
          </span>
        </Link>

        <Link to="/admin/requests" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Requests Monitor</h3>
            <Activity size={20} color="#dc2626" />
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Track system-wide open, matching, and fulfilled blood requirement entries across all cities.
          </p>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Monitor Requests ({data?.totalRequests ?? 0}) <ArrowRight size={14} />
          </span>
        </Link>

        <Link to="/admin/duplicates" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Duplicate Screening</h3>
            <Copy size={20} color="#d97706" />
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Review potential duplicate submissions based on hospital, requester, and time window rules.
          </p>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d97706', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Review Candidates <ArrowRight size={14} />
          </span>
        </Link>
      </div>

      {/* System Active Requests Preview */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Blood Requirements in Network</h3>
            <p className="card-subtitle">Real-time emergency entries across regions</p>
          </div>
          <Link to="/admin/requests" className="btn btn-secondary btn-sm">
            View All ({data?.totalRequests ?? 0})
          </Link>
        </div>

        {(!data?.recentRequests || data.recentRequests.length === 0) ? (
          <div className="empty-state">
            <p className="empty-state-desc">No active requests currently in the network.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Requester</th>
                  <th>Blood Group</th>
                  <th>Hospital</th>
                  <th>City</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRequests.map((req) => (
                  <tr key={req.id}>
                    <td><strong>#{req.id}</strong></td>
                    <td>{req.requesterName || `User #${req.requesterId}`}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BloodBadge bloodGroup={req.bloodGroup} size="sm" />
                        <span style={{ fontWeight: 600 }}>{req.bloodGroupLabel || req.bloodGroup}</span>
                      </div>
                    </td>
                    <td>{req.hospitalName}</td>
                    <td>{req.city}</td>
                    <td><UrgencyBadge urgency={req.urgency} /></td>
                    <td><StatusBadge status={req.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(req.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
