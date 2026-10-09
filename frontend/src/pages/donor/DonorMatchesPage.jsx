import React, { useState, useEffect } from 'react';
import donorService from '../../services/donorService';
import matchService from '../../services/matchService';
import { useWebSocket } from '../../context/WebSocketContext';
import { Heart, Check, X, RefreshCw, Radio, Search, Filter } from 'lucide-react';
import { StatusBadge, UrgencyBadge, BloodBadge } from '../../components/Badges';

const DonorMatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('ALL');

  const { latestNotification } = useWebSocket();

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await donorService.getDonorMatches();
      if (res.data) {
        setMatches(res.data);
      }
    } catch (err) {
      console.error('Failed to load matches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (latestNotification) {
      fetchMatches();
    }
  }, [latestNotification]);

  const handleRespond = async (matchId, responseType) => {
    try {
      setActionLoading(matchId);
      await matchService.respondToMatch(matchId, responseType);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, responseStatus: responseType, respondedAt: new Date().toISOString() } : m
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === 'PENDING') return m.responseStatus === 'NOTIFIED';
    if (filter === 'ACCEPTED') return m.responseStatus === 'ACCEPTED';
    if (filter === 'DECLINED') return m.responseStatus === 'DECLINED';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            Potential Donor Matches
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
            Emergency requests matched against your blood group and geographic vicinity
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchMatches} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '8px' }}>
        <button
          className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('ALL')}
        >
          All Matches ({matches.length})
        </button>
        <button
          className={`btn btn-sm ${filter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('PENDING')}
        >
          Pending ({matches.filter((m) => m.responseStatus === 'NOTIFIED').length})
        </button>
        <button
          className={`btn btn-sm ${filter === 'ACCEPTED' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('ACCEPTED')}
        >
          Accepted ({matches.filter((m) => m.responseStatus === 'ACCEPTED').length})
        </button>
        <button
          className={`btn btn-sm ${filter === 'DECLINED' ? 'btn-secondary' : 'btn-secondary'}`}
          onClick={() => setFilter('DECLINED')}
        >
          Declined ({matches.filter((m) => m.responseStatus === 'DECLINED').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 8px' }} />
          <p style={{ color: '#64748b' }}>Loading matches...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="empty-state">
          <Heart className="empty-state-icon" style={{ color: '#94a3b8' }} />
          <h3 className="empty-state-title">No Matches in this View</h3>
          <p className="empty-state-desc">You have no match records matching the selected status filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className="card"
              style={{
                borderLeft: match.responseStatus === 'ACCEPTED'
                  ? '5px solid #16a34a'
                  : match.responseStatus === 'DECLINED'
                  ? '5px solid #94a3b8'
                  : '5px solid #dc2626'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <BloodBadge bloodGroup={match.requestBloodGroup} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        Request #{match.requestId} — {match.requestBloodGroupLabel || match.requestBloodGroup}
                      </span>
                      <UrgencyBadge urgency={match.requestUrgency} />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                      {match.requestUnitsRequired} unit(s) • {match.hospitalName}, {match.city}
                    </div>
                  </div>
                </div>

                <div>
                  {match.responseStatus === 'NOTIFIED' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleRespond(match.id, 'ACCEPTED')}
                        className="btn btn-success btn-sm"
                        disabled={actionLoading === match.id}
                      >
                        <Check size={14} /> Accept & Share Phone
                      </button>
                      <button
                        onClick={() => handleRespond(match.id, 'DECLINED')}
                        className="btn btn-secondary btn-sm"
                        disabled={actionLoading === match.id}
                      >
                        <X size={14} /> Decline
                      </button>
                    </div>
                  ) : match.responseStatus === 'ACCEPTED' ? (
                    <span className="badge badge-responded">✓ You Accepted</span>
                  ) : (
                    <span className="badge badge-cancelled">✗ You Declined</span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '2rem', fontSize: '0.825rem', color: '#64748b' }}>
                <div>Approx Distance: <strong>{match.distanceKm != null ? `~${match.distanceKm.toFixed(1)} km` : 'City Match'}</strong></div>
                <div>Notified: <strong>{new Date(match.notifiedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</strong></div>
                {match.respondedAt && (
                  <div>Responded: <strong>{new Date(match.respondedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</strong></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorMatchesPage;
