const wrapper = document.getElementById("game-wrapper");
const container = document.getElementById("game-container");
const canvas = document.getElementById("renderCanvas");
const sidebar = document.getElementById("game-sidebar");
const main = document.querySelector("main");

export function initResizeHandler(engine) {
  window.addEventListener("resize", () => resizeGame(engine));
  resizeGame(engine); // Initial size setup
}

function resizeGame(engine) {
  const targetWidth = 1600;
  const targetHeight = 1200;
  const sidebarWidth = 250;

  // Set wrapper and container size
  wrapper.style.width = `${targetWidth}px`;
  wrapper.style.height = `${targetHeight}px`;
  container.style.width = `${targetWidth}px`;
  container.style.height = `${targetHeight}px`;

  // Center the game wrapper
  const windowWidth = window.innerWidth;
  const totalSideSpace = windowWidth - targetWidth;
  const leftMargin = Math.max(sidebarWidth, totalSideSpace / 2);

  wrapper.style.marginLeft = `${leftMargin - sidebarWidth}px`;

 
  // Adjust sidebar height
  if (sidebar) {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    sidebar.style.top = `${header.offsetHeight}px`;
   
  }

  if (engine) {
    engine.resize();
  }
}