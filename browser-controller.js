// Browser Controller for DOM Scanner Bot Extension
// Handles independent browser automation with profile support and headless mode

class BrowserController {
  constructor() {
    this.isActive = false;
    this.currentSession = null;
    this.browser = null;
    this.page = null;
    this.config = {
      headless: true,
      useProfile: true,
      profilePath: null,
      timeout: 30000,
      viewport: { width: 1280, height: 720 }
    };
    this.aiService = new AIService();
  }

  // Initialize browser controller with settings
  async initialize() {
    try {
      // Load settings from storage
      const settings = await chrome.storage.sync.get([
        'browserHeadless',
        'useUserProfile', 
        'automationTimeout',
        'profilePath'
      ]);
      
      this.config.headless = settings.browserHeadless !== false;
      this.config.useProfile = settings.useUserProfile !== false;
      this.config.timeout = settings.automationTimeout || 30000;
      this.config.profilePath = settings.profilePath;
      
      // Initialize AI service
      await this.aiService.initialize();
      
      console.log('Browser controller initialized:', this.config);
      return true;
    } catch (error) {
      console.error('Failed to initialize browser controller:', error);
      return false;
    }
  }

  // Detect Chrome profile path automatically
  async detectChromeProfile() {
    try {
      // Try to get profile path from Chrome's local state
      const profileInfo = await this.getSystemProfileInfo();
      
      if (profileInfo && profileInfo.path) {
        this.config.profilePath = profileInfo.path;
        await chrome.storage.sync.set({ profilePath: profileInfo.path });
        return profileInfo.path;
      }
      
      // Fallback to common profile locations
      const commonPaths = [
        `${process.env.USERPROFILE || process.env.HOME}/.config/google-chrome`,
        `${process.env.USERPROFILE || process.env.HOME}/Library/Application Support/Google/Chrome`,
        `${process.env.LOCALAPPDATA || process.env.HOME}/Google/Chrome/User Data`,
        `${process.env.HOME}/.config/google-chrome`
      ];
      
      for (const path of commonPaths) {
        if (await this.pathExists(path)) {
          this.config.profilePath = path;
          await chrome.storage.sync.set({ profilePath: path });
          return path;
        }
      }
      
      console.warn('Could not detect Chrome profile automatically');
      return null;
    } catch (error) {
      console.error('Failed to detect Chrome profile:', error);
      return null;
    }
  }

  // Launch browser with automation capabilities
  async launchBrowser() {
    if (this.isActive) {
      console.warn('Browser already active');
      return true;
    }

    try {
      // Detect profile if not set
      if (this.config.useProfile && !this.config.profilePath) {
        await this.detectChromeProfile();
      }

      const launchConfig = {
        headless: this.config.headless,
        defaultViewport: this.config.viewport,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1280,720',
          '--disable-extensions-except=' + chrome.runtime.getURL(''),
          '--load-extension=' + chrome.runtime.getURL('')
        ]
      };

      // Add profile configuration if enabled
      if (this.config.useProfile && this.config.profilePath) {
        launchConfig.args.push(`--user-data-dir=${this.config.profilePath}`);
        console.log('Using Chrome profile:', this.config.profilePath);
      } else {
        console.log('Using temporary browser profile');
      }

      // For Chrome extension environment, we'll use the native messaging approach
      // since we can't directly launch Puppeteer from an extension
      const response = await this.requestBrowserLaunch(launchConfig);
      
      if (response.success) {
        this.isActive = true;
        this.browser = response.browser;
        this.page = response.page;
        
        console.log('Browser launched successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to launch browser');
      }
      
    } catch (error) {
      console.error('Failed to launch browser:', error);
      return false;
    }
  }

  // Request browser launch through native messaging or background script
  async requestBrowserLaunch(config) {
    try {
      // Send message to background script to handle browser launch
      const response = await chrome.runtime.sendMessage({
        type: 'LAUNCH_AUTOMATION_BROWSER',
        config: config
      });
      
      return response;
    } catch (error) {
      console.error('Failed to request browser launch:', error);
      return { success: false, error: error.message };
    }
  }

  // Execute automation sequence
  async executeAutomation(instructions) {
    if (!this.isActive) {
      throw new Error('Browser not active. Please launch browser first.');
    }

    if (!instructions || !instructions.length) {
      throw new Error('No automation instructions provided');
    }

    try {
      console.log('Starting automation execution:', instructions.length, 'steps');
      const results = [];

      for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        console.log(`Executing step ${i + 1}:`, instruction);

        try {
          const stepResult = await this.executeStep(instruction);
          results.push({
            step: i + 1,
            instruction: instruction,
            success: true,
            result: stepResult
          });

          // Add delay between steps if configured
          if (instruction.delay || this.config.stepDelay) {
            await this.sleep(instruction.delay || this.config.stepDelay);
          }

        } catch (stepError) {
          console.error(`Step ${i + 1} failed:`, stepError);
          
          // Try AI adaptation if available
          if (this.aiService.isReady()) {
            console.log('Attempting AI-powered step adaptation...');
            try {
              const adaptedStep = await this.aiService.adaptFailedStep(instruction, stepError.message);
              if (adaptedStep) {
                const retryResult = await this.executeStep(adaptedStep);
                results.push({
                  step: i + 1,
                  instruction: instruction,
                  adapted: adaptedStep,
                  success: true,
                  result: retryResult
                });
                continue;
              }
            } catch (adaptError) {
              console.error('AI adaptation failed:', adaptError);
            }
          }

          results.push({
            step: i + 1,
            instruction: instruction,
            success: false,
            error: stepError.message
          });

          // Decide whether to continue or stop
          if (instruction.stopOnError !== false) {
            break;
          }
        }
      }

      console.log('Automation execution completed:', results);
      return results;

    } catch (error) {
      console.error('Automation execution failed:', error);
      throw error;
    }
  }

  // Execute individual automation step
  async executeStep(instruction) {
    const { action, selector, value, options = {} } = instruction;

    try {
      switch (action) {
        case 'click':
          return await this.performClick(selector, options);
          
        case 'type':
        case 'input':
          return await this.performType(selector, value, options);
          
        case 'select':
          return await this.performSelect(selector, value, options);
          
        case 'wait':
          return await this.performWait(selector || value, options);
          
        case 'navigate':
          return await this.performNavigation(value, options);
          
        case 'scroll':
          return await this.performScroll(options);
          
        case 'screenshot':
          return await this.takeScreenshot(options);
          
        case 'evaluate':
          return await this.evaluateScript(value, options);
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Failed to execute step ${action}:`, error);
      throw error;
    }
  }

  // Browser action implementations
  async performClick(selector, options = {}) {
    const message = {
      type: 'BROWSER_ACTION',
      action: 'click',
      selector: selector,
      options: options
    };
    
    const response = await chrome.runtime.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.result;
  }

  async performType(selector, value, options = {}) {
    const message = {
      type: 'BROWSER_ACTION',
      action: 'type',
      selector: selector,
      value: value,
      options: options
    };
    
    const response = await chrome.runtime.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.result;
  }

  async performSelect(selector, value, options = {}) {
    const message = {
      type: 'BROWSER_ACTION',
      action: 'select',
      selector: selector,
      value: value,
      options: options
    };
    
    const response = await chrome.runtime.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.result;
  }

  async performWait(condition, options = {}) {
    const message = {
      type: 'BROWSER_ACTION',
      action: 'wait',
      condition: condition,
      options: options
    };
    
    const response = await chrome.runtime.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.result;
  }

  async performNavigation(url, options = {}) {
    const message = {
      type: 'BROWSER_ACTION',
      action: 'navigate',
      url: url,
      options: options
    };
    
    const response = await chrome.runtime.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.result;
  }

  async performScroll(options = {}) {
    const message = {
      type: 'BROWSER_ACTION',
      action: 'scroll',
      options: options
    };
    
    const response = await chrome.runtime.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.result;
  }

  async takeScreenshot(options = {}) {
    const message = {
      type: 'BROWSER_ACTION',
      action: 'screenshot',
      options: options
    };
    
    const response = await chrome.runtime.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.result;
  }

  async evaluateScript(script, options = {}) {
    const message = {
      type: 'BROWSER_ACTION',
      action: 'evaluate',
      script: script,
      options: options
    };
    
    const response = await chrome.runtime.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error);
    }
    return response.result;
  }

  // Get current browser status
  async getBrowserStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_BROWSER_STATUS'
      });
      
      return {
        isActive: this.isActive,
        config: this.config,
        status: response.status || 'unknown'
      };
    } catch (error) {
      return {
        isActive: this.isActive,
        config: this.config,
        status: 'error',
        error: error.message
      };
    }
  }

  // Close browser and cleanup
  async closeBrowser() {
    if (!this.isActive) {
      return true;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CLOSE_AUTOMATION_BROWSER'
      });

      this.isActive = false;
      this.browser = null;
      this.page = null;
      
      console.log('Browser closed successfully');
      return true;
    } catch (error) {
      console.error('Failed to close browser:', error);
      return false;
    }
  }

  // Utility functions
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async pathExists(path) {
    // This would need to be implemented with native messaging
    // For extension environment, we'll rely on background script
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_PATH_EXISTS',
        path: path
      });
      return response.exists;
    } catch (error) {
      return false;
    }
  }

  async getSystemProfileInfo() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CHROME_PROFILE_INFO'
      });
      return response.profileInfo;
    } catch (error) {
      console.error('Failed to get profile info:', error);
      return null;
    }
  }

  // Start autonomous automation mode
  async startAutonomousMode(goal, scanResults) {
    if (!this.aiService.isReady()) {
      throw new Error('AI service not available for autonomous mode');
    }

    try {
      console.log('Starting autonomous automation mode:', goal);
      
      // Generate initial automation plan
      const suggestions = await this.aiService.generateAutomationSuggestions(scanResults, goal);
      
      if (!suggestions.automationSteps || !suggestions.automationSteps.length) {
        throw new Error('No automation steps generated by AI');
      }

      // Launch browser if not active
      if (!this.isActive) {
        const launched = await this.launchBrowser();
        if (!launched) {
          throw new Error('Failed to launch browser for autonomous mode');
        }
      }

      // Execute automation with continuous AI monitoring
      const results = await this.executeAutonomousSequence(suggestions.automationSteps);
      
      return {
        success: true,
        goal: goal,
        results: results,
        completed: true
      };
      
    } catch (error) {
      console.error('Autonomous mode failed:', error);
      throw error;
    }
  }

  // Execute automation sequence with AI monitoring and adaptation
  async executeAutonomousSequence(steps) {
    const results = [];
    let currentStepIndex = 0;

    while (currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      
      try {
        // Execute step
        const stepResult = await this.executeStep(step);
        results.push({
          step: currentStepIndex + 1,
          instruction: step,
          success: true,
          result: stepResult
        });

        currentStepIndex++;

        // Check if page changed and adaptation is needed
        if (step.checkPageChanges) {
          const adaptationNeeded = await this.checkForPageChanges();
          if (adaptationNeeded) {
            const adaptedSteps = await this.aiService.adaptToPageChanges(
              steps.slice(currentStepIndex - 1),
              await this.getCurrentPageState(),
              results
            );
            
            if (adaptedSteps && adaptedSteps.length > 0) {
              // Replace remaining steps with adapted ones
              steps.splice(currentStepIndex, steps.length - currentStepIndex, ...adaptedSteps);
              console.log('Steps adapted by AI due to page changes');
            }
          }
        }

      } catch (error) {
        console.error(`Autonomous step ${currentStepIndex + 1} failed:`, error);
        
        // Try AI recovery
        const recovered = await this.attemptAIRecovery(step, error, results);
        if (recovered) {
          results.push(recovered);
          currentStepIndex++;
        } else {
          // Recovery failed, add error and continue or stop
          results.push({
            step: currentStepIndex + 1,
            instruction: step,
            success: false,
            error: error.message
          });
          
          if (step.stopOnError !== false) {
            break;
          }
          currentStepIndex++;
        }
      }
    }

    return results;
  }

  // Check if page has changed significantly
  async checkForPageChanges() {
    // Implementation would compare current page state with expected state
    // For now, return false to avoid unnecessary adaptations
    return false;
  }

  // Get current page state for AI analysis
  async getCurrentPageState() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_CURRENT_PAGE_STATE'
      });
      return response.pageState;
    } catch (error) {
      console.error('Failed to get current page state:', error);
      return null;
    }
  }

  // Attempt AI-powered recovery from failed step
  async attemptAIRecovery(failedStep, error, previousResults) {
    try {
      const recoveryPlan = await this.aiService.generateRecoveryPlan(failedStep, error.message, previousResults);
      
      if (recoveryPlan && recoveryPlan.recoverySteps) {
        for (const recoveryStep of recoveryPlan.recoverySteps) {
          try {
            const result = await this.executeStep(recoveryStep);
            return {
              step: 'recovery',
              instruction: recoveryStep,
              originalStep: failedStep,
              success: true,
              result: result
            };
          } catch (recoveryError) {
            console.error('Recovery step failed:', recoveryError);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('AI recovery attempt failed:', error);
      return null;
    }
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.BrowserController = BrowserController;
}