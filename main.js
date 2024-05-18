import { Engine } from "@babylonjs/core";
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