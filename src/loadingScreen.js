let loadingScreen, loadingProgress, loadingText;
let currentProgress = 0;

export function initLoadingScreen() {
  loadingScreen = document.getElementById("loadingScreen");
  loadingProgress = document.getElementById("loadingProgress");
  loadingText = document.getElementById("loadingText");
}

export function updateLoadingBar(progress) {
  if (!loadingProgress || !loadingText) {
    console.warn("Loading elements not initialized. Call initLoadingScreen first.");
    return;
  }

  currentProgress = Math.min(100, Math.max(currentProgress, progress));
  loadingProgress.style.width = `${currentProgress}%`;
  loadingText.textContent = `Loading... ${Math.round(currentProgress)}%`;

  if (currentProgress >= 100) {
    setTimeout(hideLoadingScreen, 500);
  }
}

export function hideLoadingScreen() {
  if (!loadingScreen) {
    console.warn("Loading screen element not found.");
    return;
  }

  loadingScreen.style.opacity = "0";
  loadingScreen.style.transition = "opacity 0.5s ease";
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 500);
}

// Add this function to reset the loading progress
export function resetLoadingProgress() {
  currentProgress = 0;
  if (loadingProgress && loadingText) {
    loadingProgress.style.width = "0%";
    loadingText.textContent = "Loading... 0%";
  }
}



