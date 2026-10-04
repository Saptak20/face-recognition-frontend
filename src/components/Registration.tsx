import { useState, useCallback } from 'react';
import { Camera } from './Camera';
import { api } from '../api/client';
import type { RegistrationResponse } from '../types/api';

interface RegistrationProps {
  onSuccess?: (response: RegistrationResponse) => void;
}

export function Registration({ onSuccess }: RegistrationProps) {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [minQualityScore, setMinQualityScore] = useState(0.7);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationResponse | null>(null);

  const handleCapture = useCallback((blob: Blob) => {
    setCapturedBlob(blob);
    setError(null);
    setResult(null);
  }, []);

  const validateForm = (): boolean => {
    if (!userId.trim()) {
      setError('User ID is required');
      return false;
    }
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!capturedBlob) {
      setError('Please capture a face image first');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.registerFrame(
        userId.trim(),
        name.trim(),
        capturedBlob!,
        email.trim() || undefined,
        phone.trim() || undefined,
        minQualityScore
      );
      setResult(response);
      if (response.success && onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setUserId('');
    setName('');
    setEmail('');
    setPhone('');
    setMinQualityScore(0.7);
    setCapturedBlob(null);
    setError(null);
    setResult(null);
  };

  return (
    <section className="card registration-section" aria-labelledby="registration-heading">
      <h2 id="registration-heading">Register New User</h2>
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="userId">User ID <span className="required">*</span></label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="e.g., john_doe_001"
              required
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>
          <div className="form-field">
            <label htmlFor="name">Name <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., John Doe"
              required
              disabled={isSubmitting}
              autoComplete="name"
            />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email (optional)</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="john@example.com"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone (optional)</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
              autoComplete="tel"
            />
          </div>
          <div className="form-field">
            <label htmlFor="minQualityScore">Min Quality Score</label>
            <input
              type="number"
              id="minQualityScore"
              value={minQualityScore}
              onChange={e => setMinQualityScore(parseFloat(e.target.value) || 0)}
              min="0"
              max="1"
              step="0.05"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <Camera onCapture={handleCapture} disabled={isSubmitting} />

        {capturedBlob && (
          <div className="captured-preview">
            <p>Captured frame ready for submission</p>
            <img
              src={URL.createObjectURL(capturedBlob)}
              alt="Captured face preview"
              className="preview-image"
            />
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Registering...
              </>
            ) : (
              'Register User'
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Reset
          </button>
        </div>

        {error && (
          <div className="form-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {result && (
          <div className={`form-result ${result.success ? 'success' : 'error'}`} role="status">
            <h3>{result.success ? 'Registration Successful' : 'Registration Failed'}</h3>
            <p>{result.message}</p>
            {result.success && (
              <dl className="result-details">
                <dt>User ID</dt>
                <dd>{result.user_id}</dd>
                {result.embedding_id && (
                  <>
                    <dt>Embedding ID</dt>
                    <dd>{result.embedding_id}</dd>
                  </>
                )}
                {result.quality_score && (
                  <>
                    <dt>Quality Score</dt>
                    <dd>{result.quality_score.toFixed(3)}</dd>
                  </>
                )}
                {result.total_faces_captured && (
                  <>
                    <dt>Faces Captured</dt>
                    <dd>{result.total_faces_captured}</dd>
                  </>
                )}
                {result.valid_faces_processed && (
                  <>
                    <dt>Valid Faces Processed</dt>
                    <dd>{result.valid_faces_processed}</dd>
                  </>
                )}
              </dl>
            )}
          </div>
        )}
      </form>
    </section>
  );
}