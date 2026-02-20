// NeoClaw Content Script
// Runs in the context of web pages matched by manifest.json content_scripts

// Listen for messages from the background service worker
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: unknown },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { success: boolean; data?: unknown }) => void,
  ) => {
    switch (message.type) {
      case 'PING':
        sendResponse({ success: true, data: { status: 'alive' } });
        break;
      default:
        sendResponse({ success: true });
    }

    return true;
  },
);

console.log('[NeoClaw] Content script loaded.');
