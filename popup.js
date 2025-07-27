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
  
  // Settings buttons
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
  document.getElementById('reset-settings-btn').addEventListener('click', resetSettings);
  
  // Settings change listeners
  document.getElementById('scan-depth').addEventListener('change', onSettingChange);
  document.getElementById('auto-scan').addEventListener('change', onSettingChange);
  document.getElementById('highlight-elements').addEventListener('change', onSettingChange);
  document.getElementById('include-hidden').addEventListener('change', onSettingChange);
  
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