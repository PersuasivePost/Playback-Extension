// Function to update playback speed
function updateSpeed(speed) {
    const videos = document.querySelectorAll("video");
    videos.forEach(video => {
      video.playbackRate = speed; // Set speed (supports 3x, 5x, etc.)
    });
  }
  
  // Listen for messages from popup.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "changeSpeed") {
      updateSpeed(message.speed);
      sendResponse({ status: "success" });
    }
  });
  