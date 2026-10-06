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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const isExperimentalComponent = (key: string) => [
    'liveness_detector',
    'deepfake_detector',
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

  const components = health?.components;
  if (!health || !components) {
    return null;
  }

  const coreComponentsHealthy = Object.entries(components)
    .filter(([k]) => isCoreComponent(k))
    .every(([, v]) => v);

  return (
    <section className={`card health-status ${coreComponentsHealthy ? 'healthy' : 'unhealthy'}`} aria-labelledby="health-heading">
      <header className="health-header">
        <h2 id="health-heading">System Health</h2>
        <div className={`health-indicator ${coreComponentsHealthy ? 'healthy' : 'unhealthy'}`} aria-live="polite">
          <span className="indicator-dot" aria-hidden="true"></span>
          <span>{coreComponentsHealthy ? 'Face Recognition: Available' : 'Face Recognition: Unavailable'}</span>
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
        {Object.entries(components).map(([key, value]) => {
          const isCore = isCoreComponent(key);
          const isExperimental = isExperimentalComponent(key);
          let badge = null;
          let statusText = value ? 'Available' : 'Unavailable';

          if (isExperimental && value) {
            badge = <span className="component-badge experimental">Experimental</span>;
            statusText = 'Experimental / Not Validated';
          } else if (isExperimental && !value) {
            badge = <span className="component-badge unavailable">Unavailable</span>;
            statusText = 'Unavailable / Not Validated';
          } else if (!isCore && !value) {
            badge = <span className="component-badge unavailable">Unavailable</span>;
          }

          return (
            <div key={key} className={`component-item ${value ? 'healthy' : 'unhealthy'} ${isCore ? 'core' : 'optional'}`}>
              <div className="component-info">
                <span className={`component-status ${value ? 'healthy' : 'unhealthy'}`} aria-hidden="true"></span>
                <span className="component-name">{componentLabels[key] || key}</span>
                {badge}
              </div>
              <span className={`component-value ${value ? 'healthy' : 'unhealthy'}`}>
                {value ? '✓' : '✗'}
              </span>
              <span className="component-status-text">{statusText}</span>
            </div>
          );
        })}
      </div>

      <div className="health-warning" role="status">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div className="warning-content">
          <strong>Anti-spoofing models are not production-ready.</strong>
          <p>Liveness detection is experimental and may produce false results. Deepfake detection is not validated. Do not rely on these for security-critical applications.</p>
        </div>
      </div>

      <footer className="health-footer">
        <small>Last checked: {new Date(health.timestamp).toLocaleString()}</small>
      </footer>
    </section>
  );
}