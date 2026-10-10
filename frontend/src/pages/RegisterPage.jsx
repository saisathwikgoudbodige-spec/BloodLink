import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, AlertCircle, ArrowRight, MapPin, Heart, UserPlus, CheckCircle2, ShieldAlert } from 'lucide-react';

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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Optional Donor profile on registration
  const [includeDonorProfile, setIncludeDonorProfile] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [city, setCity] = useState('Hyderabad');
  const [latitude, setLatitude] = useState(17.3850);
  const [longitude, setLongitude] = useState(78.4867);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const { register } = useAuth();

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        },
        () => {
          alert('Unable to fetch device GPS location. Using default city coordinates.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      role: 'USER', // Standard unified ordinary account
      bloodGroup: includeDonorProfile ? bloodGroup : null,
      city: includeDonorProfile ? city.trim() : null,
      latitude: includeDonorProfile ? Number(latitude) : null,
      longitude: includeDonorProfile ? Number(longitude) : null,
    };

    try {
      setLoading(true);
      await register(payload);
      setSubmitted(true);
    } catch (err) {
      // If error message indicates pending approval, that is actually the expected workflow response
      if (err.message && err.message.toLowerCase().includes('awaiting administrator approval')) {
        setSubmitted(true);
      } else {
        setError(err.message || 'Registration failed. Please check your form values.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: '520px', margin: '3rem auto' }}>
        <div className="card" style={{ padding: '3rem 2.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', marginBottom: '1.25rem' }}>
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-navy)', marginBottom: '0.75rem' }}>
            Registration Submitted!
          </h2>
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem', color: '#92400e', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.5rem', textAlign: 'left' }}>
            <strong>Your registration has been submitted and is awaiting administrator approval.</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              For network safety and clinical coordination integrity, an administrator must review and approve your account before you can log in. Once approved, you can sign in to access both the <strong>Requester Dashboard</strong> and <strong>Donor Dashboard</strong>.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Go to Sign In <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

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
            One account gives you access to both the Requester and Donor portals upon approval
          </p>
        </div>

        {/* Admin Review Notice Banner */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', color: '#166534', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5rem' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0 }} />
          <span>Notice: All registrations are reviewed and approved by an administrator before access is granted.</span>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          {/* Optional Volunteer Donor Section */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '1rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={includeDonorProfile}
                onChange={(e) => setIncludeDonorProfile(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Heart size={16} color="#dc2626" /> Register as a Volunteer Donor now
              </span>
            </label>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 28px' }}>
              (Optional: You can also set this up anytime from your Donor Dashboard after approval)
            </p>

            {includeDonorProfile && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <div className="form-group">
                  <label className="form-label">Blood Group <span className="required">*</span></label>
                  <select
                    className="form-select"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    required={includeDonorProfile}
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
                    required={includeDonorProfile}
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
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Submitting Registration...' : 'Submit Registration'} <ArrowRight size={16} />
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
