import { useState, useEffect } from 'react';
import {
  fetchReminders,
  createReminder,
  toggleReminderApi,
  deleteReminderApi,
  type ReminderItem,
} from '../services/reminderApi';
import './MedicationReminders.css';

const LOCAL_STORAGE_KEY = 'medichain_medication_reminders_fallback';

export default function MedicationReminders() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedicine, setNewMedicine] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [newDate, setNewDate] = useState(todayStr);
  const [newTime, setNewTime] = useState('09:00');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const items = await fetchReminders();
      if (items && items.length > 0) {
        setReminders(items);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback to localStorage
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setReminders(JSON.parse(saved));
      } else {
        const defaultReminders: ReminderItem[] = [
          { id: 'r1', medicine: 'Cetirizine 10mg', date: todayStr, time: '21:00', done: false },
          { id: 'r2', medicine: 'Multivitamin 1 tab', date: todayStr, time: '08:00', done: true },
          { id: 'r3', medicine: 'Fluticasone Spray', date: todayStr, time: '21:30', done: false },
        ];
        setReminders(defaultReminders);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveFallbackLocally = (items: ReminderItem[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr) return '';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    const [h, m] = timeStr.split(':');
    const hourNum = parseInt(h, 10);
    if (isNaN(hourNum)) return timeStr;
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const formattedHour = hourNum % 12 || 12;
    return `${formattedHour}:${m || '00'} ${ampm}`;
  };

  const toggle = async (id: string) => {
    // Try MongoDB update
    const updated = await toggleReminderApi(id);
    if (updated) {
      if (updated.done) showToast(`✅ ${updated.medicine} marked as taken!`);
      loadData();
      return;
    }

    // Local state fallback
    setReminders((prev) => {
      const next = prev.map((r) => {
        if (r.id === id) {
          const done = !r.done;
          if (done) showToast(`✅ ${r.medicine} marked as taken!`);
          return { ...r, done };
        }
        return r;
      });
      saveFallbackLocally(next);
      return [...next].sort((a, b) => Number(a.done) - Number(b.done));
    });
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedicine.trim()) return;

    const formattedTime = formatDisplayTime(newTime);
    const created = await createReminder(newMedicine.trim(), newDate, formattedTime);
    
    if (created) {
      setNewMedicine('');
      setShowAddForm(false);
      showToast(`💊 Saved ${created.medicine} to MongoDB!`);
      loadData();
      return;
    }

    // Fallback local creation if guest/not logged in
    const newItem: ReminderItem = {
      id: `local-${Date.now()}`,
      medicine: newMedicine.trim(),
      date: newDate,
      time: formattedTime,
      done: false,
    };

    setReminders((prev) => {
      const updated = [newItem, ...prev];
      saveFallbackLocally(updated);
      return updated;
    });

    setNewMedicine('');
    setShowAddForm(false);
    showToast(`💊 Added ${newItem.medicine} reminder!`);
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await deleteReminderApi(id);
    if (ok) {
      showToast(`🗑️ Removed ${name}`);
      loadData();
      return;
    }

    // Local fallback delete
    setReminders((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveFallbackLocally(updated);
      return updated;
    });
    showToast(`🗑️ Removed ${name}`);
  };

  const remaining = reminders.filter((r) => !r.done).length;

  return (
    <div className="med-reminders card-surface">
      <div className="med-reminders__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h4>Today's Medication</h4>
          <span className="med-reminders__count mono">{remaining} left</span>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? '✕ Close' : '＋ Add Medicine'}
        </button>
      </div>

      {toastMessage && (
        <div
          style={{
            fontSize: '0.78rem',
            padding: '0.45rem 0.7rem',
            borderRadius: '6px',
            background: '#f0fdf4',
            color: '#16a34a',
            fontWeight: 600,
            border: '1px solid #bbf7d0',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Add New Medicine Form with Date & Time Pickers */}
      {showAddForm && (
        <form onSubmit={handleAddMedicine} className="med-reminders__add-form">
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Medicine Name & Dosage:</label>
          <input
            type="text"
            className="med-form-input"
            placeholder="e.g. Paracetamol 500mg"
            value={newMedicine}
            onChange={(e) => setNewMedicine(e.target.value)}
            required
            autoFocus
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.2rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                📅 Date:
              </label>
              <input
                type="date"
                className="med-form-input"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '2px' }}>
                ⏰ Time:
              </label>
              <input
                type="time"
                className="med-form-input"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.82rem', fontWeight: 600 }}
          >
            💾 Save Medication Reminder
          </button>
        </form>
      )}

      {/* Reminders List */}
      <div className="med-reminders__list">
        {loading ? (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Loading medication reminders...</p>
        ) : reminders.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', margin: '0.5rem 0' }}>
            No medication reminders set. Click <strong>＋ Add Medicine</strong> to create your first reminder!
          </p>
        ) : (
          reminders.map((r) => (
            <div
              key={r.id}
              className={`med-reminders__item ${r.done ? 'med-reminders__item--done' : ''}`}
              onClick={() => toggle(r.id)}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <span className="med-reminders__checkbox">
                {r.done && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </span>

              <span className="med-reminders__text">
                <span className="med-reminders__name">{r.medicine}</span>
                <span className="med-reminders__time mono">
                  📅 {r.date || todayStr} &nbsp;•&nbsp; ⏰ {formatDisplayTime(r.time)}
                </span>
              </span>

              <button
                type="button"
                className="med-delete-btn"
                title="Delete reminder"
                onClick={(e) => handleDelete(r.id, r.medicine, e)}
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}