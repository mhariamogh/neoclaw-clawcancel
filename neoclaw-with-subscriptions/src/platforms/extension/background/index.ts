import { GetSettingsUseCase, UpdateSettingsUseCase, ResetSettingsUseCase } from '@/core';
import { ChromeStorageProvider } from './providers/chrome-storage.provider';
import { SettingsRepository } from './providers/settings-repository.provider';
import { SubscriptionRepository } from './providers/subscription.repository';
import { InstallationListener, MessageListener, ActionListener } from './listeners';
import { SubscriptionMonitorService } from './services/subscription-monitor.service';

// 1. Initialize providers
const syncStorage = new ChromeStorageProvider('sync');

const settingsRepo = new SettingsRepository(syncStorage);
const subscriptionRepo = new SubscriptionRepository();

// 2. Initialize use cases
const getSettingsUseCase = new GetSettingsUseCase(settingsRepo);
const updateSettingsUseCase = new UpdateSettingsUseCase(settingsRepo);
const resetSettingsUseCase = new ResetSettingsUseCase(settingsRepo);

// 3. Register listeners
new InstallationListener(syncStorage).register();
new MessageListener({
  getSettingsUseCase,
  updateSettingsUseCase,
  resetSettingsUseCase,
  subscriptionRepository: subscriptionRepo,
}).register();
new ActionListener().register();

// 4. Initialize subscription monitoring
const subscriptionMonitor = new SubscriptionMonitorService(subscriptionRepo);
(async () => {
  await subscriptionMonitor.register();
  console.log('[ClawCancel] Background service worker initialized with subscription monitoring.');
})();
