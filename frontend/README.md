# Business Rules - React Frontend

Visual flowchart editor for fraud detection rules built with React, TypeScript, and ReactFlow.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL (default: http://localhost:8000)

# Start development server
npm run dev
# Open http://localhost:5173
```

## Prerequisites

- Node.js 22.12+ or 20.19+
- Backend API running at http://localhost:8000

## Project Structure

```
frontend/
├── src/
│   ├── api/              # API client layer
│   │   ├── client.ts     # Axios base configuration
│   │   ├── rules.ts      # Rule CRUD operations
│   │   ├── evaluation.ts # Transaction evaluation
│   │   └── transactions.ts # Test data generation
│   │
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Types matching backend Pydantic models
│   │
│   ├── pages/            # Page components
│   │   ├── DashboardPage.tsx    # Rule statistics and navigation
│   │   ├── FlowEditorPage.tsx   # Visual flowchart editor (Phase 3)
│   │   └── TestRunnerPage.tsx   # Transaction testing (Phase 4)
│   │
│   ├── components/       # Reusable components (Phase 3)
│   ├── stores/           # Zustand state management (Phase 3)
│   ├── hooks/            # Custom React hooks (Phase 3)
│   ├── utils/            # Utility functions (Phase 3)
│   │
│   ├── App.tsx           # Main app with routing
│   └── main.tsx          # Entry point
│
├── .env                  # Environment configuration (not in git)
├── .env.example          # Environment template
├── package.json          # Dependencies
└── vite.config.ts        # Vite configuration
```

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing
- **TanStack Query** - Server state management and API caching
- **Axios** - HTTP client
- **ReactFlow** - Visual flowchart editor (Phase 3)
- **Zustand** - Client state management (Phase 3)
- **Tailwind CSS** - Styling (Phase 3)
- **dagre** - Auto-layout algorithm (Phase 3)

## Available Scripts

```bash
# Development
npm run dev        # Start dev server with hot reload

# Production
npm run build      # Build for production
npm run preview    # Preview production build locally

# Code Quality
npm run lint       # Lint with ESLint
```

## Environment Variables

Create `.env` file:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
```

All Vite environment variables must be prefixed with `VITE_` to be exposed to the client.

## API Integration

The frontend uses TanStack Query for data fetching with automatic caching, refetching, and error handling.

**Example usage:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { rulesAPI } from '../api';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rules', 'v1'],
    queryFn: () => rulesAPI.getRules('v1'),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.rules.length} rules loaded</div>;
}
```

## Pages

### Dashboard (`/dashboard`)
- Lists all fraud detection rules
- Shows statistics (total rules, allow/review/block counts)
- Navigation to Flow Editor and Test Runner

### Flow Editor (`/flow-editor`)
- Visual flowchart editor (Phase 3)
- Drag-and-drop rule creation
- Auto-layout with dagre
- YAML export/import

### Test Runner (`/test-runner`)
- Transaction testing interface (Phase 4)
- Generate synthetic test data
- Manual transaction input
- Visual execution trace overlay

## Development Notes

- API calls automatically include `Content-Type: application/json` header
- TanStack Query caches responses for 5 minutes (staleTime)
- Failed requests retry once before showing error
- Window focus doesn't trigger automatic refetch
- API timeout is 30 seconds

## Phase Roadmap

- ✅ **Phase 2**: Foundation with routing, dashboard, API client
- ⏳ **Phase 3**: ReactFlow visual editor
  - Custom node components (Entry, Rule, Outcome, Exit)
  - YAML ↔ ReactFlow converters
  - Auto-layout with dagre
  - Inline editing panel
  - Real-time validation
- ⏳ **Phase 4**: Transaction test runner
  - Test data generation UI
  - Transaction form with dynamic fields
  - Visual trace overlay on flowchart
  - Batch evaluation results table
- ⏳ **Phase 5**: Production deployment
  - Docker container
  - Environment-based builds
  - Performance optimization

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**API connection refused:**
- Verify backend is running at http://localhost:8000
- Check CORS configuration in backend/main.py
- Confirm .env has correct VITE_API_BASE_URL

**Build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Clear Vite cache: `rm -rf .vite && npm run dev`
