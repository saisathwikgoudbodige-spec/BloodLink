import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import requestService from '../../services/requestService';
import { Droplet, PlusCircle, AlertCircle, MapPin, Zap, ArrowRight, Clock } from 'lucide-react';

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

const CreateBloodRequestPage = () => {
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [hospitalName, setHospitalName] = useState('Demo Emergency Hospital');
  const [city, setCity] = useState('Hyderabad');
  const [latitude, setLatitude] = useState(17.3850);
  const [longitude, setLongitude] = useState(78.4867);
  const [urgency, setUrgency] = useState('CRITICAL');
  const [expiresInHours, setExpiresInHours] = useState(2);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleApplyDemoPreset = () => {
    setBloodGroup('O_POSITIVE');
    setUnitsRequired(2);
    setHospitalName('Demo Emergency Hospital');
    setCity('Hyderabad');
    setLatitude(17.3850);
    setLongitude(78.4867);
    setUrgency('CRITICAL');
    setExpiresInHours(2);
    setError(null);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        },
        (err) => {
          alert('GPS unavailable. Using default city coordinates.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (unitsRequired < 1) {
      setError('Units required must be at least 1');
      return;
    }

    const payload = {
      bloodGroup,
      unitsRequired: Number(unitsRequired),
      hospitalName: hospitalName.trim(),
      city: city.trim(),
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      urgency,
      expiresInHours: Number(expiresInHours),
    };

    try {
      setLoading(true);
      setError(null);
      const res = await requestService.createRequest(payload);
      if (res.data) {
        // Navigate immediately to request details to view live matches
        navigate(`/requester/requests/${res.data.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create blood request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>
              <Zap size={14} /> Rapid Dispatch
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
              Create Emergency Blood Request
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '2px' }}>
              Submit details to initiate real-time matching against compatible, available donors
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleApplyDemoPreset}
            style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
            title="Auto-fill with prompt demo scenario values (O+, 2 units, Demo Emergency Hospital, Hyderabad, CRITICAL, 2 hours)"
          >
            ⚡ Load Demo Scenario
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Required Blood Group <span className="required">*</span></label>
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
              <label className="form-label">Units Required <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                max="20"
                className="form-input"
                value={unitsRequired}
                onChange={(e) => setUnitsRequired(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hospital / Medical Center Name <span className="required">*</span></label>
            <input
              type="text"
              className="form-input"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="e.g., Demo Emergency Hospital, Jubilee Hills"
              required
            />
          </div>

          <div className="grid-2">
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

            <div className="form-group">
              <label className="form-label">Urgency Level <span className="required">*</span></label>
              <select
                className="form-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                required
              >
                <option value="CRITICAL">CRITICAL (Immediate Transfusion Needed)</option>
                <option value="HIGH">HIGH (Required within few hours)</option>
                <option value="NORMAL">NORMAL (Scheduled within 24 hours)</option>
              </select>
            </div>
          </div>

          {/* Coordinates and Geolocation */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-navy)' }}>
                📍 Proximity Coordinates (Haversine Distance Matching)
              </span>
              <button
                type="button"
                onClick={handleGetLocation}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <MapPin size={12} /> Use GPS
              </button>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hospital Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="form-input"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hospital Longitude</label>
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

          {/* Expiry Hours */}
          <div className="form-group">
            <label className="form-label">Request Active Window (Hours) <span className="required">*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                min="1"
                max="72"
                className="form-input"
                style={{ maxWidth: '120px' }}
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Hours before auto-expiring from active donor searches
              </span>
            </div>
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#92400e', marginBottom: '1.5rem' }}>
            <strong>Medical Notice:</strong> Submitting will instantly search for and notify matching registered donors within radius. Clinical cross-matching must be performed at the hospital before transfusion.
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Finding Potential Donors...' : 'Find Potential Donors'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBloodRequestPage;
