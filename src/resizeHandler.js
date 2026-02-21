const wrapper = document.getElementById("game-wrapper");
const container = document.getElementById("game-container");
const canvas = document.getElementById("renderCanvas");
const sidebar = document.getElementById("game-sidebar");
const aiSidebar = document.getElementById("ai-sidebar");

const SIDEBAR_WIDTH = 250;
// Read once at module load — header height never changes, avoids forced reflow on every resize
const headerHeight = document.querySelector("header").offsetHeight;

function getLeftWidth() {
  return sidebar.classList.contains("collapsed") ? 0 : SIDEBAR_WIDTH;
}

function getRightWidth() {
  return aiSidebar.classList.contains("collapsed") ? 0 : SIDEBAR_WIDTH;
}

export function initResizeHandler(engine) {
  function resizeGame() {
    const aspectRatio = 1840 / 1380;
    const leftWidth = getLeftWidth();
    const rightWidth = getRightWidth();
    const maxWidth = window.innerWidth - leftWidth - rightWidth;
    const maxHeight = window.innerHeight - 200;

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

    // Centre in the available space between sidebars
    const idealLeft = leftWidth + Math.max(0, (maxWidth - newWidth) / 2);
    wrapper.style.left = `${idealLeft}px`;
    wrapper.style.marginLeft = "0px";
    wrapper.style.top = `${headerHeight}px`;

    if (sidebar) {
      sidebar.style.top = `${headerHeight}px`;
    }

    if (engine) {
      engine.resize();
    }
  }

  // Defer resize to the next animation frame to avoid forced reflows after DOM mutations
  function scheduleResize() {
    requestAnimationFrame(resizeGame);
  }

  // ── Left sidebar toggle tab ──────────────────────────────────────────────
  const leftToggle = document.getElementById("left-sidebar-toggle");
  if (leftToggle) {
    leftToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      leftToggle.textContent = sidebar.classList.contains("collapsed")
        ? "\u203a"
        : "\u2039";
      scheduleResize();
    });
  }

  // ── Right sidebar toggle tab ─────────────────────────────────────────────
  const rightToggle = document.getElementById("right-sidebar-toggle");
  if (rightToggle) {
    rightToggle.addEventListener("click", () => {
      aiSidebar.classList.toggle("collapsed");
      rightToggle.textContent = aiSidebar.classList.contains("collapsed")
        ? "\u2039"
        : "\u203a";
      scheduleResize();
    });
  }

  // ── Maximize / restore button ────────────────────────────────────────────
  const maximizeBtn = document.getElementById("maximizeButton");
  if (maximizeBtn) {
    maximizeBtn.addEventListener("click", () => {
      const bothCollapsed =
        sidebar.classList.contains("collapsed") &&
        aiSidebar.classList.contains("collapsed");

      if (bothCollapsed) {
        // Restore both sidebars
        sidebar.classList.remove("collapsed");
        aiSidebar.classList.remove("collapsed");
        if (leftToggle) leftToggle.textContent = "\u2039";
        if (rightToggle) rightToggle.textContent = "\u203a";
        maximizeBtn.querySelector(".mode-status").textContent = "OFF";
      } else {
        // Collapse both sidebars
        sidebar.classList.add("collapsed");
        aiSidebar.classList.add("collapsed");
        if (leftToggle) leftToggle.textContent = "\u203a";
        if (rightToggle) rightToggle.textContent = "\u2039";
        maximizeBtn.querySelector(".mode-status").textContent = "ON";
      }
      scheduleResize();
    });
  }

  window.addEventListener("resize", scheduleResize);
  resizeGame(); // Initial call — DOM is clean at this point, no reflow risk
}
