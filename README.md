# BeMore Frontend

React-based web client for BeMore, a multimodal emotion recognition and counseling system. This frontend captures facial expressions, voice, and text inputs to provide real-time emotion analysis and AI-powered counseling sessions.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite)](https://vitejs.dev/)

---

## Overview

BeMore Frontend is a **React 19 + TypeScript** web application that:

- Records multimodal session data (facial landmarks, voice activity, speech transcripts)
- Analyzes emotions in real-time using MediaPipe Face Mesh (468 landmarks)
- Provides AI voice counseling with automatic conversation flow (STT → AI response → TTS)
- Displays emotion timelines and session summaries for user reflection

The app communicates with the BeMore backend via REST API (authentication, session management) and WebSocket (real-time data streams).

---

## Key Screens & Flows

### Public Routes
- **Landing Page** (`/`): Product introduction, login/signup prompts
- **Login** (`/auth/login`): Email/password authentication
- **Signup** (`/auth/signup`): User registration form

### Protected Routes (Authenticated Users)
- **Dashboard** (`/app`): Session overview, quick start button
- **Session Recording** (`/app/session`): Main UI for active counseling sessions
  - Live camera feed with facial emotion recognition
  - Real-time voice activity detection (VAD) visualization
  - STT live subtitles displaying speech transcription
  - AI message overlay showing counseling responses with emotion badges
  - Session controls (start, pause, end)
- **History** (`/app/history`): Past session list (UI implemented, backend integration pending)
- **Settings** (`/app/settings`): User preferences panel (UI implemented, partial functionality)

### Development Only
- **Dev Tools** (`/dev-tools`): System health checks, API testing, manual verification checklist

---

## Features

### Implemented ✅

**Session Recording & Analysis**:
- Real-time facial emotion recognition (MediaPipe Face Mesh, 468 facial landmarks)
- Voice Activity Detection (VAD) with waveform visualization
- Speech-to-Text (STT) live subtitles (Web Speech API)
- Text-to-Speech (TTS) for AI responses
- 8 emotion types: happy, sad, angry, anxious, neutral, surprised, disgusted, fearful
- Emotion timeline visualization

**AI Voice Counseling**:
- Automatic conversation flow: user speech → STT → AI response request → TTS playback
- Emotion-aware AI prompts (current emotion sent with user message)
- Streaming AI responses with real-time display
- Video overlay UI for chat messages with emotion badges
- User-friendly error handling (session expiry, network issues)

**Communication**:
- WebSocket 3-channel communication (landmarks, voice, session control)
- REST API for authentication and session management
- Automatic reconnection with exponential backoff
- Keep-alive pings to prevent backend cold starts

**Quality & Accessibility**:
- PWA support with Service Worker v1.2.0 (offline caching)
- Dark mode (class-based theme switching)
- WCAG AAA color contrast (7:1 ratio)
- Keyboard navigation support
- axe-core accessibility validation (development mode)
- Onboarding flow with camera/microphone permission requests

**Testing & CI/CD**:
- E2E testing with Playwright (5-phase session flow automation)
- GitHub Actions CI/CD pipeline (automated testing on push/PR)
- Unit tests with Vitest (utilities 100% coverage)
- TypeScript strict mode + `noUncheckedIndexedAccess`
- ESLint zero warnings

### Partially Implemented ⚠️

- **History Page**: UI components exist, backend integration incomplete
- **Settings Page**: UI panels exist, some features need backend sync
- **Internationalization (i18n)**: Context structure exists, translation resources minimal

### Planned 📋

- Full multi-language support (complete i18n resource files)
- User preferences synchronization across devices
- Advanced data visualization (session insights, trend analysis)
- Enhanced responsive design for mobile devices
- Improved screen reader optimization

---

## Tech Stack

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.1.1 | UI library |
| TypeScript | 5.9.3 | Type safety |
| Vite | 5.4.21 | Build tool with HMR |
| React Router | 6.30.1 | Client-side routing |

### State Management & HTTP
| Package | Version | Purpose |
|---------|---------|---------|
| Zustand | 5.0.8 | Global state management |
| Axios | 1.12.2 | HTTP client |
| Native WebSocket | - | Real-time bidirectional communication |

### UI & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 3.4.18 | Utility-first CSS framework |
| React Hot Toast | 2.6.0 | Toast notifications |

### Forms & Validation
| Package | Version | Purpose |
|---------|---------|---------|
| React Hook Form | 7.65.0 | Form state management |
| Zod | 4.1.12 | Schema validation |

### AI & Media
| Package | Version | Purpose |
|---------|---------|---------|
| @mediapipe/face_mesh | 0.4.1633559619 | 468-point facial landmark tracking |
| @mediapipe/camera_utils | 0.3.1675466862 | Camera utilities |
| Web Speech API | - | STT (SpeechRecognition) & TTS (SpeechSynthesis) |

### Monitoring & Accessibility
| Package | Version | Purpose |
|---------|---------|---------|
| @sentry/browser | 7.120.0 | Error tracking & performance monitoring |
| @axe-core/react | 4.9.1 | Automated accessibility testing |

### Testing
| Package | Version | Purpose |
|---------|---------|---------|
| Vitest | 2.1.4 | Unit testing framework |
| Playwright | 1.56.1 | E2E testing (Chromium, headless) |

---

## Project Structure

```
src/
├── components/          # UI components
│   ├── AIChat/         # AI message overlay, voice chat UI
│   ├── Auth/           # Login, signup, auth guards
│   ├── Charts/         # VAD timeline, emotion charts
│   ├── Common/         # Shared components (buttons, cards, modals)
│   ├── Emotion/        # Emotion card, emotion timeline
│   ├── Layout/         # App layout wrapper
│   ├── Onboarding/     # Permission requests, device checks
│   ├── Session/        # Session controls, summary, results
│   ├── Settings/       # Settings panels
│   ├── STT/            # Speech-to-text subtitle display
│   ├── VAD/            # Voice activity detection monitor
│   └── VideoFeed/      # Camera stream with MediaPipe overlay
├── pages/              # Page-level components
│   ├── Auth/           # LoginPage, SignupPage
│   ├── Home/           # Dashboard
│   ├── History/        # Session history list
│   ├── Landing/        # Landing page
│   ├── Settings/       # Settings page
│   └── DevTools.tsx    # Development verification dashboard
├── hooks/              # Custom React hooks
│   ├── useSession.ts   # Session lifecycle management
│   ├── useWebSocket.ts # WebSocket connection & reconnection
│   ├── useMediaPipe.ts # MediaPipe Face Mesh integration
│   ├── useVAD.ts       # Voice activity detection
│   ├── useEmotion.ts   # Emotion analysis
│   └── ...
├── contexts/           # React Context providers
│   ├── AuthContext.tsx         # Authentication state
│   ├── SessionContext.tsx      # Session state
│   ├── ThemeContext.tsx        # Light/dark theme
│   ├── I18nContext.tsx         # Internationalization (basic structure)
│   ├── NetworkContext.tsx      # Network status
│   ├── AccessibilityContext.tsx # Accessibility settings
│   └── ...
├── stores/             # Zustand global stores
│   ├── sessionStore.ts  # Session data
│   ├── emotionStore.ts  # Emotion history
│   ├── vadStore.ts      # VAD metrics
│   └── ...
├── services/           # API & WebSocket clients
│   ├── api/            # Modular API services
│   │   ├── auth.api.ts       # Login, signup, logout
│   │   ├── session.api.ts    # Session start/end
│   │   ├── emotion.api.ts    # Emotion data retrieval
│   │   └── ...
│   ├── shared/         # Shared API utilities (apiClient, types)
│   └── websocket.ts    # WebSocket manager (3-channel)
├── utils/              # Utility functions
│   ├── a11y.ts         # Accessibility helpers
│   ├── performance.ts  # Performance optimization
│   ├── security.ts     # Security utilities (CSP, HTTPS)
│   ├── vadUtils.ts     # VAD data transformation
│   ├── imageCompression.ts # Image compression (50-70% size reduction)
│   ├── analytics.ts    # Analytics tracking
│   └── ...
├── types/              # TypeScript type definitions
│   ├── index.ts        # Common types (EmotionType, VADMetrics, etc.)
│   └── session.ts      # Session-related types
├── config/             # Configuration
│   └── env.ts          # Environment variable management
├── workers/            # Web Workers
│   └── landmarksWorker.ts # Background landmark processing
├── locales/            # i18n translation files (minimal)
└── assets/             # Static assets (images, fonts)
```

**Total Files**: ~150 TypeScript/TSX files

---

## Setup & Scripts

### Prerequisites

- **Node.js**: >=18.0.0
- **npm**: >=9.0.0
- **Browser Permissions**: Camera + Microphone access required

### Installation

```bash
# Clone repository
git clone <repository-url>
cd BeMoreFrontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend URLs
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Development (default)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Production (Render backend)
VITE_API_URL=https://bemorebackend.onrender.com
VITE_WS_URL=wss://bemorebackend.onrender.com

# Logging
VITE_LOG_LEVEL=info  # debug | info | warn | error

# Feature Flags
VITE_ENABLE_MOCK_STT=false
VITE_ENABLE_MOCK_MEDIAPIPE=false
```

**Note**: `.env` is gitignored. Never commit sensitive credentials.

### Development

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Dev server with backend on localhost:8000
# (Backend must be running separately)
```

### Build & Preview

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Production build
npm run build

# Preview production build
npm run preview

# Build with bundle analysis
npm run build:analyze
```

### Testing

```bash
# Unit tests (Vitest)
npm run test

# Unit tests watch mode
npm run test:watch

# E2E tests (Playwright)
npm run e2e

# E2E tests UI mode
npm run e2e:ui

# Session flow E2E verification (5-phase)
npm run verify:session

# Full verification (build + E2E)
npm run verify:full

# CI verification (build + type check + lint + E2E)
npm run verify:ci
```

---

## Backend Integration

### Communication Protocols

**REST API** (Axios):
- Authentication: `POST /api/auth/login`, `POST /api/auth/signup`
- Session Management: `POST /api/sessions/start`, `POST /api/sessions/end`
- Data Retrieval: `GET /api/sessions/:id`, `GET /api/emotions/:sessionId`

**WebSocket** (3 Channels):
1. **Landmarks Channel** (`/ws/landmarks`): Facial landmark data → backend emotion analysis
2. **Voice Channel** (`/ws/voice`): Audio stream → backend STT + VAD analysis
3. **Session Channel** (`/ws/session`): Control messages (start, pause, end, AI requests)

### Connection Flow

1. User logs in via REST API → receives auth token
2. User starts session → REST API creates session → receives `sessionId`
3. Frontend establishes 3 WebSocket connections (includes `sessionId` in URL/headers)
4. Frontend sends real-time data (landmarks @ 5fps, audio chunks)
5. Backend sends analysis results (emotions, STT text, VAD metrics, AI responses)
6. User ends session → Frontend closes WebSockets → REST API finalizes session

### Base URLs

Configured via environment variables:
- **Dev**: `http://localhost:8000` (HTTP) + `ws://localhost:8000` (WebSocket)
- **Prod**: `https://bemorebackend.onrender.com` (HTTPS) + `wss://bemorebackend.onrender.com` (WebSocket)

Auto-detects protocol upgrade in production (HTTP→HTTPS, WS→WSS).

---

## Limitations & Future Work

### Known Limitations

**UI/UX**:
- Responsive design incomplete (desktop-first, mobile layout needs improvement)
- Some modals/overlays may overflow on small screens
- Loading states inconsistent across components

**Functionality**:
- History page: UI exists but no backend integration (cannot fetch past sessions)
- Settings page: Some preferences (notifications, personalization) not synced with backend
- Error handling: Some edge cases show generic error messages
- Internationalization: Only English supported (i18n structure exists, resources incomplete)

**Accessibility**:
- Screen reader support needs testing and optimization
- Some interactive elements missing ARIA labels
- Keyboard shortcuts not fully documented

**Performance**:
- Large session data may cause memory pressure (pagination not implemented)
- No virtualization for long lists (history, timeline events)

### Planned Improvements

- [ ] Complete mobile responsive design (breakpoints, touch gestures)
- [ ] Implement history page backend integration
- [ ] Add multi-language support (Korean, English at minimum)
- [ ] Improve error messages with actionable guidance
- [ ] Add comprehensive screen reader testing
- [ ] Implement data pagination for large sessions
- [ ] Add advanced data visualizations (charts, trend analysis)
- [ ] Session resumption after page refresh
- [ ] Optimize bundle size (code splitting, lazy loading)

---

## Quality Status

| Check | Status | Details |
|-------|--------|---------|
| **TypeScript** | ✅ 0 errors | Strict mode + `noUncheckedIndexedAccess` |
| **ESLint** | ✅ 0 warnings | All warnings fixed |
| **Build** | ✅ Success | 1.67s, 280KB bundle (gzip: 89KB) |
| **Unit Tests** | ✅ 109 passed | Utilities 100% coverage |
| **E2E Tests** | ✅ Passing | 5-phase session flow verified |
| **CI/CD** | ✅ Active | GitHub Actions on push/PR |

---

## Documentation

### Project Docs
- **[SUMMARY.md](./SUMMARY.md)**: Project status overview (tech stack, quality metrics)
- **[VERIFICATION_SYSTEM.md](./VERIFICATION_SYSTEM.md)**: Testing & verification guide
- **[docs/PHASE_12_E2E_COMPLETION.md](./docs/PHASE_12_E2E_COMPLETION.md)**: E2E testing system details
- **[docs/CI_CD_QUICK_START.md](./docs/CI_CD_QUICK_START.md)**: CI/CD pipeline setup (10 min)

### Backend Integration Docs
- **[BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)**: Detailed integration guide for backend team
- **[BACKEND_INTEGRATION_BRIEF.md](./BACKEND_INTEGRATION_BRIEF.md)**: Quick summary (3 min read)
- **[FRONTEND_VERIFICATION_CHECKLIST.md](./FRONTEND_VERIFICATION_CHECKLIST.md)**: Frontend verification steps

### UX/HCI Docs
- **[UX_HCI_IMPROVEMENT_GUIDELINES.md](./UX_HCI_IMPROVEMENT_GUIDELINES.md)**: UX improvement guidelines
- **[docs/UX_CHECKLIST.md](./docs/UX_CHECKLIST.md)**: Quick UX checklist

### External References
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [MediaPipe Face Mesh](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Tailwind CSS](https://tailwindcss.com/)

---

## License

This project's license status is unclear. Please contact the project owner for licensing information.

---

## Contact

**Project Team**: BeMore Team

---

**Last Updated**: 2025-01-17
**Based on**: Actual implementation (React 19.1, TypeScript 5.9, Vite 5.4)
**Accuracy**: All features, tech stack, and scripts verified from source code
