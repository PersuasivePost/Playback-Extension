document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".speed-btn");
  const resetButton = document.getElementById("reset");
  const customSpeedInput = document.getElementById("customSpeed");
  const setCustomButton = document.getElementById("setCustom");
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

    // Send message to active tab to apply immediately
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'changeSpeed', speed }, (resp) => {
          if (chrome.runtime.lastError) {
            // Fallback to executeScript if content script wasn't injected for some reason
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: setPlaybackSpeed,
              args: [speed]
            }, (results) => {
              if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                showNotification("Error: " + chrome.runtime.lastError.message);
              } else {
                showNotification(`Playback speed set to ${speed}x`);
              }
            });
          } else {
            showNotification(`Playback speed set to ${speed}x`);
          }
        });
      }
    });
  }

  // Attach event listeners to speed buttons
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const speed = parseFloat(button.dataset.speed);
      changeSpeed(speed);
    });
  });

  // Reset button to restore normal speed (1x)
  resetButton.addEventListener("click", () => {
    changeSpeed(1);
  });

  // Custom speed input
  setCustomButton.addEventListener("click", () => {
    const customSpeed = parseFloat(customSpeedInput.value);
    if (!isNaN(customSpeed) && customSpeed > 0) {
      changeSpeed(customSpeed);
    } else {
      alert("Please enter a valid speed above 0.");
    }
  });
});

// Function executed in the active tab
function setPlaybackSpeed(speed) {
  const video = document.querySelector("video");
  if (video) {
    video.playbackRate = speed;
  } else {
    alert("No video found on this page!");
  }
}
