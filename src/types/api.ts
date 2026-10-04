export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  components: {
    face_capture: boolean;
    embedding_extractor: boolean;
    database_manager: boolean;
    auth_engine: boolean;
    liveness_detector: boolean;
    deepfake_detector: boolean;
  };
  uptime: number;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  user_id: string;
  embedding_id?: string;
  quality_score?: number;
  total_faces_captured?: number;
  valid_faces_processed?: number;
}

export interface AuthenticationResponse {
  success: boolean;
  message: string;
  user_id?: string;
  name?: string;
  confidence: number;
  face_similarity?: number;
  liveness_score?: number;
  deepfake_score?: number;
  processing_time?: number;
  mfa_required?: boolean;
}

export interface RegisterRequest {
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  min_quality_score?: number;
}

export interface ApiError {
  detail: string;
}