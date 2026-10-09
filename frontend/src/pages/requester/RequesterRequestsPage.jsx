import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import requestService from '../../services/requestService';
import { PlusCircle, Search, Filter, Eye, RefreshCw, Activity } from 'lucide-react';
import { StatusBadge, UrgencyBadge, BloodBadge } from '../../components/Badges';

const RequesterRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await requestService.getMyRequests();
      if (res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const matchesFilter = filterStatus === 'ALL' || req.status === filterStatus;
    const matchesSearch =
      req.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.bloodGroupLabel && req.bloodGroupLabel.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            My Blood Requests
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
            Track all historical and currently active emergency blood coordination entries
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchRequests} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <Link to="/requester/create-request" className="btn btn-primary">
            <PlusCircle size={16} /> New Request
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by hospital, city, or blood group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} style={{ color: '#64748b' }} />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="MATCHING">MATCHING</option>
            <option value="RESPONDED">RESPONDED</option>
            <option value="FULFILLED">FULFILLED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Requests List Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 8px' }} />
          <p style={{ color: '#64748b' }}>Loading blood requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <Activity className="empty-state-icon" style={{ color: '#dc2626' }} />
          <h3 className="empty-state-title">No Requests Found</h3>
          <p className="empty-state-desc">
            {searchTerm || filterStatus !== 'ALL'
              ? 'No blood requests matched your search criteria.'
              : 'You have not submitted any emergency blood requests yet.'}
          </p>
          <Link to="/requester/create-request" className="btn btn-primary">
            Create Blood Request
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Blood Group</th>
                <th>Units</th>
                <th>Hospital & Location</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.id}>
                  <td><strong>#{req.id}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BloodBadge bloodGroup={req.bloodGroup} size="sm" />
                      <span style={{ fontWeight: 700 }}>{req.bloodGroupLabel || req.bloodGroup}</span>
                    </div>
                  </td>
                  <td><strong>{req.unitsRequired}</strong> unit(s)</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{req.hospitalName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.city}</div>
                  </td>
                  <td><UrgencyBadge urgency={req.urgency} /></td>
                  <td><StatusBadge status={req.status} /></td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(req.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(req.expiresAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td>
                    <Link to={`/requester/requests/${req.id}`} className="btn btn-secondary btn-sm">
                      <Eye size={14} /> View Details
                    </Link>
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

export default RequesterRequestsPage;
