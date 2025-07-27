// Action Recording System for DOM Scanner Bot Extension
// Records user interactions and converts them to automation instructions

class ActionRecorder {
  constructor() {
    this.isRecording = false;
    this.recordedActions = [];
    this.currentSession = null;
    this.startTime = null;
    this.eventListeners = [];
    this.pageContext = {};
  }

  // Start recording user actions
  startRecording(sessionName = null) {
    if (this.isRecording) {
      console.warn('Recording already in progress');
      return false;
    }

    this.isRecording = true;
    this.recordedActions = [];
    this.startTime = Date.now();
    this.currentSession = sessionName || `session_${Date.now()}`;
    
    // Capture page context
    this.pageContext = {
      url: window.location.href,
      title: document.title,
      timestamp: this.startTime,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Setup event listeners
    this.setupEventListeners();
    
    console.log('Action recording started:', this.currentSession);
    return true;
  }

  // Stop recording
  stopRecording() {
    if (!this.isRecording) {
      console.warn('No recording in progress');
      return null;
    }

    this.isRecording = false;
    this.removeEventListeners();

    const session = {
      sessionName: this.currentSession,
      pageContext: this.pageContext,
      actions: this.recordedActions.slice(),
      duration: Date.now() - this.startTime,
      endTime: Date.now()
    };

    console.log('Action recording stopped. Recorded', this.recordedActions.length, 'actions');
    return session;
  }

  // Setup event listeners for recording
  setupEventListeners() {
    // Click events
    const clickListener = (event) => this.recordClick(event);
    document.addEventListener('click', clickListener, true);
    this.eventListeners.push({ element: document, type: 'click', listener: clickListener });

    // Input events
    const inputListener = (event) => this.recordInput(event);
    document.addEventListener('input', inputListener, true);
    this.eventListeners.push({ element: document, type: 'input', listener: inputListener });

    // Change events (for selects, checkboxes, radios)
    const changeListener = (event) => this.recordChange(event);
    document.addEventListener('change', changeListener, true);
    this.eventListeners.push({ element: document, type: 'change', listener: changeListener });

    // Form submissions
    const submitListener = (event) => this.recordSubmit(event);
    document.addEventListener('submit', submitListener, true);
    this.eventListeners.push({ element: document, type: 'submit', listener: submitListener });

    // Scroll events
    const scrollListener = (event) => this.recordScroll(event);
    document.addEventListener('scroll', scrollListener, true);
    this.eventListeners.push({ element: document, type: 'scroll', listener: scrollListener });

    // Key presses (for special keys)
    const keyListener = (event) => this.recordKeyPress(event);
    document.addEventListener('keydown', keyListener, true);
    this.eventListeners.push({ element: document, type: 'keydown', listener: keyListener });
  }

  // Remove event listeners
  removeEventListeners() {
    this.eventListeners.forEach(({ element, type, listener }) => {
      element.removeEventListener(type, listener, true);
    });
    this.eventListeners = [];
  }

  // Record click action
  recordClick(event) {
    if (!this.isRecording) return;

    const element = event.target;
    const elementInfo = this.getElementInfo(element);
    
    const action = {
      type: 'click',
      timestamp: Date.now() - this.startTime,
      element: elementInfo,
      coordinates: {
        x: event.clientX,
        y: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY
      },
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey
      },
      button: event.button // 0: left, 1: middle, 2: right
    };

    this.recordedActions.push(action);
    console.log('Recorded click:', action);
  }

  // Record input action
  recordInput(event) {
    if (!this.isRecording) return;

    const element = event.target;
    if (!this.isFormElement(element)) return;

    const elementInfo = this.getElementInfo(element);
    
    const action = {
      type: 'input',
      timestamp: Date.now() - this.startTime,
      element: elementInfo,
      value: element.value,
      inputType: element.type || 'text',
      previousValue: this.getPreviousValue(element)
    };

    // Debounce rapid input events
    const lastAction = this.recordedActions[this.recordedActions.length - 1];
    if (lastAction && 
        lastAction.type === 'input' && 
        lastAction.element.selectors[0] === elementInfo.selectors[0] &&
        (action.timestamp - lastAction.timestamp) < 1000) {
      // Update the last action instead of creating a new one
      lastAction.value = action.value;
      lastAction.timestamp = action.timestamp;
    } else {
      this.recordedActions.push(action);
    }

    console.log('Recorded input:', action);
  }

  // Record change action (selects, checkboxes, radios)
  recordChange(event) {
    if (!this.isRecording) return;

    const element = event.target;
    const elementInfo = this.getElementInfo(element);
    
    const action = {
      type: 'change',
      timestamp: Date.now() - this.startTime,
      element: elementInfo,
      value: this.getElementValue(element),
      changeType: element.type || element.tagName.toLowerCase()
    };

    this.recordedActions.push(action);
    console.log('Recorded change:', action);
  }

  // Record form submission
  recordSubmit(event) {
    if (!this.isRecording) return;

    const form = event.target;
    const formInfo = this.getElementInfo(form);
    
    const action = {
      type: 'submit',
      timestamp: Date.now() - this.startTime,
      element: formInfo,
      formData: this.getFormData(form),
      method: form.method || 'get',
      action: form.action || window.location.href
    };

    this.recordedActions.push(action);
    console.log('Recorded submit:', action);
  }

  // Record scroll action
  recordScroll(event) {
    if (!this.isRecording) return;

    // Throttle scroll events
    const now = Date.now();
    const lastScrollAction = this.recordedActions
      .filter(a => a.type === 'scroll')
      .pop();
    
    if (lastScrollAction && (now - (this.startTime + lastScrollAction.timestamp)) < 500) {
      return; // Skip this scroll event
    }

    const action = {
      type: 'scroll',
      timestamp: now - this.startTime,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      target: event.target === document ? 'window' : this.getElementInfo(event.target)
    };

    this.recordedActions.push(action);
    console.log('Recorded scroll:', action);
  }

  // Record special key presses
  recordKeyPress(event) {
    if (!this.isRecording) return;

    // Only record special keys, not regular typing
    const specialKeys = ['Enter', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    
    if (!specialKeys.includes(event.key)) return;

    const element = event.target;
    const elementInfo = this.getElementInfo(element);
    
    const action = {
      type: 'keypress',
      timestamp: Date.now() - this.startTime,
      element: elementInfo,
      key: event.key,
      code: event.code,
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey
      }
    };

    this.recordedActions.push(action);
    console.log('Recorded keypress:', action);
  }

  // Get comprehensive element information
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
      selectors: this.generateSelectors(element),
      xpath: this.getXPath(element)
    };
  }

  // Get element text content
  getElementText(element) {
    return (element.textContent || element.value || element.alt || element.title || '').trim().substring(0, 100);
  }

  // Get relevant attributes
  getRelevantAttributes(element) {
    const attrs = {};
    const relevantAttrs = ['type', 'name', 'href', 'src', 'alt', 'title', 'role', 'aria-label', 'data-testid', 'placeholder'];
    
    relevantAttrs.forEach(attr => {
      if (element.hasAttribute(attr)) {
        attrs[attr] = element.getAttribute(attr);
      }
    });
    
    return attrs;
  }

  // Generate multiple selectors for element
  generateSelectors(element) {
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
    
    // CSS path
    selectors.push(this.getCSSPath(element));
    
    return selectors;
  }

  // Generate XPath for element
  getXPath(element) {
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
  getCSSPath(element) {
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

  // Check if element is a form element
  isFormElement(element) {
    const formTags = ['input', 'textarea', 'select'];
    return formTags.includes(element.tagName.toLowerCase());
  }

  // Get element value (handles different input types)
  getElementValue(element) {
    const type = element.type || element.tagName.toLowerCase();
    
    switch (type) {
      case 'checkbox':
      case 'radio':
        return element.checked;
      case 'select-multiple':
        return Array.from(element.selectedOptions).map(option => option.value);
      default:
        return element.value;
    }
  }

  // Get previous value (for change detection)
  getPreviousValue(element) {
    return element.dataset.previousValue || '';
  }

  // Get form data
  getFormData(form) {
    const formData = {};
    const elements = form.querySelectorAll('input, textarea, select');
    
    elements.forEach(element => {
      const name = element.name || element.id;
      if (name) {
        formData[name] = this.getElementValue(element);
      }
    });
    
    return formData;
  }

  // Convert recorded actions to automation instructions
  generateAutomationInstructions(session = null) {
    const actions = session ? session.actions : this.recordedActions;
    const instructions = [];
    
    actions.forEach((action, index) => {
      const instruction = {
        step: index + 1,
        action: action.type,
        description: this.generateActionDescription(action),
        selector: action.element?.selectors?.[0] || '',
        value: action.value || null,
        timestamp: action.timestamp,
        alternatives: action.element?.selectors?.slice(1) || [],
        xpath: action.element?.xpath || null
      };
      
      // Add specific properties based on action type
      switch (action.type) {
        case 'click':
          instruction.coordinates = action.coordinates;
          instruction.button = action.button;
          break;
        case 'input':
          instruction.inputType = action.inputType;
          break;
        case 'scroll':
          instruction.scrollPosition = { x: action.scrollX, y: action.scrollY };
          break;
        case 'keypress':
          instruction.key = action.key;
          instruction.modifiers = action.modifiers;
          break;
      }
      
      instructions.push(instruction);
    });
    
    return instructions;
  }

  // Generate human-readable description for action
  generateActionDescription(action) {
    switch (action.type) {
      case 'click':
        const elementText = action.element.text || action.element.attributes?.['aria-label'] || '';
        return `Click ${action.element.tag}${elementText ? ` "${elementText}"` : ''}`;
      
      case 'input':
        return `Type "${action.value}" into ${action.element.tag}`;
      
      case 'change':
        return `Select "${action.value}" in ${action.element.tag}`;
      
      case 'submit':
        return `Submit form`;
      
      case 'scroll':
        return `Scroll to position (${action.scrollX}, ${action.scrollY})`;
      
      case 'keypress':
        return `Press ${action.key} key`;
      
      default:
        return `Perform ${action.type} action`;
    }
  }

  // Save recorded session to storage
  async saveSession(session = null) {
    const sessionToSave = session || {
      sessionName: this.currentSession,
      pageContext: this.pageContext,
      actions: this.recordedActions.slice(),
      duration: Date.now() - this.startTime,
      endTime: Date.now()
    };

    try {
      const existingSessions = await chrome.storage.local.get(['recordedSessions']);
      const sessions = existingSessions.recordedSessions || {};
      
      sessions[sessionToSave.sessionName] = sessionToSave;
      
      await chrome.storage.local.set({ recordedSessions: sessions });
      console.log('Session saved:', sessionToSave.sessionName);
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }

  // Load recorded sessions from storage
  async loadSessions() {
    try {
      const result = await chrome.storage.local.get(['recordedSessions']);
      return result.recordedSessions || {};
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return {};
    }
  }

  // Get current recording state
  getRecordingState() {
    return {
      isRecording: this.isRecording,
      currentSession: this.currentSession,
      actionsCount: this.recordedActions.length,
      duration: this.isRecording ? Date.now() - this.startTime : 0
    };
  }
}

// Create global instance
window.actionRecorder = new ActionRecorder();

// Make it available to extension
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('Action Recorder initialized');
}