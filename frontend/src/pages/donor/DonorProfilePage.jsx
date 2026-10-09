import React, { useState, useEffect } from 'react';
import donorService from '../../services/donorService';
import { User, Heart, MapPin, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { BloodBadge } from '../../components/Badges';

const BLOOD_GROUPS = [
  { value: 'O_POSITIVE', label: 'O+ (O Positive)' },
  { value: 'O_NEGATIVE', label: 'O- (O Negative - Universal Donor)' },
  { value: 'A_POSITIVE', label: 'A+ (A Positive)' },
  { value: 'A_NEGATIVE', label: 'A- (A Negative)' },
  { value: 'B_POSITIVE', label: 'B+ (B Positive)' },
  { value: 'B_NEGATIVE', label: 'B- (B Negative)' },
  { value: 'AB_POSITIVE', label: 'AB+ (AB Positive)' },
  { value: 'AB_NEGATIVE', label: 'AB- (AB Negative)' },
];

const DonorProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState('');
  const [availability, setAvailability] = useState('AVAILABLE');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await donorService.getProfile();
      if (res.data) {
        const p = res.data;
        setProfile(p);
        setBloodGroup(p.bloodGroup);
        setCity(p.city || '');
        setLatitude(p.latitude != null ? p.latitude : '');
        setLongitude(p.longitude != null ? p.longitude : '');
        setPhone(p.phone || '');
        setAvailability(p.availabilityStatus || 'AVAILABLE');
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const payload = {
        bloodGroup,
        city: city.trim(),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        phone: phone.trim(),
        availabilityStatus: availability,
      };

      const res = await donorService.updateProfile(payload);
      if (res.data) {
        setProfile(res.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw size={28} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 8px' }} />
        <p style={{ color: '#64748b' }}>Loading donor profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '1.5rem' }}>
          <BloodBadge bloodGroup={bloodGroup} size="lg" />
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              Donor Volunteer Profile
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Manage your blood group, geographic location, and emergency contact details
            </p>
          </div>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 14px', borderRadius: '8px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <CheckCircle size={18} />
            <span>Profile and availability settings updated successfully.</span>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
            <label className="form-label">Contact Phone (Shared with hospital when you accept)</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91-9876543210"
            />
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

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                📍 Coordinates for Distance Proximity Calculation
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGetLocation}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <MapPin size={12} /> Auto-Detect
              </button>
            </div>
            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
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
          </div>

          <div className="form-group">
            <label className="form-label">Availability Status</label>
            <select
              className="form-select"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="AVAILABLE">AVAILABLE (Receive emergency alerts)</option>
              <option value="UNAVAILABLE">UNAVAILABLE (Pause notifications)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={saving}
          >
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonorProfilePage;
