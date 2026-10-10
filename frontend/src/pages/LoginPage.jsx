import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, AlertCircle, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await login(email, password);

      // Redirect: Admin goes to admin dashboard, ordinary users go to requester portal
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/requester/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(80vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            background: '#dc2626',
            borderRadius: '14px',
            color: 'white',
            marginBottom: '14px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
          }}>
            <Droplet size={30} fill="white" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '6px' }}>
            Sign in to access your BloodLink coordination portal
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '12px 14px',
            borderRadius: '10px',
            color: '#b91c1c',
            fontSize: '0.85rem',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '1.5rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px', display: 'block' }}>
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px', display: 'block' }}>
              Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', borderRadius: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.875rem',
          color: '#64748b'
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#dc2626', fontWeight: 700 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
