import { ISubscriptionRepository } from '@/core/interfaces';
import { SUBSCRIPTION_SERVICES } from '@/core/entities';

const REPORT_INTERVAL_MINUTES = 43200; // 30 days
const HISTORY_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class SubscriptionMonitorService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  async register(): Promise<void> {
    // Ensure 30-day subscription check alarm exists
    await this.ensureAlarmExists();

    // Monitor history visits in real-time
    chrome.history.onVisited.addListener((historyItem) => {
      if (historyItem.url) {
        this.subscriptionRepository.trackVisit(
          historyItem.url,
          historyItem.lastVisitTime || Date.now()
        );
      }
    });

    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'subscription-check') {
        this.performPeriodicCheck();
      }
    });

    // Handle notification clicks - open/focus tab
    chrome.notifications.onClicked.addListener((notificationId) => {
      if (notificationId === 'subscription-report') {
        this.openOrFocusTab();
      }
    });

    // Backfill from browser history on first load so the first report is meaningful
    await this.backfillFromHistory();

    console.log('[ClawCancel] Subscription monitoring initialized - checking every 30 days');
  }

  private async backfillFromHistory(): Promise<void> {
    const stored = await chrome.storage.local.get('historyBackfilled');
    if (stored.historyBackfilled) return;

    const startTime = Date.now() - HISTORY_LOOKBACK_MS;
    let visited = 0;

    for (const service of SUBSCRIPTION_SERVICES) {
      for (const domain of service.domains) {
        const items = await chrome.history.search({ text: domain, startTime, maxResults: 100 });
        for (const item of items) {
          if (item.url && item.lastVisitTime) {
            await this.subscriptionRepository.trackVisit(item.url, item.lastVisitTime);
            visited++;
          }
        }
      }
    }

    await chrome.storage.local.set({ historyBackfilled: true });
    console.log(`[ClawCancel] History backfill complete — ${visited} visits recorded`);

    // Notify any open tab that fresh data is available
    chrome.runtime.sendMessage({ type: 'NEW_REPORT', timestamp: Date.now() }).catch(() => {});
  }

  private async ensureAlarmExists(): Promise<void> {
    const existing = await chrome.alarms.get('subscription-check');
    if (!existing) {
      chrome.alarms.create('subscription-check', { periodInMinutes: REPORT_INTERVAL_MINUTES });
      console.log('[ClawCancel] Created subscription check alarm (30 day interval)');
    } else {
      console.log('[ClawCancel] Subscription check alarm already exists, next at', new Date(existing.scheduledTime));
    }
  }

  private async performPeriodicCheck(): Promise<void> {
    try {
      const report = await this.subscriptionRepository.getReport();

      // Send real-time update to open tabs
      chrome.runtime.sendMessage({
        type: 'NEW_REPORT',
        timestamp: Date.now()
      }).catch(() => {
        // No tabs listening - that's okay, they'll see it when they open
      });

      // Show a notification if there are unused subscriptions
      if (report.unusedCount > 0) {
        chrome.notifications.create('subscription-report', {
          type: 'basic',
          iconUrl: '/icons/neo-claw.png',
          title: 'Monthly Subscription Report',
          message: `${report.unusedCount} unused - $${report.wastedCost.toFixed(2)}/mo wasted. Click to view your report.`,
          priority: 1
        });
      }

      console.log('[ClawCancel] Posted 30-day subscription report');
    } catch (error) {
      console.error('[ClawCancel] Subscription check failed:', error);
    }
  }

  private async openOrFocusTab(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      const extensionUrl = chrome.runtime.getURL('/src/platforms/extension/tab/index.html');
      const existingTab = tabs.find(tab => tab.url === extensionUrl);

      if (existingTab?.id) {
        await chrome.tabs.update(existingTab.id, { active: true });
        if (existingTab.windowId) {
          await chrome.windows.update(existingTab.windowId, { focused: true });
        }
      } else {
        await chrome.tabs.create({ url: extensionUrl });
      }
    } catch (error) {
      console.error('[ClawCancel] Failed to open/focus tab:', error);
    }
  }
}
