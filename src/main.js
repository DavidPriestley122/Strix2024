import { Engine } from "@babylonjs/core/Engines/engine.js";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager.js";
import createScene from "./game/strixGame.js";
import { sidebar } from "./sidebar/sidebar.js";
import { initLoadingScreen, updateLoadingBar, hideLoadingScreen } from "./loadingScreen.js";
import { initResizeHandler } from "./resizeHandler.js";
import "./css/styles.css";

let engine, scene;

function initGame() {
  const canvas = document.getElementById("renderCanvas");
  engine = new Engine(canvas, true);
  scene = createScene(engine, canvas);

  sidebar.init();
  initLoadingScreen();
  initResizeHandler(engine);

  loadAssets();
}

function loadAssets() {
  const assetsManager = new AssetsManager(scene);

  assetsManager.onProgress = (remainingCount, totalCount) => {
    const progress = ((totalCount - remainingCount) / totalCount) * 100;
    updateLoadingBar(Math.round(progress));
  };

  assetsManager.onFinish = (tasks) => {
    hideLoadingScreen();
    sidebar.updateInfo("Game started!");
    startRenderLoop();
  };

  assetsManager.load();
}

function startRenderLoop() {
  engine.runRenderLoop(() => {
    scene.render();
  });
}

function restartGame() {
  location.reload();
}

// Event Listeners
window.addEventListener("load", initGame);

document.addEventListener("keydown", (event) => {
  if (event.key === "r" || event.key === "R") {
    restartGame();
  }
});

// Expose necessary functions to global scope
window.updateLoadingBar = updateLoadingBar;
window.finalizeLoading = () => updateLoadingBar(100);

export { updateLoadingBar, hideLoadingScreen };
