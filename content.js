// Function to update playback speed
function updateSpeed(speed) {
    const videos = document.querySelectorAll("video");
    videos.forEach(video => {
      try {
        video.playbackRate = speed; // Set speed (supports 3x, 5x, etc.)
      } catch (e) {
        console.warn('Failed to set playbackRate on video', e);
      }
    });
  }
  
  // Listen for messages from popup.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "changeSpeed") {
        updateSpeed(message.speed);
        sendResponse({ status: "success" });
      }

      if (message.action === 'popupOpened') {
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
          try {
            if (v.paused) {
              const p = v.play();
              if (p && p.catch) p.catch(() => {});
            }
          } catch (e) {}
        });
      }
  });

// Apply saved speed on load and when new videos appear
function applySavedSpeed() {
  // Default to 1 if not set
  chrome.storage.local.get(['lastSpeed'], (result) => {
    const speed = (result && result.lastSpeed) ? result.lastSpeed : 1;
    updateSpeed(speed);
  });
}

// Run once on initial load
applySavedSpeed();

// Observe DOM for new video elements (works with SPA sites like YouTube)
const observer = new MutationObserver((mutations) => {
  let found = false;
  for (var mi = 0; mi < mutations.length; mi++) {
    var m = mutations[mi];
    for (var ni = 0; ni < m.addedNodes.length; ni++) {
      var node = m.addedNodes[ni];
      if (node.nodeType === Node.ELEMENT_NODE) {
        try {
          if (node.tagName === 'VIDEO' || node.querySelector && node.querySelector('video')) {
            found = true;
            break;
          }
        } catch (e) {}
      }
    }
    if (found) break;
  }
  if (found) {
    applySavedSpeed();
  }
});

observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

// Some sites (like YouTube) use SPA navigation; listen to common navigation events
try {
  window.addEventListener('popstate', () => {
    // small delay to allow new elements to be added
    setTimeout(applySavedSpeed, 200);
  });
  // YouTube fires these custom events during navigation
  window.addEventListener('yt-navigate-finish', () => setTimeout(applySavedSpeed, 200));
  window.addEventListener('spfdone', () => setTimeout(applySavedSpeed, 200));
} catch (e) {
  console.warn('Failed to attach navigation listeners', e);
}
  