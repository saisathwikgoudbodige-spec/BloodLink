import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Heart, Shield, Bell, CheckCircle2, AlertTriangle, ArrowRight, Activity, Users, Clock } from 'lucide-react';
import { BloodBadge } from '../components/Badges';

const LandingPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        borderRadius: '24px',
        padding: '4rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.3)'
      }}>
        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(220, 38, 38, 0.2)', border: '1px solid rgba(220, 38, 38, 0.4)', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5', marginBottom: '1.5rem' }}>
            <Droplet size={16} fill="#dc2626" color="#dc2626" />
            <span>Emergency Volunteer Coordination Network</span>
          </div>

          <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem' }}>
            Emergency Blood Requirement Matching Network
          </h1>

          <p style={{ fontSize: '1.15rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '640px' }}>
            Connect emergency blood requests with potentially compatible and available registered donors in real-time. Transparent, rule-based coordination when every minute counts.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/requester/create-request" className="btn btn-primary btn-lg" style={{ boxShadow: '0 10px 15px -3px rgba(220, 38, 38, 0.4)' }}>
              Create Blood Request <ArrowRight size={18} />
            </Link>
            <Link to="/register" className="btn btn-secondary btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
              <Heart size={18} fill="#ef4444" color="#ef4444" /> Become a Donor
            </Link>
          </div>
        </div>

        {/* Decorative Blood Drop Background Silhouette */}
        <div style={{
          position: 'absolute',
          right: '-50px',
          bottom: '-60px',
          opacity: 0.08,
          pointerEvents: 'none'
        }}>
          <Droplet size={420} fill="white" />
        </div>
      </section>

      {/* Primary Value Propositions */}
      <section className="grid-3">
        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Activity size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Rule-Based Compatibility</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
              Centralized ABO/Rh compatibility rules automatically identify potentially eligible volunteer donors for emergency requests.
            </p>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Zero-Delay WebSocket Alerts</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
              Instant notifications reach donors and requesters immediately without page refreshes or latency delays.
            </p>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>Clear Clinical Boundaries</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
              Coordination-only design. Never replaces formal blood bank testing, laboratory cross-matching, or clinical doctors.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Workflow */}
      <section className="card" style={{ padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End-to-End Workflow</span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '6px', color: '#0f172a' }}>How BloodLink Operates</h2>
          <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '8px' }}>
            Four straightforward steps connecting an emergency patient requirement with volunteer blood donors.
          </p>
        </div>

        <div className="grid-4">
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
              1
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Create Blood Requirement</h4>
            <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5 }}>
              Requester submits blood group, units, hospital, city, GPS coordinates, urgency, and expiry window.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
              2
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Intelligent Matching Engine</h4>
            <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5 }}>
              Backend evaluates blood compatibility, donor availability, and approximate Haversine distance.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d97706', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
              3
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Instant Donor Alerts</h4>
            <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5 }}>
              Matching donors receive real-time notifications via WebSocket and review hospital details.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>
              4
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Donor Responds & Tracks</h4>
            <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.5 }}>
              Donor accepts or declines. Requester receives instant update and coordinates with hospital staff.
            </p>
          </div>
        </div>
      </section>

      {/* Blood Compatibility Guide */}
      <section className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Configured Blood Group Compatibility Matrix</h3>
            <p className="card-subtitle">Potential red blood cell compatibility guidelines used for matching</p>
          </div>
          <span className="badge badge-matching">Reference Rules</span>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Recipient Group</th>
                <th>Potentially Compatible Donors</th>
                <th>Universal Role Note</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>O- (O Negative)</strong></td>
                <td><span className="badge badge-normal">O-</span></td>
                <td><span style={{ color: '#dc2626', fontWeight: 600 }}>Universal Donor (Can donate to all)</span></td>
              </tr>
              <tr>
                <td><strong>O+ (O Positive)</strong></td>
                <td><span className="badge badge-normal">O-</span> <span className="badge badge-normal">O+</span></td>
                <td>Can donate to O+, A+, B+, AB+</td>
              </tr>
              <tr>
                <td><strong>A- (A Negative)</strong></td>
                <td><span className="badge badge-normal">O-</span> <span className="badge badge-normal">A-</span></td>
                <td>Can donate to A-, A+, AB-, AB+</td>
              </tr>
              <tr>
                <td><strong>A+ (A Positive)</strong></td>
                <td><span className="badge badge-normal">O-</span> <span className="badge badge-normal">O+</span> <span className="badge badge-normal">A-</span> <span className="badge badge-normal">A+</span></td>
                <td>Can donate to A+, AB+</td>
              </tr>
              <tr>
                <td><strong>B- (B Negative)</strong></td>
                <td><span className="badge badge-normal">O-</span> <span className="badge badge-normal">B-</span></td>
                <td>Can donate to B-, B+, AB-, AB+</td>
              </tr>
              <tr>
                <td><strong>B+ (B Positive)</strong></td>
                <td><span className="badge badge-normal">O-</span> <span className="badge badge-normal">O+</span> <span className="badge badge-normal">B-</span> <span className="badge badge-normal">B+</span></td>
                <td>Can donate to B+, AB+</td>
              </tr>
              <tr>
                <td><strong>AB- (AB Negative)</strong></td>
                <td><span className="badge badge-normal">O-</span> <span className="badge badge-normal">A-</span> <span className="badge badge-normal">B-</span> <span className="badge badge-normal">AB-</span></td>
                <td>Can donate to AB-, AB+</td>
              </tr>
              <tr>
                <td><strong>AB+ (AB Positive)</strong></td>
                <td><span className="badge badge-normal">All Groups (O-, O+, A-, A+, B-, B+, AB-, AB+)</span></td>
                <td><span style={{ color: '#16a34a', fontWeight: 600 }}>Universal Recipient (Can receive from all)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Safety & Medical Limitation Banner */}
      <section style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '16px',
        padding: '2rem',
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'flex-start'
      }}>
        <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px', color: '#b45309' }}>
          <AlertTriangle size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e', marginBottom: '8px' }}>
            Critical Medical Disclaimer & Limitations
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: 1.6, marginBottom: '12px' }}>
            BloodLink is <strong>strictly a volunteer communication and coordination platform</strong>. The system does NOT guarantee blood availability, donor health eligibility, biological safety, or compatibility.
          </p>
          <ul style={{ listStylePosition: 'inside', fontSize: '0.85rem', color: '#92400e', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>The platform does NOT diagnose, prescribe, or authorize blood transfusions.</li>
            <li>All donors must undergo standard clinical screening and questionnaire verification at the hospital.</li>
            <li>Laboratory blood typing and serological cross-matching by certified professionals are mandatory before transfusion.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
