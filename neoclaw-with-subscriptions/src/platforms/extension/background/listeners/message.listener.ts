import type {
  GetSettingsUseCase,
  UpdateSettingsUseCase,
  ResetSettingsUseCase,
  ISubscriptionRepository,
} from '@/core';
import { MessageType } from '../../types';
import type { ExtensionMessage, ExtensionResponse } from '../../types';

interface MessageListenerDeps {
  getSettingsUseCase: GetSettingsUseCase;
  updateSettingsUseCase: UpdateSettingsUseCase;
  resetSettingsUseCase: ResetSettingsUseCase;
  subscriptionRepository: ISubscriptionRepository;
}

export class MessageListener {
  private deps: MessageListenerDeps;

  constructor(deps: MessageListenerDeps) {
    this.deps = deps;
  }

  register(): void {
    chrome.runtime.onMessage.addListener(
      (
        message: ExtensionMessage,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (response: ExtensionResponse) => void,
      ) => {
        this.handleMessage(message)
          .then(sendResponse)
          .catch((error) => {
            sendResponse({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });

        // Return true to indicate async response
        return true;
      },
    );
  }

  private async handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
    switch (message.type) {
      case MessageType.GET_SETTINGS: {
        const settings = await this.deps.getSettingsUseCase.execute();
        return { success: true, data: settings };
      }

      case MessageType.UPDATE_SETTINGS: {
        const updated = await this.deps.updateSettingsUseCase.execute(message.payload);
        return { success: true, data: updated };
      }

      case MessageType.RESET_SETTINGS: {
        const reset = await this.deps.resetSettingsUseCase.execute();
        return { success: true, data: reset };
      }

      case MessageType.GET_SUBSCRIPTION_REPORT: {
        const report = await this.deps.subscriptionRepository.getReport();
        return { success: true, data: report };
      }

      default:
        return { success: false, error: `Unknown message type: ${(message as { type: string }).type}` };
    }
  }
}
