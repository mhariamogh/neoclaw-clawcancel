## Vibe coded for a hackathon and cleaned up for everyday use.
Read more here - https://www.hariamogh.com/blog/neoclaw-hackathon

# ClawCancel

**Stop paying for subscriptions you don't use.**

ClawCancel is a Chrome extension that tracks which streaming and subscription services you actually visit, then tells you exactly what you're wasting money on — right from a popup when you click the extension icon.

<img width="404" height="438" alt="Screenshot 2026-02-28 at 5 16 56 PM" src="https://github.com/user-attachments/assets/006b0238-3407-48d9-8bc2-e8b8c812c010" />


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

## Notifications

After each 30-day cycle, if you have unused subscriptions ClawCancel sends a Chrome notification showing the count and wasted amount. Clicking the notification opens the popup.
