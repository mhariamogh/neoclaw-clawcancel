export interface SubscriptionService {
  id: string;
  name: string;
  icon: string;
  cost: number;
  domains: string[];
}

export interface SubscriptionUsage {
  serviceId: string;
  totalVisits: number;
  visits7d: number;
  visits30d: number;
  lastVisit: number | null;
  firstTracked: number;
  status: 'active' | 'unused' | 'new';
  minutesUnused: number;
}

export interface SubscriptionReport {
  services: SubscriptionService[];
  usage: Record<string, SubscriptionUsage>;
  totalCost: number;
  wastedCost: number;
  activeCount: number;
  unusedCount: number;
  lastUpdated: number;
}

export const SUBSCRIPTION_SERVICES: SubscriptionService[] = [
  {
    id: 'netflix',
    name: 'Netflix',
    icon: '🎬',
    cost: 15.99,
    domains: ['netflix.com']
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎵',
    cost: 9.99,
    domains: ['spotify.com', 'open.spotify.com']
  },
  {
    id: 'hulu',
    name: 'Hulu',
    icon: '🎬',
    cost: 7.99,
    domains: ['hulu.com']
  },
  {
    id: 'disney',
    name: 'Disney+',
    icon: '🎬',
    cost: 7.99,
    domains: ['disneyplus.com']
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    icon: '📺',
    cost: 11.99,
    domains: ['youtube.com']
  },
  {
    id: 'hbo',
    name: 'HBO Max',
    icon: '🎬',
    cost: 15.99,
    domains: ['hbomax.com', 'max.com']
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime Video',
    icon: '🎬',
    cost: 8.99,
    domains: ['primevideo.com', 'amazon.com/Prime-Video']
  },
  {
    id: 'apple',
    name: 'Apple TV+',
    icon: '📺',
    cost: 6.99,
    domains: ['tv.apple.com']
  },
  {
    id: 'paramount',
    name: 'Paramount+',
    icon: '🎬',
    cost: 5.99,
    domains: ['paramountplus.com']
  },
  {
    id: 'espn',
    name: 'ESPN+',
    icon: '⚽',
    cost: 10.99,
    domains: ['espn.com', 'plus.espn.com']
  }
];
