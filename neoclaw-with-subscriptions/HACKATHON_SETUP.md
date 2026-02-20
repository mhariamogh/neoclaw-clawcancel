# ClawCancel - Hackathon Demo Guide

## What is ClawCancel?

ClawCancel is a Chrome extension that automatically tracks your subscription services and tells you which ones you're wasting money on. It monitors your browsing history, generates reports every 20 minutes, and helps you identify subscriptions you've forgotten about.

**Note:** The unused threshold is set to **20 minutes** for demo purposes (would be 30 days in production).

---

## Quick Start

### Step 1: Install the Extension

1. Extract `clawcancel-realtime-fixed.tar.gz`
2. Load the `dist` folder as an unpacked extension in Chrome (`chrome://extensions`)

### Step 2: Test the Extension

ClawCancel comes pre-configured to track these popular streaming services:
- **Netflix** ($15.99/mo)
- **Spotify** ($9.99/mo)
- **Hulu** ($7.99/mo)
- **Disney+** ($7.99/mo)
- **YouTube Premium** ($11.99/mo)
- **HBO Max** ($15.99/mo)
- **Amazon Prime Video** ($8.99/mo)
- **Apple TV+** ($6.99/mo)
- **Paramount+** ($5.99/mo)
- **ESPN+** ($10.99/mo)

No manual setup needed - just visit any of these sites and the extension automatically tracks your usage!

### Step 3: See It In Action

1. Visit some streaming sites (e.g., `https://netflix.com`, `https://spotify.com`)
2. The extension tracks your visits automatically
3. **Trigger a report immediately** (don't wait 20 minutes):
   - Right-click the ClawCancel icon → "Inspect Service Worker"
   - In the console, run: `chrome.alarms.onAlarm.dispatch({ name: 'subscription-check' })`
4. Click the ClawCancel icon to view your subscription report

### Step 4: Cancel Subscriptions (Optional)

If you have the **OpenClaw Browser Relay extension** installed, you can instruct ClawCancel to automatically cancel unused subscriptions for you. Just ask in the chat interface: *"Cancel my Netflix subscription"* and the AI will navigate to the cancellation page and complete the process.

---

---

---

## Testing Scenarios

### Scenario 1: Active User
1. Add Netflix, Spotify, YouTube Premium
2. Visit all three sites
3. Check report - should show all as "active"
4. Total wasted: $0

### Scenario 2: Subscription Hoarder
1. Add 10+ subscriptions
2. Only visit 2-3 of them
3. Check report - should highlight unused ones
4. See calculated savings if you cancel

### Scenario 3: Forgotten Subscription
1. Don't visit Netflix for 20+ minutes
2. Check the report
3. Report flags Netflix as "unused"
4. Recommendation: You're wasting $15.99/month on a service you're not using

---

## Troubleshooting

### Extension won't load?
- Make sure you're loading the `dist` folder, not the entire project
- Check that Developer mode is enabled in `chrome://extensions/`

### Reports not generating?
- Manually trigger: `chrome.alarms.onAlarm.dispatch({ name: 'subscription-check' })` in Service Worker console
- Check for errors in the Service Worker console (right-click extension icon → Inspect Service Worker)

### Subscriptions not tracking?
- Make sure you've granted history permissions when prompted
- Visit the exact domain (e.g., `netflix.com`, `spotify.com`)
- Check the service worker console for tracking logs

---

### Browser Relay for Subscription Cancellation

**Integration with OpenClaw Browser Relay**: If you have the OpenClaw Browser Relay extension installed alongside ClawCancel, you can instruct the AI to automatically cancel subscriptions:

1. Install both ClawCancel and OpenClaw Browser Relay
2. In the ClawCancel chat, say: *"Cancel my Netflix subscription"*
3. The AI will:
   - Navigate to the Netflix account page
   - Find the cancellation flow
   - Handle retention offers
   - Complete the cancellation process

---

**Ready to save money? Load the extension and start tracking! 💰**
