import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { Users, Search, Filter, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { BloodBadge } from '../../components/Badges';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers();
      if (res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = !user.active;
    const confirmMsg = newStatus
      ? `Activate account for ${user.email}?`
      : `Deactivate account for ${user.email}? Deactivated users cannot log in or participate in matching.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(user.id);
      await adminService.toggleUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: newStatus } : u))
      );
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    return matchesRole && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            User Management
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
            Monitor and manage registered donors, requesters, and system administrators
          </p>
        </div>
        <button onClick={fetchUsers} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={16} color="#64748b" />
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="REQUESTER">Requesters</option>
            <option value="DONOR">Donors</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 8px' }} />
          <p style={{ color: '#64748b' }}>Loading users...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Donor Details</th>
                <th>Account Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td><strong>#{u.id}</strong></td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-critical' : u.role === 'DONOR' ? 'badge-responded' : 'badge-open'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.donorProfile ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BloodBadge bloodGroup={u.donorProfile.bloodGroup} size="sm" />
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {u.donorProfile.city} ({u.donorProfile.availabilityStatus})
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>
                    )}
                  </td>
                  <td>
                    {u.active ? (
                      <span className="badge badge-available">ACTIVE</span>
                    ) : (
                      <span className="badge badge-unavailable">DEACTIVATED</span>
                    )}
                  </td>
                  <td>
                    {u.role !== 'ADMIN' ? (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`btn btn-sm ${u.active ? 'btn-secondary' : 'btn-success'}`}
                        disabled={actionLoading === u.id}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Protected</span>
                    )}
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

export default AdminUsersPage;
