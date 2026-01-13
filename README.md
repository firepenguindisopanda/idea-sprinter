
# specs before code - srs-doc-sprinter (Frontend)

This is the frontend for the **specs before code** product, an AI-powered multi-agent system for generating software specifications before you code.

This project, together with the multi-agent-system backend, forms the complete specs before code product.

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **PWA** - Progressive Web App support
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
npm install
```


Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.

### Quick Start (Web App)

To run only the web application (useful when developing the frontend against a running backend at `http://localhost:5001`):

```bash
cd apps/web
npm install
npm run dev
```

The frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5001`) to locate the backend API. Create `apps/web/.env.local` or set the env var if your API runs elsewhere:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### Tests & Quality

Unit and integration tests are available for the frontend:

```bash
# Run unit tests
cd apps/web
npm test

# Run unit tests with UI
npm run test:ui

# Run e2e tests (Playwright)
npm run test:e2e
```

Linting and type checks are also available via:

```bash
npm run lint
npm run check-types
```

The UI shows per-agent progress and judge results (Approved / Needs Revision) with inline feedback when available.







## Project Structure

```
srs-doc-sprinter/
├── apps/
│   ├── web/         # Frontend application (Next.js)
```

## Available Scripts

- `npm run dev`: Start all applications in development mode
- `npm run build`: Build all applications
- `npm run dev:web`: Start only the web application
- `npm run check-types`: Check TypeScript types across all apps
- `cd apps/web && npm run generate-pwa-assets`: Generate PWA assets
