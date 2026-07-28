import type { MedicalHistoryEntry } from './patient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getAuthHeaders(): HeadersInit {
  const token =
    localStorage.getItem('medichain_token') ||
    localStorage.getItem('medichain_patient_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface NewMedicalRecordPayload {
  title: string;
  type: 'Consultation' | 'Lab Report' | 'Prescription' | 'Procedure';
  doctor: string;
  hospital: string;
  date: string;
  summary: string;
  labValues?: Array<{ parameter: string; value: string; referenceRange: string; flag: 'normal' | 'high' | 'low' }>;
  prescriptionItems?: Array<{ medicine: string; dosage: string; duration: string }>;
}

export async function fetchMedicalRecords(): Promise<MedicalHistoryEntry[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/medical-records`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch medical records:', err);
    return [];
  }
}

export async function createMedicalRecord(payload: NewMedicalRecordPayload): Promise<MedicalHistoryEntry | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/medical-records`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error('Server error creating record:', errBody);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to create medical record:', err);
    return null;
  }
}

export async function deleteMedicalRecordApi(recordId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/medical-records/${recordId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete medical record:', err);
    return false;
  }
}
