const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('medichain_patient_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ReminderItem {
  id: string;
  patient_id?: string;
  medicine: string;
  time: string;
  done: boolean;
  createdAt?: string;
}

export async function fetchReminders(): Promise<ReminderItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reminders`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch reminders:', err);
    return [];
  }
}

export async function createReminder(medicine: string, time: string): Promise<ReminderItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reminders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ medicine, time }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to create reminder:', err);
    return null;
  }
}

export async function toggleReminderApi(reminderId: string): Promise<ReminderItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}/toggle`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to toggle reminder:', err);
    return null;
  }
}

export async function deleteReminderApi(reminderId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reminders/${reminderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete reminder:', err);
    return false;
  }
}
