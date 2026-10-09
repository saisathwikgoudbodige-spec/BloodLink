import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, ShieldCheck, HeartHandshake } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: 800, fontSize: '1.2rem', marginBottom: '10px' }}>
              <Droplet size={20} fill="#dc2626" color="#dc2626" />
              <span>BLOODLINK</span>
            </div>
            <p style={{ maxWidth: '440px', lineHeight: 1.6, fontSize: '0.85rem' }}>
              Emergency Blood Requirement Matching Network. A rapid, rule-based coordination network connecting emergency blood needs with potentially compatible, registered volunteer donors.
            </p>
            <div style={{ marginTop: '14px', fontSize: '0.775rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #dc2626' }}>
              <strong>Medical Disclaimer:</strong> BloodLink does NOT provide medical advice, diagnosis, cross-matching, or guarantees of availability. All blood transfusions require medical authorization and clinical laboratory verification by certified healthcare personnel.
            </div>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 700 }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <li><Link to="/" style={{ color: '#94a3b8' }}>Home</Link></li>
              <li><Link to="/about" style={{ color: '#94a3b8' }}>Clinical Scope & Rules</Link></li>
              <li><Link to="/register" style={{ color: '#94a3b8' }}>Become a Donor</Link></li>
              <li><Link to="/login" style={{ color: '#94a3b8' }}>Account Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px', fontWeight: 700 }}>Emergency Guidelines</h4>
            <p style={{ fontSize: '0.825rem', lineHeight: 1.5, color: '#94a3b8' }}>
              In critical trauma or immediate surgical situations, always contact hospital emergency departments or certified regional blood banks simultaneously.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} BloodLink — Individual B.Tech Java Full Stack Capstone Project.</span>
          <span>Powered by Spring Boot, Neon PostgreSQL, WebSocket & React</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
