import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../../services/dashboardService';
import { PlusCircle, Activity, Clock, CheckCircle2, AlertOctagon, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { StatusBadge, UrgencyBadge, BloodBadge } from '../../components/Badges';

const RequesterDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getRequesterDashboard();
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b' }}>Loading requester dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            Emergency Requester Dashboard
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
            Coordinate and monitor your active blood requirements in real-time
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchDashboard} className="btn btn-secondary btn-sm" title="Refresh data">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link to="/requester/create-request" className="btn btn-primary">
            <PlusCircle size={18} /> Create Blood Request
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-4">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Activity size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.activeRequests ?? 0}</div>
            <div className="metric-label">Active Requirements</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.pendingResponses ?? 0}</div>
            <div className="metric-label">Pending Matches</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.fulfilledRequests ?? 0}</div>
            <div className="metric-label">Fulfilled Requests</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.expiredRequests ?? 0}</div>
            <div className="metric-label">Expired / Closed</div>
          </div>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Blood Requests</h2>
            <p className="card-subtitle">Real-time status and matching progress for your submissions</p>
          </div>
          <Link to="/requester/requests" className="btn btn-secondary btn-sm">
            View All ({data?.totalRequests ?? 0})
          </Link>
        </div>

        {(!data?.recentRequests || data.recentRequests.length === 0) ? (
          <div className="empty-state">
            <Activity className="empty-state-icon" style={{ color: '#dc2626' }} />
            <h3 className="empty-state-title">No Active Blood Requests</h3>
            <p className="empty-state-desc">
              You have not created any emergency blood requirements yet. Click below to initiate potential donor matching.
            </p>
            <Link to="/requester/create-request" className="btn btn-primary">
              <PlusCircle size={16} /> Create First Blood Request
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Req ID</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Hospital & City</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRequests.map((req) => (
                  <tr key={req.id}>
                    <td><strong>#{req.id}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BloodBadge bloodGroup={req.bloodGroup} size="sm" />
                        <span style={{ fontWeight: 700 }}>{req.bloodGroupLabel || req.bloodGroup}</span>
                      </div>
                    </td>
                    <td><strong style={{ fontSize: '1rem' }}>{req.unitsRequired}</strong> unit(s)</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.hospitalName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.city}</div>
                    </td>
                    <td><UrgencyBadge urgency={req.urgency} /></td>
                    <td><StatusBadge status={req.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(req.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      <Link to={`/requester/requests/${req.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> Details
                      </Link>
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

export default RequesterDashboard;
