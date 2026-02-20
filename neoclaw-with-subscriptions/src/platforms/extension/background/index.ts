import { GetSettingsUseCase, UpdateSettingsUseCase, ResetSettingsUseCase } from '@/core';
import { ChromeStorageProvider } from './providers/chrome-storage.provider';
import { SettingsRepository } from './providers/settings-repository.provider';
import { AuthRepository } from './providers/auth-repository.provider';
import { ChatRepository } from './providers/chat-repository.provider';
import { OpenClawChatClient } from './providers/openclaw-chat-client.provider';
import { SubscriptionRepository } from './providers/subscription.repository';
import { InstallationListener, MessageListener, ActionListener, ChatPortListener } from './listeners';
import { SubscriptionMonitorService } from './services/subscription-monitor.service';
import { SubscriptionFunctionHandler } from './services/subscription-functions.service';
import { SubscriptionChatMiddleware } from './middleware/subscription-chat.middleware';
import {
  GATEWAY_CHAT_ENDPOINT,
  GATEWAY_AGENT_ID,
  GATEWAY_MODEL,
} from '../constants/gateway.constants';
import {
  AUTH_INSTANCE_API_URL,
} from '../constants/auth.constants';

// 1. Initialize providers
const syncStorage = new ChromeStorageProvider('sync');
const localStorage = new ChromeStorageProvider('local');

const settingsRepo = new SettingsRepository(syncStorage);
const chatRepo = new ChatRepository(localStorage);
const subscriptionRepo = new SubscriptionRepository();

const authRepo = new AuthRepository(syncStorage, {
  instanceApiUrl: AUTH_INSTANCE_API_URL,
});

const chatClient = new OpenClawChatClient({
  baseUrl: '',
  chatEndpoint: GATEWAY_CHAT_ENDPOINT,
  authToken: '',
  agentId: GATEWAY_AGENT_ID,
  model: GATEWAY_MODEL,
});

// 2. Initialize use cases
const getSettingsUseCase = new GetSettingsUseCase(settingsRepo);
const updateSettingsUseCase = new UpdateSettingsUseCase(settingsRepo);
const resetSettingsUseCase = new ResetSettingsUseCase(settingsRepo);

// 3. Initialize subscription services
const subscriptionFunctions = new SubscriptionFunctionHandler(subscriptionRepo);
const subscriptionMiddleware = new SubscriptionChatMiddleware(subscriptionFunctions);

// 4. Register listeners
new InstallationListener(syncStorage).register();
new MessageListener({
  getSettingsUseCase,
  updateSettingsUseCase,
  resetSettingsUseCase,
  authRepository: authRepo,
}).register();
new ActionListener().register();
new ChatPortListener(chatClient, chatRepo, authRepo, subscriptionMiddleware).register();

// 5. Initialize subscription monitoring (async IIFE to avoid top-level await)
const subscriptionMonitor = new SubscriptionMonitorService(subscriptionRepo, chatRepo);
(async () => {
  await subscriptionMonitor.register();
  console.log('[ClawCancel] Background service worker initialized with subscription monitoring and AI integration.');
})();
