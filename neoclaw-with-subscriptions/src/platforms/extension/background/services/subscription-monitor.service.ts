import { ISubscriptionRepository } from '@/core/interfaces';
import { IChatRepository } from '@/core/interfaces';

const RELAY_URL = 'ws://localhost:18795'; // Connect to existing relay

export class SubscriptionMonitorService {
  private ws: WebSocket | null = null;

  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly chatRepository: IChatRepository
  ) {}

  async register(): Promise<void> {
    // Set up keepalive to prevent Service Worker from sleeping (every 24 seconds)
    chrome.alarms.create('keepalive', { periodInMinutes: 0.4 });
    
    // Ensure subscription check alarm exists - AWAIT to guarantee it's ready
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
        this.syncWithRelay();
      } else if (alarm.name === 'keepalive') {
        // Keep Service Worker alive - check connection health
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.connectToRelay();
        }
      }
    });

    // Handle notification clicks - open/focus tab
    chrome.notifications.onClicked.addListener((notificationId) => {
      if (notificationId === 'subscription-report') {
        this.openOrFocusTab();
      }
    });

    // Connect to relay server (for Telegram alerts via cron)
    this.connectToRelay();

    // Run immediate check on registration (install/startup)
    await this.performPeriodicCheck();

    console.log('[ClawCancel] Subscription monitoring initialized - checking every 20 minutes');
  }

  private async ensureAlarmExists(): Promise<void> {
    const existing = await chrome.alarms.get('subscription-check');
    if (!existing) {
      // Alarm doesn't exist, create it
      chrome.alarms.create('subscription-check', { periodInMinutes: 20 });
      console.log('[ClawCancel] Created subscription check alarm (20 min interval)');
    } else {
      console.log('[ClawCancel] Subscription check alarm already exists, next at', new Date(existing.scheduledTime));
    }
  }

  private connectToRelay(): void {
    try {
      this.ws = new WebSocket(RELAY_URL);
      
      this.ws.onopen = () => {
        console.log('[ClawCancel] Connected to subscription relay');
        this.ws?.send(JSON.stringify({
          type: 'identify',
          clientType: 'neoclaw-extension'
        }));
      };

      this.ws.onclose = () => {
        console.log('[ClawCancel] Relay disconnected, reconnecting in 5s...');
        setTimeout(() => this.connectToRelay(), 5000);
      };

      this.ws.onerror = (err) => {
        console.error('[ClawCancel] Relay error:', err);
      };
    } catch (err) {
      console.error('[ClawCancel] Failed to connect to relay:', err);
      setTimeout(() => this.connectToRelay(), 5000);
    }
  }

  private async syncWithRelay(): Promise<void> {
    try {
      const report = await this.subscriptionRepository.getReport();
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send report to relay for server-side processing (Telegram)
        this.ws.send(JSON.stringify({
          type: 'subscriptionReport',
          data: report,
          timestamp: Date.now()
        }));
        console.log('[ClawCancel] Synced subscription report to relay');
      }
    } catch (error) {
      console.error('[ClawCancel] Failed to sync with relay:', error);
    }
  }

  private async performPeriodicCheck(): Promise<void> {
    try {
      const report = await this.subscriptionRepository.getReport();
      
      // Generate clean, readable report
      const lines = [];
      lines.push('SUBSCRIPTION STATUS');
      lines.push('');
      lines.push(`Total: $${report.totalCost.toFixed(2)}/month`);
      lines.push(`Wasted: $${report.wastedCost.toFixed(2)}/month`);
      lines.push('');
      
      // Active subscriptions
      const activeServices = report.services.filter(s => {
        const usage = report.usage[s.id];
        return usage && usage.status === 'active';
      });
      
      if (activeServices.length > 0) {
        lines.push(`ACTIVE (${activeServices.length})`);
        lines.push('');
        activeServices.forEach(service => {
          const usage = report.usage[service.id];
          const lastUsed = usage?.lastVisit 
            ? this.formatTimeAgo(usage.lastVisit)
            : 'never';
          lines.push(`• ${service.name} $${service.cost}/mo - Last used ${lastUsed}`);
        });
        lines.push('');
      }
      
      // Unused subscriptions
      const unusedServices = report.services.filter(s => {
        const usage = report.usage[s.id];
        return usage && usage.status === 'unused';
      });
      
      if (unusedServices.length > 0) {
        lines.push(`UNUSED (${unusedServices.length})`);
        lines.push('');
        unusedServices.forEach(service => {
          const usage = report.usage[service.id];
          const lastUsed = usage?.lastVisit 
            ? this.formatTimeAgo(usage.lastVisit)
            : 'never used';
          lines.push(`• ${service.name} $${service.cost}/mo - ${lastUsed}`);
        });
        lines.push('');
        lines.push(`Recommendation: Cancel ${unusedServices.length} unused service${unusedServices.length > 1 ? 's' : ''} to save $${report.wastedCost.toFixed(2)}/month`);
      } else if (activeServices.length > 0) {
        lines.push('All tracked subscriptions are being used!');
      }
      
      const reportText = lines.join('\n');
      
      // Add report as a system message in current chat session
      const currentSession = await this.chatRepository.getOrCreateCurrentSession();
      await this.chatRepository.addMessage(currentSession.id, {
        id: crypto.randomUUID(),
        role: 'system',
        content: reportText,
        timestamp: Date.now()
      });
      
      console.log('[ClawCancel] Posted subscription report to chat');
      
      // Send real-time update to open tabs
      chrome.runtime.sendMessage({ 
        type: 'NEW_REPORT',
        timestamp: Date.now()
      }).catch(() => {
        // No tabs listening - that's okay, they'll see it when they open
      });
      
      // Also show a brief notification
      if (unusedServices.length > 0) {
        chrome.notifications.create('subscription-report', {
          type: 'basic',
          iconUrl: '/icons/neo-claw.png',
          title: 'Subscription Report',
          message: `${unusedServices.length} unused - $${report.wastedCost.toFixed(2)}/mo wasted. Click to view.`,
          priority: 1
        });
      }
      
    } catch (error) {
      console.error('[ClawCancel] Subscription check failed:', error);
    }
  }

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  private async openOrFocusTab(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      
      // Find existing ClawCancel tab
      const extensionUrl = chrome.runtime.getURL('/src/platforms/extension/tab/index.html');
      const existingTab = tabs.find(tab => tab.url === extensionUrl);
      
      if (existingTab?.id) {
        // Tab exists - focus it
        await chrome.tabs.update(existingTab.id, { active: true });
        if (existingTab.windowId) {
          await chrome.windows.update(existingTab.windowId, { focused: true });
        }
        console.log('[ClawCancel] Focused existing tab');
      } else {
        // Tab doesn't exist - create it
        await chrome.tabs.create({ url: extensionUrl });
        console.log('[ClawCancel] Opened new tab');
      }
    } catch (error) {
      console.error('[ClawCancel] Failed to open/focus tab:', error);
    }
  }

  // Expose method for chat UI to get current report
  async getReport() {
    return this.subscriptionRepository.getReport();
  }
}
