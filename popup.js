document.addEventListener("DOMContentLoaded", () => {
  const speedSlider = document.getElementById('speedSlider');
  const currentLabel = document.getElementById('currentLabel');
  
  const minusBtn = document.getElementById('minusBtn');
  const plusBtn = document.getElementById('plusBtn');

  const presetBtns = document.querySelectorAll('.preset-btn[data-value]');
  const customToggleBtn = document.getElementById('customToggleBtn');
  const customInputWrapper = document.getElementById('customInputWrapper');
  const customSpeedInput = document.getElementById('customSpeedInput');
  const applyCustomBtn = document.getElementById('applyCustomBtn');

  // Notification
  const notification = document.createElement("div");
  notification.id = "speed-notification";
  document.body.appendChild(notification);

  function showNotification(message) {
    notification.textContent = message;
    notification.style.display = "block";
    setTimeout(() => {
      notification.style.display = "none";
    }, 2000);
  }

  function updateSliderFill(val) {
    // Map value to percentage
    const min = parseFloat(speedSlider.min);
    const max = parseFloat(speedSlider.max);
    const percent = ((val - min) / (max - min)) * 100;
    speedSlider.style.setProperty('--range-progress', `${percent}%`);
  }

  function updateActivePreset(val) {
    let matchFound = false;
    presetBtns.forEach(btn => {
      if (parseFloat(btn.getAttribute('data-value')) === val) {
        btn.classList.add('active');
        matchFound = true;
      } else {
        btn.classList.remove('active');
      }
    });

    if (customToggleBtn) {
      if (!matchFound && val !== 1.0) {
        customToggleBtn.classList.add('active');
      } else {
        customToggleBtn.classList.remove('active');
      }
    }
  }

  function changeSpeed(speed) {
    try {
      chrome.storage.local.set({ lastSpeed: speed });
    } catch (e) {}

    let formattedSpeed = speed.toFixed(2);
    if (currentLabel) currentLabel.textContent = formattedSpeed + 'x';
    
    if (speedSlider) {
      speedSlider.value = speed;
      updateSliderFill(speed);
    }
    
    if (customSpeedInput) customSpeedInput.value = speed;

    updateActivePreset(speed);

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
        }, function() {
          if (chrome.runtime.lastError) {
             // Silently handle error
          }
        });
      }
    });
  }

  // Load Initial Settings
  chrome.storage.local.get(['lastSpeed'], (result) => {
    const initial = (result && result.lastSpeed) ? parseFloat(result.lastSpeed) : 1.0;
    changeSpeed(initial);
  });

  // Slider events
  speedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    currentLabel.textContent = val.toFixed(2) + 'x';
    updateSliderFill(val);
    if (customSpeedInput) customSpeedInput.value = val;
  });

  speedSlider.addEventListener('change', (e) => {
    const val = parseFloat(e.target.value);
    changeSpeed(val);
  });

  // Plus / Minus buttons
  minusBtn.addEventListener('click', () => {
    let val = parseFloat(speedSlider.value) - 0.25;
    if (val < parseFloat(speedSlider.min)) val = parseFloat(speedSlider.min);
    changeSpeed(val);
  });

  plusBtn.addEventListener('click', () => {
    let val = parseFloat(speedSlider.value) + 0.25;
    if (val > parseFloat(speedSlider.max)) val = parseFloat(speedSlider.max);
    changeSpeed(val);
  });

  // Presets
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.getAttribute('data-value'));
      changeSpeed(val);
      customInputWrapper.style.display = 'none'; // hide custom if a preset is selected
    });
  });

  // Custom Toggle
  customToggleBtn.addEventListener('click', () => {
    if (customInputWrapper.style.display === 'none' || customInputWrapper.style.display === '') {
      customInputWrapper.style.display = 'flex';
      customSpeedInput.focus();
    } else {
      customInputWrapper.style.display = 'none';
    }
  });

  // Custom Apply
  if (applyCustomBtn && customSpeedInput) {
    applyCustomBtn.addEventListener('click', () => {
      let val = parseFloat(customSpeedInput.value);
      if (isNaN(val)) val = 1.0;
      if (val > 16.0) val = 16.0;
      if (val < 0.1) val = 0.1;
      customSpeedInput.value = val;
      changeSpeed(val);
    });
    
    customSpeedInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyCustomBtn.click();
      }
    });
  }
});
