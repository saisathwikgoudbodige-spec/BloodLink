import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);
  const [toasts, setToasts] = useState([]);
  const stompClientRef = useRef(null);

  // Load unread count on authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res.data) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to load notification count:', err);
    }
  };

  const addToast = (notification) => {
    const id = Date.now();
    const newToast = { id, ...notification };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    // Auto-remove toast after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
        setConnected(false);
      }
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

    const storedToken = localStorage.getItem('bloodlink_token');

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      connectHeaders: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // console.log('[STOMP]', str);
      },
      onConnect: () => {
        setConnected(true);
        console.log('Connected to BloodLink WebSocket Server');

        // 1. Subscribe to recipient-specific notifications channel
        client.subscribe(`/topic/user.${user.id}.notifications`, (message) => {
          try {
            const data = JSON.parse(message.body);
            setLatestNotification(data);
            setUnreadCount((c) => c + 1);
            addToast(data);
          } catch (e) {
            console.error('Error parsing user notification message', e);
          }
        });

        // 2. If authenticated as ADMIN, subscribe to dedicated administrative notification feed
        if (user.role === 'ADMIN') {
          client.subscribe('/topic/admin.notifications', (message) => {
            try {
              const data = JSON.parse(message.body);
              // Avoid duplicate if sent both to admin's user channel and admin topic
              setLatestNotification(data);
              setUnreadCount((c) => c + 1);
              addToast(data);
            } catch (e) {
              console.error('Error parsing admin broadcast notification', e);
            }
          });
        }
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.warn('STOMP Error:', frame.headers['message'], frame.body);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [isAuthenticated, user?.id]);

  const subscribeToRequestMatches = (requestId, onMatchReceived) => {
    if (!stompClientRef.current || !connected) return null;
    return stompClientRef.current.subscribe(`/topic/requests.${requestId}.matches`, (msg) => {
      try {
        const matchData = JSON.parse(msg.body);
        onMatchReceived(matchData);
      } catch (err) {
        console.error('Error handling request match update:', err);
      }
    });
  };

  const value = {
    connected,
    unreadCount,
    setUnreadCount,
    loadUnreadCount,
    latestNotification,
    toasts,
    removeToast,
    subscribeToRequestMatches,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
      {/* Real-time Global Toast Container */}
      <div className="toast-container" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px', width: '100%', pointerEvents: 'none' }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-alert animate-slide-in"
            style={{
              pointerEvents: 'auto',
              background: '#ffffff',
              borderLeft: toast.type === 'NEW_MATCH' ? '4px solid #dc2626' : toast.type === 'DONOR_ACCEPTED' ? '4px solid #16a34a' : '4px solid #2563eb',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              borderLeftWidth: '5px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{toast.title}</strong>
              <button
                onClick={() => removeToast(toast.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#475569', lineHeight: 1.4 }}>
              {toast.message}
            </p>
          </div>
        ))}
      </div>
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
