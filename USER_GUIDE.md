# DOM Scanner Bot Extension - User Guide

## Overview

The DOM Scanner Bot Extension is a comprehensive Chrome extension that provides advanced web page analysis, automation capabilities, and AI-powered assistance for web interactions. This guide covers all the new features and enhancements.

## New Features

### 🤖 AI-Powered Automation
- **Smart Suggestions**: AI analyzes your page and suggests optimal automation steps
- **Adaptive Instructions**: AI helps adapt automation when websites change
- **Multiple AI Providers**: Support for OpenAI, Anthropic, and custom APIs
- **Intelligent Analysis**: AI reviews recorded actions and suggests improvements

### 📹 Action Recording System
- **Real-time Recording**: Capture clicks, inputs, form submissions, scrolling, and key presses
- **Session Management**: Save and load recorded automation sessions
- **Instruction Generation**: Convert recorded actions into step-by-step automation instructions
- **Smart Detection**: Automatically detect and record interactive elements

### ⚙️ Enhanced Automation Settings
- **Auto-Adaptation**: Automatically adapt to page changes
- **Smart Waiting**: Intelligent waiting for dynamic elements
- **Precise Positioning**: Option to record exact mouse coordinates
- **Configurable Delays**: Adjustable delays between actions

## Getting Started

### 1. Installation
1. Load the extension in Chrome (Developer Mode)
2. Pin the extension to your toolbar
3. Navigate to any webpage you want to analyze

### 2. Basic Page Scanning
1. Click the extension icon
2. Navigate to the **Scan** tab
3. Click **"🔍 Scan Current Page"**
4. View results in the **Results** tab

### 3. Setting Up AI Integration

#### For OpenAI:
1. Go to the **Settings** tab
2. Select "OpenAI" as your AI Provider
3. Enter your OpenAI API key
4. Choose your model (GPT-3.5 Turbo, GPT-4, etc.)
5. Click **"🔗 Test AI Connection"**

#### For Anthropic:
1. Select "Anthropic" as your AI Provider
2. Enter your Anthropic API key
3. Choose your Claude model
4. Test the connection

#### For Custom APIs:
1. Select "Custom API"
2. Enter your custom endpoint URL
3. Enter your API key
4. Set your model name

### 4. Recording Actions for Automation

#### Starting a Recording Session:
1. Navigate to the **Automation** tab
2. Click **"🔴 Start Recording"**
3. Perform your desired actions on the webpage
4. Click **"⏹️ Stop Recording"** when finished

#### What Gets Recorded:
- **Clicks**: Button clicks, link clicks, element interactions
- **Inputs**: Text entry, form field completion
- **Selections**: Dropdown selections, checkbox/radio changes
- **Form Submissions**: Form submission events
- **Navigation**: Scrolling and page navigation
- **Special Keys**: Enter, Tab, Arrow keys, etc.

### 5. Generating AI Automation Suggestions
1. First, scan the current page
2. Go to the **Automation** tab
3. Click **"🤖 Generate AI Suggestions"**
4. Review the AI-generated automation steps
5. Export the instructions if needed

## Feature Details

### DOM Scanning Capabilities
- **Interactive Elements**: Buttons, inputs, links, forms
- **Element Analysis**: Position, visibility, attributes, text content
- **Multiple Selectors**: ID, class, CSS path, XPath generation
- **Hidden Elements**: Optional inclusion of hidden elements
- **Real-time Highlighting**: Visual highlighting of found elements

### Action Recording Features
- **Comprehensive Capture**: All user interactions are recorded
- **Element Information**: Detailed element data for each action
- **Session Persistence**: Save and reload recording sessions
- **Instruction Export**: Convert to automation-ready instructions
- **Smart Deduplication**: Removes redundant actions automatically

### AI Integration Capabilities
- **Automation Planning**: AI suggests optimal automation sequences
- **Error Prevention**: Identifies potential issues and risks
- **Alternative Strategies**: Provides backup selectors and approaches
- **Performance Optimization**: Suggests improvements for recorded actions
- **Adaptive Responses**: Helps handle dynamic page changes

### Advanced Settings

#### Scan Options:
- **Scan Depth**: Control DOM traversal depth (2-10 levels)
- **Auto-scan**: Automatically scan new pages
- **Element Types**: Filter specific element types
- **Hidden Elements**: Include/exclude hidden elements

#### Automation Options:
- **Auto-adapt**: Automatically adjust to page changes
- **Mouse Position**: Record precise click coordinates
- **Smart Waiting**: Intelligent element waiting
- **Action Delays**: Configurable delays (0ms - 5000ms)

#### AI Configuration:
- **API Provider**: OpenAI, Anthropic, or Custom
- **Model Selection**: Choose specific AI models
- **Custom Endpoints**: Support for custom API endpoints
- **Connection Testing**: Verify AI connectivity

## Troubleshooting

### Common Issues:

#### Extension Not Working:
- Refresh the webpage after installing the extension
- Check if the content script loaded in Developer Tools
- Verify the extension has necessary permissions

#### AI Features Not Available:
- Ensure you've entered a valid API key
- Test the AI connection in settings
- Check your API quota and billing status
- Verify the API endpoint is accessible

#### Recording Not Capturing Actions:
- Make sure recording is active (red button should be disabled)
- Refresh the page and try again
- Check browser console for any error messages

#### Scan Results Empty:
- Try increasing the scan depth in settings
- Enable "Include hidden elements" if needed
- Check if the page has loaded completely

### Error Messages:

- **"Content script not available"**: Refresh the page
- **"AI service not configured"**: Set up your AI API key
- **"No scan results to export"**: Run a page scan first
- **"Failed to start recording"**: Refresh page and try again

## Best Practices

### For Effective Scanning:
1. Wait for pages to fully load before scanning
2. Use appropriate scan depth for complex pages
3. Enable element highlighting for visual verification
4. Export results regularly for backup

### For Action Recording:
1. Plan your actions before starting recording
2. Perform actions slowly and deliberately
3. Avoid unnecessary mouse movements
4. Stop recording promptly when finished

### For AI Integration:
1. Use clear, descriptive goals when requesting suggestions
2. Review AI suggestions before implementing
3. Test automation on similar pages
4. Keep API keys secure and rotate regularly

## API Reference

### Content Script Functions
```javascript
// Available in window.domScanner
domScanner.scan()              // Perform page scan
domScanner.highlight()         // Highlight elements
domScanner.clearHighlights()   // Clear highlights
domScanner.getPageInfo()       // Get page information

// Available in window.actionRecorder
actionRecorder.startRecording()    // Start recording
actionRecorder.stopRecording()     // Stop recording
actionRecorder.getRecordingState() // Get current state
```

### Message Types (for programmatic use)
- `SCAN_PAGE`: Trigger page scan
- `START_RECORDING`: Start action recording
- `STOP_RECORDING`: Stop action recording
- `GENERATE_AI_SUGGESTIONS`: Get AI automation suggestions
- `HIGHLIGHT_ELEMENTS`: Highlight multiple elements

## Privacy & Security

- ✅ All processing happens locally in your browser
- ✅ API keys are stored locally using Chrome's secure storage
- ✅ No data is sent to third parties except chosen AI providers
- ✅ Recorded actions are stored locally only
- ✅ You control what data is exported

## Support & Updates

### Getting Help:
1. Check this documentation first
2. Review browser console for error messages
3. Test on different websites to isolate issues
4. Report bugs with specific reproduction steps

### Feature Requests:
- Additional AI providers
- New automation capabilities
- Enhanced recording features
- Integration with external tools

---

**Version**: 2.0.0  
**Last Updated**: January 2024  
**Compatibility**: Chrome/Chromium browsers with Manifest V3 support