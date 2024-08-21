const wrapper = document.getElementById("game-wrapper");
const container = document.getElementById("game-container");
const canvas = document.getElementById("renderCanvas");

export function initResizeHandler(engine) {
  window.addEventListener("resize", () => resizeGame(engine));
  resizeGame(engine); // Initial size setup
}

function resizeGame(engine) {
  const targetWidth = 1600;
  const targetHeight = 1200;

  wrapper.style.width = `${targetWidth}px`;
  wrapper.style.height = `${targetHeight}px`;

  container.style.width = `${targetWidth}px`;
  container.style.height = `${targetHeight}px`;
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  if (engine) {
    engine.resize();
  }
}