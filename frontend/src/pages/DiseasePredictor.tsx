import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSymptoms, predictDisease, type DiseasePredictResponse } from '../services/diseaseApi';
import './DiseasePredictor.css';

const POPULAR_SYMPTOMS = [
  'fever',
  'cough',
  'headache',
  'shortness of breath',
  'chest pain',
  'fatigue',
  'sore throat',
  'dizziness',
  'nausea',
  'vomiting',
  'sharp abdominal pain',
  'joint pain',
];

export default function DiseasePredictor() {
  const navigate = useNavigate();
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [naturalText, setNaturalText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [filteredSymptoms, setFilteredSymptoms] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiseasePredictResponse | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSymptoms()
      .then((data) => {
        setAllSymptoms(data);
      })
      .catch((err) => {
        console.error('Failed to load symptoms:', err);
      });
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSymptoms([]);
      return;
    }
    const query = searchTerm.toLowerCase().trim();
    const matches = allSymptoms.filter(
      (s) => s.toLowerCase().includes(query) && !selectedSymptoms.includes(s)
    );
    setFilteredSymptoms(matches.slice(0, 15));
  }, [searchTerm, allSymptoms, selectedSymptoms]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addSymptom = (symptom: string) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms((prev) => [...prev, symptom]);
    }
    setSearchTerm('');
    setShowDropdown(false);
    setError(null);
  };

  const removeSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s !== symptom));
  };

  const clearAll = () => {
    setSelectedSymptoms([]);
    setNaturalText('');
    setResult(null);
    setError(null);
  };

  const handleExtractFromText = async () => {
    if (!naturalText.trim()) return;
    setExtracting(true);
    setError(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE_URL}/api/extract-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: naturalText }),
      });

      if (!res.ok) throw new Error('Failed to extract symptoms');
      const data = await res.json();

      if (data.extracted_symptoms && data.extracted_symptoms.length > 0) {
        const newSymptoms = data.extracted_symptoms.filter(
          (s: string) => !selectedSymptoms.includes(s)
        );
        setSelectedSymptoms((prev) => [...prev, ...newSymptoms]);
      } else {
        setError('No matching symptoms detected in your text. Try selecting from the common list below.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to extract symptoms from text');
    } finally {
      setExtracting(false);
    }
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom to analyze.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await predictDisease(selectedSymptoms, 5);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing symptoms.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookForDisease = (diseaseName: string) => {
    navigate('/book-appointment', { state: { initialReason: `AI Symptom Check Diagnosis: ${diseaseName}` } });
  };

  return (
    <div className="disease-predictor">
      <header className="disease-predictor__header">
        <div className="disease-predictor__title-group">
          <h1 className="disease-predictor__title">AI Disease Predictor</h1>
          <span className="disease-predictor__ai-badge">Multilingual AI Powered</span>
        </div>
        <p className="disease-predictor__subtitle">
          Describe your symptoms in free text (English, Hindi, Spanish, etc.) or choose from 377 supported medical symptoms.
        </p>
      </header>

      <div className="disease-predictor__grid">
        {/* Left Column: Multilingual Input + Symptom Selector */}
        <div className="disease-card">
          <div className="disease-card__title">
            <span>Symptom Selection</span>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>
              {selectedSymptoms.length} Selected
            </span>
          </div>

          {/* Multilingual Free Text Input Box */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.4rem' }}>
              💬 Describe in your own words / language:
            </label>
            <textarea
              className="symptom-input"
              style={{ paddingLeft: '1rem', minHeight: '75px', resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="e.g. mujhe 2 din se severe bukhar aur khansi hai / tengo fiebre y dolor de cabeza..."
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
            />
            <button
              type="button"
              className="quick-chip"
              style={{
                marginTop: '0.5rem',
                width: '100%',
                background: '#4f46e5',
                color: 'white',
                borderColor: '#4f46e5',
                fontWeight: 600,
                padding: '0.5rem',
                borderRadius: '8px',
              }}
              onClick={handleExtractFromText}
              disabled={extracting || !naturalText.trim()}
            >
              {extracting ? '✨ Extracting Symptoms...' : '✨ Auto-Extract Symptoms from Text'}
            </button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.25rem 0' }} />

          {/* Direct Search Bar */}
          <div className="symptom-input-wrapper" ref={dropdownRef}>
            <span className="symptom-input-icon">🔍</span>
            <input
              type="text"
              className="symptom-input"
              placeholder="Search symptom (e.g., headache, fever, cough)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />

            {showDropdown && filteredSymptoms.length > 0 && (
              <div className="symptom-dropdown">
                {filteredSymptoms.map((symptom) => (
                  <div
                    key={symptom}
                    className="symptom-dropdown-item"
                    onClick={() => addSymptom(symptom)}
                  >
                    {symptom}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Symptoms */}
          <div className="quick-suggestions">
            <div className="quick-suggestions__title">Common Symptoms</div>
            <div className="chips-container">
              {POPULAR_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    className="quick-chip"
                    onClick={() => (isSelected ? removeSymptom(sym) : addSymptom(sym))}
                    style={{
                      backgroundColor: isSelected ? '#6366f1' : undefined,
                      color: isSelected ? '#ffffff' : undefined,
                      borderColor: isSelected ? '#6366f1' : undefined,
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Symptoms List */}
          {selectedSymptoms.length > 0 && (
            <div className="selected-symptoms">
              <div className="selected-symptoms__header">
                <span>Selected ({selectedSymptoms.length})</span>
                <button type="button" className="clear-btn" onClick={clearAll}>
                  Clear All
                </button>
              </div>
              <div className="chips-container">
                {selectedSymptoms.map((sym) => (
                  <span key={sym} className="chip">
                    {sym}
                    <button
                      type="button"
                      className="chip__remove"
                      onClick={() => removeSymptom(sym)}
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                color: '#ef4444',
                background: '#fef2f2',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="button"
            className="analyze-btn"
            onClick={handlePredict}
            disabled={loading || selectedSymptoms.length === 0}
          >
            {loading ? (
              <>⏳ Analyzing Symptoms with ML...</>
            ) : (
              <>⚡ Analyze Symptoms ({selectedSymptoms.length})</>
            )}
          </button>
        </div>

        {/* Right Column: AI Diagnosis Results */}
        <div className="disease-card">
          <div className="disease-card__title">
            <span>Diagnostic Report</span>
            {result && (
              <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>
                {result.model_name}
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="results-empty">
              <div className="results-empty-icon">🩺</div>
              <p style={{ fontWeight: 600, color: '#475569' }}>No Analysis Performed Yet</p>
              <p style={{ fontSize: '0.85rem' }}>
                Type your symptoms in any language or select them from the list, then click <strong>Analyze Symptoms</strong>.
              </p>
            </div>
          )}

          {loading && (
            <div className="results-empty">
              <div className="results-empty-icon">🧠</div>
              <p style={{ fontWeight: 600, color: '#6366f1' }}>Running Machine Learning Model...</p>
              <p style={{ fontSize: '0.85rem' }}>Evaluating 377 symptom correlations across 773 disease profiles.</p>
            </div>
          )}

          {result && !loading && (
            <div className="predictions-list">
              {result.predictions.map((pred, index) => {
                const isPrimary = index === 0;
                let badgeClass = 'prediction-card__badge--low';
                if (pred.confidence >= 50) badgeClass = 'prediction-card__badge--high';
                else if (pred.confidence >= 20) badgeClass = 'prediction-card__badge--med';

                return (
                  <div
                    key={pred.disease}
                    className={`prediction-card ${isPrimary ? 'prediction-card--primary' : ''}`}
                  >
                    <div className="prediction-card__header">
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', display: 'block' }}>
                          {isPrimary ? 'MOST LIKELY CONDITION' : `OPTION #${pred.rank}`}
                        </span>
                        <span className="prediction-card__name">{pred.disease}</span>
                      </div>
                      <span className={`prediction-card__badge ${badgeClass}`}>
                        {pred.confidence}% match
                      </span>
                    </div>

                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.max(pred.confidence, 3)}%` }}
                      />
                    </div>

                    {isPrimary && (
                      <div className="actions-row">
                        <button
                          type="button"
                          className="action-btn-primary"
                          onClick={() => handleBookForDisease(pred.disease)}
                        >
                          Book Appointment for {pred.disease}
                        </button>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={() => navigate('/transfer')}
                        >
                          Emergency Transfer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="disclaimer-banner">
                <span>⚠️</span>
                <div>
                  <strong>Medical Disclaimer:</strong> This prediction is generated using automated statistical pattern matching. It is not a clinical medical diagnosis. If you are experiencing severe or life-threatening symptoms, please seek emergency medical services immediately.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
