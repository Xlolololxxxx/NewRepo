document.addEventListener('DOMContentLoaded', function() {
  const sendButton = document.getElementById('send-button');
  const userInput = document.getElementById('user-input');
  const chatLog = document.getElementById('chat-log');

  sendButton.addEventListener('click', function() {
    const userMessage = userInput.value;
    if (userMessage) {
      appendMessage('user', userMessage);
      userInput.value = '';
      // TODO: Send the message to the AI agent via API
    }
  });

  function appendMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.textContent = message;
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  // OCR functionality
  chrome.tabs.captureVisibleTab(null, {}, function(imageUrl) {
    Tesseract.recognize(
      imageUrl,
      'eng',
      { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
      console.log(text);
      // TODO: Do something with the recognized text
    });
  });

  function saveStep(step) {
    chrome.storage.local.get({ steps: [] }, function(result) {
      const steps = result.steps;
      steps.push(step);
      chrome.storage.local.set({ steps: steps });
    });
  }

  function getSteps(callback) {
    chrome.storage.local.get({ steps: [] }, function(result) {
      callback(result.steps);
    });
  }

  const ocrButton = document.getElementById('ocr-button');
  ocrButton.addEventListener('click', function() {
    chrome.tabs.captureVisibleTab(null, {}, function(imageUrl) {
      Tesseract.recognize(
        imageUrl,
        'eng',
        { logger: m => console.log(m) }
      ).then(({ data: { text } }) => {
        appendMessage('agent', text);
      });
    });
  });

  const loginButton = document.getElementById('login-button');
  loginButton.addEventListener('click', function() {
    getAuthToken(function(token) {
      get2FACode(token, function(code) {
        // TODO: Input the code into the 2FA field
        console.log(`2FA code: ${code}`);
      });
    });
  });

  const showStepsButton = document.getElementById('show-steps-button');
  showStepsButton.addEventListener('click', function() {
    getSteps(function(steps) {
      appendMessage('agent', `Steps: ${steps.join(', ')}`);
    });
  });
});
