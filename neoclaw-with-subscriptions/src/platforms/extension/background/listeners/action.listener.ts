export class ActionListener {
  register(): void {
    chrome.action.onClicked.addListener(async () => {
      const tabUrl = chrome.runtime.getURL('src/platforms/extension/tab/index.html');

      // Check if the tab page is already open; if so, focus it
      const existingTabs = await chrome.tabs.query({ url: tabUrl });

      if (existingTabs.length > 0 && existingTabs[0].id !== undefined) {
        await chrome.tabs.update(existingTabs[0].id, { active: true });
        if (existingTabs[0].windowId !== undefined) {
          await chrome.windows.update(existingTabs[0].windowId, { focused: true });
        }
      } else {
        await chrome.tabs.create({ url: tabUrl });
      }
    });
  }
}
