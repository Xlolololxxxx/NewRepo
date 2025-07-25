chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Agent extension installed.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'get_bookmarks') {
    chrome.bookmarks.getTree((bookmarks) => {
      sendResponse({ bookmarks: bookmarks });
    });
    return true; // Indicates that the response is sent asynchronously
  } else if (request.message === 'get_history') {
    chrome.history.search({ text: '', maxResults: 100 }, (history) => {
      sendResponse({ history: history });
    });
    return true; // Indicates that the response is sent asynchronously
  }
});
