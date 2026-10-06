import { useRef, useState, useEffect, useCallback } from 'react';

interface CameraProps {
  onCapture: (blob: Blob) => void;
  disabled?: boolean;
}

export function Camera({ onCapture, disabled = false }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startIdRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [streamKey, setStreamKey] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);

  // Keep the latest onCapture callback available to the stable capture handler
  const onCaptureRef = useRef(onCapture);
  useEffect(() => {
    onCaptureRef.current = onCapture;
  });

  const stopStream = useCallback(() => {
    startIdRef.current += 1;
    setIsStarting(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsActive(false);
      setCameraReady(false);
      setStreamKey(k => k + 1);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (disabled) return;
    setError(null);
    setIsStarting(true);
    const startId = ++startIdRef.current;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (startId !== startIdRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = mediaStream;
      setIsActive(true);
      setIsStarting(false);
      setStreamKey(k => k + 1);
    } catch (err) {
      if (startId !== startIdRef.current) return;
      let message = 'Failed to access camera';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          message = 'Camera permission denied. Allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          message = 'No camera device found.';
        } else if (err.name === 'NotReadableError') {
          message = 'Camera is unavailable or in use by another application.';
        } else if (err.message) {
          message = err.message;
        }
      }
      setError(message);
      setIsActive(false);
      setCameraReady(false);
      setIsStarting(false);
    }
  }, [disabled, facingMode]);

  // Attach/detach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => {
        // Autoplay may be blocked, user interaction needed
      });
    } else {
      video.srcObject = null;
    }
  }, [streamKey]);

  // Camera lifecycle - restarts when disabled/facing mode change
  useEffect(() => {
    if (disabled) {
      stopStream();
      return;
    }
    startCamera();
    return () => {
      stopStream();
    };
  }, [disabled, startCamera, stopStream]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  // Detect when video is ready and playing
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlaying = () => {
      setCameraReady(true);
    };

    const handleWaiting = () => {
      setCameraReady(false);
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);

    return () => {
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
    };
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isActive) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) onCaptureRef.current(blob);
    }, 'image/jpeg', 0.9);
  }, [isActive]);

  if (!isActive || error) {
    return (
      <div className="camera-container" role="region" aria-label="Camera capture">
        {error ? (
          <div className="camera-error" role="alert">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
            {!disabled && (
              <button type="button" onClick={startCamera} className="btn btn-secondary">
                Retry
              </button>
            )}
          </div>
        ) : disabled ? (
          <div className="camera-disabled">
            <p>Camera is paused while submitting. It will restart automatically.</p>
          </div>
        ) : isStarting ? (
          <div className="camera-loading" role="status">
            <span className="spinner" aria-hidden="true"></span>
            <p>Starting camera…</p>
          </div>
        ) : (
          <div className="camera-idle" role="status">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4m2-2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2m10 0a2 2 0 0 0 2 2v4a2 2 0 0 1-2 2h-2m0-10V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <p>Camera is stopped.</p>
            <button type="button" onClick={startCamera} className="btn btn-primary">
              Start Camera
            </button>
          </div>
        )}
      </div>
    );
  }

  const containerClass = [
    'camera-container',
    cameraReady ? 'ready' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass} role="region" aria-label="Camera capture">
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
          disabled={disabled || !isActive}
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
          disabled={disabled || !isActive}
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