import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { FileText, RefreshCw, Shield } from 'lucide-react';

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs();
      if (res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            System Audit Logs
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '2px' }}>
            Immutable administrative action tracking and system security logs
          </p>
        </div>
        <button onClick={fetchLogs} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 8px' }} />
            <p style={{ color: '#64748b' }}>Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <FileText className="empty-state-icon" style={{ color: '#94a3b8' }} />
            <h3 className="empty-state-title">No Audit Logs Recorded</h3>
            <p className="empty-state-desc">Administrative actions such as toggling user accounts are logged here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin User</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      <strong>{log.adminUser?.name || 'Administrator'}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.adminUser?.email}</div>
                    </td>
                    <td><span className="badge badge-normal">{log.action}</span></td>
                    <td>{log.targetType || '—'}</td>
                    <td>#{log.targetId || '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{log.description}</td>
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

export default AdminAuditLogsPage;
