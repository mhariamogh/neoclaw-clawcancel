# NeoClaw with Subscription Monitoring

## What's Been Added

### 1. **Subscription Entities** (`src/core/entities/subscription.entity.ts`)
- Defined subscription services (Netflix, Spotify, Hulu, etc.)
- Usage tracking data structure
- Report generation interface

### 2. **Subscription Repository** (`src/platforms/extension/background/providers/subscription.repository.ts`)
- Tracks visits to subscription domains
- Calculates usage statistics (7-day, 30-day)
- Determines active vs unused status
- Generates cost reports

### 3. **Subscription Monitor Service** (`src/platforms/extension/background/services/subscription-monitor.service.ts`)
- Listens to Chrome history changes in real-time
- Runs periodic checks every 5 minutes
- Shows notifications for unused subscriptions

### 4. **Integrated into Background Service** (`src/platforms/extension/background/index.ts`)
- Automatically starts monitoring on extension load
- Works alongside existing chat functionality

### 5. **Updated Permissions** (`public/manifest.json`)
- Added `history` - to track visits
- Added `alarms` - for periodic checks
- Added `notifications` - for alerts

## How It Works

1. **Automatic Tracking**: Monitors all Chrome history visits in real-time
2. **Smart Detection**: Identifies visits to subscription service domains
3. **Usage Analysis**: Tracks last visit, total visits, 7-day/30-day counts
4. **Status Determination**: Marks services as active/unused based on 20-minute threshold
5. **Cost Calculation**: Totals monthly costs and identifies wasted spending
6. **Notifications**: Alerts you every 5 minutes if unused subscriptions detected

## Next Steps

### To Build & Test:

```bash
cd ~/.openclaw/workspace/neoclaw-with-subscriptions
npm install
npm run build
```

Then load the `dist/` folder in Chrome as an unpacked extension.

### To Add Chat Integration:

You can ask the AI assistant questions like:
- "What subscriptions am I wasting money on?"
- "When did I last use Netflix?"
- "How much am I spending on streaming services?"

The AI will have access to the subscription data through the background service.

## Backup

Your original extensions remain untouched:
- `subscription-manager-extension/` - Your working subscription tracker
- `neoclaw-extension/` - Original compiled NeoClaw
- `neoclaw-extension-main/` - Original source code

This new version is in: `neoclaw-with-subscriptions/`
