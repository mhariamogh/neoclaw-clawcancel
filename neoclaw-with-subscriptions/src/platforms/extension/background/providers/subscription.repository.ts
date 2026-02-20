import { ISubscriptionRepository } from '@/core/interfaces';
import {
  SubscriptionReport,
  SubscriptionUsage,
  SUBSCRIPTION_SERVICES,
  SubscriptionService
} from '@/core/entities';

const USAGE_THRESHOLD_MINUTES = 20; // For hackathon demo - should be 30 days (43200 minutes) in production

export class SubscriptionRepository implements ISubscriptionRepository {
  private readonly USAGE_KEY = 'subscription_usage';
  private readonly IDLE_THRESHOLD = USAGE_THRESHOLD_MINUTES * 60 * 1000; // 20 minutes in ms

  async getReport(): Promise<SubscriptionReport> {
    const usage = await this.getAllUsage();
    const now = Date.now();

    let totalCost = 0;
    let wastedCost = 0;
    let activeCount = 0;
    let unusedCount = 0;

    // Process ALL services (even those never visited)
    for (const service of SUBSCRIPTION_SERVICES) {
      totalCost += service.cost;
      
      const serviceUsage = usage[service.id];
      
      if (!serviceUsage || !serviceUsage.lastVisit) {
        // Never visited = unused
        unusedCount++;
        wastedCost += service.cost;
        // Create usage entry if it doesn't exist
        if (!usage[service.id]) {
          usage[service.id] = this.createDefaultUsage(service.id);
          usage[service.id].status = 'unused';
        }
      } else {
        // Calculate minutes unused
        const minutesUnused = Math.floor((now - serviceUsage.lastVisit) / (1000 * 60));

        // Use < for active (exactly like subscription-manager)
        const isActive = minutesUnused < USAGE_THRESHOLD_MINUTES;

        if (isActive) {
          activeCount++;
          usage[service.id].status = 'active';
        } else {
          unusedCount++;
          wastedCost += service.cost;
          usage[service.id].status = 'unused';
        }
        
        // Update minutesUnused
        usage[service.id].minutesUnused = minutesUnused;
      }
    }

    return {
      services: SUBSCRIPTION_SERVICES,
      usage,
      totalCost,
      wastedCost,
      activeCount,
      unusedCount,
      lastUpdated: now
    };
  }

  async updateUsage(serviceId: string, usage: Partial<SubscriptionUsage>): Promise<void> {
    const allUsage = await this.getAllUsage();
    const current = allUsage[serviceId] || this.createDefaultUsage(serviceId);
    
    allUsage[serviceId] = {
      ...current,
      ...usage
    };

    await chrome.storage.local.set({ [this.USAGE_KEY]: allUsage });
  }

  async trackVisit(url: string, timestamp: number): Promise<void> {
    const service = this.findServiceByUrl(url);
    if (!service) return;

    const allUsage = await this.getAllUsage();
    const current = allUsage[service.id] || this.createDefaultUsage(service.id);

    const now = Date.now();

    const updated: SubscriptionUsage = {
      ...current,
      totalVisits: current.totalVisits + 1,
      lastVisit: timestamp,
      minutesUnused: 0, // Just visited, so 0 minutes unused
      status: 'active' // Just visited, so active
    };

    // Update time-based visit counts
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    if (timestamp > sevenDaysAgo) updated.visits7d++;
    if (timestamp > thirtyDaysAgo) updated.visits30d++;

    await this.updateUsage(service.id, updated);
  }

  async getUsage(serviceId: string): Promise<SubscriptionUsage | null> {
    const allUsage = await this.getAllUsage();
    return allUsage[serviceId] || null;
  }

  private async getAllUsage(): Promise<Record<string, SubscriptionUsage>> {
    const result = await chrome.storage.local.get(this.USAGE_KEY);
    return result[this.USAGE_KEY] || {};
  }

  private createDefaultUsage(serviceId: string): SubscriptionUsage {
    return {
      serviceId,
      totalVisits: 0,
      visits7d: 0,
      visits30d: 0,
      lastVisit: null,
      firstTracked: Date.now(),
      status: 'new',
      minutesUnused: 0
    };
  }

  private findServiceByUrl(url: string): SubscriptionService | null {
    for (const service of SUBSCRIPTION_SERVICES) {
      for (const domain of service.domains) {
        if (url.includes(domain)) {
          return service;
        }
      }
    }
    return null;
  }
}
