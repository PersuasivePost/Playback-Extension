document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".speed-btn");
  const resetButton = document.getElementById("reset");
  const speedSlider = document.getElementById('speedSlider');
  const currentLabel = document.getElementById('currentLabel');
  const themeToggle = document.getElementById("themeToggle");

  // Theme toggle
  function setTheme(isDark) {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('darkTheme', isDark);
  }

  const savedTheme = localStorage.getItem('darkTheme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme !== null ? savedTheme === 'true' : prefersDark;

  setTheme(initialTheme);
  themeToggle.checked = initialTheme;

  themeToggle.addEventListener('change', () => {
    setTheme(themeToggle.checked);
  });

  // Notification
  const notification = document.createElement("div");
  notification.id = "speed-notification";
  document.body.appendChild(notification);

  // Show notification
  function showNotification(message) {
    notification.textContent = message;
    notification.style.display = "block";

    setTimeout(() => {
      notification.style.display = "none";
    }, 2000);
  }

  // Function to change playback speed
  function changeSpeed(speed) {
    // Save speed to storage so content script (and future pages) can apply it
    try {
      chrome.storage.local.set({ lastSpeed: speed });
    } catch (e) {
      console.warn('chrome.storage not available in popup context', e);
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function(s) {
            var vids = document.querySelectorAll('video');
            for (var i = 0; i < vids.length; i++) {
              try { vids[i].playbackRate = s; } catch (e) {}
            }
          },
          args: [speed]
        }, function(results) {
          if (chrome.runtime.lastError) {
            showNotification("Error: " + chrome.runtime.lastError.message);
          } else {
            showNotification('Playback speed set to ' + speed + 'x');
          }
          window.close();
        });
      }
    });
  }

  // Slider interaction: update label live and set speed on change
  if (speedSlider) {
    chrome.storage.local.get(['lastSpeed'], (result) => {
      const initial = (result && result.lastSpeed) ? result.lastSpeed : 8;
      speedSlider.value = initial;
      if (currentLabel) currentLabel.textContent = `${initial}x`;
    });

    speedSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      currentLabel.textContent = `${val}x`;
    });

    speedSlider.addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      changeSpeed(val);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'popupOpened' }, (resp) => {
          if (chrome.runtime.lastError) {
            // ignore when no receiver exists
          }
        });
      }
    });
  }

  // Reset button to restore normal speed (1x)
  resetButton.addEventListener("click", () => {
    if (speedSlider) speedSlider.value = 1;
    if (currentLabel) currentLabel.textContent = '1x';
    changeSpeed(1);
  });
});

// Function executed in the active tab
function setPlaybackSpeed(speed) {
  const vids = document.querySelectorAll('video');
  vids.forEach(v => {
    try { v.playbackRate = speed; } catch (e) {}
  });
}
