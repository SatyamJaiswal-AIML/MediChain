import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHospitals } from '../services/api.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export default function HospitalLogin() {
  const [hospitals, setHospitals] = useState([]); const [hospitalId, setHospitalId] = useState('');
  const [password, setPassword] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate();
  useEffect(() => { getHospitals().then(items => { setHospitals(items); setHospitalId(items[0]?.id || ''); }).catch(e => setError(e.message)); }, []);
  async function submit(e) { e.preventDefault(); setError(''); try {
    const response = await fetch(`${API}/auth/hospital/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hospital_id: hospitalId, password }) });
    const body = await response.json(); if (!response.ok) throw new Error(body.detail || 'Unable to sign in.');
    localStorage.setItem('medichain_hospital_token', body.token); localStorage.setItem('medichain_hospital', JSON.stringify(body.hospital)); navigate('/admin');
  } catch (err) { setError(err.message); } }
  return <div className="login"><div className="login__panel glass-panel fade-in-up"><div className="login__brand" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}><img src="/logo.png" alt="MediChain Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain', background: '#ffffff', borderRadius: '10px', padding: '4px 10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} /><div><h1 className="login__brand-name" style={{ margin: 0, fontSize: '1.5rem' }}>MediChain</h1><p className="login__brand-tag mono" style={{ margin: 0 }}>HOSPITAL PORTAL</p></div></div><h2 className="login__heading">Hospital sign in</h2><p className="login__subheading">Manage only your hospital’s beds and incoming transfers.</p><form className="login__form" onSubmit={submit}><label className="login__field"><span className="login__label">Hospital</span><select value={hospitalId} onChange={e => setHospitalId(e.target.value)} required>{hospitals.map(h => <option key={h.id} value={h.id}>{h.name} — {h.city}</option>)}</select></label><label className="login__field"><span className="login__label">Password</span><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{error && <div className="login__error">{error}</div>}<button className="btn btn-primary login__submit">Sign in to hospital portal</button><p className="login__hint">Demo password after seeding: <strong>Hospital@123</strong></p></form></div></div>;

}
