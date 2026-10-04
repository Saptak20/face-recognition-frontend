import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { HealthResponse } from '../types/api';

export function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Health check failed';
      setError(message);
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const componentLabels: Record<string, string> = {
    face_capture: 'Face Capture',
    embedding_extractor: 'Embedding Extractor',
    database_manager: 'Database Manager',
    auth_engine: 'Authentication Engine',
    liveness_detector: 'Liveness Detector',
    deepfake_detector: 'Deepfake Detector',
  };

  const isCoreComponent = (key: string) => [
    'face_capture',
    'embedding_extractor',
    'database_manager',
    'auth_engine',
  ].includes(key);

  if (isLoading && !health) {
    return (
      <div className="card health-status loading">
        <h2>System Health</h2>
        <div className="loading-spinner" aria-label="Loading health status"></div>
        <p>Checking backend connectivity...</p>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="card health-status error">
        <h2>System Health</h2>
        <div className="health-error" role="alert">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>Failed to connect to backend</p>
          <button onClick={fetchHealth} className="btn btn-secondary">Retry</button>
        </div>
      </div>
    );
  }

  const overallHealthy = health?.status === 'healthy';
  const disabledCount = health
    ? Object.entries(health.components).filter(([k, v]) => !v && !isCoreComponent(k)).length
    : 0;

  return (
    <section className={`card health-status ${overallHealthy ? 'healthy' : 'unhealthy'}`} aria-labelledby="health-heading">
      <header className="health-header">
        <h2 id="health-heading">System Health</h2>
        <div className={`health-indicator ${overallHealthy ? 'healthy' : 'unhealthy'}`} aria-live="polite">
          <span className="indicator-dot" aria-hidden="true"></span>
          <span>{overallHealthy ? 'Healthy' : 'Unhealthy'}</span>
          <button onClick={fetchHealth} className="btn btn-ghost btn-sm" aria-label="Refresh health status">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
      </header>

      <div className="components-grid">
        {health && Object.entries(health.components).map(([key, value]) => (
          <div key={key} className={`component-item ${value ? 'healthy' : 'unhealthy'} ${isCoreComponent(key) ? 'core' : 'optional'}`}>
            <div className="component-info">
              <span className={`component-status ${value ? 'healthy' : 'unhealthy'}`} aria-hidden="true"></span>
              <span className="component-name">{componentLabels[key] || key}</span>
              {!isCoreComponent(key) && (
                <span className="component-badge optional">Optional</span>
              )}
            </div>
            <span className={`component-value ${value ? 'healthy' : 'unhealthy'}`}>
              {value ? '✓' : '✗'}
            </span>
          </div>
        ))}
      </div>

      {disabledCount > 0 && (
        <div className="health-warning" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div className="warning-content">
            <strong>Liveness and deepfake detection are currently disabled.</strong>
            <p>This demo does not verify whether a face is live or spoofed. These models are disabled for memory optimization on the free hosting tier.</p>
          </div>
        </div>
      )}

      <footer className="health-footer">
        <small>Last checked: {health ? new Date(health.timestamp).toLocaleString() : '—'}</small>
      </footer>
    </section>
  );
}