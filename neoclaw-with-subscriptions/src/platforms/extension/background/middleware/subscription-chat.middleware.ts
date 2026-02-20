import { SubscriptionFunctionHandler } from '../services/subscription-functions.service';

export class SubscriptionChatMiddleware {
  constructor(private functionHandler: SubscriptionFunctionHandler) {}

  /**
   * Detect if a message is asking about subscriptions and inject context
   */
  async enrichMessage(userMessage: string): Promise<string> {
    const subscriptionKeywords = [
      'subscription', 'subscriptions', 'cancel', 'unused', 'wasting',
      'spending', 'netflix', 'spotify', 'hulu', 'disney', 'youtube',
      'prime', 'paramount', 'hbo', 'espn', 'apple tv'
    ];

    const lowerMessage = userMessage.toLowerCase();
    const isSubscriptionRelated = subscriptionKeywords.some(kw => lowerMessage.includes(kw));

    if (isSubscriptionRelated) {
      // Get current subscription data
      const data = await this.functionHandler.executeFunction('getSubscriptions');
      
      // Format as context
      const context = this.formatSubscriptionContext(data);
      
      // Prepend context to message
      return `[SUBSCRIPTION CONTEXT - Current as of ${new Date().toLocaleTimeString()}:
${context}]

User question: ${userMessage}`;
    }

    return userMessage;
  }

  private formatSubscriptionContext(data: any): string {
    const lines = [];
    lines.push(`Total spending: ${data.total}`);
    lines.push(`Wasted on unused: ${data.wasted}`);
    lines.push(`Active services: ${data.active}, Unused: ${data.unused}`);
    lines.push('');
    lines.push('Service details:');
    
    data.services.forEach((service: any) => {
      if (service.status !== 'never_used' || service.minutesUnused < 999999) {
        lines.push(`- ${service.name}: ${service.cost}, ${service.status}, last used ${service.lastUsed}`);
      }
    });
    
    lines.push('');
    lines.push('CANCELLATION METHOD: Use Browser Relay to automate cancellations on the user\'s logged-in browser tabs. No manual steps or passwords needed.');
    
    return lines.join('\n');
  }
}
