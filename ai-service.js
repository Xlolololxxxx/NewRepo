// AI Service integration for DOM Scanner Bot Extension
// Handles AI API communication and intelligent automation suggestions

class AIService {
  constructor() {
    this.apiKey = null;
    this.apiEndpoint = null;
    this.model = 'gpt-3.5-turbo';
    this.maxTokens = 1000;
    this.isInitialized = false;
  }

  // Initialize AI service with user settings
  async initialize() {
    try {
      const settings = await chrome.storage.sync.get(['aiApiKey', 'aiEndpoint', 'aiModel']);
      this.apiKey = settings.aiApiKey;
      this.apiEndpoint = settings.aiEndpoint || 'https://api.openai.com/v1/chat/completions';
      this.model = settings.aiModel || 'gpt-3.5-turbo';
      this.isInitialized = !!this.apiKey;
      
      console.log('AI Service initialized:', { 
        hasApiKey: !!this.apiKey, 
        endpoint: this.apiEndpoint, 
        model: this.model 
      });
      
      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      return false;
    }
  }

  // Check if AI service is ready
  isReady() {
    return this.isInitialized && this.apiKey;
  }

  // Generate automation suggestions based on page scan
  async generateAutomationSuggestions(scanResults, userGoal = '') {
    if (!this.isReady()) {
      throw new Error('AI service not initialized or API key missing');
    }

    const prompt = this.buildAutomationPrompt(scanResults, userGoal);
    
    try {
      const response = await this.callAI(prompt);
      return this.parseAutomationResponse(response);
    } catch (error) {
      console.error('Failed to generate automation suggestions:', error);
      throw error;
    }
  }

  // Analyze recorded actions and suggest improvements
  async analyzeRecordedActions(actions, pageContext) {
    if (!this.isReady()) {
      throw new Error('AI service not initialized');
    }

    const prompt = this.buildActionAnalysisPrompt(actions, pageContext);
    
    try {
      const response = await this.callAI(prompt);
      return this.parseActionAnalysis(response);
    } catch (error) {
      console.error('Failed to analyze recorded actions:', error);
      throw error;
    }
  }

  // Adapt automation when website changes are detected
  async adaptToPageChanges(originalElements, currentElements, previousActions) {
    if (!this.isReady()) {
      throw new Error('AI service not initialized');
    }

    const prompt = this.buildAdaptationPrompt(originalElements, currentElements, previousActions);
    
    try {
      const response = await this.callAI(prompt);
      return this.parseAdaptationResponse(response);
    } catch (error) {
      console.error('Failed to adapt to page changes:', error);
      throw error;
    }
  }

  // Build prompt for automation suggestions
  buildAutomationPrompt(scanResults, userGoal) {
    const elementsCount = scanResults.elements?.length || 0;
    const formsCount = scanResults.forms?.length || 0;
    const linksCount = scanResults.links?.length || 0;

    return `You are an intelligent web automation assistant. Analyze the following webpage scan results and suggest optimal automation steps.

WEBPAGE INFORMATION:
- URL: ${scanResults.url}
- Title: ${scanResults.title}
- Interactive Elements: ${elementsCount}
- Forms: ${formsCount}
- Links: ${linksCount}

USER GOAL: ${userGoal || 'General automation assistance'}

SCAN RESULTS:
${JSON.stringify(scanResults.elements?.slice(0, 10), null, 2)}

Please provide:
1. A prioritized list of automation steps
2. Recommended element selectors
3. Suggested input values for forms
4. Potential automation risks or challenges
5. Alternative approaches if elements change

Format your response as JSON with the following structure:
{
  "automationSteps": [
    {
      "step": 1,
      "action": "click|input|navigate|wait",
      "selector": "CSS selector",
      "value": "input value if applicable",
      "description": "Human readable description",
      "confidence": 0.95,
      "alternatives": ["alternative selector 1", "alternative selector 2"]
    }
  ],
  "risks": ["potential issues"],
  "recommendations": ["best practices"]
}`;
  }

  // Build prompt for action analysis
  buildActionAnalysisPrompt(actions, pageContext) {
    return `Analyze these recorded user actions on a webpage and suggest optimizations:

PAGE CONTEXT:
- URL: ${pageContext.url}
- Title: ${pageContext.title}

RECORDED ACTIONS:
${JSON.stringify(actions, null, 2)}

Please analyze and provide:
1. Action sequence optimization
2. Potential redundancies
3. Missing error handling
4. Robustness improvements
5. Performance optimizations

Format as JSON:
{
  "optimizedSequence": [...],
  "improvements": [...],
  "errorHandling": [...],
  "performance": [...]
}`;
  }

  // Build prompt for adaptation
  buildAdaptationPrompt(originalElements, currentElements, previousActions) {
    return `Help adapt automation to webpage changes:

ORIGINAL ELEMENTS (when automation was created):
${JSON.stringify(originalElements.slice(0, 5), null, 2)}

CURRENT ELEMENTS (detected now):
${JSON.stringify(currentElements.slice(0, 5), null, 2)}

PREVIOUS ACTIONS:
${JSON.stringify(previousActions, null, 2)}

Please provide:
1. Updated selectors for changed elements
2. New automation sequence
3. Elements that are no longer available
4. New elements that could be used instead

Format as JSON:
{
  "updatedActions": [...],
  "removedElements": [...],
  "newElements": [...],
  "confidence": 0.85
}`;
  }

  // Make API call to AI service
  async callAI(prompt) {
    if (!this.apiKey) {
      throw new Error('AI API key not configured');
    }

    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a web automation expert. Always respond with valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.maxTokens,
      temperature: 0.3
    };

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response from AI API');
    }

    return data.choices[0].message.content;
  }

  // Parse automation suggestions response
  parseAutomationResponse(response) {
    try {
      const parsed = JSON.parse(response);
      
      // Validate structure
      if (!parsed.automationSteps || !Array.isArray(parsed.automationSteps)) {
        throw new Error('Invalid automation response structure');
      }

      // Add confidence scores if missing
      parsed.automationSteps.forEach(step => {
        if (typeof step.confidence !== 'number') {
          step.confidence = 0.7; // Default confidence
        }
      });

      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return fallback response
      return {
        automationSteps: [],
        risks: ['Failed to parse AI response'],
        recommendations: ['Please check AI API configuration']
      };
    }
  }

  // Parse action analysis response
  parseActionAnalysis(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse action analysis:', error);
      return {
        optimizedSequence: [],
        improvements: ['Failed to analyze actions'],
        errorHandling: [],
        performance: []
      };
    }
  }

  // Parse adaptation response
  parseAdaptationResponse(response) {
    try {
      const parsed = JSON.parse(response);
      parsed.confidence = parsed.confidence || 0.5;
      return parsed;
    } catch (error) {
      console.error('Failed to parse adaptation response:', error);
      return {
        updatedActions: [],
        removedElements: [],
        newElements: [],
        confidence: 0.0
      };
    }
  }

  // Test AI connection
  async testConnection() {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' };
    }

    try {
      const testPrompt = 'Respond with: {"test": "success", "message": "AI connection working"}';
      const response = await this.callAI(testPrompt);
      const parsed = JSON.parse(response);
      
      return { 
        success: true, 
        message: parsed.message || 'Connection successful' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Update API configuration
  async updateConfig(config) {
    this.apiKey = config.apiKey;
    this.apiEndpoint = config.endpoint || this.apiEndpoint;
    this.model = config.model || this.model;
    this.maxTokens = config.maxTokens || this.maxTokens;
    
    // Save to storage
    await chrome.storage.sync.set({
      aiApiKey: this.apiKey,
      aiEndpoint: this.apiEndpoint,
      aiModel: this.model,
      aiMaxTokens: this.maxTokens
    });

    this.isInitialized = !!this.apiKey;
    return this.isInitialized;
  }
}

// Create global instance
window.aiService = new AIService();

// Auto-initialize when loaded
if (typeof chrome !== 'undefined' && chrome.storage) {
  window.aiService.initialize().then(success => {
    console.log('AI Service auto-initialization:', success ? 'successful' : 'failed');
  });
}