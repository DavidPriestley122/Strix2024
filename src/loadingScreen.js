let loadingScreen, loadingProgress, loadingText;
let currentProgress = 0;

export function initLoadingScreen() {
  loadingScreen = document.getElementById("loadingScreen");
  loadingProgress = document.getElementById("loadingProgress");
  loadingText = document.getElementById("loadingText");
}

export function updateLoadingBar(progress) {
  currentProgress = Math.min(100, Math.max(currentProgress, progress));
  loadingProgress.style.width = `${currentProgress}%`;
  loadingText.textContent = `Loading... ${Math.round(currentProgress)}%`;

  if (currentProgress >= 100) {
    setTimeout(hideLoadingScreen, 500);
  }
}

export function hideLoadingScreen() {
  loadingScreen.style.opacity = "0";
  loadingScreen.style.transition = "opacity 0.5s ease";
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 500);
}