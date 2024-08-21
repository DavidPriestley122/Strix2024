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
  const sidebarWidth = 200; // Width of the sidebar

  wrapper.style.width = `${targetWidth + sidebarWidth}px`;
  wrapper.style.height = `${targetHeight}px`;

  container.style.width = `${targetWidth + sidebarWidth}px`;
  container.style.height = `${targetHeight}px`;
  container.style.position = 'relative';  // Ensure it's a positioning context

  canvas.style.position = 'absolute';
  canvas.style.left = `${sidebarWidth}px`;
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  if (engine) {
    engine.resize();
  }
}