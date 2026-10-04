# Face Recognition with Anti-Spoofing — Frontend

A polished, responsive React + Vite + TypeScript frontend for the Face Recognition with Anti-Spoofing backend. Built as a portfolio demonstration.

## Backend

The backend API is deployed at:
```
https://face-recognition-with-anti-spoofing.onrender.com/api/v1
```

## Features

- **Dashboard** — Real-time health monitoring with component status
- **Camera Capture** — Live camera preview with snapshot capability
- **Face Registration** — Register users with face images
- **Face Authentication** — Authenticate users against registered faces
- **Health Status** — Persistent backend connectivity indicator
- **Anti-Spoofing Disclaimer** — Clear notice that liveness/deepfake detection is disabled

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Native browser APIs (MediaDevices, Canvas, Fetch)

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
cd face-recognition-frontend
npm install
```

### Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

The default `VITE_API_BASE_URL` points to the production Render deployment. For local development with a local backend:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

The output will be in the `dist/` directory, ready for static hosting.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Push this repository to GitHub
2. Import in Vercel: `vercel import <github-repo>`
3. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://face-recognition-with-anti-spoofing.onrender.com/api/v1`
4. Deploy

### Netlify

1. Connect repository in Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add Environment Variable: `VITE_API_BASE_URL`
5. Deploy

### Render Static Site

1. Create new Static Site in Render
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add Environment Variable: `VITE_API_BASE_URL`

## CORS Configuration

The backend must allow your frontend origin. Set this in the Render dashboard for the backend service:

```
FACE_RECOGNITION_ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
```

## Project Structure

```
src/
├── api/
│   └── client.ts          # API client with typed responses
├── components/
│   ├── Camera.tsx         # Camera capture with MediaDevices API
│   ├── Dashboard.tsx      # Main dashboard layout
│   ├── HealthStatus.tsx   # Backend health monitoring
│   ├── Registration.tsx   # User registration form
│   └── Authentication.tsx # Face authentication form
├── styles/
│   └── main.css           # Global styles (dark navy/slate theme)
├── types/
│   └── api.ts             # TypeScript interfaces for API
├── App.tsx
└── main.tsx
```

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Backend health check |
| `/register-frame` | POST | Register user with face image |
| `/authenticate-frame` | POST | Authenticate user with face image |

## Important Notes

### Anti-Spoofing Disclaimer

The backend runs on Render's free tier (512 MiB RAM). To fit within memory limits, the optional liveness and deepfake detection models are disabled via `FACE_RECOGNITION_SKIP_OPTIONAL_MODELS=true`.

The frontend displays scores for these components but includes a prominent warning:
> "Liveness and deepfake detection are currently disabled. This demo does not verify whether a face is live or spoofed."

Do not use this demo for production security applications.

### Camera Permissions

The camera component requires HTTPS (or localhost) for `getUserMedia()`. It will not work on plain HTTP.

### Image Requirements

- Format: JPEG or PNG
- Color space: RGB (standard canvas output)
- Single face required — backend rejects 0 or multiple faces

## License

MIT — Portfolio demonstration project.