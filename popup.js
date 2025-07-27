// Popup script for DOM Scanner Bot Extension
console.log('DOM Scanner Bot - Popup loaded');

let currentTab = null;
let scanResults = null;

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup DOM loaded');
  
  // Get current active tab
  currentTab = await getCurrentTab();
  
  // Load settings
  await loadSettings();
  
  // Load page info
  await loadPageInfo();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup tabs
  setupTabs();
});

// Get current active tab
async function getCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

// Setup event listeners
function setupEventListeners() {
  // Main action buttons
  document.getElementById('scan-btn').addEventListener('click', scanCurrentPage);
  document.getElementById('highlight-btn').addEventListener('click', highlightElements);
  document.getElementById('clear-highlights-btn').addEventListener('click', clearHighlights);
  
  // Export buttons
  document.getElementById('export-json-btn').addEventListener('click', exportAsJSON);
  document.getElementById('export-csv-btn').addEventListener('click', exportAsCSV);
  
  // Automation buttons
  document.getElementById('start-recording-btn').addEventListener('click', startRecording);
  document.getElementById('stop-recording-btn').addEventListener('click', stopRecording);
  document.getElementById('generate-ai-suggestions-btn').addEventListener('click', generateAISuggestions);
  document.getElementById('test-ai-connection-btn').addEventListener('click', testAIConnection);
  document.getElementById('load-sessions-btn').addEventListener('click', loadRecordedSessions);
  document.getElementById('export-instructions-btn').addEventListener('click', exportInstructions);
  
  // Settings buttons
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('reset-settings-btn').addEventListener('click', resetSettings);
  
  // Settings change listeners
  document.getElementById('scan-depth').addEventListener('change', onSettingChange);
  document.getElementById('auto-scan').addEventListener('change', onSettingChange);
  document.getElementById('highlight-elements').addEventListener('change', onSettingChange);
  document.getElementById('include-hidden').addEventListener('change', onSettingChange);
  
  // AI settings listeners
  document.getElementById('ai-api-key').addEventListener('change', onAISettingChange);
  document.getElementById('ai-endpoint').addEventListener('change', onAISettingChange);
  document.getElementById('ai-model').addEventListener('change', onAISettingChange);
  document.getElementById('ai-provider').addEventListener('change', onAIProviderChange);
  
  // Automation settings listeners
  document.getElementById('auto-adapt').addEventListener('change', onSettingChange);
  document.getElementById('record-mouse-position').addEventListener('change', onSettingChange);
  document.getElementById('smart-waiting').addEventListener('change', onSettingChange);
  document.getElementById('action-delay').addEventListener('change', onSettingChange);
  
  // Selector checkboxes
  ['buttons', 'inputs', 'links', 'clickable', 'forms'].forEach(type => {
    document.getElementById(`sel-${type}`).addEventListener('change', onSettingChange);
  });
}

// Setup tab switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        }
      });
    });
  });
}

// Load settings from storage
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get();
    
    // Apply settings to UI
    document.getElementById('scan-depth').value = settings.scanDepth || 3;
    document.getElementById('auto-scan').checked = settings.autoScan || false;
    document.getElementById('highlight-elements').checked = settings.highlightElements !== false;
    document.getElementById('include-hidden').checked = settings.includeHidden || false;
    
    // Automation settings
    document.getElementById('auto-adapt').checked = settings.autoAdapt || false;
    document.getElementById('record-mouse-position').checked = settings.recordMousePosition || false;
    document.getElementById('smart-waiting').checked = settings.smartWaiting || true;
    document.getElementById('action-delay').value = settings.actionDelay || 1000;
    
    // Selector settings
    const selectors = settings.selectedSelectors || ['button', 'input', 'a', 'div[role="button"]', 'form'];
    document.getElementById('sel-buttons').checked = selectors.some(s => s.includes('button'));
    document.getElementById('sel-inputs').checked = selectors.some(s => s.includes('input'));
    document.getElementById('sel-links').checked = selectors.some(s => s.includes('a'));
    document.getElementById('sel-clickable').checked = selectors.some(s => s.includes('[role="button"]'));
    document.getElementById('sel-forms').checked = selectors.some(s => s.includes('form'));
    
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

// Load page information
async function loadPageInfo() {
  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'GET_PAGE_INFO'
    });
    
    if (response.success) {
      const pageInfo = response.data;
      document.getElementById('page-info').innerHTML = `
        <div style="font-size: 12px; line-height: 1.4;">
          <strong>URL:</strong> ${truncateUrl(pageInfo.url)}<br>
          <strong>Title:</strong> ${pageInfo.title}<br>
          <strong>Domain:</strong> ${pageInfo.domain}<br>
          <strong>Elements:</strong> ${pageInfo.elementCount.toLocaleString()}<br>
          <strong>Status:</strong> ${pageInfo.readyState}<br>
          <strong>Viewport:</strong> ${pageInfo.viewport.width}×${pageInfo.viewport.height}
        </div>
      `;
    } else {
      document.getElementById('page-info').innerHTML = `
        <div style="color: #dc3545; font-size: 12px;">
          Failed to load page info: ${response.error}
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to get page info:', error);
    document.getElementById('page-info').innerHTML = `
      <div style="color: #dc3545; font-size: 12px;">
        Content script not available. Please refresh the page.
      </div>
    `;
  }
}

// Scan current page
async function scanCurrentPage() {
  const scanBtn = document.getElementById('scan-btn');
  const originalText = scanBtn.textContent;
  
  try {
    scanBtn.textContent = '🔍 Scanning...';
    scanBtn.disabled = true;
    
    showStatus('Scanning page...', 'info');
    
    // Get current settings
    const settings = await chrome.storage.sync.get();
    
    // Send scan message to content script
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'SCAN_PAGE',
      options: {
        depth: parseInt(settings.scanDepth) || 3,
        includeHidden: settings.includeHidden || false,
        selectors: getSelectedSelectors()
      }
    });
    
    if (response.success) {
      scanResults = response.data;
      displayScanResults(scanResults);
      showStatus(`Scan complete! Found ${scanResults.elements.length} interactive elements.`, 'success');
      
      // Auto-highlight if enabled
      if (settings.highlightElements !== false) {
        setTimeout(() => highlightElements(), 500);
      }
      
    } else {
      showStatus(`Scan failed: ${response.error}`, 'error');
    }
    
  } catch (error) {
    console.error('Scan failed:', error);
    showStatus('Scan failed. Please refresh the page and try again.', 'error');
  } finally {
    scanBtn.textContent = originalText;
    scanBtn.disabled = false;
  }
}

// Display scan results
function displayScanResults(results) {
  // Update statistics
  document.getElementById('elements-count').textContent = results.elements.length;
  document.getElementById('forms-count').textContent = results.forms.length;
  
  // Display elements list
  const elementsList = document.getElementById('elements-list');
  
  if (results.elements.length === 0) {
    elementsList.innerHTML = '<div class="results empty">No interactive elements found.</div>';
    elementsList.className = 'results empty';
    return;
  }
  
  elementsList.className = 'results';
  
  // Group elements by type
  const grouped = {};
  results.elements.forEach(element => {
    const type = element.tag;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(element);
  });
  
  let html = '';
  Object.keys(grouped).sort().forEach(type => {
    html += `<div style="font-weight: 600; margin: 8px 0 4px 0; color: #495057; font-size: 11px; text-transform: uppercase;">${type.toUpperCase()} (${grouped[type].length})</div>`;
    
    grouped[type].slice(0, 10).forEach((element, index) => { // Limit to 10 per type
      html += `
        <div class="element-item" data-selector="${escapeHtml(element.selectors[0])}" onclick="highlightSingleElement('${escapeHtml(element.selectors[0])}')">
          <div class="element-tag">${element.tag}${element.id ? '#' + element.id : ''}${element.classes.length ? '.' + element.classes.slice(0,2).join('.') : ''}</div>
          <div class="element-text">${escapeHtml(element.text || element.value || element.attributes['placeholder'] || 'No text')}</div>
          <div class="element-position">Position: ${element.position.x}, ${element.position.y} | ${element.visible ? 'Visible' : 'Hidden'}</div>
        </div>
      `;
    });
    
    if (grouped[type].length > 10) {
      html += `<div style="font-size: 11px; color: #6c757d; text-align: center; margin: 4px 0;">... and ${grouped[type].length - 10} more</div>`;
    }
  });
  
  elementsList.innerHTML = html;
}

// Highlight all found elements
async function highlightElements() {
  if (!scanResults || !scanResults.elements.length) {
    showStatus('No scan results to highlight. Please scan the page first.', 'error');
    return;
  }
  
  try {
    await chrome.tabs.sendMessage(currentTab.id, {
      type: 'HIGHLIGHT_ELEMENTS',
      data: scanResults.elements
    });
    
    showStatus(`Highlighted ${scanResults.elements.length} elements`, 'success');
  } catch (error) {
    console.error('Failed to highlight elements:', error);
    showStatus('Failed to highlight elements', 'error');
  }
}

// Highlight single element
async function highlightSingleElement(selector) {
  try {
    await chrome.tabs.sendMessage(currentTab.id, {
      type: 'HIGHLIGHT_ELEMENT',
      selector: selector,
      highlight: true
    });
  } catch (error) {
    console.error('Failed to highlight element:', error);
  }
}

// Clear all highlights
async function clearHighlights() {
  try {
    await chrome.tabs.sendMessage(currentTab.id, {
      type: 'CLEAR_HIGHLIGHTS'
    });
    
    showStatus('Highlights cleared', 'info');
  } catch (error) {
    console.error('Failed to clear highlights:', error);
  }
}

// Export results as JSON
function exportAsJSON() {
  if (!scanResults) {
    showStatus('No scan results to export. Please scan the page first.', 'error');
    return;
  }
  
  const dataStr = JSON.stringify(scanResults, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `dom-scan-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  
  showStatus('JSON export downloaded', 'success');
}

// Export results as CSV
function exportAsCSV() {
  if (!scanResults || !scanResults.elements.length) {
    showStatus('No scan results to export. Please scan the page first.', 'error');
    return;
  }
  
  const headers = ['Tag', 'ID', 'Classes', 'Text', 'X', 'Y', 'Width', 'Height', 'Visible', 'Selector'];
  const rows = [headers];
  
  scanResults.elements.forEach(element => {
    rows.push([
      element.tag,
      element.id || '',
      element.classes.join(' '),
      (element.text || '').replace(/"/g, '""'),
      element.position.x,
      element.position.y,
      element.position.width,
      element.position.height,
      element.visible ? 'Yes' : 'No',
      element.selectors[0] || ''
    ]);
  });
  
  const csvContent = rows.map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n');
  
  const dataBlob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `dom-scan-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  
  showStatus('CSV export downloaded', 'success');
}

// Get selected selectors based on checkboxes
function getSelectedSelectors() {
  const selectors = [];
  
  if (document.getElementById('sel-buttons').checked) {
    selectors.push('button', '[role="button"]', '.btn', '.button');
  }
  
  if (document.getElementById('sel-inputs').checked) {
    selectors.push('input', 'textarea', 'select');
  }
  
  if (document.getElementById('sel-links').checked) {
    selectors.push('a[href]');
  }
  
  if (document.getElementById('sel-clickable').checked) {
    selectors.push('[onclick]', '[role="button"]');
  }
  
  if (document.getElementById('sel-forms').checked) {
    selectors.push('form');
  }
  
  return selectors.length > 0 ? selectors : ['button', 'input', 'a'];
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      scanDepth: parseInt(document.getElementById('scan-depth').value),
      autoScan: document.getElementById('auto-scan').checked,
      highlightElements: document.getElementById('highlight-elements').checked,
      includeHidden: document.getElementById('include-hidden').checked,
      autoAdapt: document.getElementById('auto-adapt').checked,
      recordMousePosition: document.getElementById('record-mouse-position').checked,
      smartWaiting: document.getElementById('smart-waiting').checked,
      actionDelay: parseInt(document.getElementById('action-delay').value),
      selectedSelectors: getSelectedSelectors()
    };
    
    await chrome.storage.sync.set(settings);
    showStatus('Settings saved successfully', 'success');
    
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('Failed to save settings', 'error');
  }
}

// Reset settings to defaults
async function resetSettings() {
  try {
    const defaultSettings = {
      scanDepth: 3,
      autoScan: false,
      highlightElements: true,
      includeHidden: false,
      selectedSelectors: ['button', 'input', 'a', 'div[role="button"]']
    };
    
    await chrome.storage.sync.set(defaultSettings);
    await loadSettings();
    showStatus('Settings reset to defaults', 'success');
    
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showStatus('Failed to reset settings', 'error');
  }
}

// Handle setting changes
function onSettingChange() {
  // Auto-save settings when they change
  setTimeout(saveSettings, 500);
}

// Show status message
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';
  
  // Auto-hide after 3 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}

// Utility functions
function truncateUrl(url) {
  if (url.length <= 50) return url;
  return url.substring(0, 25) + '...' + url.substring(url.length - 22);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions available for onclick handlers
window.highlightSingleElement = highlightSingleElement;

// Global variables for automation features
let currentInstructions = [];
let recordingState = { isRecording: false };

// Action recording functions
async function startRecording() {
  const startBtn = document.getElementById('start-recording-btn');
  const stopBtn = document.getElementById('stop-recording-btn');
  
  try {
    const sessionName = `session_${Date.now()}`;
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'START_RECORDING',
      sessionName: sessionName
    });
    
    if (response.success) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      showRecordingStatus('Recording started... Perform actions on the page', 'info');
      
      // Update recording info periodically
      updateRecordingInfo();
    } else {
      showRecordingStatus(`Failed to start recording: ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('Failed to start recording:', error);
    showRecordingStatus('Failed to start recording. Please refresh the page.', 'error');
  }
}

async function stopRecording() {
  const startBtn = document.getElementById('start-recording-btn');
  const stopBtn = document.getElementById('stop-recording-btn');
  
  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'STOP_RECORDING'
    });
    
    if (response.success) {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      currentInstructions = response.instructions || [];
      
      showRecordingStatus(`Recording stopped. Captured ${response.session.actions.length} actions.`, 'success');
      displayInstructions(currentInstructions);
      document.getElementById('export-instructions-btn').disabled = false;
    } else {
      showRecordingStatus(`Failed to stop recording: ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('Failed to stop recording:', error);
    showRecordingStatus('Failed to stop recording', 'error');
  }
}

async function updateRecordingInfo() {
  try {
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'GET_RECORDING_STATE'
    });
    
    if (response.success && response.data.isRecording) {
      const info = document.getElementById('recording-info');
      const duration = Math.floor(response.data.duration / 1000);
      info.textContent = `Recording: ${response.data.actionsCount} actions, ${duration}s elapsed`;
      
      // Continue updating if still recording
      setTimeout(updateRecordingInfo, 1000);
    }
  } catch (error) {
    // Recording likely stopped or page changed
  }
}

// AI automation functions
async function generateAISuggestions() {
  if (!scanResults) {
    showStatus('Please scan the page first before generating AI suggestions', 'error');
    return;
  }
  
  const generateBtn = document.getElementById('generate-ai-suggestions-btn');
  const originalText = generateBtn.textContent;
  
  try {
    generateBtn.textContent = '🤖 Generating...';
    generateBtn.disabled = true;
    
    showStatus('Generating AI automation suggestions...', 'info');
    
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'GENERATE_AI_SUGGESTIONS',
      data: {
        scanResults: scanResults,
        userGoal: '' // Could add user goal input later
      }
    });
    
    if (response.success) {
      const suggestions = response.data;
      displayAISuggestions(suggestions);
      showStatus('AI suggestions generated successfully', 'success');
    } else {
      showStatus(`Failed to generate AI suggestions: ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('Failed to generate AI suggestions:', error);
    showStatus('Failed to generate AI suggestions. Check your AI configuration.', 'error');
  } finally {
    generateBtn.textContent = originalText;
    generateBtn.disabled = false;
  }
}

async function testAIConnection() {
  const testBtn = document.getElementById('test-ai-connection-btn');
  const originalText = testBtn.textContent;
  
  try {
    testBtn.textContent = '🔗 Testing...';
    testBtn.disabled = true;
    
    // Save current AI settings first
    await saveAISettings();
    
    // Test by injecting AI service and testing
    const response = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: async function() {
        // Load AI service
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('ai-service.js');
        document.head.appendChild(script);
        
        return new Promise(resolve => {
          script.onload = async () => {
            try {
              await window.aiService.initialize();
              const result = await window.aiService.testConnection();
              resolve(result);
            } catch (error) {
              resolve({ success: false, error: error.message });
            }
          };
        });
      }
    });
    
    const result = response[0].result;
    
    if (result.success) {
      showAIStatus('✅ AI connection successful', 'success');
      document.getElementById('ai-enabled').disabled = false;
      document.getElementById('generate-ai-suggestions-btn').disabled = false;
    } else {
      showAIStatus(`❌ AI connection failed: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('AI connection test failed:', error);
    showAIStatus('❌ AI connection test failed', 'error');
  } finally {
    testBtn.textContent = originalText;
    testBtn.disabled = false;
  }
}

async function loadRecordedSessions() {
  try {
    const sessions = await chrome.storage.local.get(['recordedSessions']);
    const sessionsList = document.getElementById('sessions-list');
    
    if (!sessions.recordedSessions || Object.keys(sessions.recordedSessions).length === 0) {
      sessionsList.innerHTML = '<div class="results empty">No recorded sessions found.</div>';
      sessionsList.className = 'results empty';
      return;
    }
    
    sessionsList.className = 'results';
    let html = '';
    
    Object.entries(sessions.recordedSessions).forEach(([name, session]) => {
      const duration = Math.floor(session.duration / 1000);
      html += `
        <div class="element-item" onclick="loadSession('${name}')">
          <div class="element-tag">${name}</div>
          <div class="element-text">${session.actions.length} actions, ${duration}s duration</div>
          <div class="element-position">${session.pageContext.url}</div>
        </div>
      `;
    });
    
    sessionsList.innerHTML = html;
    showStatus(`Loaded ${Object.keys(sessions.recordedSessions).length} recorded sessions`, 'success');
  } catch (error) {
    console.error('Failed to load sessions:', error);
    showStatus('Failed to load recorded sessions', 'error');
  }
}

async function loadSession(sessionName) {
  try {
    const sessions = await chrome.storage.local.get(['recordedSessions']);
    const session = sessions.recordedSessions[sessionName];
    
    if (session) {
      // Generate instructions from session
      const instructions = generateInstructionsFromSession(session);
      currentInstructions = instructions;
      displayInstructions(instructions);
      document.getElementById('export-instructions-btn').disabled = false;
      showStatus(`Loaded session: ${sessionName}`, 'success');
    }
  } catch (error) {
    console.error('Failed to load session:', error);
    showStatus('Failed to load session', 'error');
  }
}

function generateInstructionsFromSession(session) {
  return session.actions.map((action, index) => ({
    step: index + 1,
    action: action.type,
    description: generateActionDescription(action),
    selector: action.element?.selectors?.[0] || '',
    value: action.value || null,
    timestamp: action.timestamp
  }));
}

function generateActionDescription(action) {
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
    default:
      return `Perform ${action.type} action`;
  }
}

function exportInstructions() {
  if (!currentInstructions.length) {
    showStatus('No instructions to export', 'error');
    return;
  }
  
  const dataStr = JSON.stringify(currentInstructions, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `automation-instructions-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  
  showStatus('Automation instructions exported', 'success');
}

// Display functions
function displayInstructions(instructions) {
  const instructionsList = document.getElementById('instructions-list');
  
  if (!instructions.length) {
    instructionsList.innerHTML = '<div class="results empty">No instructions available.</div>';
    instructionsList.className = 'results empty';
    return;
  }
  
  instructionsList.className = 'results';
  let html = '';
  
  instructions.forEach((instruction, index) => {
    html += `
      <div class="element-item">
        <div class="element-tag">Step ${instruction.step}: ${instruction.action}</div>
        <div class="element-text">${escapeHtml(instruction.description)}</div>
        <div class="element-position">Selector: ${escapeHtml(instruction.selector)}</div>
      </div>
    `;
  });
  
  instructionsList.innerHTML = html;
}

function displayAISuggestions(suggestions) {
  const instructionsList = document.getElementById('instructions-list');
  
  if (!suggestions.automationSteps || !suggestions.automationSteps.length) {
    instructionsList.innerHTML = '<div class="results empty">No AI suggestions available.</div>';
    instructionsList.className = 'results empty';
    return;
  }
  
  currentInstructions = suggestions.automationSteps;
  document.getElementById('export-instructions-btn').disabled = false;
  
  instructionsList.className = 'results';
  let html = '';
  
  suggestions.automationSteps.forEach((step, index) => {
    const confidence = Math.round(step.confidence * 100);
    html += `
      <div class="element-item">
        <div class="element-tag">Step ${step.step}: ${step.action} (${confidence}% confidence)</div>
        <div class="element-text">${escapeHtml(step.description)}</div>
        <div class="element-position">Selector: ${escapeHtml(step.selector)}</div>
      </div>
    `;
  });
  
  // Add risks and recommendations
  if (suggestions.risks && suggestions.risks.length) {
    html += '<div style="margin-top: 10px; font-weight: bold; color: #dc3545;">⚠️ Risks:</div>';
    suggestions.risks.forEach(risk => {
      html += `<div style="font-size: 11px; color: #dc3545;">• ${escapeHtml(risk)}</div>`;
    });
  }
  
  if (suggestions.recommendations && suggestions.recommendations.length) {
    html += '<div style="margin-top: 10px; font-weight: bold; color: #28a745;">💡 Recommendations:</div>';
    suggestions.recommendations.forEach(rec => {
      html += `<div style="font-size: 11px; color: #28a745;">• ${escapeHtml(rec)}</div>`;
    });
  }
  
  instructionsList.innerHTML = html;
}

function showRecordingStatus(message, type = 'info') {
  const statusEl = document.getElementById('recording-status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}

function showAIStatus(message, type = 'info') {
  const statusEl = document.getElementById('ai-status');
  statusEl.textContent = message;
  statusEl.style.color = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#6c757d';
}

// Settings functions
async function saveAISettings() {
  const aiSettings = {
    aiApiKey: document.getElementById('ai-api-key').value,
    aiEndpoint: document.getElementById('ai-endpoint').value,
    aiModel: document.getElementById('ai-model').value,
    aiProvider: document.getElementById('ai-provider').value
  };
  
  await chrome.storage.sync.set(aiSettings);
}

async function loadAISettings() {
  const settings = await chrome.storage.sync.get(['aiApiKey', 'aiEndpoint', 'aiModel', 'aiProvider']);
  
  document.getElementById('ai-api-key').value = settings.aiApiKey || '';
  document.getElementById('ai-endpoint').value = settings.aiEndpoint || 'https://api.openai.com/v1/chat/completions';
  document.getElementById('ai-model').value = settings.aiModel || 'gpt-3.5-turbo';
  document.getElementById('ai-provider').value = settings.aiProvider || 'openai';
  
  // Update AI enabled state
  const hasApiKey = !!settings.aiApiKey;
  document.getElementById('ai-enabled').disabled = !hasApiKey;
  document.getElementById('generate-ai-suggestions-btn').disabled = !hasApiKey;
  
  if (hasApiKey) {
    showAIStatus('✅ AI API key configured', 'success');
  } else {
    showAIStatus('❌ AI API key not configured', 'error');
  }
}

function onAISettingChange() {
  setTimeout(saveAISettings, 500);
  setTimeout(loadAISettings, 600); // Reload to update UI state
}

function onAIProviderChange() {
  const provider = document.getElementById('ai-provider').value;
  const endpointField = document.getElementById('ai-endpoint');
  const modelField = document.getElementById('ai-model');
  
  // Update default endpoint and model based on provider
  switch (provider) {
    case 'openai':
      endpointField.value = 'https://api.openai.com/v1/chat/completions';
      modelField.innerHTML = `
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        <option value="gpt-4">GPT-4</option>
        <option value="gpt-4-turbo">GPT-4 Turbo</option>
      `;
      break;
    case 'anthropic':
      endpointField.value = 'https://api.anthropic.com/v1/messages';
      modelField.innerHTML = `
        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
        <option value="claude-3-opus">Claude 3 Opus</option>
        <option value="claude-3-haiku">Claude 3 Haiku</option>
      `;
      break;
    case 'custom':
      endpointField.value = '';
      modelField.innerHTML = '<option value="custom">Custom Model</option>';
      break;
  }
  
  onAISettingChange();
}

// Load AI settings when popup loads
document.addEventListener('DOMContentLoaded', async () => {
  // ... existing code ...
  await loadAISettings();
});

// Make functions available globally
window.loadSession = loadSession;