import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { Users, Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { BloodBadge } from '../../components/Badges';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' or 'PENDING'
  const [approvalFilter, setApprovalFilter] = useState('ALL');
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

  const handleApprove = async (user) => {
    if (!window.confirm(`Approve registration for ${user.name} (${user.email})? They will immediately receive access to both the Requester and Donor portals.`)) {
      return;
    }

    try {
      setActionLoading(user.id);
      const res = await adminService.approveUser(user.id);
      if (res.data) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, approvalStatus: 'APPROVED', active: true } : u))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (user) => {
    const reason = window.prompt(
      `Enter reason for rejecting ${user.name}'s registration (this will be recorded in the audit log and shared with the user):`,
      'Did not meet registration or verification requirements'
    );

    if (reason === null) return; // user cancelled

    try {
      setActionLoading(user.id);
      const res = await adminService.rejectUser(user.id, reason);
      if (res.data) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, approvalStatus: 'REJECTED', rejectionReason: reason } : u))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.active;
    const confirmMsg = newStatus
      ? `Activate account for ${user.email}?`
      : `Deactivate account for ${user.email}? Deactivated users cannot log in or participate in emergency matching.`;

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

  const pendingUsers = users.filter((u) => u.approvalStatus === 'PENDING_APPROVAL');

  const filteredUsers = users.filter((u) => {
    if (activeTab === 'PENDING') {
      return u.approvalStatus === 'PENDING_APPROVAL';
    }

    const matchesApproval = approvalFilter === 'ALL' || u.approvalStatus === approvalFilter;
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    return matchesApproval && matchesRole && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            User Management & Registrations
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
            Review pending registrations, grant approvals, and manage verified members across both portals
          </p>
        </div>
        <button onClick={fetchUsers} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`btn btn-sm ${activeTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontWeight: 700 }}
        >
          All Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`btn btn-sm ${activeTab === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontWeight: 700, position: 'relative' }}
        >
          Pending Registrations ({pendingUsers.length})
          {pendingUsers.length > 0 && (
            <span style={{ marginLeft: '6px', background: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '9999px', fontSize: '0.7rem' }}>
              Action Required
            </span>
          )}
        </button>
      </div>

      {/* Filter and Search Bar (Only shown on ALL tab) */}
      {activeTab === 'ALL' && (
        <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={16} color="#64748b" />
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
            >
              <option value="ALL">All Approval Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval ({pendingUsers.length})</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="USER">Unified Members (USER)</option>
              <option value="REQUESTER">Requesters</option>
              <option value="DONOR">Donors</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 8px' }} />
          <p style={{ color: '#64748b' }}>Loading user directory...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <UserCheck size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
          <h3>{activeTab === 'PENDING' ? 'No Registrations Pending Approval' : 'No Users Match Search Criteria'}</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {activeTab === 'PENDING'
              ? 'All submitted user accounts have been reviewed.'
              : 'Try adjusting your search terms or filters.'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User Details</th>
                <th>Role & Access</th>
                <th>Approval Status</th>
                <th>Associated Donor Profile</th>
                <th>Account State</th>
                <th>Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} style={{ background: u.approvalStatus === 'PENDING_APPROVAL' ? '#fffbeb' : 'inherit' }}>
                  <td><strong>#{u.id}</strong></td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.phone || 'No phone'}</div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-critical' : 'badge-responded'}`}>
                      {u.role === 'ADMIN' ? 'ADMIN' : 'MEMBER (Requester + Donor)'}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                      Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td>
                    {u.approvalStatus === 'PENDING_APPROVAL' ? (
                      <span className="badge badge-pending" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                        ⏳ PENDING REVIEW
                      </span>
                    ) : u.approvalStatus === 'APPROVED' ? (
                      <div>
                        <span className="badge badge-available">✓ APPROVED</span>
                        {u.approvedByEmail && (
                          <div style={{ fontSize: '0.675rem', color: '#64748b', marginTop: '2px' }}>
                            by {u.approvedByEmail}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="badge badge-unavailable">✗ REJECTED</span>
                        {u.rejectionReason && (
                          <div style={{ fontSize: '0.675rem', color: '#b91c1c', marginTop: '2px', maxWidth: '140px' }} title={u.rejectionReason}>
                            Reason: {u.rejectionReason}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {u.donorProfile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BloodBadge bloodGroup={u.donorProfile.bloodGroup} size="sm" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{u.donorProfile.city}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: u.donorProfile.availabilityStatus === 'AVAILABLE' ? '#16a34a' : '#64748b' }}>
                          ● {u.donorProfile.availabilityStatus}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None (Requester only)</span>
                    )}
                  </td>
                  <td>
                    {u.active ? (
                      <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: 600 }}>Active</span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>Deactivated</span>
                    )}
                  </td>
                  <td>
                    {u.role !== 'ADMIN' ? (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {u.approvalStatus === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApprove(u)}
                              className="btn btn-sm btn-success"
                              disabled={actionLoading === u.id}
                              style={{ fontSize: '0.75rem', padding: '4px 10px', fontWeight: 700 }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleReject(u)}
                              className="btn btn-sm btn-secondary"
                              disabled={actionLoading === u.id}
                              style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#dc2626' }}
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}

                        {u.approvalStatus === 'APPROVED' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`btn btn-sm ${u.active ? 'btn-secondary' : 'btn-success'}`}
                            disabled={actionLoading === u.id}
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}

                        {u.approvalStatus === 'REJECTED' && (
                          <button
                            onClick={() => handleApprove(u)}
                            className="btn btn-sm btn-secondary"
                            disabled={actionLoading === u.id}
                            style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#16a34a' }}
                          >
                            Re-Approve
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Protected Admin</span>
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
