# ClawCancel - Subscription Tracker

**Automatically track your streaming subscriptions and identify what you're wasting money on.**

ClawCancel is a Chrome extension that monitors your browsing history and generates reports showing which subscriptions you're actually using and which ones are draining your wallet.

---

## 🚀 Quick Start

### Option 1: Load Pre-built Extension (Fastest)

1. Download `clawcancel-realtime-fixed.tar.gz`
2. Extract it: `tar -xzf clawcancel-realtime-fixed.tar.gz`
3. Load the `dist` folder in Chrome as an unpacked extension

### Option 2: Build from Source

```bash
cd neoclaw-with-subscriptions
npm install
npm run build
# Load the generated dist/ folder in Chrome
```

---

## 📖 Full Documentation

See **[neoclaw-with-subscriptions/HACKATHON_SETUP.md](./neoclaw-with-subscriptions/HACKATHON_SETUP.md)** for:
- Detailed setup instructions
- Testing scenarios
- Browser Relay integration
- Troubleshooting

---

## ✨ Key Features

- **Automatic Tracking**: Monitors 10 popular streaming services (Netflix, Spotify, Hulu, etc.)
- **Usage Analysis**: Reports generated every 20 minutes showing active vs. unused subscriptions
- **Immediate Reports**: Get your first report instantly on install
- **AI Chat Interface**: Ask questions and get recommendations on what to cancel
- **Privacy-First**: All data stored locally in Chrome

---

## 🎯 Demo Features

- **20-minute usage threshold** (instead of 30 days) for easy testing
- **Manual trigger**: Run `chrome.alarms.onAlarm.dispatch({ name: 'subscription-check' })` in Service Worker console
- **Pre-configured services**: Netflix, Spotify, Hulu, Disney+, YouTube Premium, HBO Max, Prime Video, Apple TV+, Paramount+, ESPN+

---

## 🔧 Optional: WebSocket Relay Server

Run the relay server for advanced integrations:

```bash
node extension-relay-server.js
# Extension auto-connects to ws://localhost:18795
```

This enables external integrations with OpenClaw's AI scheduling system (optional for demo).

---

## 📦 Repository Contents

- `neoclaw-with-subscriptions/` - Extension source code
- `clawcancel-realtime-fixed.tar.gz` - Pre-built extension (ready to load)
- `extension-relay-server.js` - Optional WebSocket relay server
- `neoclaw-with-subscriptions/HACKATHON_SETUP.md` - Full setup guide

---

