import { useState, useEffect } from 'react';
import {
  fetchReminders,
  createReminder,
  toggleReminderApi,
  deleteReminderApi,
  type ReminderItem,
} from '../services/reminderApi';
import './MedicationReminders.css';

export default function MedicationReminders() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMedicine, setNewMedicine] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    fetchReminders().then((items) => {
      setReminders(items);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggle = async (id: string) => {
    const updated = await toggleReminderApi(id);
    if (updated) {
      if (updated.done) {
        showToast(`✅ ${updated.medicine} marked as taken!`);
      }
      loadData();
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedicine.trim()) return;

    const created = await createReminder(newMedicine.trim(), newTime.trim() || '10:00 AM');
    if (created) {
      setNewMedicine('');
      setShowAddForm(false);
      showToast(`💊 Added ${created.medicine} to MongoDB!`);
      loadData();
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await deleteReminderApi(id);
    if (ok) {
      showToast(`🗑️ Removed ${name}`);
      loadData();
    }
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
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 600 }}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? 'Close' : '＋ Add Medicine'}
        </button>
      </div>

      {toastMessage && (
        <div
          style={{
            fontSize: '0.78rem',
            padding: '0.4rem 0.6rem',
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

      {/* Add New Medicine Form */}
      {showAddForm && (
        <form onSubmit={handleAddMedicine} className="med-reminders__add-form">
          <input
            type="text"
            className="med-form-input"
            placeholder="Medicine name & dose (e.g. Paracetamol 500mg)"
            value={newMedicine}
            onChange={(e) => setNewMedicine(e.target.value)}
            required
            autoFocus
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="med-form-input"
              placeholder="Time (e.g. 08:00 AM)"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              Save to DB
            </button>
          </div>
        </form>
      )}

      {/* Reminders List */}
      <div className="med-reminders__list">
        {loading ? (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Loading reminders from MongoDB...</p>
        ) : reminders.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', margin: '0.5rem 0' }}>
            No medication reminders set. Click <strong>＋ Add Medicine</strong> to save one!
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
                <span className="med-reminders__time mono">⏰ {r.time}</span>
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