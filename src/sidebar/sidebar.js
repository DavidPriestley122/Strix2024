export const sidebar = {
  init: function() {
    console.log("Sidebar initialized");
    this.createSidebarElement();
    this.setupEventListeners();
  },
  
  createSidebarElement: function() {
    const sidebarElement = document.createElement('div');
    sidebarElement.id = 'game-sidebar';
    sidebarElement.style.cssText = `
      position: absolute;
      top: 0;
      left: -100px;
      width: 200px;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 20px;
      box-sizing: border-box;
      z-index: 1000;
      overflow-y: auto;
    `;
    sidebarElement.innerHTML = '<h2>Game Sidebar</h2><p>Game information will appear here.</p>';
    
    // Append the sidebar to the game container instead of the body
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.position = 'relative';  // Ensure the container is a positioning context
      gameContainer.appendChild(sidebarElement);
    } else {
      console.error('Game container not found. Sidebar could not be appended.');
    }
  },

  setupEventListeners: function() {
    // We'll add event listeners here in the future
    console.log("Sidebar event listeners set up");
  },

  updateInfo: function(info) {
    const sidebarElement = document.getElementById('game-sidebar');
    if (sidebarElement) {
      sidebarElement.innerHTML = `<h2>Game Sidebar</h2><p>${info}</p>`;
    }
  }
};





