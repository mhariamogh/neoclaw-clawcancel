## Vibe coded for a hackathon and cleaned up for everyday use.
Read more here - https://www.hariamogh.com/blog/neoclaw-hackathon


# ClawCancel - Subscription Tracker

**Automatically track your streaming subscriptions and identify what you're wasting money on.**

ClawCancel is a Chrome extension that monitors your browsing history and shows you which subscriptions you're actively using and which ones are draining your wallet — right from a clean popup when you click the extension icon.

---

## Quick Start

```bash
cd neoclaw-with-subscriptions
npm install
npm run build
```

Then load the `dist/` folder as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

Click the extension icon — a popup opens showing your subscription usage.

---

## What It Shows

- **Monthly total** — combined cost of all tracked subscriptions
- **Wasted** — money spent on services you haven't used
- **Using** — active subscriptions with time since last visit
- **Not using** — unused subscriptions with their monthly cost highlighted in red
- **Savings nudge** — how much you'd save per month and per year by cancelling unused services

---

## Key Features

- **Automatic tracking** — monitors 10 popular services: Netflix, Spotify, Hulu, Disney+, YouTube Premium, HBO Max, Prime Video, Apple TV+, Paramount+, ESPN+
- **Popup UI** — opens inline when you click the extension icon, no new tab
- **Real-time refresh** — manual refresh button + auto-updates when the background generates a new report
- **Privacy-first** — all data stored locally in Chrome storage, nothing leaves your browser

---

## Tracked Services

Netflix · Spotify · Hulu · Disney+ · YouTube Premium · HBO Max · Amazon Prime Video · Apple TV+ · Paramount+ · ESPN+

---

## Repository

- `neoclaw-with-subscriptions/` — Extension source (React + TypeScript + Vite)
