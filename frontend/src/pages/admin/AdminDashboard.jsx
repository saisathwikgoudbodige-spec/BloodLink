import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../../services/dashboardService';
import { Shield, Users, Activity, CheckCircle2, AlertOctagon, Copy, RefreshCw, FileText, ArrowRight } from 'lucide-react';
import { StatusBadge, UrgencyBadge, BloodBadge } from '../../components/Badges';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getAdminDashboard();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b' }}>Loading administrative dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}>
            <Shield size={14} /> Administrative Control
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            System Oversight & Monitoring
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Monitor network activity, triage potential duplicate requests, and manage accounts
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchDashboard} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh Metrics
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid-4">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.totalUsers ?? 0}</div>
            <div className="metric-label">Total Users</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.activeDonors ?? 0}</div>
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

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Copy size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.potentialDuplicatesCount ?? 0}</div>
            <div className="metric-label">Potential Duplicates</div>
          </div>
        </div>
      </div>

      {/* Administrative Shortcuts */}
      <div className="grid-3">
        <Link to="/admin/users" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>User Management</h3>
            <Users size={20} color="#2563eb" />
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            View registered donors and requesters. Activate or deactivate accounts as necessary.
          </p>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2563eb', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Manage Users <ArrowRight size={14} />
          </span>
        </Link>

        <Link to="/admin/requests" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-navy)' }}>Requests Monitor</h3>
            <Activity size={20} color="#dc2626" />
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Track system-wide open, matching, and fulfilled blood requirement entries.
          </p>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Monitor Requests <ArrowRight size={14} />
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
            <h3 className="card-title">Active Blood Requirements In Network</h3>
            <p className="card-subtitle">Real-time status of emergency entries</p>
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
