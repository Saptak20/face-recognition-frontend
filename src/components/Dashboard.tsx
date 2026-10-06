import { useEffect, useState } from 'react';
import { HealthStatus } from './HealthStatus';
import { Camera } from './Camera';
import { api } from '../api/client';
import type { RegistrationResponse, AuthenticationResponse } from '../types/api';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'register' | 'authenticate'>('register');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regResult, setRegResult] = useState<RegistrationResponse | null>(null);
  const [authResult, setAuthResult] = useState<AuthenticationResponse | null>(null);

  useEffect(() => {
    if (!capturedBlob) return;
    const url = URL.createObjectURL(capturedBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [capturedBlob]);

  const handleCapture = (blob: Blob) => {
    setCapturedBlob(blob);
    setError(null);
    setRegResult(null);
    setAuthResult(null);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!capturedBlob) {
      setError('Please capture a face image first');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const userId = formData.get('userId') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (!userId.trim() || !name.trim()) {
      setError('User ID and Name are required');
      return;
    }

    const parsedQuality = Number.parseFloat(formData.get('minQualityScore') as string);
    const minQualityScore = Number.isFinite(parsedQuality)
      ? Math.min(1, Math.max(0, parsedQuality))
      : 0.7;

    setIsSubmitting(true);
    setError(null);
    setRegResult(null);

    try {
      const response = await api.registerFrame(
        userId.trim(),
        name.trim(),
        capturedBlob,
        email || undefined,
        phone || undefined,
        minQualityScore
      );
      setRegResult(response);
      if (response.success) {
        setCapturedBlob(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!capturedBlob) {
      setError('Please capture a face image first');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setAuthResult(null);

    try {
      const response = await api.authenticateFrame(capturedBlob);
      setAuthResult(response);
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
    setRegResult(null);
    setAuthResult(null);
  };

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <div className="logo-text">
              <h1>Face Recognition with Anti-Spoofing</h1>
              <p className="subtitle">Portfolio Demonstration</p>
            </div>
          </div>
          <div className="header-actions">
            <a
              href="https://github.com/Saptak20/Face-Recognition-with-Anti-Spoofing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              aria-label="View source on GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Source Code
            </a>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <aside className="sidebar">
          <HealthStatus />
          <div className="system-status" role="region" aria-label="System status">
            <h3>System Status</h3>
            <div className="system-status-grid">
              <div className="system-status-item">
                <span className="system-status-icon available" aria-hidden="true"></span>
                <span className="system-status-label">Face Recognition</span>
                <span className="system-status-badge available">Available</span>
              </div>
              <div className="system-status-item">
                <span className="system-status-icon experimental" aria-hidden="true"></span>
                <span className="system-status-label">Liveness Detection</span>
                <span className="system-status-badge experimental">Experimental</span>
              </div>
              <div className="system-status-item">
                <span className="system-status-icon unavailable" aria-hidden="true"></span>
                <span className="system-status-label">Deepfake Detection</span>
                <span className="system-status-badge unavailable">Not Validated</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="main-content">
          {/* Tab Navigation */}
          <div className="tab-navigation" role="tablist" aria-label="Workflow selection">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'register'}
              aria-controls="register-panel"
              className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('register');
                setCapturedBlob(null);
                setError(null);
                setRegResult(null);
                setAuthResult(null);
              }}
              disabled={isSubmitting}
            >
              Register
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'authenticate'}
              aria-controls="authenticate-panel"
              className={`tab-button ${activeTab === 'authenticate' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('authenticate');
                setCapturedBlob(null);
                setError(null);
                setRegResult(null);
                setAuthResult(null);
              }}
              disabled={isSubmitting}
            >
              Authenticate
            </button>
          </div>

          {activeTab === 'register' && (
            <section id="register-panel" className="card registration-section" aria-labelledby="registration-heading" role="tabpanel">
              <h2 id="registration-heading">Register New User</h2>
              <p className="section-intro">
                Enter user details, capture a face image, and register the user.
              </p>
              <ol className="workflow-steps" aria-label="Registration steps">
                <li>Enter user information</li>
                <li>Position face</li>
                <li>Capture</li>
                <li>Register</li>
              </ol>
              <form onSubmit={handleRegister} className="registration-form">
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="userId">User ID <span className="required">*</span></label>
                    <input
                      type="text"
                      id="userId"
                      name="userId"
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
                      name="name"
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
                      name="email"
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
                      name="phone"
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
                      name="minQualityScore"
                      defaultValue="0.7"
                      min="0"
                      max="1"
                      step="0.05"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Camera onCapture={handleCapture} disabled={isSubmitting} />

                {capturedBlob && previewUrl && (
                  <div className="captured-preview">
                    <p>Captured frame ready for submission</p>
                    <img
                      src={previewUrl}
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
                        Registering...
                      </>
                    ) : (
                      'Register User'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedBlob(null);
                      setError(null);
                      setRegResult(null);
                    }}
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

                {regResult && (
                  <div className={`form-result ${regResult.success ? 'success' : 'error'}`} role="status">
                    <h3>{regResult.success ? 'Registration Successful' : 'Registration Failed'}</h3>
                    <p>{regResult.message}</p>
                    {regResult.success && (
                      <dl className="result-details">
                        <dt>User ID</dt>
                        <dd>{regResult.user_id}</dd>
                        {regResult.embedding_id && (
                          <>
                            <dt>Embedding ID</dt>
                            <dd>{regResult.embedding_id}</dd>
                          </>
                        )}
                        {typeof regResult.quality_score === 'number' && (
                          <>
                            <dt>Quality Score</dt>
                            <dd>{regResult.quality_score.toFixed(3)}</dd>
                          </>
                        )}
                        {typeof regResult.total_faces_captured === 'number' && (
                          <>
                            <dt>Faces Captured</dt>
                            <dd>{regResult.total_faces_captured}</dd>
                          </>
                        )}
                        {typeof regResult.valid_faces_processed === 'number' && (
                          <>
                            <dt>Valid Faces Processed</dt>
                            <dd>{regResult.valid_faces_processed}</dd>
                          </>
                        )}
                      </dl>
                    )}
                  </div>
                )}
              </form>
            </section>
          )}

          {activeTab === 'authenticate' && (
            <section id="authenticate-panel" className="card authentication-section" aria-labelledby="auth-heading" role="tabpanel">
              <h2 id="auth-heading">Face Authentication</h2>
              <p className="section-intro">
                Capture a face image to authenticate against registered users.
              </p>
              <form onSubmit={handleAuthenticate} className="authentication-form">
                <Camera onCapture={handleCapture} disabled={isSubmitting} />

                {capturedBlob && previewUrl && (
                  <div className="captured-preview">
                    <p>Captured frame ready for authentication</p>
                    <img
                      src={previewUrl}
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

                {authResult && (
                  <div className={`form-result ${authResult.success ? 'success' : 'error'}`} role="status">
                    <h3>{authResult.success ? 'Authentication Successful' : 'Authentication Failed'}</h3>
                    <p>{authResult.message}</p>
                    {authResult.success && (
                      <dl className="result-details">
                        <dt>User</dt>
                        <dd>{authResult.name}</dd>
                        <dt>User ID</dt>
                        <dd>{authResult.user_id}</dd>
                        {typeof authResult.face_similarity === 'number' && (
                          <>
                            <dt>Face Match</dt>
                            <dd>{(authResult.face_similarity * 100).toFixed(1)}%</dd>
                          </>
                        )}
                        <dt>Confidence</dt>
                        <dd>{(authResult.confidence * 100).toFixed(1)}%</dd>
                        {typeof authResult.processing_time === 'number' && (
                          <>
                            <dt>Processing Time</dt>
                            <dd>{authResult.processing_time.toFixed(2)}s</dd>
                          </>
                        )}
                        <div className="detection-disclaimer">
                          <dt>Anti-Spoofing Scores</dt>
                          <dd>
                            <div className="scores-grid">
                              {typeof authResult.liveness_score === 'number' && (
                                <div className="score-item">
                                  <span className="score-label">Liveness</span>
                                  <span className="score-value">
                                    {(authResult.liveness_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              {typeof authResult.deepfake_score === 'number' && (
                                <div className="score-item">
                                  <span className="score-label">Deepfake</span>
                                  <span className="score-value">
                                    {(authResult.deepfake_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="disclaimer-text">
                              ⚠ <strong>Note:</strong> Liveness and deepfake detection are experimental.
                              These scores do not reliably verify whether a face is live or spoofed.
                            </p>
                          </dd>
                        </div>
                      </dl>
                    )}
                    {!authResult.success && typeof authResult.face_similarity === 'number' && (
                      <dl className="result-details">
                        <dt>Face Match</dt>
                        <dd>{(authResult.face_similarity * 100).toFixed(1)}%</dd>
                      </dl>
                    )}
                  </div>
                )}
              </form>
            </section>
          )}
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>
          <strong>Face Recognition with Anti-Spoofing</strong> — Portfolio Demo
        </p>
        <p className="disclaimer">
          ⚠ This is a portfolio demonstration. Liveness and deepfake detection are experimental.
          Do not use for production security applications.
        </p>
      </footer>
    </main>
  );
}