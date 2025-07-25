// DOM Scanner utility functions
// This file provides additional utilities for DOM analysis and bot automation

class DOMScanner {
  constructor(options = {}) {
    this.options = {
      maxDepth: options.maxDepth || 5,
      includeHidden: options.includeHidden || false,
      scanIntervals: options.scanIntervals || 1000,
      autoHighlight: options.autoHighlight || false,
      ...options
    };
    
    this.scanHistory = [];
    this.observers = [];
  }

  // Advanced DOM scanning with machine learning-like pattern recognition
  async performAdvancedScan() {
    const scan = {
      timestamp: Date.now(),
      url: window.location.href,
      patterns: this.detectUIPatterns(),
      interactiveElements: this.findInteractiveElements(),
      formStructure: this.analyzeFormStructure(),
      navigationElements: this.findNavigationElements(),
      contentBlocks: this.identifyContentBlocks(),
      dataElements: this.findDataElements(),
      botActions: this.generateBotActions()
    };
    
    this.scanHistory.push(scan);
    return scan;
  }

  // Detect common UI patterns (navigation, forms, lists, etc.)
  detectUIPatterns() {
    const patterns = {
      navigation: this.findNavigationPatterns(),
      forms: this.findFormPatterns(),
      lists: this.findListPatterns(),
      modals: this.findModalPatterns(),
      tabs: this.findTabPatterns(),
      carousels: this.findCarouselPatterns(),
      dataTable: this.findDataTablePatterns()
    };
    
    return patterns;
  }

  // Find navigation patterns
  findNavigationPatterns() {
    const navElements = [];
    
    // Find nav elements
    document.querySelectorAll('nav, [role="navigation"], .nav, .navbar, .menu').forEach(nav => {
      navElements.push({
        type: 'navigation',
        element: this.getElementInfo(nav),
        links: Array.from(nav.querySelectorAll('a')).map(link => this.getElementInfo(link)),
        structure: this.analyzeNavigationStructure(nav)
      });
    });
    
    return navElements;
  }

  // Find form patterns and analyze their structure
  findFormPatterns() {
    const forms = [];
    
    document.querySelectorAll('form').forEach(form => {
      const formInfo = {
        type: 'form',
        element: this.getElementInfo(form),
        fields: this.analyzeFormFields(form),
        validation: this.detectFormValidation(form),
        submitActions: this.findSubmitActions(form),
        botStrategy: this.generateFormBotStrategy(form)
      };
      
      forms.push(formInfo);
    });
    
    return forms;
  }

  // Analyze form fields in detail
  analyzeFormFields(form) {
    const fields = [];
    
    form.querySelectorAll('input, textarea, select').forEach(field => {
      const fieldInfo = {
        ...this.getElementInfo(field),
        type: field.type || field.tagName.toLowerCase(),
        required: field.required,
        validation: this.getFieldValidation(field),
        autoComplete: field.autocomplete,
        placeholder: field.placeholder,
        options: this.getFieldOptions(field),
        botValue: this.suggestBotValue(field)
      };
      
      fields.push(fieldInfo);
    });
    
    return fields;
  }

  // Generate bot-friendly action suggestions
  generateBotActions() {
    const actions = [];
    
    // Find clickable elements with high confidence
    document.querySelectorAll('button, [role="button"], .btn, input[type="submit"]').forEach(element => {
      if (this.isElementVisible(element) && this.isElementClickable(element)) {
        actions.push({
          type: 'click',
          confidence: this.calculateClickConfidence(element),
          element: this.getElementInfo(element),
          description: this.generateActionDescription(element),
          preconditions: this.getActionPreconditions(element),
          expectedOutcome: this.predictActionOutcome(element)
        });
      }
    });
    
    // Find input elements with suggested values
    document.querySelectorAll('input, textarea').forEach(element => {
      if (this.isElementVisible(element) && !element.disabled && !element.readOnly) {
        actions.push({
          type: 'input',
          confidence: this.calculateInputConfidence(element),
          element: this.getElementInfo(element),
          suggestedValue: this.suggestBotValue(element),
          description: this.generateInputDescription(element)
        });
      }
    });
    
    return actions.sort((a, b) => b.confidence - a.confidence);
  }

  // Calculate confidence score for click actions
  calculateClickConfidence(element) {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for buttons
    if (element.tagName === 'BUTTON') confidence += 0.3;
    
    // Higher confidence for submit buttons
    if (element.type === 'submit') confidence += 0.2;
    
    // Higher confidence for elements with clear text
    const text = this.getElementText(element);
    if (text && text.length > 0 && text.length < 50) confidence += 0.2;
    
    // Higher confidence for common button classes
    const buttonClasses = ['btn', 'button', 'submit', 'primary', 'cta'];
    if (buttonClasses.some(cls => element.className.includes(cls))) confidence += 0.1;
    
    // Lower confidence for disabled elements
    if (element.disabled) confidence -= 0.5;
    
    // Higher confidence for elements in viewport
    if (this.isInViewport(element)) confidence += 0.1;
    
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  // Generate human-readable descriptions for actions
  generateActionDescription(element) {
    const text = this.getElementText(element);
    const tag = element.tagName.toLowerCase();
    const type = element.type || '';
    
    if (text) {
      return `Click "${text}" ${tag}`;
    } else if (type) {
      return `Click ${type} ${tag}`;
    } else {
      return `Click ${tag} element`;
    }
  }

  // Suggest appropriate values for input fields
  suggestBotValue(field) {
    const type = field.type || field.tagName.toLowerCase();
    const name = field.name || '';
    const placeholder = field.placeholder || '';
    const label = this.findFieldLabel(field);
    
    // Common field patterns
    const patterns = {
      email: /email|e-mail|mail/i,
      password: /password|pass|pwd/i,
      name: /name|title|label/i,
      phone: /phone|tel|mobile/i,
      address: /address|street|city|zip|postal/i,
      age: /age/i,
      date: /date|birth|dob/i,
      search: /search|query|find/i
    };
    
    // Suggest values based on field type and patterns
    if (type === 'email' || patterns.email.test(name + placeholder + label)) {
      return 'bot@example.com';
    } else if (type === 'password' || patterns.password.test(name + placeholder + label)) {
      return 'BotPassword123!';
    } else if (patterns.name.test(name + placeholder + label)) {
      return 'Bot User';
    } else if (patterns.phone.test(name + placeholder + label)) {
      return '555-0123';
    } else if (type === 'number' || patterns.age.test(name + placeholder + label)) {
      return '25';
    } else if (type === 'date' || patterns.date.test(name + placeholder + label)) {
      return '1990-01-01';
    } else if (patterns.search.test(name + placeholder + label)) {
      return 'test search';
    } else if (type === 'text' || type === 'textarea') {
      return 'Test input';
    }
    
    return null;
  }

  // Find label associated with form field
  findFieldLabel(field) {
    // Look for label element
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent.trim();
    }
    
    // Look for parent label
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();
    
    // Look for sibling label
    const sibling = field.previousElementSibling;
    if (sibling && sibling.tagName === 'LABEL') {
      return sibling.textContent.trim();
    }
    
    return '';
  }

  // Start monitoring page changes for dynamic content
  startMonitoring() {
    // Observe DOM changes
    const observer = new MutationObserver((mutations) => {
      let hasSignificantChanges = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          hasSignificantChanges = true;
        }
      });
      
      if (hasSignificantChanges) {
        this.onPageChange();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden']
    });
    
    this.observers.push(observer);
  }

  // Handle page changes
  onPageChange() {
    console.log('DOM Scanner: Page changed, re-scanning...');
    
    // Debounce rescanning
    clearTimeout(this.rescanTimeout);
    this.rescanTimeout = setTimeout(() => {
      this.performAdvancedScan();
    }, this.options.scanIntervals);
  }

  // Stop monitoring
  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    clearTimeout(this.rescanTimeout);
  }

  // Helper method to get comprehensive element information
  getElementInfo(element) {
    const rect = element.getBoundingClientRect();
    
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: Array.from(element.classList),
      text: this.getElementText(element),
      attributes: this.getRelevantAttributes(element),
      position: {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      visible: this.isElementVisible(element),
      selectors: this.generateElementSelectors(element)
    };
  }

  // Get element text content
  getElementText(element) {
    return (element.textContent || element.value || element.alt || element.title || '').trim().substring(0, 100);
  }

  // Get relevant attributes
  getRelevantAttributes(element) {
    const attrs = {};
    const relevantAttrs = ['type', 'name', 'href', 'src', 'alt', 'title', 'role', 'aria-label', 'data-testid'];
    
    relevantAttrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        attrs[attr] = element.getAttribute(attr);
      }
    });
    
    return attrs;
  }

  // Check if element is visible
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           style.opacity !== '0';
  }

  // Check if element is clickable
  isElementClickable(element) {
    const clickableTags = ['button', 'a'];
    const clickableRoles = ['button', 'link'];
    
    return clickableTags.includes(element.tagName.toLowerCase()) ||
           clickableRoles.includes(element.getAttribute('role')) ||
           element.hasAttribute('onclick') ||
           getComputedStyle(element).cursor === 'pointer';
  }

  // Check if element is in viewport
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 &&
           rect.left >= 0 &&
           rect.bottom <= window.innerHeight &&
           rect.right <= window.innerWidth;
  }

  // Generate multiple selectors for an element
  generateElementSelectors(element) {
    const selectors = [];
    
    if (element.id) {
      selectors.push(`#${element.id}`);
    }
    
    if (element.className) {
      const classes = Array.from(element.classList).filter(c => c.length > 0);
      if (classes.length > 0) {
        selectors.push(`.${classes.join('.')}`);
      }
    }
    
    ['name', 'data-testid', 'aria-label'].forEach(attr => {
      if (element.hasAttribute(attr)) {
        selectors.push(`[${attr}="${element.getAttribute(attr)}"]`);
      }
    });
    
    return selectors;
  }

  // Export scan results for bot consumption
  exportForBot() {
    return {
      scanHistory: this.scanHistory,
      currentScan: this.scanHistory[this.scanHistory.length - 1],
      botInstructions: this.generateBotInstructions(),
      pageStructure: this.generatePageStructure()
    };
  }

  // Generate step-by-step instructions for a bot
  generateBotInstructions() {
    const currentScan = this.scanHistory[this.scanHistory.length - 1];
    if (!currentScan) return [];
    
    const instructions = [];
    
    // Prioritize actions by confidence and importance
    const sortedActions = currentScan.botActions.sort((a, b) => {
      return (b.confidence * this.getActionImportance(b)) - (a.confidence * this.getActionImportance(a));
    });
    
    sortedActions.forEach((action, index) => {
      instructions.push({
        step: index + 1,
        action: action.type,
        description: action.description,
        selector: action.element.selectors[0],
        value: action.suggestedValue || null,
        confidence: action.confidence,
        preconditions: action.preconditions || [],
        expectedOutcome: action.expectedOutcome || 'Action completed'
      });
    });
    
    return instructions;
  }

  // Calculate importance of an action for bot prioritization
  getActionImportance(action) {
    let importance = 1.0;
    
    // Submit buttons are very important
    if (action.element.attributes.type === 'submit') importance *= 2.0;
    
    // Primary buttons are important
    if (action.element.classes.some(cls => ['primary', 'main', 'cta'].includes(cls))) {
      importance *= 1.5;
    }
    
    // Form inputs are moderately important
    if (action.type === 'input') importance *= 1.2;
    
    return importance;
  }
}

// Make DOMScanner available globally
window.DOMScanner = DOMScanner;

// Auto-initialize if running in content script context
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
  window.domScanner = new DOMScanner({
    autoHighlight: true,
    scanIntervals: 2000
  });
  
  console.log('DOM Scanner utility loaded and initialized');
}