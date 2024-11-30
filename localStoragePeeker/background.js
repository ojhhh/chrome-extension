chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refreshPage") {
    const { tabId } = message;

    chrome.browsingData.remove({}, { cache: true }, () => {
      chrome.tabs.reload(tabId, { bypassCache: true }, () => {
        sendResponse({ success: true });
      });
    });

    return true;
  }
});
