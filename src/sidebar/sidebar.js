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
      right: 0;
      width: 200px;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 20px;
      box-sizing: border-box;
    `;
    sidebarElement.innerHTML = '<h2>Game Sidebar</h2><p>Game information will appear here.</p>';
    document.body.appendChild(sidebarElement);
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