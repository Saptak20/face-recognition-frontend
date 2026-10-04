import { useRef, useState, useEffect, useCallback } from 'react';

interface CameraProps {
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
}

export function Camera({ onCapture, disabled = false }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    if (disabled) return;
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      setError(message);
      setIsActive(false);
    }
  }, [disabled, facingMode]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    stopStream();
    setTimeout(startCamera, 100);
  }, [stopStream, startCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, 'image/jpeg', 0.9);
  }, [isActive, onCapture]);

  useEffect(() => {
    if (disabled) {
      stopStream();
      return;
    }
    startCamera();
    return () => stopStream();
  }, [disabled, startCamera, stopStream]);

  if (!isActive || error) {
    return (
      <div className="camera-container" role="region" aria-label="Camera capture">
        {error && (
          <div className="camera-error" role="alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
            {!disabled && <button onClick={startCamera} className="btn btn-secondary">Retry</button>}
          </div>
        )}
        {disabled && !error && (
          <div className="camera-disabled">
            <p>Camera is disabled. Enable it to capture frames.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="camera-container" role="region" aria-label="Camera capture">
      <div className="camera-preview-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-preview"
          aria-label="Live camera preview"
        />
        <canvas ref={canvasRef} className="camera-canvas" hidden />
      </div>
      <div className="camera-controls">
        <button
          type="button"
          onClick={switchCamera}
          className="btn btn-secondary"
          aria-label="Switch camera"
          disabled={disabled}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4m2-2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2m10 0a2 2 0 0 0 2 2v4a2 2 0 0 1-2 2h-2m0-10V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
          </svg>
          <span>Switch</span>
        </button>
        <button
          type="button"
          onClick={capture}
          className="btn btn-primary"
          aria-label="Capture frame"
          disabled={disabled}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
          <span>Capture</span>
        </button>
        <button
          type="button"
          onClick={stopStream}
          className="btn btn-secondary"
          aria-label="Stop camera"
          disabled={disabled}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="6" width="12" height="12" rx="2"></rect>
          </svg>
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
}