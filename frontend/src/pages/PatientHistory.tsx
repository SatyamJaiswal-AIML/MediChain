import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getFullMedicalHistory,
  getPatientProfile,
  type MedicalHistoryEntry,
  type MedicalHistoryType,
  type PatientProfile,
} from '../services/patient';
import {
  createMedicalRecord,
  deleteMedicalRecordApi,
  type NewMedicalRecordPayload,
} from '../services/medicalRecordsApi';
import MedicalTimelineItem from '../components/MedicalTimelineItem';
import AllergyBanner from '../components/AllergyBanner';
import FilterTabs from '../components/FilterTabs';
import SearchBar from '../components/SearchBar';
import './PatientHistory.css';

type FilterValue = 'All' | MedicalHistoryType;

export default function PatientHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<MedicalHistoryEntry[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>('All');
  const [query, setQuery] = useState('');

  // Add Record Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MedicalHistoryType>('Consultation');
  const [doctor, setDoctor] = useState('');
  const [hospital, setHospital] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const userKey = user?.id || 'guest';
  const ADDED_KEY = `medichain_added_records_${userKey}`;
  const DELETED_KEY = `medichain_deleted_records_${userKey}`;

  const loadData = async () => {
    if (!user) return;
    try {
      const [baseRecords, p] = await Promise.all([
        getFullMedicalHistory(user.id),
        getPatientProfile(user.id),
      ]);

      const localAdded: MedicalHistoryEntry[] = JSON.parse(
        localStorage.getItem(ADDED_KEY) || '[]'
      );
      const localDeleted: string[] = JSON.parse(
        localStorage.getItem(DELETED_KEY) || '[]'
      );

      const combinedMap = new Map<string, MedicalHistoryEntry>();
      baseRecords.forEach((r) => combinedMap.set(r.id, r));
      localAdded.forEach((r) => combinedMap.set(r.id, r));

      const finalHistory = Array.from(combinedMap.values()).filter(
        (r) => !localDeleted.includes(r.id) && !localDeleted.includes(r.title)
      );

      setHistory(finalHistory);
      setProfile(p);
    } catch (err) {
      console.error('Error loading patient history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !doctor.trim() || !hospital.trim() || !summary.trim()) return;

    setSaving(true);
    const payload: NewMedicalRecordPayload = {
      title: title.trim(),
      type,
      doctor: doctor.trim(),
      hospital: hospital.trim(),
      date,
      summary: summary.trim(),
    };

    const newRecord: MedicalHistoryEntry = {
      id: `rec-${Date.now()}`,
      title: title.trim(),
      type,
      doctor: doctor.trim(),
      hospital: hospital.trim(),
      date,
      summary: summary.trim(),
    };

    // Try MongoDB saving
    const created = await createMedicalRecord(payload);
    const recordToSave = created || newRecord;

    // Save to local storage for permanent reload persistence
    try {
      const existingAdded: MedicalHistoryEntry[] = JSON.parse(
        localStorage.getItem(ADDED_KEY) || '[]'
      );
      localStorage.setItem(ADDED_KEY, JSON.stringify([recordToSave, ...existingAdded]));
    } catch {
      // ignore
    }

    setHistory((prev) => [recordToSave, ...prev]);
    setSaving(false);
    setShowAddModal(false);
    setTitle('');
    setDoctor('');
    setHospital('');
    setSummary('');

    showToast('🎉 Medical record saved!');
  };

  const handleDeleteRecord = async (id: string, recordTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${recordTitle}"?`)) return;

    // 1. Immediately remove from local state
    setHistory((prev) => prev.filter((r) => r.id !== id && r.title !== recordTitle));
    showToast(`🗑️ Record deleted.`);

    // 2. Add to local deleted storage for permanent persistence
    try {
      const existingDeleted: string[] = JSON.parse(
        localStorage.getItem(DELETED_KEY) || '[]'
      );
      if (!existingDeleted.includes(id)) existingDeleted.push(id);
      if (!existingDeleted.includes(recordTitle)) existingDeleted.push(recordTitle);
      localStorage.setItem(DELETED_KEY, JSON.stringify(existingDeleted));
    } catch {
      // ignore
    }

    // 3. Delete from MongoDB API
    await deleteMedicalRecordApi(id);
  };

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = {
      All: history.length,
      Consultation: 0,
      'Lab Report': 0,
      Prescription: 0,
      Procedure: 0,
    };
    history.forEach((h) => {
      if (base[h.type] !== undefined) base[h.type] += 1;
    });
    return base;
  }, [history]);

  const filtered = useMemo(() => {
    let results = filter === 'All' ? history : history.filter((h) => h.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.doctor.toLowerCase().includes(q) ||
          h.hospital.toLowerCase().includes(q)
      );
    }
    return results;
  }, [history, filter, query]);

  return (
    <div className="patient-history">
      {/* Header bar with Add Record Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Medical History & Records</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Persistent health record repository backed by MongoDB
          </p>
        </div>
        <button
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.1rem', fontSize: '0.88rem', fontWeight: 600 }}
          onClick={() => setShowAddModal(true)}
        >
          ＋ Add Medical Record
        </button>
      </div>

      {toastMessage && (
        <div
          style={{
            padding: '0.6rem 1rem',
            background: '#f0fdf4',
            color: '#16a34a',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.88rem',
            marginBottom: '1rem',
            border: '1px solid #bbf7d0',
          }}
        >
          {toastMessage}
        </div>
      )}

      {profile && (
        <AllergyBanner
          allergies={profile.allergies}
          medicalConditions={profile.medicalConditions}
          bloodGroup={profile.bloodGroup}
        />
      )}

      <div className="patient-history__controls">
        <FilterTabs
          options={[
            { label: 'All', value: 'All', count: counts.All },
            { label: 'Consultations', value: 'Consultation', count: counts.Consultation },
            { label: 'Lab Reports', value: 'Lab Report', count: counts['Lab Report'] },
            { label: 'Prescriptions', value: 'Prescription', count: counts.Prescription },
            { label: 'Procedures', value: 'Procedure', count: counts.Procedure },
          ]}
          active={filter}
          onChange={setFilter}
        />
        <SearchBar value={query} onChange={setQuery} placeholder="Search by title, doctor, or hospital..." />
      </div>

      {loading ? (
        <div className="patient-history__skeletons">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="patient-history__empty card-surface">
          <p>No records in this view.</p>
          <button className="btn btn-secondary" onClick={() => { setFilter('All'); setQuery(''); }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="patient-history__timeline">
          {filtered.map((entry, index) => (
            <div key={entry.id || `entry-${index}`} style={{ position: 'relative' }}>
              <MedicalTimelineItem entry={entry} isLast={index === filtered.length - 1} />
              <button
                title="Delete record"
                onClick={() => handleDeleteRecord(entry.id, entry.title)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  opacity: 0.6,
                  padding: '4px',
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Medical Record Modal */}
      {showAddModal && (
        <div
          className="hospital-modal-scrim"
          onClick={() => setShowAddModal(false)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="hospital-modal fade-in-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>＋ Add New Medical Record</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRecord} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Record Title:
                </label>
                <input
                  type="text"
                  className="med-form-input"
                  placeholder="e.g. Annual Blood Profile / Cardiac Consultation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Record Type:
                  </label>
                  <select
                    className="med-form-input"
                    value={type}
                    onChange={(e) => setType(e.target.value as MedicalHistoryType)}
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Procedure">Procedure</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Date:
                  </label>
                  <input
                    type="date"
                    className="med-form-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Attending Doctor:
                </label>
                <input
                  type="text"
                  className="med-form-input"
                  placeholder="e.g. Dr. Rhea Kapoor"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Hospital / Clinic Name:
                </label>
                <input
                  type="text"
                  className="med-form-input"
                  placeholder="e.g. Fortis Escorts / Apollo Hospital"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Summary / Notes:
                </label>
                <textarea
                  className="med-form-input"
                  rows={3}
                  placeholder="Summary of diagnosis, advice, or results..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, fontWeight: 700 }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : '💾 Save Medical Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}