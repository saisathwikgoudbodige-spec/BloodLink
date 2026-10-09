import React from 'react';
import { Droplet, Shield, Database, Cpu, CheckCircle } from 'lucide-react';

const AboutPage = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary-navy)' }}>
          About BloodLink
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#64748b', marginTop: '8px' }}>
          Emergency Blood Requirement Matching Network — Academic Capstone Architecture
        </p>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Problem Statement & Purpose</h3>
        <p style={{ lineHeight: 1.7, color: '#334155', marginBottom: '1rem' }}>
          During emergency medical crises, accidents, or urgent surgical procedures, rapid access to blood is essential. Traditional manual phone trees and broadcast messages on social media suffer from high friction, delayed notification, duplicate inquiries, and lack of geographic proximity filtering.
        </p>
        <p style={{ lineHeight: 1.7, color: '#334155' }}>
          <strong>BloodLink</strong> provides a clean, modular monolith web application designed to coordinate registered volunteer donors with emergency requirements in real-time, utilizing standardized blood compatibility matrices and approximate Haversine distance calculations.
        </p>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Clean Modular Monolith Architecture</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
          <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Spring Boot 3 / Java 21</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              REST API controllers, service layer business logic, Jakarta Bean Validation, Spring Security + JWT authentication.
            </p>
          </div>
          <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Neon PostgreSQL</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Serverless cloud PostgreSQL database with transactional integrity, foreign key cascades, and safe update DDL strategies.
            </p>
          </div>
          <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Spring WebSocket & STOMP</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              In-memory simple broker delivering real-time notification push to donors and instant status updates to requesters.
            </p>
          </div>
          <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>React + Vite</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Modern single-page application with Axios interceptors, responsive CSS design tokens, and live state synchronization.
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '16px', padding: '2rem' }}>
        <h3 style={{ color: '#991b1b', fontWeight: 800, fontSize: '1.15rem', marginBottom: '8px' }}>
          Crucial Medical Limitation Notice
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#7f1d1d', lineHeight: 1.6 }}>
          BloodLink is exclusively an emergency volunteer matching and communication aid. The system does not guarantee blood availability, donor health eligibility, biological safety, or compatibility. BloodLink is not a hospital, blood bank, or diagnostic facility, and does not authorize transfusions.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
