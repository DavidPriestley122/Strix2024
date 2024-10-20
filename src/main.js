import { Engine } from "@babylonjs/core/Engines/engine.js";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager.js";
import createScene from "./game/strixGame.js";
import { sidebar } from "./sidebar/sidebar.js";
import {
  initLoadingScreen,
  updateLoadingBar,
  hideLoadingScreen,
} from "./loadingScreen.js";
import { initResizeHandler } from "./resizeHandler.js";
import { initLightbox } from "./utils/lightbox.js";
//import "./css/styles.css";
import "./css/main.css";
import "./css/header.css";
import "./css/sidebar.css";
import "./css/game.css";
import "./css/footer.css";

let engine, scene;

function initGame() {
  const canvas = document.getElementById("renderCanvas");
  engine = new Engine(canvas, true);
  scene = createScene(engine, canvas);

  sidebar.init();
  initLoadingScreen();
  initResizeHandler(engine);
  initLightbox();

  loadAssets();
}

function loadAssets() {
  const assetsManager = new AssetsManager(scene);

  assetsManager.onProgress = (remainingCount, totalCount) => {
    const progress = ((totalCount - remainingCount) / totalCount) * 100;
    updateLoadingBar(Math.round(progress));
  };

  assetsManager.onFinish = (tasks) => {
    updateLoadingBar(100);
    setTimeout(() => {
      hideLoadingScreen();
      startRenderLoop();
    }, 500);
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

window.addEventListener("DOMContentLoaded", initGame);

document.addEventListener("keydown", (event) => {
  if (event.key === "r" || event.key === "R") {
    restartGame();
  }
});

// Expose necessary functions to global scope
window.updateLoadingBar = updateLoadingBar;
window.finalizeLoading = () => updateLoadingBar(100);

export { updateLoadingBar, hideLoadingScreen };
