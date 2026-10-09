import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminService from '../../services/adminService';
import { Copy, AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { StatusBadge, UrgencyBadge, BloodBadge } from '../../components/Badges';

const AdminDuplicatesPage = () => {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(searchParams.get('requestId') || '');
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load all requests for dropdown selector
    const loadRequests = async () => {
      try {
        const res = await adminService.getAllRequests();
        if (res.data) {
          setRequests(res.data);
          if (!selectedRequestId && res.data.length > 0) {
            setSelectedRequestId(res.data[0].id.toString());
          }
        }
      } catch (e) {
        console.error('Failed to load requests list', e);
      }
    };
    loadRequests();
  }, []);

  const handleScreenDuplicates = async (idToScreen) => {
    if (!idToScreen) return;
    try {
      setLoading(true);
      const res = await adminService.getPotentialDuplicates(idToScreen);
      if (res.data) {
        setDuplicates(res.data);
      }
    } catch (err) {
      console.error('Failed to screen duplicates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) {
      handleScreenDuplicates(selectedRequestId);
    }
  }, [selectedRequestId]);

  const currentTargetRequest = requests.find((r) => r.id.toString() === selectedRequestId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}>
          <AlertTriangle size={14} /> Administrative Screening Aid
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
          Potential Duplicate Detection
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
          Screens active and recent blood requests within a 48-hour window for duplicate submissions by requester, hospital, or region.
        </p>
      </div>

      {/* Target Selector */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <label className="form-label" style={{ marginBottom: '8px' }}>Select Target Blood Request to Screen:</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ flex: 1, minWidth: '260px' }}
            value={selectedRequestId}
            onChange={(e) => setSelectedRequestId(e.target.value)}
          >
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                #{r.id} — {r.bloodGroupLabel || r.bloodGroup} at {r.hospitalName} ({r.city}) by {r.requesterName} [{r.status}]
              </option>
            ))}
          </select>
          <button
            onClick={() => handleScreenDuplicates(selectedRequestId)}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Run Screening
          </button>
        </div>
      </div>

      {/* Target Details Card */}
      {currentTargetRequest && (
        <div className="card" style={{ background: '#f8fafc' }}>
          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '8px' }}>Target Request Baseline</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            <div><strong>ID:</strong> #{currentTargetRequest.id}</div>
            <div><strong>Requester:</strong> {currentTargetRequest.requesterName}</div>
            <div><strong>Blood Group:</strong> {currentTargetRequest.bloodGroupLabel || currentTargetRequest.bloodGroup}</div>
            <div><strong>Hospital:</strong> {currentTargetRequest.hospitalName} ({currentTargetRequest.city})</div>
            <div><strong>Status:</strong> <StatusBadge status={currentTargetRequest.status} /></div>
          </div>
        </div>
      )}

      {/* Duplicate Candidates Results */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Potential Duplicate Candidates ({duplicates.length})</h3>
            <p className="card-subtitle">
              Requests sharing the same requester/blood group, hospital/blood group, or vicinity within the 48-hour time window
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 8px' }} />
            <p style={{ color: '#64748b' }}>Screening candidates...</p>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <Copy className="empty-state-icon" style={{ color: '#16a34a' }} />
            <h4 className="empty-state-title" style={{ color: '#16a34a' }}>No Potential Duplicates Flagged</h4>
            <p className="empty-state-desc">
              This request does not appear to overlap with any other recent submissions by the same requester or hospital within the search window.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Duplicate Candidate</th>
                  <th>Requester</th>
                  <th>Blood Group</th>
                  <th>Hospital & City</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Flag Reason</th>
                </tr>
              </thead>
              <tbody>
                {duplicates.map((dup) => (
                  <tr key={dup.id} style={{ background: '#fffbeb' }}>
                    <td><strong>#{dup.id}</strong></td>
                    <td>{dup.requesterName}</td>
                    <td><BloodBadge bloodGroup={dup.bloodGroup} size="sm" /></td>
                    <td>{dup.hospitalName}, {dup.city}</td>
                    <td><UrgencyBadge urgency={dup.urgency} /></td>
                    <td><StatusBadge status={dup.status} /></td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(dup.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      <span className="badge badge-matching">
                        POTENTIAL_DUPLICATE
                      </span>
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

export default AdminDuplicatesPage;
