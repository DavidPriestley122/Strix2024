export const sidebar = {
  init: function() {
    console.log("Sidebar initialized");
    this.sidebarElement = document.getElementById('game-sidebar');
    if (!this.sidebarElement) {
      console.error('Sidebar element not found in the DOM');
      return;
    }
    this.updateInfo("Game Sidebar<br>Game started!");
  },

  updateInfo: function(info) {
    if (this.sidebarElement) {
      this.sidebarElement.innerHTML = info;
    }
  }
};