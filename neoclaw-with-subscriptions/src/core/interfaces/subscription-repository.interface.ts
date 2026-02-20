import { SubscriptionReport, SubscriptionUsage } from '../entities/subscription.entity';

export interface ISubscriptionRepository {
  getReport(): Promise<SubscriptionReport>;
  updateUsage(serviceId: string, usage: Partial<SubscriptionUsage>): Promise<void>;
  trackVisit(url: string, timestamp: number): Promise<void>;
  getUsage(serviceId: string): Promise<SubscriptionUsage | null>;
}
