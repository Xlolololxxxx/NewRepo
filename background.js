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