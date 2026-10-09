import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import requestService from '../../services/requestService';
import { useWebSocket } from '../../context/WebSocketContext';
import { Droplet, MapPin, Clock, Hospital, CheckCircle2, XCircle, ArrowLeft, RefreshCw, UserCheck, ShieldAlert, Phone } from 'lucide-react';
import { StatusBadge, UrgencyBadge, BloodBadge } from '../../components/Badges';

const RequestDetailsPage = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const { subscribeToRequestMatches, latestNotification } = useWebSocket();

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await requestService.getRequestById(id);
      if (res.data) {
        setRequest(res.data);
      }

      // Fetch matches
      try {
        const matchesRes = await requestService.getMatchesForRequest(id);
        if (matchesRes.data) {
          setMatches(matchesRes.data);
        }
      } catch (mErr) {
        console.warn('Could not fetch matches directly:', mErr);
      }
    } catch (err) {
      setError(err.message || 'Failed to load blood request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  // Subscribe to real-time STOMP topic for this specific request's matches
  useEffect(() => {
    const subscription = subscribeToRequestMatches(id, (updatedMatch) => {
      console.log('Real-time match update received:', updatedMatch);
      // Update local match in list
      setMatches((prevMatches) => {
        const exists = prevMatches.some((m) => m.id === updatedMatch.id);
        if (exists) {
          return prevMatches.map((m) => (m.id === updatedMatch.id ? updatedMatch : m));
        }
        return [updatedMatch, ...prevMatches];
      });

      // Refresh request status if match was accepted
      if (updatedMatch.responseStatus === 'ACCEPTED') {
        setRequest((prev) => prev ? { ...prev, status: 'RESPONDED' } : prev);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [id, subscribeToRequestMatches]);

  // Also listen for relevant global/user notifications that mention this requestId
  useEffect(() => {
    if (latestNotification && latestNotification.requestId === Number(id)) {
      fetchRequestDetails();
    }
  }, [latestNotification, id]);

  const handleUpdateStatus = async (newStatus, reason = '') => {
    if (!window.confirm(`Are you sure you want to mark this request as ${newStatus}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await requestService.updateStatus(id, newStatus, reason);
      await fetchRequestDetails();
    } catch (err) {
      alert(err.message || `Failed to update status to ${newStatus}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !request) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b' }}>Loading request details and potential matches...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldAlert size={36} color="#dc2626" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Request Not Found</h2>
        <p style={{ color: '#64748b', margin: '8px 0 1.5rem' }}>{error || 'Unable to locate this request record.'}</p>
        <Link to="/requester/requests" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to My Requests
        </Link>
      </div>
    );
  }

  const acceptedMatches = matches.filter((m) => m.responseStatus === 'ACCEPTED');
  const pendingMatches = matches.filter((m) => m.responseStatus === 'NOTIFIED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Navigation & Header */}
      <div>
        <Link to="/requester/requests" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>
          <ArrowLeft size={16} /> Back to My Requests
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
                Blood Request #{request.id}
              </h1>
              <StatusBadge status={request.status} />
              <UrgencyBadge urgency={request.urgency} />
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Created on {new Date(request.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchRequestDetails} className="btn btn-secondary btn-sm" title="Refresh Live Data">
              <RefreshCw size={15} /> Refresh
            </button>

            {request.status !== 'FULFILLED' && request.status !== 'CLOSED' && request.status !== 'CANCELLED' && (
              <>
                <button
                  onClick={() => handleUpdateStatus('FULFILLED', 'Blood arranged and verified at hospital')}
                  className="btn btn-success btn-sm"
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} /> Mark as Fulfilled
                </button>
                <button
                  onClick={() => handleUpdateStatus('CANCELLED', 'Cancelled by requester')}
                  className="btn btn-outline-crimson btn-sm"
                  disabled={actionLoading}
                >
                  <XCircle size={16} /> Cancel Request
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Accepted Donor Alert Banner (if any donor accepted) */}
      {acceptedMatches.length > 0 && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '10px', borderRadius: '10px' }}>
            <UserCheck size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#15803d' }}>
              {acceptedMatches.length} Potential Donor(s) Have Accepted!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#166534', marginTop: '2px' }}>
              Review the donor contact details below. Coordinate directly with hospital blood bank personnel for testing and verification.
            </p>
          </div>
        </div>
      )}

      {/* Main Request Info Card */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Requirement Specifications</h3>
        <div className="grid-4">
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Blood Group</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <BloodBadge bloodGroup={request.bloodGroup} />
              <strong style={{ fontSize: '1.2rem' }}>{request.bloodGroupLabel || request.bloodGroup}</strong>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Units Required</div>
            <div style={{ marginTop: '6px', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
              {request.unitsRequired} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>Unit(s)</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Hospital & Location</div>
            <div style={{ marginTop: '6px', fontWeight: 700, color: '#0f172a' }}>{request.hospitalName}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{request.city} {request.latitude ? `(${request.latitude}, ${request.longitude})` : ''}</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Expiry Window</div>
            <div style={{ marginTop: '6px', fontWeight: 700, color: '#0f172a' }}>
              {new Date(request.expiresAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {new Date(request.expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </div>
          </div>
        </div>
      </div>

      {/* Potential Matches & Donor Responses Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Potential Donor Matches ({matches.length})</h3>
            <p className="card-subtitle">
              Real-time matching status based on compatibility and proximity ranking
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
            Live WebSocket Sync
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <Hospital className="empty-state-icon" style={{ color: '#94a3b8' }} />
            <h4 className="empty-state-title">No Potential Donors Matched Yet</h4>
            <p className="empty-state-desc">
              The matching engine is actively scanning for available registered donors matching {request.bloodGroupLabel || request.bloodGroup} in the {request.city} region.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>Location</th>
                  <th>Approx. Distance</th>
                  <th>Response Status</th>
                  <th>Contact Details</th>
                  <th>Notified At</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id} style={{ background: match.responseStatus === 'ACCEPTED' ? '#f0fdf4' : 'inherit' }}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {match.donorName || `Donor #${match.donorId}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verified Volunteer</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BloodBadge bloodGroup={match.donorBloodGroup} size="sm" />
                        <span style={{ fontWeight: 600 }}>{match.donorBloodGroupLabel || match.donorBloodGroup}</span>
                      </div>
                    </td>
                    <td>{match.donorCity || 'Registered Area'}</td>
                    <td>
                      {match.distanceKm != null ? (
                        <span style={{ fontWeight: 600, color: match.distanceKm < 15 ? '#16a34a' : '#d97706' }}>
                          ~{match.distanceKm.toFixed(1)} km
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>City Match</span>
                      )}
                    </td>
                    <td>
                      {match.responseStatus === 'ACCEPTED' ? (
                        <span className="badge badge-responded">✓ ACCEPTED</span>
                      ) : match.responseStatus === 'DECLINED' ? (
                        <span className="badge badge-cancelled">✗ DECLINED</span>
                      ) : (
                        <span className="badge badge-matching">⏳ NOTIFIED</span>
                      )}
                    </td>
                    <td>
                      {match.responseStatus === 'ACCEPTED' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: 700 }}>
                          <Phone size={14} /> {match.donorPhone || 'Contact provided to hospital'}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Awaiting donor response</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {match.notifiedAt ? new Date(match.notifiedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request History Log */}
      {request.history && request.history.length > 0 && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>Request Status Audit History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {request.history.map((hist, index) => (
              <div
                key={hist.id || index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {hist.oldStatus ? `${hist.oldStatus} → ` : ''}{hist.newStatus}
                  </span>
                  {hist.reason && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Note: {hist.reason}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <div>{new Date(hist.changedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</div>
                  <div>By: {hist.changedByName || 'System'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailsPage;
