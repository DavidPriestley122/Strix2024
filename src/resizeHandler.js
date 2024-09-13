/*const wrapper = document.getElementById("game-wrapper");
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
 */
const wrapper = document.getElementById("game-wrapper");
const container = document.getElementById("game-container");
const canvas = document.getElementById("renderCanvas");
const sidebar = document.getElementById("game-sidebar");

export function initResizeHandler(engine) {
  function resizeGame() {
    const aspectRatio = 1600 / 1200; // Original width / height
    const sidebarWidth = sidebar.offsetWidth; 
    const headerHeight = document.querySelector('header').offsetHeight;
    const maxWidth = window.innerWidth - sidebarWidth;
    const maxHeight = window.innerHeight - 300; // Adjust for header/footer

    let newWidth, newHeight;

    if (maxWidth / maxHeight > aspectRatio) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    } else {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    wrapper.style.width = `${newWidth}px`;
    wrapper.style.height = `${newHeight}px`;
    container.style.width = `${newWidth}px`;
    container.style.height = `${newHeight}px`;
    canvas.width = newWidth;
    canvas.height = newHeight;

     // Update the left and top positions of the game wrapper
     wrapper.style.left = `${sidebarWidth}px`;
     wrapper.style.top = `${headerHeight}px`;

    // Center the game wrapper
    const leftMargin = Math.max(sidebarWidth, (window.innerWidth - newWidth) / 2);
    wrapper.style.marginLeft = `${leftMargin - sidebarWidth}px`;

    // Adjust sidebar height
    if (sidebar) {
      const header = document.querySelector('header');
      sidebar.style.top = `${header.offsetHeight}px`;
      sidebar.style.height = `${newHeight}px`;
    }

    if (engine) {
      engine.resize();
    }
  }

  window.addEventListener("resize", resizeGame);
  resizeGame(); // Initial size setup
}
