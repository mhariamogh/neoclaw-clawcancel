import { ISubscriptionRepository } from '@/core/interfaces';

export interface SubscriptionFunction {
  name: string;
  description: string;
  parameters?: any;
  handler: (params: any) => Promise<any>;
}

export class SubscriptionFunctionHandler {
  private functions: Map<string, SubscriptionFunction>;

  constructor(private subscriptionRepository: ISubscriptionRepository) {
    this.functions = new Map();
    this.registerFunctions();
  }

  private registerFunctions(): void {
    // Get current subscription status
    this.functions.set('getSubscriptions', {
      name: 'getSubscriptions',
      description: 'Get current subscription status including active, unused, costs, and last usage times',
      handler: async () => {
        const report = await this.subscriptionRepository.getReport();
        return {
          total: `$${report.totalCost.toFixed(2)}/month`,
          wasted: `$${report.wastedCost.toFixed(2)}/month`,
          active: report.activeCount,
          unused: report.unusedCount,
          services: report.services.map(service => {
            const usage = report.usage[service.id];
            return {
              name: service.name,
              cost: `$${service.cost}/mo`,
              status: usage?.status || 'never_used',
              lastUsed: usage?.lastVisit 
                ? this.formatTimeAgo(usage.lastVisit)
                : 'never',
              minutesUnused: usage?.minutesUnused || 999999
            };
          })
        };
      }
    });

    // Cancel a subscription (triggers browser automation)
    this.functions.set('cancelSubscription', {
      name: 'cancelSubscription',
      description: 'Guide user through cancellation using Browser Relay to automate on their logged-in browser tab.',
      parameters: {
        serviceName: 'string - name of the service to cancel (e.g., "Netflix", "Spotify")'
      },
      handler: async (params: { serviceName: string }) => {
        const instructions = this.getCancellationInstructions(params.serviceName);
        return {
          message: `I can guide you through canceling ${params.serviceName} using Browser Relay.`,
          approach: 'Browser Relay will control your logged-in browser tab to automate the cancellation steps.',
          steps: instructions,
          note: 'This uses your existing logged-in session, so no passwords or 2FA needed!'
        };
      }
    });
  }

  async executeFunction(name: string, params?: any): Promise<any> {
    const func = this.functions.get(name);
    if (!func) {
      throw new Error(`Unknown function: ${name}`);
    }
    return func.handler(params);
  }

  getFunctionDefinitions(): any[] {
    return Array.from(this.functions.values()).map(f => ({
      name: f.name,
      description: f.description,
      parameters: f.parameters
    }));
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

  private getCancellationInstructions(serviceName: string): string[] {
    const instructions: Record<string, string[]> = {
      'Netflix': [
        'Go to netflix.com/account',
        'Click "Cancel Membership"',
        'Confirm cancellation',
        'Your subscription will remain active until the end of your billing period'
      ],
      'Spotify': [
        'Go to spotify.com/account',
        'Click "Change plan"',
        'Select "Cancel Premium"',
        'Confirm your choice'
      ],
      'Hulu': [
        'Go to hulu.com/account',
        'Click "Cancel" under subscription',
        'Follow the cancellation flow',
        'Confirm'
      ],
      'Disney+': [
        'Go to disneyplus.com/account',
        'Click "Billing Details"',
        'Select "Cancel Subscription"',
        'Confirm'
      ],
      'YouTube Premium': [
        'Go to youtube.com/paid_memberships',
        'Click your membership',
        'Select "Deactivate"',
        'Confirm'
      ]
    };

    return instructions[serviceName] || [
      `Visit the ${serviceName} account settings`,
      'Look for subscription or billing section',
      'Find the cancel option',
      'Follow the cancellation prompts'
    ];
  }
}
