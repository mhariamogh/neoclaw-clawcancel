# NeoClaw Browser Extension

A Chrome browser extension built with React, TypeScript, and Vite (Manifest V3).

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)
- Google Chrome browser

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual configuration:

| Variable | Description |
| --- | --- |
| `VITE_AUTH_INSTANCE_API_URL` | Instance API endpoint used at login (default: `https://auth-gateway.replit.app/api/instance`) |
| `VITE_OPENAI_API_KEY` | OpenAI API key used for speech-to-text transcription |

### Authentication Flow

- Users sign in with username and password in the extension UI.
- On sign in, the extension calls `GET /api/instance` (configured by `VITE_AUTH_INSTANCE_API_URL`).
- The response fields (`url` and `token`) are saved in extension auth state and persisted in browser `localStorage` under `neoclaw_instance`.
- Chat requests use these stored credentials as the gateway base URL and bearer token.
- These values are also shown in the app UI after successful login.

### 3. Build the Extension

**Development build (with hot-reload):**

```bash
npm run dev
```

**Production build:**

```bash
npm run build
```

The build output will be generated in the `dist/` directory.

### 4. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked**
4. Select the `dist/` folder from the project root
5. The NeoClaw extension should now appear in your extensions list

### 5. Reload After Changes

- **Development mode (`npm run dev`):** Changes are automatically picked up via HMR. If the extension doesn't update, click the refresh icon on the extension card in `chrome://extensions/`.
- **Production build (`npm run build`):** After rebuilding, go to `chrome://extensions/` and click the refresh icon on the NeoClaw extension card.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint on the `src/` directory |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run type-check` | Run TypeScript type checking (no emit) |

## Project Structure

```
NeoClaw/
├── public/
│   ├── icons/              # Extension icons
│   └── manifest.json       # Chrome extension manifest (MV3)
├── src/
│   ├── core/               # Domain layer (entities, interfaces, use cases)
│   ├── features/           # UI components, hooks, and theme
│   ├── lib/                # Shared utilities
│   └── platforms/
│       └── extension/      # Chrome extension platform layer
│           ├── background/  # Service worker and providers
│           ├── constants/   # Configuration constants (reads from env)
│           ├── content/     # Content scripts
│           ├── tab/         # Extension tab page (React UI)
│           └── types/       # Extension-specific types
├── .env.example            # Environment variable template
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Architecture

The project follows an 80/20 architecture principle:

- **`core/`** — Platform-agnostic business logic (entities, interfaces, use cases)
- **`features/`** — Reusable UI components and hooks
- **`lib/`** — Shared utilities
- **`platforms/extension/`** — Chrome extension-specific implementation

Core and features are designed to be reusable across platforms (web, mobile, desktop), while only the platform layer contains browser extension-specific code.
