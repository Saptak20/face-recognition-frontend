import { useState, useCallback } from 'react';
import { Camera } from './Camera';
import { api } from '../api/client';
import type { AuthenticationResponse } from '../types/api';

interface AuthenticationProps {
  onSuccess?: (response: AuthenticationResponse) => void;
}

export function Authentication({ onSuccess }: AuthenticationProps) {
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuthenticationResponse | null>(null);

  const handleCapture = useCallback((blob: Blob) => {
    setCapturedBlob(blob);
    setError(null);
    setResult(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedBlob) {
      setError('Please capture a face image first');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.authenticateFrame(capturedBlob);
      setResult(response);
      if (response.success && onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCapturedBlob(null);
    setError(null);
    setResult(null);
  };

  return (
    <section className="card authentication-section" aria-labelledby="auth-heading">
      <h2 id="auth-heading">Face Authentication</h2>
      <form onSubmit={handleSubmit} className="authentication-form">
        <Camera onCapture={handleCapture} disabled={isSubmitting} />

        {capturedBlob && (
          <div className="captured-preview">
            <p>Captured frame ready for authentication</p>
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
            disabled={isSubmitting || !capturedBlob}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Authenticating...
              </>
            ) : (
              'Authenticate'
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
            <h3>{result.success ? 'Authentication Successful' : 'Authentication Failed'}</h3>
            <p>{result.message}</p>
            {result.success && (
              <dl className="result-details">
                <dt>Name</dt>
                <dd>{result.name}</dd>
                <dt>User ID</dt>
                <dd>{result.user_id}</dd>
                <dt>Confidence</dt>
                <dd>{(result.confidence * 100).toFixed(1)}%</dd>
                {result.face_similarity && (
                  <>
                    <dt>Face Similarity</dt>
                    <dd>{(result.face_similarity * 100).toFixed(1)}%</dd>
                  </>
                )}
                {result.processing_time && (
                  <>
                    <dt>Processing Time</dt>
                    <dd>{result.processing_time.toFixed(2)}s</dd>
                  </>
                )}
                {/* Display liveness/deepfake scores with clear disclaimer */}
                {(result.liveness_score !== undefined || result.deepfake_score !== undefined) && (
                  <div className="detection-disclaimer">
                    <dt>Anti-Spoofing Scores</dt>
                    <dd>
                      <div className="scores-grid">
                        {result.liveness_score !== undefined && (
                          <div className="score-item">
                            <span className="score-label">Liveness</span>
                            <span className="score-value">
                              {(result.liveness_score * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {result.deepfake_score !== undefined && (
                          <div className="score-item">
                            <span className="score-label">Deepfake</span>
                            <span className="score-value">
                              {(result.deepfake_score * 100).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="disclaimer-text">
                        ⚠ <strong>Note:</strong> Liveness and deepfake detection are currently disabled.
                        These scores reflect random model initialization and do not verify
                        whether a face is live or spoofed.
                      </p>
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {!result.success && result.face_similarity && (
              <dl className="result-details">
                <dt>Face Similarity</dt>
                <dd>{(result.face_similarity * 100).toFixed(1)}%</dd>
              </dl>
            )}
          </div>
        )}
      </form>
    </section>
  );
}