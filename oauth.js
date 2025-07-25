function getAuthToken(callback) {
  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    callback(token);
  });
}

function get2FACode(token, callback) {
  const url = 'https://www.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1';
  const init = {
    method: 'GET',
    async: true,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    'contentType': 'json'
  };

  fetch(url, init)
    .then(response => response.json())
    .then(data => {
      if (data.messages && data.messages.length > 0) {
        const messageId = data.messages[0].id;
        const messageUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
        fetch(messageUrl, init)
          .then(response => response.json())
          .then(messageData => {
            const message = messageData.snippet;
            const code = message.match(/\d{6}/)[0];
            callback(code);
          });
      }
    });
}

function getUserEmail(callback) {
  chrome.identity.getProfileUserInfo(function(userInfo) {
    callback(userInfo.email);
  });
}
