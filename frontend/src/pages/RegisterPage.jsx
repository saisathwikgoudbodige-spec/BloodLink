import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, AlertCircle, ArrowRight, MapPin, Heart, UserPlus } from 'lucide-react';

const BLOOD_GROUPS = [
  { value: 'O_POSITIVE', label: 'O+ (O Positive)' },
  { value: 'O_NEGATIVE', label: 'O- (O Negative - Universal Donor)' },
  { value: 'A_POSITIVE', label: 'A+ (A Positive)' },
  { value: 'A_NEGATIVE', label: 'A- (A Negative)' },
  { value: 'B_POSITIVE', label: 'B+ (B Positive)' },
  { value: 'B_NEGATIVE', label: 'B- (B Negative)' },
  { value: 'AB_POSITIVE', label: 'AB+ (AB Positive - Universal Recipient)' },
  { value: 'AB_NEGATIVE', label: 'AB- (AB Negative)' },
];

const RegisterPage = () => {
  const [role, setRole] = useState('DONOR');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [city, setCity] = useState('Hyderabad');
  const [latitude, setLatitude] = useState(17.3850);
  const [longitude, setLongitude] = useState(78.4867);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        },
        (err) => {
          alert('Unable to fetch device GPS location. Using default city coordinates.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      email,
      password,
      phone,
      role,
      bloodGroup: role === 'DONOR' ? bloodGroup : null,
      city: role === 'DONOR' ? city : null,
      latitude: role === 'DONOR' ? Number(latitude) : null,
      longitude: role === 'DONOR' ? Number(longitude) : null,
    };

    try {
      setLoading(true);
      const user = await register(payload);
      if (user.role === 'DONOR') {
        navigate('/donor/dashboard');
      } else {
        navigate('/requester/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check form values.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '2rem auto' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: '#dc2626', borderRadius: '12px', color: 'white', marginBottom: '12px' }}>
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
            Join BloodLink Network
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Register to coordinate emergency blood requirements or save lives as a donor
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selection Tabs */}
          <div className="form-group">
            <label className="form-label">I am joining as a:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${role === 'DONOR' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRole('DONOR')}
                style={{ padding: '10px' }}
              >
                <Heart size={16} /> Volunteer Donor
              </button>
              <button
                type="button"
                className={`btn ${role === 'REQUESTER' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRole('REQUESTER')}
                style={{ padding: '10px' }}
              >
                <Droplet size={16} /> Requester
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rajesh Kumar"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address <span className="required">*</span></label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91-9876543210"
              />
            </div>
          </div>

          {/* Donor Profile Specific Details */}
          {role === 'DONOR' && (
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '1rem 0' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Heart size={16} color="#dc2626" /> Donor Compatibility & Location
              </h4>

              <div className="form-group">
                <label className="form-label">Blood Group <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  required
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg.value} value={bg.value}>{bg.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">City / Region <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Hyderabad"
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGetLocation}
                style={{ width: '100%', marginTop: '4px', fontSize: '0.8rem' }}
              >
                <MapPin size={14} /> Detect Current GPS Location
              </button>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Registering Account...' : 'Complete Registration'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: '#dc2626', fontWeight: 600 }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
