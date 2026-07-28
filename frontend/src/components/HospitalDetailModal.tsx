import { useNavigate } from 'react-router-dom';
import type { Hospital } from '../services/hospital';
import './HospitalDetailModal.css';

interface HospitalDetailModalProps {
  hospital: Hospital;
  onClose: () => void;
}

export default function HospitalDetailModal({ hospital, onClose }: HospitalDetailModalProps) {
  const navigate = useNavigate();

  const beds = hospital.beds || {
    icu: { total: 10, available: 4 },
    emergency: { total: 15, available: 6 },
    oxygen: { total: 20, available: 12 },
    general: { total: 50, available: 25 },
  };

  return (
    <div className="hospital-modal-scrim" onClick={onClose}>
      <div className="hospital-modal fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="hospital-modal__banner">
          <button className="hospital-modal__close" onClick={onClose} aria-label="Close">✕</button>
          {hospital.emergencyAvailable && (
            <span className="hospital-modal__emergency-tag">24/7 Emergency Available</span>
          )}
        </div>

        <div className="hospital-modal__body">
          <div className="hospital-modal__header">
            <h2>{hospital.name}</h2>
            <span className="hospital-modal__rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.6 7.2.8-5.4 4.9 1.5 7.2L12 17.9 5.6 21.5l1.5-7.2L1.7 9.4l7.2-.8z" /></svg>
              {hospital.rating}
            </span>
          </div>
          <p className="hospital-modal__address text-secondary">{hospital.address}</p>

          <div className="hospital-modal__stats">
            <div className="hospital-modal__stat">
              <span className="hospital-modal__stat-value mono">{hospital.distanceKm} km</span>
              <span className="hospital-modal__stat-label">Distance</span>
            </div>
            <div className="hospital-modal__stat">
              <span className="hospital-modal__stat-value mono">{hospital.availableDoctors}</span>
              <span className="hospital-modal__stat-label">Doctors</span>
            </div>
            <div className="hospital-modal__stat">
              <span className="hospital-modal__stat-value mono">{hospital.doctors.length}</span>
              <span className="hospital-modal__stat-label">Departments</span>
            </div>
          </div>

          {/* Live Bed Availability Section */}
          <div className="hospital-modal__section" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 0.75rem', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🟢</span> Live Bed Availability
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>ICU BEDS</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: beds.icu.available > 0 ? '#16a34a' : '#dc2626' }}>
                  {beds.icu.available} / {beds.icu.total}
                </span>
              </div>

              <div style={{ background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>EMERGENCY BEDS</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: beds.emergency.available > 0 ? '#16a34a' : '#dc2626' }}>
                  {beds.emergency.available} / {beds.emergency.total}
                </span>
              </div>

              <div style={{ background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>OXYGEN BEDS</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: beds.oxygen.available > 0 ? '#16a34a' : '#dc2626' }}>
                  {beds.oxygen.available} / {beds.oxygen.total}
                </span>
              </div>

              <div style={{ background: '#ffffff', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>GENERAL BEDS</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: beds.general.available > 0 ? '#16a34a' : '#dc2626' }}>
                  {beds.general.available} / {beds.general.total}
                </span>
              </div>
            </div>
          </div>

          {hospital.emergencyPhone && (
            <div className="hospital-modal__emergency-box" style={{ marginTop: '1rem' }}>
              <span>Emergency Line</span>
              <strong className="mono">{hospital.emergencyPhone}</strong>
            </div>
          )}

          <div className="hospital-modal__section" style={{ marginTop: '1rem' }}>
            <h4>Specialties</h4>
            <div className="hospital-modal__tags">
              {hospital.specialties.map((s) => (
                <span key={s} className="hospital-modal__tag">{s}</span>
              ))}
            </div>
          </div>

          <div className="hospital-modal__section">
            <h4>Available Doctors</h4>
            <div className="hospital-modal__doctor-list">
              {hospital.doctors.map((d) => (
                <div key={d.id} className="hospital-modal__doctor">
                  <span className="hospital-modal__doctor-avatar">
                    {d.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="hospital-modal__doctor-name">{d.name}</p>
                    <p className="hospital-modal__doctor-specialty">{d.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary hospital-modal__cta" onClick={() => navigate('/book-appointment')}>
            Book Appointment Here
          </button>
        </div>
      </div>
    </div>
  );
}