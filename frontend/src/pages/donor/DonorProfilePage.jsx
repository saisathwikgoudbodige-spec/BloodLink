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
  const [detectingLocation, setDetectingLocation] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await donorService.getProfile();
      if (res && res.data) {
        const p = res.data;
        setProfile(p);
        setBloodGroup(p.bloodGroup || 'O_POSITIVE');
        setCity(p.city || '');
        setLatitude(p.latitude != null ? p.latitude : '');
        setLongitude(p.longitude != null ? p.longitude : '');
        setPhone(p.phone || '');
        setAvailability(p.availabilityStatus || 'AVAILABLE');
      } else {
        // User has not created donor profile yet - provide initial blank state
        setProfile({ bloodGroup: 'O_POSITIVE', city: '', availabilityStatus: 'AVAILABLE' });
      }
    } catch (err) {
      // 404 simply means no donor profile configured yet
      setProfile({ bloodGroup: 'O_POSITIVE', city: '', availabilityStatus: 'AVAILABLE' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
          setDetectingLocation(false);
        },
        () => {
          setDetectingLocation(false);
          alert('GPS unavailable. You can enter your approximate coordinates manually.');
        },
        { timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
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
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: '#dc2626', margin: '0 auto 12px' }} />
        <p style={{ color: '#64748b', fontWeight: 600 }}>Loading donor profile...</p>
      </div>
    );
  }

  return (
    <div className="donor-profile-container" style={{ maxWidth: '680px', width: '100%', margin: '1.5rem auto', padding: '0 0.5rem' }}>
      <div className="card" style={{ padding: '2.25rem 1.75rem', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
        {/* Profile Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '1.75rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap'
        }}>
          <div style={{ flexShrink: 0 }}>
            <BloodBadge bloodGroup={bloodGroup} size="lg" />
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-navy)', lineHeight: 1.25 }}>
              Donor Volunteer Profile
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
              Manage your blood group, geographic location, and emergency contact details
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {success && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '12px 14px',
            borderRadius: '10px',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>Profile and availability settings updated successfully.</span>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '12px 14px',
            borderRadius: '10px',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Blood Group */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px', display: 'block' }}>
              Blood Group <span className="required" style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              className="form-select"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg.value} value={bg.value}>{bg.label}</option>
              ))}
            </select>
            <span className="form-help" style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
              Used by the automated ABO/Rh compatibility engine to screen matching requests.
            </span>
          </div>

          {/* Contact Phone */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px', display: 'block' }}>
              Contact Phone (Shared with hospital when you accept a match)
            </label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91-9876543210"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
            />
          </div>

          {/* City / Region */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px', display: 'block' }}>
              City / Region <span className="required" style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Hyderabad"
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
            />
          </div>

          {/* Geolocation Coordinates Box */}
          <div style={{
            background: '#f8fafc',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                📍 Coordinates for Distance Matching (Haversine)
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGetLocation}
                disabled={detectingLocation}
                style={{ fontSize: '0.75rem', padding: '5px 10px', borderRadius: '6px' }}
              >
                <MapPin size={13} /> {detectingLocation ? 'Detecting...' : 'Auto-Detect GPS'}
              </button>
            </div>

            <div className="coordinates-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 17.3850"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.875rem' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 78.4867"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', fontSize: '0.875rem' }}
                />
              </div>
            </div>
          </div>

          {/* Availability Status */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '6px', display: 'block' }}>
              Volunteer Availability Status
            </label>
            <select
              className="form-select"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
            >
              <option value="AVAILABLE">AVAILABLE (Active — receive emergency match alerts)</option>
              <option value="UNAVAILABLE">UNAVAILABLE (Paused — temporarily mute notifications)</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '1rem' }}
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
