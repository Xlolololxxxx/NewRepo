// Background service worker for DOM Scanner Bot Extension
// Handles extension lifecycle and communication between components

console.log('DOM Scanner Bot Extension - Background script loaded');

// Extension installation/startup
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
  
  // Initialize default settings
  chrome.storage.sync.set({
    scanDepth: 5,
    highlightElements: true,
    autoScan: false,
    selectedSelectors: ['button', 'input', 'a', 'div[role="button"]']
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'SCAN_DOM':
      handleDomScan(message.data, sender.tab.id, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'GET_SETTINGS':
      getSettings(sendResponse);
      return true;
      
    case 'UPDATE_SETTINGS':
      updateSettings(message.data, sendResponse);
      return true;
      
    case 'HIGHLIGHT_ELEMENTS':
      highlightElements(message.data, sender.tab.id);
      break;

    // Browser automation control messages
    case 'LAUNCH_AUTOMATION_BROWSER':
      handleBrowserLaunch(message.config, sendResponse);
      return true;
      
    case 'CLOSE_AUTOMATION_BROWSER':
      handleBrowserClose(sendResponse);
      return true;
      
    case 'BROWSER_ACTION':
      handleBrowserAction(message, sendResponse);
      return true;
      
    case 'GET_BROWSER_STATUS':
      handleGetBrowserStatus(sendResponse);
      return true;
      
    case 'CHECK_PATH_EXISTS':
      handleCheckPathExists(message.path, sendResponse);
      return true;
      
    case 'GET_CHROME_PROFILE_INFO':
      handleGetChromeProfileInfo(sendResponse);
      return true;
      
    case 'GET_CURRENT_PAGE_STATE':
      handleGetCurrentPageState(sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Handle DOM scanning request
async function handleDomScan(data, tabId, sendResponse) {
  try {
    // Get current settings
    const settings = await chrome.storage.sync.get();
    
    // Inject content script if needed and trigger scan
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: performDomScan,
      args: [settings]
    });
    
    const scanResults = results[0].result;
    
    // Store scan results
    await chrome.storage.local.set({
      [`scan_${tabId}_${Date.now()}`]: scanResults
    });
    
    sendResponse({
      success: true,
      data: scanResults
    });
    
  } catch (error) {
    console.error('DOM scan failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Function injected into page to perform DOM scan
function performDomScan(settings) {
  const scanResults = {
    timestamp: Date.now(),
    url: window.location.href,
    title: document.title,
    elements: [],
    structure: null
  };
  
  // Scan for interactive elements
  const selectors = settings.selectedSelectors || ['button', 'input', 'a', 'div[role="button"]'];
  const elements = [];
  
  selectors.forEach(selector => {
    const found = document.querySelectorAll(selector);
    found.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const elementInfo = {
        selector: selector,
        index: index,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classes: Array.from(el.classList),
        text: el.textContent?.trim().substring(0, 100) || '',
        attributes: {},
        position: {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        },
        visible: rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden',
        xpath: getXPath(el)
      };
      
      // Get important attributes
      ['href', 'type', 'value', 'placeholder', 'role', 'aria-label'].forEach(attr => {
        if (el.hasAttribute(attr)) {
          elementInfo.attributes[attr] = el.getAttribute(attr);
        }
      });
      
      elements.push(elementInfo);
    });
  });
  
  scanResults.elements = elements;
  
  // Generate page structure summary
  scanResults.structure = generatePageStructure(settings.scanDepth || 5);
  
  return scanResults;
}

// Generate XPath for element
function getXPath(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    const tagName = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentNode?.children || []).filter(e => e.tagName === element.tagName);
    const index = siblings.indexOf(element) + 1;
    
    if (siblings.length > 1) {
      path.unshift(`${tagName}[${index}]`);
    } else {
      path.unshift(tagName);
    }
    
    element = element.parentElement;
  }
  
  return '/' + path.join('/');
}

// Generate simplified page structure
function generatePageStructure(maxDepth) {
  function analyzeElement(element, depth = 0) {
    if (depth > maxDepth) return null;
    
    const info = {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: Array.from(element.classList),
      childCount: element.children.length,
      children: []
    };
    
    if (depth < maxDepth) {
      Array.from(element.children).forEach(child => {
        const childInfo = analyzeElement(child, depth + 1);
        if (childInfo) info.children.push(childInfo);
      });
    }
    
    return info;
  }
  
  return analyzeElement(document.body);
}

// Get settings from storage
async function getSettings(sendResponse) {
  try {
    const settings = await chrome.storage.sync.get();
    sendResponse({ success: true, data: settings });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Update settings in storage
async function updateSettings(newSettings, sendResponse) {
  try {
    await chrome.storage.sync.set(newSettings);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Highlight elements on page
async function highlightElements(elementData, tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: highlightPageElements,
      args: [elementData]
    });
  } catch (error) {
    console.error('Failed to highlight elements:', error);
  }
}

// Function to highlight elements on page
function highlightPageElements(elements) {
  // Remove existing highlights
  document.querySelectorAll('.dom-scanner-highlight').forEach(el => el.remove());
  
  elements.forEach((elementInfo, index) => {
    try {
      let element = null;
      
      // Try to find element by ID first
      if (elementInfo.id) {
        element = document.getElementById(elementInfo.id);
      }
      
      // Try xpath
      if (!element && elementInfo.xpath) {
        element = document.evaluate(elementInfo.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      }
      
      if (element) {
        const highlight = document.createElement('div');
        highlight.className = 'dom-scanner-highlight';
        highlight.style.cssText = `
          position: absolute;
          border: 2px solid #ff4444;
          background: rgba(255, 68, 68, 0.1);
          z-index: 10000;
          pointer-events: none;
          box-sizing: border-box;
        `;
        
        const rect = element.getBoundingClientRect();
        highlight.style.left = (rect.left + window.scrollX) + 'px';
        highlight.style.top = (rect.top + window.scrollY) + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        
        // Add element info tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position: absolute;
          top: -25px;
          left: 0;
          background: #333;
          color: white;
          padding: 2px 6px;
          font-size: 11px;
          border-radius: 3px;
          white-space: nowrap;
        `;
        tooltip.textContent = `${elementInfo.tag}${elementInfo.id ? '#' + elementInfo.id : ''}`;
        highlight.appendChild(tooltip);
        
        document.body.appendChild(highlight);
      }
    } catch (error) {
      console.error('Failed to highlight element:', elementInfo, error);
    }
  });
}

// Browser Automation Management
let automationBrowser = null;
let automationPage = null;

// Handle browser launch for automation
async function handleBrowserLaunch(config, sendResponse) {
  try {
    if (automationBrowser) {
      sendResponse({ 
        success: false, 
        error: 'Automation browser already running. Close it first.' 
      });
      return;
    }

    console.log('Launching automation browser with config:', config);
    
    // Since we're in a Chrome extension, we can't directly use Puppeteer
    // Instead, we'll create a new Chrome window with specific parameters
    const windowConfig = {
      url: 'about:blank',
      type: 'normal',
      focused: !config.headless,
      state: config.headless ? 'minimized' : 'normal',
      width: config.defaultViewport ? config.defaultViewport.width : 1280,
      height: config.defaultViewport ? config.defaultViewport.height : 720
    };

    const window = await chrome.windows.create(windowConfig);
    const tab = window.tabs[0];

    // Store automation browser info
    automationBrowser = {
      windowId: window.id,
      tabId: tab.id,
      config: config,
      isHeadless: config.headless,
      profilePath: extractProfilePath(config.args)
    };

    // If headless mode, minimize the window
    if (config.headless) {
      await chrome.windows.update(window.id, { state: 'minimized' });
    }

    sendResponse({ 
      success: true, 
      browser: { windowId: window.id, tabId: tab.id },
      page: { tabId: tab.id }
    });

  } catch (error) {
    console.error('Failed to launch automation browser:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// Handle browser close
async function handleBrowserClose(sendResponse) {
  try {
    if (!automationBrowser) {
      sendResponse({ success: true, message: 'No automation browser running' });
      return;
    }

    await chrome.windows.remove(automationBrowser.windowId);
    automationBrowser = null;
    automationPage = null;

    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to close automation browser:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle browser actions
async function handleBrowserAction(message, sendResponse) {
  try {
    if (!automationBrowser) {
      sendResponse({ success: false, error: 'No automation browser running' });
      return;
    }

    const { action, selector, value, options } = message;
    const tabId = automationBrowser.tabId;

    let result;
    switch (action) {
      case 'click':
        result = await executeClick(tabId, selector, options);
        break;
      case 'type':
        result = await executeType(tabId, selector, value, options);
        break;
      case 'select':
        result = await executeSelect(tabId, selector, value, options);
        break;
      case 'wait':
        result = await executeWait(tabId, message.condition, options);
        break;
      case 'navigate':
        result = await executeNavigate(tabId, message.url, options);
        break;
      case 'scroll':
        result = await executeScroll(tabId, options);
        break;
      case 'screenshot':
        result = await executeScreenshot(tabId, options);
        break;
      case 'evaluate':
        result = await executeEvaluate(tabId, message.script, options);
        break;
      default:
        throw new Error(`Unknown browser action: ${action}`);
    }

    sendResponse({ success: true, result: result });
  } catch (error) {
    console.error('Browser action failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Browser action implementations
async function executeClick(tabId, selector, options = {}) {
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (selector, options) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        throw new Error(`Element not visible: ${selector}`);
      }
      
      element.click();
      return { clicked: true, selector: selector };
    },
    args: [selector, options]
  });
  
  return results[0].result;
}

async function executeType(tabId, selector, value, options = {}) {
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (selector, value, options) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      // Clear existing value if specified
      if (options.clear !== false) {
        element.value = '';
      }
      
      // Focus element
      element.focus();
      
      // Set value
      if (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea') {
        element.value = value;
        
        // Trigger input events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        element.textContent = value;
      }
      
      return { typed: true, selector: selector, value: value };
    },
    args: [selector, value, options]
  });
  
  return results[0].result;
}

async function executeSelect(tabId, selector, value, options = {}) {
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (selector, value, options) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      
      if (element.tagName.toLowerCase() !== 'select') {
        throw new Error(`Element is not a select: ${selector}`);
      }
      
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      return { selected: true, selector: selector, value: value };
    },
    args: [selector, value, options]
  });
  
  return results[0].result;
}

async function executeWait(tabId, condition, options = {}) {
  const timeout = options.timeout || 30000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (condition) => {
          if (typeof condition === 'string') {
            // Wait for selector
            const element = document.querySelector(condition);
            return element && element.offsetParent !== null;
          } else if (typeof condition === 'number') {
            // Wait for time
            return true;
          }
          return false;
        },
        args: [condition]
      });
      
      if (results[0].result) {
        return { waited: true, condition: condition };
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Wait condition check failed:', error);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  throw new Error(`Wait timeout after ${timeout}ms for condition: ${condition}`);
}

async function executeNavigate(tabId, url, options = {}) {
  await chrome.tabs.update(tabId, { url: url });
  
  // Wait for navigation to complete
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Navigation timeout'));
    }, options.timeout || 30000);
    
    const listener = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);
        resolve({ navigated: true, url: url });
      }
    };
    
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function executeScroll(tabId, options = {}) {
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (options) => {
      const scrollX = options.x || 0;
      const scrollY = options.y || window.innerHeight;
      
      window.scrollBy(scrollX, scrollY);
      
      return { 
        scrolled: true, 
        x: scrollX, 
        y: scrollY,
        currentScrollX: window.scrollX,
        currentScrollY: window.scrollY
      };
    },
    args: [options]
  });
  
  return results[0].result;
}

async function executeScreenshot(tabId, options = {}) {
  const screenshotData = await chrome.tabs.captureVisibleTab(
    automationBrowser.windowId,
    { format: 'png', quality: options.quality || 90 }
  );
  
  return { 
    screenshot: true, 
    data: screenshotData,
    format: 'png'
  };
}

async function executeEvaluate(tabId, script, options = {}) {
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: new Function('options', script),
    args: [options]
  });
  
  return results[0].result;
}

// Get browser status
async function handleGetBrowserStatus(sendResponse) {
  const status = {
    isActive: !!automationBrowser,
    browser: automationBrowser,
    timestamp: Date.now()
  };
  
  if (automationBrowser) {
    try {
      const tab = await chrome.tabs.get(automationBrowser.tabId);
      status.currentUrl = tab.url;
      status.title = tab.title;
    } catch (error) {
      status.error = 'Browser tab not accessible';
    }
  }
  
  sendResponse({ status: status });
}

// Handle path existence check
async function handleCheckPathExists(path, sendResponse) {
  // In Chrome extension context, we can't directly check file system paths
  // This would need to be implemented with native messaging or file API
  sendResponse({ exists: false, message: 'Path checking not available in extension context' });
}

// Handle Chrome profile info
async function handleGetChromeProfileInfo(sendResponse) {
  try {
    // Try to get profile information from Chrome APIs
    const profileInfo = {
      path: null,
      name: 'Default',
      isDefault: true
    };
    
    // In a real implementation, this would need native messaging
    // or additional permissions to access profile information
    
    sendResponse({ profileInfo: profileInfo });
  } catch (error) {
    sendResponse({ profileInfo: null, error: error.message });
  }
}

// Handle current page state
async function handleGetCurrentPageState(sendResponse) {
  try {
    if (!automationBrowser) {
      sendResponse({ pageState: null, error: 'No automation browser running' });
      return;
    }
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: automationBrowser.tabId },
      func: () => {
        return {
          url: window.location.href,
          title: document.title,
          readyState: document.readyState,
          elementCount: document.querySelectorAll('*').length,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY
          }
        };
      }
    });
    
    sendResponse({ pageState: results[0].result });
  } catch (error) {
    sendResponse({ pageState: null, error: error.message });
  }
}

// Utility function to extract profile path from launch args
function extractProfilePath(args) {
  if (!args) return null;
  
  const userDataArg = args.find(arg => arg.startsWith('--user-data-dir='));
  return userDataArg ? userDataArg.split('=')[1] : null;
}