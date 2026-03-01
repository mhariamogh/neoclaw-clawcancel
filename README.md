## Vibe coded for a hackathon and cleaned up for everyday use.
Read more here - https://www.hariamogh.com/blog/neoclaw-hackathon

# ClawCancel

**Stop paying for subscriptions you don't use.**

ClawCancel is a Chrome extension that tracks which streaming and subscription services you actually visit, then tells you exactly what you're wasting money on — right from a popup when you click the extension icon.

## How It Works

1. **On install** — ClawCancel immediately backfills from your last 30 days of Chrome browsing history, so you get useful data right away without waiting.
2. **As you browse** — every visit to a tracked service is recorded in real time.
3. **Every 30 days** — the extension generates a fresh report. If you have unused subscriptions, a Chrome notification fires with the total wasted amount.
4. **Click the icon** — a popup shows your current usage, what you're paying, and what you're not using.

All data is stored locally in Chrome. Nothing leaves your browser.

## Installation

**Prerequisites:** Node.js 18+, Google Chrome

```bash
git clone https://github.com/mhariamogh/neoclaw-clawcancel.git
cd neoclaw-clawcancel/neoclaw-with-subscriptions
npm install
npm run build
```

Then load the extension:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder inside `neoclaw-with-subscriptions/`

Click the ClawCancel icon in your toolbar — the popup opens immediately.

## What the Popup Shows

| Section | Description |
|---|---|
| **Monthly** | Combined cost of all tracked subscriptions |
| **Wasted** | Money spent on services you haven't visited in 30 days |
| **Using** | Active subscriptions with time since your last visit |
| **Not using** | Unused subscriptions with cost in red |
| **Savings nudge** | How much you'd save per month and per year by cancelling unused services |

## Notifications

After each 30-day cycle, if you have unused subscriptions ClawCancel sends a Chrome notification showing the count and wasted amount. Clicking the notification opens the popup.
