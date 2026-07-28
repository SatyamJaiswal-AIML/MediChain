import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHealthSummary, getRecentMedicalHistory, type HealthMetric, type MedicalHistoryEntry } from '../services/patient';
import { getUpcomingAppointment, type Appointment } from '../services/appointment';
import { getNearbyHospitals, type Hospital } from '../services/hospital';
import DashboardCard from '../components/DashboardCard';
import QuickActionCard from '../components/QuickActionCard';
import AppointmentCard from '../components/AppointmentCard';
import HospitalCard from '../components/HospitalCard';
import HospitalDetailModal from '../components/HospitalDetailModal';
import HealthScoreRing from '../components/HealthScoreRing';
import MedicationReminders from '../components/MedicationReminders';
import FloatingAIButton from '../components/FloatingAIButton';
import './PatientDashboard.css';

const QUICK_ACTIONS = [
  {
    label: 'AI Symptom Checker',
    description: 'Predict conditions from symptoms',
    path: '/disease-predictor',
    accent: 'violet' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 12 16zm1-5.5a1 1 0 0 0-2 0v-4a1 1 0 0 0 2 0z" />
      </svg>
    ),
  },
  {
    label: 'Book Appointment',
    description: 'Schedule a visit with a doctor',
    path: '/book-appointment',
    accent: 'teal' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M12 14v4M10 16h4" />
      </svg>
    ),
  },
  {
    label: 'Find a Hospital',
    description: 'Browse live bed availability',
    path: '/hospitals',
    accent: 'amber' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    label: 'Emergency Transfer',
    description: 'Request urgent bed transfer',
    path: '/transfer',
    accent: 'coral' as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

const HISTORY_TYPE_COLOR: Record<MedicalHistoryEntry['type'], string> = {
  Consultation: 'var(--color-teal-600)',
  'Lab Report': 'var(--color-violet-600)',
  Prescription: 'var(--color-amber-500)',
  Procedure: 'var(--color-coral-600)',
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [history, setHistory] = useState<MedicalHistoryEntry[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    Promise.all([
      getHealthSummary(user.id),
      getUpcomingAppointment(user.id),
      getNearbyHospitals(3),
      getRecentMedicalHistory(user.id, 3),
    ]).then(([metricsRes, apptRes, hospitalsRes, historyRes]) => {
      if (cancelled) return;
      setMetrics(metricsRes);
      setAppointment(apptRes);
      setHospitals(hospitalsRes);
      setHistory(historyRes);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [user]);

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <div className="dashboard">
      {/* 1. Hero Welcome Banner */}
      <section className="welcome-banner fade-in-up">
        <span className="welcome-banner__orb welcome-banner__orb--1" />
        <span className="welcome-banner__orb welcome-banner__orb--2" />

        <div className="welcome-banner__text">
          <h2>Welcome back, {firstName} 👋</h2>
          <p>Your unified health monitoring & hospital network portal.</p>
        </div>

        <svg className="welcome-banner__ekg" viewBox="0 0 300 60" preserveAspectRatio="none">
          <path
            className="welcome-banner__ekg-path"
            d="M0 30 H60 L75 30 L85 8 L95 52 L105 30 L120 30 H160 L172 30 L182 14 L192 46 L202 30 L215 30 H300"
            fill="none"
          />
        </svg>

        <div className="welcome-banner__id">
          <span className="welcome-banner__id-label">Patient ID</span>
          <span className="welcome-banner__id-value mono">{user?.id}</span>
        </div>
      </section>

      {/* 2. Featured AI Disease Predictor Banner */}
      <section
        className="card-surface fade-in-up"
        style={{
          background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 25px -5px rgba(67, 56, 202, 0.4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
              NEW FEATURE
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>🤖 AI Disease Predictor</span>
          </div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', color: '#ffffff' }}>
            Feeling unwell? Describe your symptoms in any language!
          </h3>
          <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.85 }}>
            Our ML model analyzes 377 symptoms across 773 condition profiles to give instant diagnostic suggestions.
          </p>
        </div>
        <button
          className="btn"
          style={{
            background: '#ffffff',
            color: '#4338ca',
            fontWeight: 700,
            padding: '0.65rem 1.2rem',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          onClick={() => navigate('/disease-predictor')}
        >
          ⚡ Analyze Symptoms Now →
        </button>
      </section>

      {/* 3. Core Health Metrics Row */}
      <section className="dashboard__section">
        <div className="dashboard__section-header">
          <h3>Vitals & Health Metrics</h3>
        </div>
        <div className="dashboard__metrics-grid">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton--metric" />)
            : metrics.map((m, i) => <DashboardCard key={m.id} metric={m} index={i} />)}
        </div>
      </section>

      {/* 4. Rearranged Core Two-Column Layout */}
      <div className="dashboard__two-col">
        {/* Left Column: Health Score Ring + MongoDB Reminders + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <section className="dashboard__section">
            <div className="dashboard__section-header">
              <h3>Health Overview</h3>
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
            ) : (
              <HealthScoreRing score={84} />
            )}
          </section>

          <section className="dashboard__section">
            <div className="dashboard__section-header">
              <h3>Medication Reminders</h3>
              <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>☁️ MongoDB Synced</span>
            </div>
            <MedicationReminders />
          </section>

          <section className="dashboard__section">
            <div className="dashboard__section-header">
              <h3>Quick Shortcuts</h3>
            </div>
            <div className="dashboard__quick-actions">
              {QUICK_ACTIONS.map((action) => (
                <QuickActionCard key={action.label} {...action} />
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Upcoming Appointment + Nearby Hospitals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upcoming Appointment */}
          <section className="dashboard__section">
            <div className="dashboard__section-header">
              <h3>Upcoming Appointment</h3>
              <a href="/appointment-status" className="dashboard__section-link">View all</a>
            </div>
            {loading ? (
              <div className="skeleton skeleton--card" />
            ) : appointment ? (
              <AppointmentCard appointment={appointment} />
            ) : (
              <div className="dashboard__empty card-surface">
                <p>No upcoming appointments scheduled.</p>
                <a href="/book-appointment" className="btn btn-primary">Book Appointment</a>
              </div>
            )}
          </section>

          {/* Nearby Hospitals */}
          <section className="dashboard__section">
            <div className="dashboard__section-header">
              <h3>Nearby Hospitals & Live Beds</h3>
              <a href="/hospitals" className="dashboard__section-link">Directory →</a>
            </div>
            <div className="dashboard__hospitals-grid">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton--hospital" />)
                : hospitals.map((h) => (
                    <HospitalCard key={h.id} hospital={h} variant="compact" onViewDetails={setSelectedHospital} />
                  ))}
            </div>
          </section>
        </div>
      </div>

      {/* 5. Bottom Timeline: Recent Medical History */}
      <section className="dashboard__section" style={{ marginTop: '0.5rem' }}>
        <div className="dashboard__section-header">
          <h3>Recent Medical History</h3>
          <a href="/medical-history" className="dashboard__section-link">View all records</a>
        </div>
        <div className="dashboard__history-list card-surface">
          {loading ? (
            <div className="skeleton skeleton--history" />
          ) : (
            history.map((entry) => (
              <a key={entry.id} href="/medical-history" className="history-row">
                <span className="history-row__dot" style={{ background: HISTORY_TYPE_COLOR[entry.type] }} />
                <div className="history-row__content">
                  <div className="history-row__top">
                    <span className="history-row__title">{entry.title}</span>
                    <span className="history-row__date mono">
                      {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="history-row__summary text-secondary">{entry.summary}</p>
                  <span className="history-row__doctor">{entry.doctor} · {entry.type}</span>
                </div>
              </a>
            ))
          )}
        </div>
      </section>

      {/* Hospital Details & Live Beds Modal */}
      {selectedHospital && (
        <HospitalDetailModal hospital={selectedHospital} onClose={() => setSelectedHospital(null)} />
      )}

      <FloatingAIButton />
    </div>
  );
}