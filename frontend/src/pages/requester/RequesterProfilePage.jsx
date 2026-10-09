import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Shield } from 'lucide-react';

const RequesterProfilePage = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '1.5rem', fontWeight: 800 }}>
            {user?.name?.charAt(0) || 'R'}
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            {user?.name}
          </h1>
          <span className="badge badge-open" style={{ marginTop: '4px' }}>
            Emergency Requester
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={18} color="#64748b" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Email Address</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Phone size={18} color="#64748b" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Phone Number</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.phone || 'Not provided'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={18} color="#64748b" />
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Account ID</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>User #{user?.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequesterProfilePage;
