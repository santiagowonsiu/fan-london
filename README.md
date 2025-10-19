# Fan London Inventory App

This monorepo contains a Node/Express backend and a React (Vite) frontend.

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Backend
```bash
cd backend
cp .env .env.local || true
# Ensure MONGODB_URI and PORT are set in .env
npm run dev
# Health check: http://localhost:4000/health
```

### Frontend
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### Environment Variables
- Backend: `.env` with `MONGODB_URI`, `PORT`
- Frontend: `.env` with `VITE_API_BASE_URL`

## Notes
- Backend uses Mongoose, CORS, and Morgan.
- Frontend proxies API to the backend in development.
