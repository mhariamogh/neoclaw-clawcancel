import type {
  GetSettingsUseCase,
  UpdateSettingsUseCase,
  ResetSettingsUseCase,
  IAuthRepository,
} from '@/core';
import { MessageType } from '../../types';
import type { ExtensionMessage, ExtensionResponse } from '../../types';
import { AuthError } from '../providers/auth-repository.provider';

interface MessageListenerDeps {
  getSettingsUseCase: GetSettingsUseCase;
  updateSettingsUseCase: UpdateSettingsUseCase;
  resetSettingsUseCase: ResetSettingsUseCase;
  authRepository: IAuthRepository;
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
              errorKind: error instanceof AuthError ? error.kind : 'error',
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

      case MessageType.GET_AUTH_STATE: {
        const authState = await this.deps.authRepository.getAuthState();
        return { success: true, data: authState };
      }

      case MessageType.LOGIN: {
        const authState = await this.deps.authRepository.login(message.username, message.password);
        return { success: true, data: authState };
      }

      case MessageType.LOGOUT: {
        const authState = await this.deps.authRepository.logout();
        return { success: true, data: authState };
      }

      default:
        return { success: false, error: `Unknown message type: ${(message as { type: string }).type}` };
    }
  }
}
