// DOM Elements
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const settingsBtn = document.getElementById("settings-btn");
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

  // Request notification permission
  if ("Notification" in window) {
    Notification.requestPermission();
  }
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

  // Play sound notification if enabled
  if (settings.audioNotifications) {
    timerCompleteSound.play();
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
