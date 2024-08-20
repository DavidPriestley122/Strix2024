/*//import { Engine } from "@babylonjs/core";
import {Engine} from "@babylonjs/core/Engines/engine.js";
import createScene from "./src/game/strixGame.js";


function main() {
  const canvas = document.getElementById("renderCanvas");
  const engine = new Engine(canvas, true);
  const scene = createScene(engine, canvas);

  engine.runRenderLoop(function () {
    scene.render();
  });

  window.addEventListener("resize", function () {
    engine.resize();
  });
}

// Call the main function when the window is loaded
window.addEventListener("load", main);
*/


import { Engine } from "@babylonjs/core/Engines/engine.js";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager.js";
import createScene from "./game/strixGame.js";
import './css/styles.css';
console.log('CSS should be loaded')

function main() {
  const canvas = document.getElementById("renderCanvas");
  const engine = new Engine(canvas, true);

  function updateLoadingBar(progress) {
    if (window.updateLoadingBar) {
      window.updateLoadingBar(progress);
    }
  }

  function hideLoadingScreen() {
    if (window.finalizeLoading) {
      window.finalizeLoading();
    }
  }

  const scene = createScene(engine, canvas);

  // Set up asset manager
  const assetsManager = new AssetsManager(scene);

  // Add your assets here
  // Example: assetsManager.addMeshTask("stand", "", "path/to/", "stand.babylon");

  assetsManager.onProgress = function(remainingCount, totalCount, lastFinishedTask) {
    const progress = ((totalCount - remainingCount) / totalCount) * 100;
    updateLoadingBar(Math.round(progress));
  };

  assetsManager.onFinish = function(tasks) {
    hideLoadingScreen();
    engine.runRenderLoop(function () {
      scene.render();
    });
  };

  assetsManager.load();

  window.addEventListener("resize", function () {
    engine.resize();
  });
}

// Call the main function when the window is loaded
window.addEventListener("load", main);


