document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".speed-btn");
    const resetButton = document.getElementById("reset");
    const customSpeedInput = document.getElementById("customSpeed");
    const setCustomButton = document.getElementById("setCustom");
  
    // Function to change playback speed
    function changeSpeed(speed) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: setPlaybackSpeed,
            args: [speed]
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
  