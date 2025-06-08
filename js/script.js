// DOM Elements
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const settingsBtn = document.getElementById("settings-btn");
const testSoundBtn = document.getElementById("test-sound-btn");
const settingsModal = document.getElementById("settings-modal");
const settingsClose = document.getElementById("settings-close");
const saveSettingsBtn = document.getElementById("save-settings");
const resetSettingsBtn = document.getElementById("reset-settings");
const themeToggle = document.getElementById("theme-toggle");
const themeOptions = document.getElementById("theme-options");
const themeBtns = document.querySelectorAll(".theme-btn");
const modeBtns = document.querySelectorAll(".mode-btn");
const progressRing = document.querySelector(".progress-ring-circle");
const focusDurationInput = document.getElementById("focus-duration");
const shortBreakDurationInput = document.getElementById("short-break-duration");
const longBreakDurationInput = document.getElementById("long-break-duration");
const audioNotificationsInput = document.getElementById("audio-notifications");
const browserNotificationsInput = document.getElementById(
  "browser-notifications"
);
const timerCompleteSound = document.getElementById("timer-complete");

// Constants and Variables
const TIMER_MODES = {
  FOCUS: "focus",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
};

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  audioNotifications: true,
  browserNotifications: true,
  theme: "default",
};

let settings = { ...DEFAULT_SETTINGS };
let currentMode = TIMER_MODES.FOCUS;
let timeLeft = settings.focusDuration * 60; // in seconds
let timerInterval = null;
let isTimerRunning = false;

// Get the circumference of the progress ring
const radius = progressRing.getAttribute("r");
const circumference = 2 * Math.PI * radius;
progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
progressRing.style.strokeDashoffset = "0";

// Initialize the app
function init() {
  loadSettings();
  updateDisplay();
  updateProgressRing();
  setTheme(settings.theme);
  
  // Initialize audio
  initializeAudio();

  // Request notification permission
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}

// Initialize audio for better browser compatibility
function initializeAudio() {
  // Add event listeners for audio loading
  timerCompleteSound.addEventListener("error", (e) => {
    console.error("Error loading audio file:", e);
  });

  // Some browsers require a user interaction before allowing audio playback
  // We'll preload the audio but set the volume to 0 temporarily
  timerCompleteSound.load();

  // Create a user interaction handler to enable audio
  document.addEventListener(
    "click",
    function enableAudio() {
      // Play and immediately pause to enable audio for future programmatic playback
      timerCompleteSound.volume = 0;
      timerCompleteSound
        .play()
        .then(() => {
          timerCompleteSound.pause();
          timerCompleteSound.currentTime = 0;
          timerCompleteSound.volume = 1;
          // Remove this listener once audio is enabled
          document.removeEventListener("click", enableAudio);
          console.log("Audio enabled after user interaction");
        })
        .catch((error) => {
          console.log("Still cannot play audio:", error);
        });
    },
    { once: true } // Using once: true to simplify listener removal
  );
}

// Helper function for playing audio with error handling
function playAudio(audioElement, errorMessage = "Timer complete!") {
  // Reset the audio to the beginning and ensure it's ready to play
  audioElement.currentTime = 0;

  // Play the sound with error handling
  const playPromise = audioElement.play();

  // Handle play() promise to catch any errors
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        // Playback started successfully
        console.log("Sound played successfully");
      })
      .catch((error) => {
        // Auto-play was prevented or there was another error
        console.error("Error playing sound:", error);

        // Try again with user interaction if browser policy blocked autoplay
        if (error.name === "NotAllowedError") {
          console.log(
            "Audio playback was prevented by browser policy. User interaction is required."
          );
          // We'll show a visual alert instead
          alert(errorMessage);
        }
      });
  }
}

// Function to test the sound
function testSound() {
  playAudio(timerCompleteSound, "Could not play sound. This browser might block autoplay.");
}

// Timer Functions
function startTimer() {
  if (isTimerRunning) return;

  isTimerRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();
    updateProgressRing();

    if (timeLeft <= 0) {
      completeTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isTimerRunning) return;

  isTimerRunning = false;
  clearInterval(timerInterval);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resetTimer() {
  pauseTimer();
  timeLeft = getModeTime() * 60;
  updateDisplay();
  updateProgressRing();
}

function completeTimer() {
  pauseTimer();

  // Add visual alert animation
  const timerContainer = document.querySelector(".timer-container");
  timerContainer.classList.add("timer-complete-alert");

  // Remove animation after 5 seconds
  setTimeout(() => {
    timerContainer.classList.remove("timer-complete-alert");
  }, 5000);

  // Play sound notification if enabled
  if (settings.audioNotifications) {
    playAudio(timerCompleteSound);
  }

  // Show browser notification if enabled
  if (settings.browserNotifications && Notification.permission === "granted") {
    const modeNames = {
      [TIMER_MODES.FOCUS]: "Focus",
      [TIMER_MODES.SHORT_BREAK]: "Short Break",
      [TIMER_MODES.LONG_BREAK]: "Long Break",
    };

    const nextMode =
      currentMode === TIMER_MODES.FOCUS
        ? TIMER_MODES.SHORT_BREAK
        : TIMER_MODES.FOCUS;

    new Notification("Pomodoro Timer Complete", {
      body: `${modeNames[currentMode]} time is up! Time for ${modeNames[nextMode]}.`,
      icon: "assets/icon.png",
    });
  }

  // Auto switch to the next mode
  if (currentMode === TIMER_MODES.FOCUS) {
    switchMode(TIMER_MODES.SHORT_BREAK);
  } else {
    switchMode(TIMER_MODES.FOCUS);
  }
}

function switchMode(mode) {
  currentMode = mode;

  // Update active button
  modeBtns.forEach((btn) => {
    if (btn.dataset.mode === mode) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Reset timer with new mode duration
  resetTimer();
}

function getModeTime() {
  switch (currentMode) {
    case TIMER_MODES.FOCUS:
      return settings.focusDuration;
    case TIMER_MODES.SHORT_BREAK:
      return settings.shortBreakDuration;
    case TIMER_MODES.LONG_BREAK:
      return settings.longBreakDuration;
    default:
      return settings.focusDuration;
  }
}

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  minutesEl.textContent = minutes.toString().padStart(2, "0");
  secondsEl.textContent = seconds.toString().padStart(2, "0");

  // Update document title with timer
  document.title = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")} - Pomodoro Vibe`;
}

function updateProgressRing() {
  const totalTime = getModeTime() * 60;
  const progress = timeLeft / totalTime;
  const offset = circumference - progress * circumference;
  progressRing.style.strokeDashoffset = offset;
}

// Settings Functions
function loadSettings() {
  const savedSettings = localStorage.getItem("pomodoroSettings");

  if (savedSettings) {
    settings = JSON.parse(savedSettings);
  }

  // Update inputs with current settings
  focusDurationInput.value = settings.focusDuration;
  shortBreakDurationInput.value = settings.shortBreakDuration;
  longBreakDurationInput.value = settings.longBreakDuration;
  audioNotificationsInput.checked = settings.audioNotifications;
  browserNotificationsInput.checked = settings.browserNotifications;

  // Reset timer with loaded settings
  resetTimer();
}

function saveSettings() {
  settings.focusDuration =
    parseInt(focusDurationInput.value) || DEFAULT_SETTINGS.focusDuration;
  settings.shortBreakDuration =
    parseInt(shortBreakDurationInput.value) ||
    DEFAULT_SETTINGS.shortBreakDuration;
  settings.longBreakDuration =
    parseInt(longBreakDurationInput.value) ||
    DEFAULT_SETTINGS.longBreakDuration;
  settings.audioNotifications = audioNotificationsInput.checked;
  settings.browserNotifications = browserNotificationsInput.checked;

  localStorage.setItem("pomodoroSettings", JSON.stringify(settings));

  // Reset timer with new settings
  resetTimer();
  closeSettingsModal();
}

function resetSettingsToDefault() {
  focusDurationInput.value = DEFAULT_SETTINGS.focusDuration;
  shortBreakDurationInput.value = DEFAULT_SETTINGS.shortBreakDuration;
  longBreakDurationInput.value = DEFAULT_SETTINGS.longBreakDuration;
  audioNotificationsInput.checked = DEFAULT_SETTINGS.audioNotifications;
  browserNotificationsInput.checked = DEFAULT_SETTINGS.browserNotifications;
}

function openSettingsModal() {
  settingsModal.classList.add("show");
}

function closeSettingsModal() {
  settingsModal.classList.remove("show");
}

// Theme Functions
function toggleThemeOptions() {
  themeOptions.classList.toggle("show");
}

function setTheme(theme) {
  document.body.className = `theme-${theme}`;
  settings.theme = theme;
  localStorage.setItem("pomodoroSettings", JSON.stringify(settings));
}

// Event Listeners
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
testSoundBtn.addEventListener("click", testSound);

settingsBtn.addEventListener("click", openSettingsModal);
settingsClose.addEventListener("click", closeSettingsModal);
saveSettingsBtn.addEventListener("click", saveSettings);
resetSettingsBtn.addEventListener("click", resetSettingsToDefault);

themeToggle.addEventListener("click", toggleThemeOptions);
themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    setTheme(btn.dataset.theme);
    themeOptions.classList.remove("show");
  });
});

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchMode(btn.dataset.mode);
  });
});

// Close settings modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    closeSettingsModal();
  }
});

// Close theme options when clicking outside
document.addEventListener("click", (e) => {
  if (!themeToggle.contains(e.target) && !themeOptions.contains(e.target)) {
    themeOptions.classList.remove("show");
  }
});

// Initialize the app
document.addEventListener("DOMContentLoaded", init);
