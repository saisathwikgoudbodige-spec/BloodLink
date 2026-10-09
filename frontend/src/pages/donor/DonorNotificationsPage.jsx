import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import { useWebSocket } from '../../context/WebSocketContext';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';

const DonorNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount, latestNotification } = useWebSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMyNotifications();
      if (res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (latestNotification) {
      fetchNotifications();
    }
  }, [latestNotification]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            Donor Notifications
          </h1>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Emergency broadcast alerts and blood matching notifications
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchNotifications} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
            <CheckCheck size={14} /> Mark all read
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 8px' }} />
          <p style={{ color: '#64748b' }}>Loading donor alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell className="empty-state-icon" style={{ color: '#94a3b8' }} />
          <h3 className="empty-state-title">No Notifications Yet</h3>
          <p className="empty-state-desc">You will receive notifications here whenever matching emergencies occur.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: notif.isRead ? '4px solid #cbd5e1' : '4px solid #dc2626',
                background: notif.isRead ? '#ffffff' : '#fef2f2',
                cursor: notif.isRead ? 'default' : 'pointer'
              }}
              onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{notif.title}</h4>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {new Date(notif.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
                {notif.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorNotificationsPage;
