# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

EduFlow (edustream) is a study management application with AI-powered features for learning and knowledge retention. It's a full-stack TypeScript/React application with a Node.js backend.

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite
- State Management: Zustand (with persist middleware)
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3)
- AI: Google Gemini API (@google/genai)
- Charts: Recharts

**Key Features:**
- Study areas and topics with Kanban-style status tracking (PENDING, IN_PROGRESS, REVIEWING, COMPLETED)
- Spaced repetition system with 7-level review intervals
- AI-powered study plan generation and quiz creation
- Study timer with time tracking per topic
- Heatmap visualization of study activity
- Resource management (videos, links, PDFs, books)
- Dark mode support

## Commands

### Development
```bash
# Install dependencies (run from root)
npm install

# Install server dependencies
cd server && npm install

# Run frontend dev server (port 3000)
npm run dev

# Run backend server (port 3001)
npm run server
# OR from server directory:
cd server && npm start

# Run backend with auto-restart on changes
cd server && npm run dev
```

### Build & Deploy
```bash
# Build frontend for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup
Create a `.env.local` file in the root directory with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

The Vite config maps this to both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` for the frontend.

## Architecture

### Frontend Structure

**State Management (Zustand):**
- `store/useStudyStore.ts` - Central store with persistence
  - Manages areas, topics, study logs, dark mode, and active area
  - Uses Zustand persist middleware to save to localStorage
  - Communicates with backend via `services/dbService.ts`

**Services:**
- `services/dbService.ts` - Backend API client (fetch wrapper)
  - CRUD operations for areas, topics, resources, and logs
  - All calls go through `/api` proxy to port 3001
- `services/geminiService.ts` - AI integration
  - Uses `gemini-3-flash-preview` for study plans and quizzes
  - Uses `gemini-3-pro-preview` for tutor explanations
  - Structured JSON output with Type-based schemas

**Components:**
- `App.tsx` - Root component with routing logic
- `components/Sidebar.tsx` - Navigation and area list
- `components/Dashboard.tsx` - Overview with charts and heatmap
- `components/AreaView.tsx` - Main area management (largest component)
  - Supports three view modes: kanban, detail, tree
  - Integrates Timer, KanbanBoard, QuizModule, SkillTree
- `components/KanbanBoard.tsx` - Drag-and-drop topic status board
- `components/Timer.tsx` - Pomodoro-style study timer
- `components/QuizModule.tsx` - AI-generated quiz interface
- `components/SkillTree.tsx` - Visual topic progression tree
- `components/Heatmap.tsx` - GitHub-style activity calendar

**Types (`types.ts`):**
- Core interfaces: StudyArea, Topic, Resource, StudyLog
- Enums: StudyStatus, ResourceType
- AI response types: StudyPlanResponse, QuizQuestion

### Backend Structure

**Server (`server/`):**
- `index.js` - Express server with CORS enabled
  - REST API endpoints under `/api`
  - Foreign keys enabled via `PRAGMA foreign_keys = ON`
  
**API Endpoints:**
- `GET /api/areas` - Fetch all areas with nested topics and resources
- `PUT /api/areas` - Upsert area with full cascade (replaces topics)
- `DELETE /api/areas/:id` - Delete area (cascades to topics/resources)
- `PUT /api/topics/:id` - Update existing topic
- `POST /api/topics` - Create new topic
- `POST /api/topics/:id/resources` - Sync resources for topic
- `GET /api/logs` - Fetch study activity logs

**Database:**
- `server/db.js` - Database initialization and connection
- `database/schema.sql` - SQLite schema with foreign key cascades
  - Tables: study_areas, topics, resources, study_logs
  - Cascade deletes configured for referential integrity

### Data Flow

1. User interaction → Component state change
2. Component calls Zustand store action
3. Store updates local state and calls dbService
4. dbService makes HTTP request to Express backend
5. Backend updates SQLite database
6. Response propagates back through layers

For AI features:
1. User triggers AI action (generate plan/quiz/explanation)
2. Component calls geminiService function
3. geminiService makes API call to Google Gemini
4. Structured JSON response returned
5. Component processes and updates state via store

## Development Patterns

### State Updates
Always update state through the store, not directly in components. The store handles both local state and backend persistence.

```typescript
// CORRECT
onUpdateArea({ ...area, topics: updatedTopics });

// INCORRECT - bypasses persistence
setAreas(prev => [...prev, newArea]);
```

### Database Operations
All database operations use transactions for atomicity. When updating nested structures (area → topics → resources), the backend uses replace semantics (delete + re-insert).

### ID Generation
IDs are generated client-side using: `Math.random().toString(36).substr(2, 9)`

### Spaced Repetition Logic
Review intervals in days: `[1, 3, 7, 14, 30, 60, 120]` (7 levels, 0-6)
- Success: level increases (max 6)
- Failure: level decreases (min 0)
- Located in `components/AreaView.tsx` (handleCompleteReview)

### Dark Mode
- Managed by Zustand store
- Uses Tailwind's dark: classes
- Persisted to localStorage as 'edustream_theme'
- Respects system preference on first load

## Key Implementation Details

### Vite Proxy Configuration
Frontend (port 3000) proxies `/api/*` requests to backend (port 3001). This avoids CORS issues in development.

### SQLite Foreign Keys
Foreign keys must be explicitly enabled in better-sqlite3. The server does this on initialization: `db.pragma('foreign_keys = ON')`

### Gemini API Usage
- API key loaded from environment via Vite's `loadEnv`
- Two models used: flash for generation, pro for explanations
- All responses use structured output with JSON schema validation

### Resource Type Detection
YouTube URLs are auto-detected and typed as 'video'. Otherwise, user specifies type (link, book, pdf, other).

### Component Communication
Parent-child communication uses props. No context providers. The store is the single source of truth accessed via hooks.

## Troubleshooting

### Backend not starting
- Check that port 3001 is available
- Ensure `server/node_modules` is installed
- Verify `database/schema.sql` exists

### AI features not working
- Verify `GEMINI_API_KEY` is set in `.env.local`
- Check browser console for API errors
- Gemini API requires valid billing/project setup

### Database changes not persisting
- Verify backend is running
- Check network tab for failed `/api` requests
- Ensure foreign keys are enabled if cascades aren't working

### State persistence issues
- Clear localStorage item 'edustream-storage' if corrupted
- Check Zustand persist configuration in store

## File Naming Conventions

- Components: PascalCase with `.tsx` extension
- Services: camelCase with `.ts` extension
- Types: singular `types.ts` for shared types
- Backend: `.js` files (not using TypeScript on backend)

## Testing Approach

No formal test suite exists yet. Manual testing workflow:
1. Create area via sidebar
2. Add topics manually or via AI generation
3. Update topic status through kanban
4. Add resources to topics
5. Use timer to track study time
6. Take AI-generated quiz
7. Verify persistence by refreshing page
