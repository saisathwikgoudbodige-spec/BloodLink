import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { Activity, Search, Filter, RefreshCw, Eye, Copy, ArrowUpRight } from 'lucide-react';
import { StatusBadge, UrgencyBadge, BloodBadge } from '../../components/Badges';

const BLOOD_GROUPS = [
  { value: 'ALL', label: 'All Blood Groups' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
];

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllRequests();
      if (res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to load requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = requests.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'ALL' || r.urgency === urgencyFilter;
    const matchesBlood = bloodGroupFilter === 'ALL' || r.bloodGroup === bloodGroupFilter;
    const matchesSearch =
      r.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.requesterName && r.requesterName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesUrgency && matchesBlood && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            System-Wide Requests Monitor
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
            Comprehensive overview of all blood coordination requests across all regions
          </p>
        </div>
        <button onClick={fetchRequests} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by hospital, city, or requester name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={16} color="#64748b" />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses ({requests.length})</option>
            <option value="OPEN">OPEN</option>
            <option value="MATCHING">MATCHING</option>
            <option value="RESPONDED">RESPONDED</option>
            <option value="FULFILLED">FULFILLED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="NORMAL">NORMAL</option>
          </select>

          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
          >
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg.value} value={bg.value}>{bg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 8px' }} />
          <p style={{ color: '#64748b' }}>Loading all requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Activity size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
          <h3>No Requests Found</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Try adjusting your filters or search criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Requester</th>
                <th>Blood Group</th>
                <th>Units</th>
                <th>Hospital & City</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Matches</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id}>
                  <td><strong>#{req.id}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{req.requesterName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.requesterEmail}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BloodBadge bloodGroup={req.bloodGroup} size="sm" />
                      <span style={{ fontWeight: 600 }}>{req.bloodGroupLabel || req.bloodGroup}</span>
                    </div>
                  </td>
                  <td><strong>{req.unitsRequired}</strong> unit(s)</td>
                  <td>
                    <div>{req.hospitalName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.city}</div>
                  </td>
                  <td><UrgencyBadge urgency={req.urgency} /></td>
                  <td><StatusBadge status={req.status} /></td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {req.totalMatches || 0} match(es)
                    </span>
                    {req.acceptedMatches > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>
                        {req.acceptedMatches} accepted
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(req.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link
                        to={`/requester/requests/${req.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        title="View request details & live status"
                      >
                        <Eye size={12} /> View
                      </Link>
                      <Link
                        to={`/admin/duplicates?requestId=${req.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        title="Screen potential duplicates for this entry"
                      >
                        <Copy size={12} /> Screen
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminRequestsPage;
