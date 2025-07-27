// Content script for DOM Scanner Bot Extension
// Runs on all pages to provide DOM scanning capabilities

console.log('DOM Scanner Bot - Content script loaded');

// Listen for messages from background script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.type) {
    case 'SCAN_PAGE':
      scanCurrentPage(message.options || {}, sendResponse);
      return true;
      
    case 'HIGHLIGHT_ELEMENT':
      highlightElement(message.selector, message.highlight);
      break;
      
    case 'CLEAR_HIGHLIGHTS':
      clearHighlights();
      break;
      
    case 'GET_PAGE_INFO':
      getPageInfo(sendResponse);
      return true;
      
    case 'SIMULATE_CLICK':
      simulateClick(message.selector, sendResponse);
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Main DOM scanning function
function scanCurrentPage(options = {}, sendResponse) {
  try {
    const scanResults = {
      timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      elements: [],
      forms: [],
      links: [],
      images: [],
      structure: generateDOMStructure(options.depth || 3),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      }
    };
    
    // Scan interactive elements
    scanResults.elements = scanInteractiveElements(options);
    
    // Scan forms
    scanResults.forms = scanForms();
    
    // Scan links
    scanResults.links = scanLinks(options);
    
    // Scan images
    scanResults.images = scanImages(options);
    
    if (sendResponse) {
      sendResponse({
        success: true,
        data: scanResults
      });
    }
    
    return scanResults;
    
  } catch (error) {
    console.error('Page scan failed:', error);
    if (sendResponse) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
    return null;
  }
}

// Scan for interactive elements (buttons, inputs, clickable divs, etc.)
function scanInteractiveElements(options = {}) {
  const selectors = options.selectors || [
    'button',
    'input',
    'textarea',
    'select',
    'a[href]',
    '[role="button"]',
    '[onclick]',
    '.btn',
    '.button',
    '[data-testid]',
    '[aria-label]'
  ];
  
  const elements = [];
  
  selectors.forEach(selector => {
    try {
      const found = document.querySelectorAll(selector);
      found.forEach((element, index) => {
        const elementInfo = analyzeElement(element, selector, index);
        if (elementInfo && isElementInteractive(element)) {
          elements.push(elementInfo);
        }
      });
    } catch (error) {
      console.warn(`Failed to scan selector "${selector}":`, error);
    }
  });
  
  // Remove duplicates based on position and text
  return deduplicateElements(elements);
}

// Analyze a single element
function analyzeElement(element, originalSelector, index) {
  try {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    
    // Skip hidden elements
    if (rect.width === 0 && rect.height === 0) return null;
    if (style.visibility === 'hidden' || style.display === 'none') return null;
    
    const elementInfo = {
      // Basic info
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: Array.from(element.classList),
      selector: originalSelector,
      index: index,
      
      // Text content
      text: getElementText(element),
      value: element.value || null,
      placeholder: element.placeholder || null,
      
      // Attributes
      attributes: getRelevantAttributes(element),
      
      // Position and visibility
      position: {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        centerX: Math.round(rect.left + rect.width / 2 + window.scrollX),
        centerY: Math.round(rect.top + rect.height / 2 + window.scrollY)
      },
      
      // Visibility info
      visible: isElementVisible(element, rect),
      inViewport: isInViewport(rect),
      
      // Selectors for finding this element
      selectors: generateSelectors(element),
      
      // Context
      parent: getParentInfo(element),
      siblings: getSiblingCount(element),
      
      // Interaction info
      interactive: isElementInteractive(element),
      clickable: isElementClickable(element),
      formElement: isFormElement(element)
    };
    
    return elementInfo;
    
  } catch (error) {
    console.warn('Failed to analyze element:', error);
    return null;
  }
}

// Get clean text content from element
function getElementText(element) {
  let text = '';
  
  // Try aria-label first
  if (element.getAttribute('aria-label')) {
    text = element.getAttribute('aria-label').trim();
  }
  // Then try alt text for images
  else if (element.alt) {
    text = element.alt.trim();
  }
  // Then try title
  else if (element.title) {
    text = element.title.trim();
  }
  // Finally use text content
  else {
    text = element.textContent?.trim() || '';
  }
  
  // Limit length and clean up
  return text.substring(0, 200).replace(/\s+/g, ' ').trim();
}

// Get relevant attributes for an element
function getRelevantAttributes(element) {
  const relevantAttrs = [
    'type', 'name', 'href', 'src', 'alt', 'title', 'role', 
    'aria-label', 'aria-describedby', 'data-testid', 'data-test',
    'onclick', 'onsubmit', 'target', 'method', 'action'
  ];
  
  const attributes = {};
  relevantAttrs.forEach(attr => {
    if (element.hasAttribute(attr)) {
      attributes[attr] = element.getAttribute(attr);
    }
  });
  
  return attributes;
}

// Check if element is visible
function isElementVisible(element, rect) {
  const style = getComputedStyle(element);
  return rect.width > 0 && 
         rect.height > 0 && 
         style.visibility !== 'hidden' && 
         style.display !== 'none' &&
         style.opacity !== '0';
}

// Check if element is in viewport
function isInViewport(rect) {
  return rect.top >= 0 &&
         rect.left >= 0 &&
         rect.bottom <= window.innerHeight &&
         rect.right <= window.innerWidth;
}

// Generate multiple selectors for finding an element
function generateSelectors(element) {
  const selectors = [];
  
  // ID selector
  if (element.id) {
    selectors.push(`#${element.id}`);
  }
  
  // Class selector
  if (element.className) {
    const classes = Array.from(element.classList).filter(c => c.length > 0);
    if (classes.length > 0) {
      selectors.push(`.${classes.join('.')}`);
    }
  }
  
  // Attribute selectors
  ['name', 'data-testid', 'aria-label'].forEach(attr => {
    if (element.hasAttribute(attr)) {
      selectors.push(`[${attr}="${element.getAttribute(attr)}"]`);
    }
  });
  
  // XPath
  selectors.push(getXPathForElement(element));
  
  // CSS path
  selectors.push(getCSSPath(element));
  
  return selectors;
}

// Generate XPath for element
function getXPathForElement(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    const tagName = element.tagName.toLowerCase();
    const siblings = Array.from(element.parentNode?.children || [])
      .filter(e => e.tagName === element.tagName);
    
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      path.unshift(`${tagName}[${index}]`);
    } else {
      path.unshift(tagName);
    }
    
    element = element.parentElement;
  }
  
  return '/' + path.join('/');
}

// Generate CSS path
function getCSSPath(element) {
  const path = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += `#${element.id}`;
      path.unshift(selector);
      break;
    }
    
    if (element.className) {
      const classes = Array.from(element.classList).filter(c => c.length > 0);
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`;
      }
    }
    
    path.unshift(selector);
    element = element.parentElement;
  }
  
  return path.join(' > ');
}

// Get parent element info
function getParentInfo(element) {
  const parent = element.parentElement;
  if (!parent) return null;
  
  return {
    tag: parent.tagName.toLowerCase(),
    id: parent.id || null,
    classes: Array.from(parent.classList)
  };
}

// Get sibling count
function getSiblingCount(element) {
  return element.parentElement ? element.parentElement.children.length - 1 : 0;
}

// Check if element is interactive
function isElementInteractive(element) {
  const interactiveTags = ['button', 'input', 'textarea', 'select', 'a'];
  const interactiveRoles = ['button', 'link', 'checkbox', 'radio', 'textbox'];
  
  return interactiveTags.includes(element.tagName.toLowerCase()) ||
         interactiveRoles.includes(element.getAttribute('role')) ||
         element.hasAttribute('onclick') ||
         element.hasAttribute('onsubmit') ||
         getComputedStyle(element).cursor === 'pointer';
}

// Check if element is clickable
function isElementClickable(element) {
  return element.tagName.toLowerCase() === 'button' ||
         element.tagName.toLowerCase() === 'a' ||
         element.getAttribute('role') === 'button' ||
         element.hasAttribute('onclick') ||
         getComputedStyle(element).cursor === 'pointer';
}

// Check if element is a form element
function isFormElement(element) {
  const formTags = ['input', 'textarea', 'select', 'button'];
  return formTags.includes(element.tagName.toLowerCase()) ||
         element.closest('form') !== null;
}

// Scan forms on the page
function scanForms() {
  const forms = [];
  document.querySelectorAll('form').forEach((form, index) => {
    const formInfo = {
      index: index,
      id: form.id || null,
      classes: Array.from(form.classList),
      action: form.action || null,
      method: form.method || 'get',
      fields: [],
      selectors: generateSelectors(form)
    };
    
    // Scan form fields
    form.querySelectorAll('input, textarea, select').forEach(field => {
      const fieldInfo = analyzeElement(field, 'form-field', 0);
      if (fieldInfo) {
        formInfo.fields.push(fieldInfo);
      }
    });
    
    forms.push(formInfo);
  });
  
  return forms;
}

// Scan links on the page
function scanLinks(options = {}) {
  const links = [];
  document.querySelectorAll('a[href]').forEach((link, index) => {
    const linkInfo = analyzeElement(link, 'link', index);
    if (linkInfo && linkInfo.visible) {
      linkInfo.href = link.href;
      linkInfo.target = link.target || '_self';
      linkInfo.external = !link.href.startsWith(window.location.origin);
      links.push(linkInfo);
    }
  });
  
  return links.slice(0, options.maxLinks || 100);
}

// Scan images on the page
function scanImages(options = {}) {
  const images = [];
  document.querySelectorAll('img').forEach((img, index) => {
    const rect = img.getBoundingClientRect();
    if (rect.width > 10 && rect.height > 10) { // Skip tiny images
      const imageInfo = {
        index: index,
        src: img.src,
        alt: img.alt || null,
        title: img.title || null,
        position: {
          x: Math.round(rect.left + window.scrollX),
          y: Math.round(rect.top + window.scrollY),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        visible: isElementVisible(img, rect)
      };
      images.push(imageInfo);
    }
  });
  
  return images.slice(0, options.maxImages || 50);
}

// Generate simplified DOM structure
function generateDOMStructure(maxDepth = 3) {
  function analyzeElement(element, depth = 0) {
    if (depth > maxDepth || !element) return null;
    
    const info = {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: Array.from(element.classList).slice(0, 5), // Limit classes
      childCount: element.children.length,
      hasText: (element.textContent?.trim().length || 0) > 0,
      interactive: isElementInteractive(element)
    };
    
    // Only include children for important structural elements
    const importantTags = ['body', 'main', 'section', 'article', 'div', 'form', 'nav'];
    if (depth < maxDepth && importantTags.includes(info.tag) && element.children.length > 0) {
      info.children = Array.from(element.children)
        .slice(0, 10) // Limit children per element
        .map(child => analyzeElement(child, depth + 1))
        .filter(child => child !== null);
    }
    
    return info;
  }
  
  return analyzeElement(document.body);
}

// Remove duplicate elements
function deduplicateElements(elements) {
  const seen = new Set();
  return elements.filter(element => {
    const key = `${element.position.x},${element.position.y},${element.text}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Highlight a specific element
function highlightElement(selector, highlight = true) {
  try {
    const element = document.querySelector(selector);
    if (element) {
      if (highlight) {
        element.style.outline = '2px solid #ff4444';
        element.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        element.style.outline = '';
        element.style.backgroundColor = '';
      }
    }
  } catch (error) {
    console.error('Failed to highlight element:', error);
  }
}

// Clear all highlights
function clearHighlights() {
  document.querySelectorAll('*').forEach(el => {
    el.style.outline = '';
    el.style.backgroundColor = '';
  });
  
  // Remove highlight overlays
  document.querySelectorAll('.dom-scanner-highlight').forEach(el => el.remove());
}

// Get basic page information
function getPageInfo(sendResponse) {
  const pageInfo = {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    readyState: document.readyState,
    elementCount: document.querySelectorAll('*').length,
    interactive: document.readyState === 'complete',
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    }
  };
  
  if (sendResponse) {
    sendResponse({ success: true, data: pageInfo });
  }
  
  return pageInfo;
}

// Simulate click on element
function simulateClick(selector, sendResponse) {
  try {
    const element = document.querySelector(selector);
    if (element) {
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Wait a bit then click
      setTimeout(() => {
        element.click();
        if (sendResponse) {
          sendResponse({ success: true, message: 'Element clicked' });
        }
      }, 500);
    } else {
      if (sendResponse) {
        sendResponse({ success: false, error: 'Element not found' });
      }
    }
  } catch (error) {
    console.error('Failed to simulate click:', error);
    if (sendResponse) {
      sendResponse({ success: false, error: error.message });
    }
  }
}

// Auto-scan page when loaded (if enabled)
chrome.storage.sync.get(['autoScan'], (result) => {
  if (result.autoScan) {
    console.log('Auto-scanning page...');
    setTimeout(() => {
      scanCurrentPage({}, null);
    }, 1000);
  }
});

// Make functions available globally for testing
window.domScanner = {
  scan: scanCurrentPage,
  highlight: highlightElement,
  clearHighlights: clearHighlights,
  getPageInfo: getPageInfo
};