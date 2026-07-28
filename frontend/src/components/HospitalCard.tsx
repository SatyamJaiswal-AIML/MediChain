import type { Hospital } from '../services/hospital';
import './HospitalCard.css';

interface HospitalCardProps {
  hospital: Hospital;
  variant?: 'full' | 'compact';
  onViewDetails?: (hospital: Hospital) => void;
}

export default function HospitalCard({ hospital, variant = 'full', onViewDetails }: HospitalCardProps) {
  const beds = hospital.beds || {
    icu: { total: 10, available: 4 },
    emergency: { total: 15, available: 6 },
    oxygen: { total: 20, available: 12 },
    general: { total: 50, available: 25 },
  };

  return (
    <div className={`hospital-card hospital-card--${variant}`}>
      <div className="hospital-card__image">
        <span className="hospital-card__image-placeholder">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /><path d="M12 8v4M10 10h4" />
          </svg>
        </span>
        {hospital.emergencyAvailable && <span className="hospital-card__emergency-tag">24/7 Emergency</span>}
      </div>

      <div className="hospital-card__body">
        <div className="hospital-card__top-row">
          <h4 className="hospital-card__name">{hospital.name}</h4>
          <span className="hospital-card__rating">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.6 7.2.8-5.4 4.9 1.5 7.2L12 17.9 5.6 21.5l1.5-7.2L1.7 9.4l7.2-.8z" /></svg>
            {hospital.rating}
          </span>
        </div>

        <p className="hospital-card__address text-secondary">{hospital.address}</p>

        <div className="hospital-card__stats">
          <span className="hospital-card__stat mono">{hospital.distanceKm} km away</span>
          <span className="hospital-card__stat mono">{hospital.availableDoctors} doctors</span>
        </div>

        {/* Live Bed Count Section */}
        <div
          style={{
            margin: '0.75rem 0',
            padding: '0.6rem 0.75rem',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🟢 Live Bed Counts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem', fontSize: '0.78rem' }}>
            <div>ICU: <strong style={{ color: beds.icu.available > 0 ? '#16a34a' : '#dc2626' }}>{beds.icu.available}/{beds.icu.total}</strong></div>
            <div>Emergency: <strong style={{ color: beds.emergency.available > 0 ? '#16a34a' : '#dc2626' }}>{beds.emergency.available}/{beds.emergency.total}</strong></div>
            <div>Oxygen: <strong style={{ color: beds.oxygen.available > 0 ? '#16a34a' : '#dc2626' }}>{beds.oxygen.available}/{beds.oxygen.total}</strong></div>
            <div>General: <strong style={{ color: beds.general.available > 0 ? '#16a34a' : '#dc2626' }}>{beds.general.available}/{beds.general.total}</strong></div>
          </div>
        </div>

        {variant === 'full' && (
          <div className="hospital-card__specialties">
            {hospital.specialties.slice(0, 3).map((s) => (
              <span key={s} className="hospital-card__specialty-tag">{s}</span>
            ))}
          </div>
        )}

        <button
          className="btn btn-secondary hospital-card__cta"
          onClick={() => onViewDetails?.(hospital)}
        >
          View Details & Live Beds
        </button>
      </div>
    </div>
  );
}