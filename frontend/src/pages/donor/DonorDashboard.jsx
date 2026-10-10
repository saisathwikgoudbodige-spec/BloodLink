import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dashboardService from '../../services/dashboardService';
import donorService from '../../services/donorService';
import matchService from '../../services/matchService';
import { useWebSocket } from '../../context/WebSocketContext';
import { Heart, Activity, CheckCircle, Clock, Bell, Radio, Check, X, MapPin, RefreshCw, ShieldAlert } from 'lucide-react';
import { StatusBadge, UrgencyBadge, BloodBadge } from '../../components/Badges';

const DonorDashboard = () => {
  const [data, setData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [availability, setAvailability] = useState('AVAILABLE');
  const [error, setError] = useState(null);

  const { latestNotification } = useWebSocket();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getDonorDashboard();
      if (res.data) {
        setData(res.data);
        setAvailability(res.data.availabilityStatus || 'AVAILABLE');
      }

      const matchRes = await donorService.getDonorMatches();
      if (matchRes.data) {
        setMatches(matchRes.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load donor dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // When a new WebSocket notification arrives (e.g. NEW_MATCH), refresh automatically!
  useEffect(() => {
    if (latestNotification) {
      console.log('Real-time notification arrived at donor dashboard, refreshing matches');
      fetchDashboard();
    }
  }, [latestNotification]);

  const handleToggleAvailability = async () => {
    const nextStatus = availability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      await donorService.updateAvailability(nextStatus);
      setAvailability(nextStatus);
    } catch (err) {
      alert(err.message || 'Failed to update availability status');
    }
  };

  const handleRespond = async (matchId, responseType) => {
    try {
      setActionLoading(matchId);
      await matchService.respondToMatch(matchId, responseType);
      // Immediately reflect response locally
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, responseStatus: responseType, respondedAt: new Date().toISOString() } : m
        )
      );
      // Update pending count
      setData((prev) => prev ? {
        ...prev,
        pendingResponses: Math.max(0, (prev.pendingResponses || 1) - 1),
        acceptedResponses: responseType === 'ACCEPTED' ? (prev.acceptedResponses || 0) + 1 : prev.acceptedResponses
      } : prev);
    } catch (err) {
      alert(err.message || `Failed to record ${responseType} response`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b' }}>Connecting to volunteer donor network...</p>
      </div>
    );
  }

  const pendingMatches = matches.filter((m) => m.responseStatus === 'NOTIFIED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header and Availability Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            Volunteer Donor Portal
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
            Registered Blood Group: <strong>{data?.bloodGroupLabel || data?.bloodGroup || 'Not set'}</strong> | City: <strong>{data?.city || 'Hyderabad'}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Availability Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Availability:</span>
            <button
              onClick={handleToggleAvailability}
              className={`btn btn-sm ${availability === 'AVAILABLE' ? 'btn-success' : 'btn-secondary'}`}
              style={{ fontWeight: 700 }}
            >
              {availability === 'AVAILABLE' ? '● AVAILABLE' : '○ UNAVAILABLE'}
            </button>
          </div>

          <button onClick={fetchDashboard} className="btn btn-secondary btn-sm" title="Refresh Live Alerts">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Unconfigured Donor Profile Warning Banner */}
      {!data?.profile && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Heart size={18} color="#dc2626" /> Donor Profile Not Yet Completed
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#78350f', margin: '4px 0 0 0' }}>
              You can submit emergency requests anytime. To also participate as an eligible volunteer blood donor and receive match alerts, complete your blood group and city.
            </p>
          </div>
          <Link to="/donor/profile" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
            Complete Donor Profile
          </Link>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-4">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Radio size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.pendingResponses ?? pendingMatches.length}</div>
            <div className="metric-label">Urgent Match Alerts</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.acceptedResponses ?? 0}</div>
            <div className="metric-label">Accepted Donations</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <Heart size={24} />
          </div>
          <div>
            <div className="metric-value">{matches.length}</div>
            <div className="metric-label">Lifetime Matches</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Bell size={24} />
          </div>
          <div>
            <div className="metric-value">{data?.unreadNotifications ?? 0}</div>
            <div className="metric-label">Unread Notifications</div>
          </div>
        </div>
      </div>

      {/* Active Match Alerts (Awaiting Response) */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Urgent Potential Matches ({pendingMatches.length})</h2>
            <p className="card-subtitle">
              Patients currently in emergency need of compatible blood in your vicinity
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', animation: 'pulse 1.5s infinite' }} />
            Zero-Delay Real-Time WebSocket Feed
          </span>
        </div>

        {pendingMatches.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <Heart className="empty-state-icon" style={{ color: '#94a3b8' }} />
            <h4 className="empty-state-title">No Pending Emergency Alerts</h4>
            <p className="empty-state-desc">
              You currently have no unanswered match notifications. You will receive an instant push notification the moment a compatible requirement arises.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {pendingMatches.map((match) => (
              <div
                key={match.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #fed7aa',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  borderLeft: '5px solid #dc2626'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <BloodBadge bloodGroup={match.requestBloodGroup} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                          Potential Match: {match.requestBloodGroupLabel || match.requestBloodGroup}
                        </span>
                        <UrgencyBadge urgency={match.requestUrgency} />
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                        Request #{match.requestId} • {match.requestUnitsRequired} Unit(s) Required
                      </div>
                    </div>
                  </div>

                  {/* Accept / Decline Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleRespond(match.id, 'ACCEPTED')}
                      className="btn btn-success"
                      disabled={actionLoading === match.id}
                      style={{ padding: '8px 16px', fontWeight: 700 }}
                    >
                      <Check size={16} /> Accept & Share Contact
                    </button>
                    <button
                      onClick={() => handleRespond(match.id, 'DECLINED')}
                      className="btn btn-secondary"
                      disabled={actionLoading === match.id}
                      style={{ padding: '8px 14px' }}
                    >
                      <X size={16} /> Decline
                    </button>
                  </div>
                </div>

                {/* Location and Hospital Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Hospital:</span>{' '}
                    <strong>{match.hospitalName || 'Emergency Center'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>City:</span>{' '}
                    <strong>{match.city || 'Hyderabad'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Approx. Distance:</span>{' '}
                    <strong>{match.distanceKm != null ? `~${match.distanceKm.toFixed(1)} km away` : 'City Match'}</strong>
                  </div>
                </div>

                {/* Required Medical Disclaimer */}
                <div style={{ marginTop: '12px', fontSize: '0.775rem', color: '#92400e', background: '#fffbeb', padding: '8px 12px', borderRadius: '6px' }}>
                  ⚠️ <em>Final donor eligibility and medical compatibility must be verified by the authorized healthcare facility.</em>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History of Past Responses */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Past Responses History</h3>
            <p className="card-subtitle">Previous blood requirement coordination records</p>
          </div>
          <Link to="/donor/matches" className="btn btn-secondary btn-sm">
            View All ({matches.length})
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Patient Group</th>
                <th>Units</th>
                <th>Hospital & City</th>
                <th>Approx Distance</th>
                <th>Your Response</th>
                <th>Responded At</th>
              </tr>
            </thead>
            <tbody>
              {matches.filter((m) => m.responseStatus !== 'NOTIFIED').slice(0, 5).map((match) => (
                <tr key={match.id}>
                  <td><strong>#{match.requestId}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BloodBadge bloodGroup={match.requestBloodGroup} size="sm" />
                      <span style={{ fontWeight: 600 }}>{match.requestBloodGroupLabel || match.requestBloodGroup}</span>
                    </div>
                  </td>
                  <td>{match.requestUnitsRequired} unit(s)</td>
                  <td>{match.hospitalName}, {match.city}</td>
                  <td>{match.distanceKm != null ? `~${match.distanceKm.toFixed(1)} km` : 'N/A'}</td>
                  <td>
                    {match.responseStatus === 'ACCEPTED' ? (
                      <span className="badge badge-responded">✓ ACCEPTED</span>
                    ) : (
                      <span className="badge badge-cancelled">✗ DECLINED</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {match.respondedAt ? new Date(match.respondedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
