/*export const sidebar = {
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
*/
import { content } from "./content.js";

export const sidebar = {
  init: function () {
    console.log("Sidebar initialized");
    this.sidebarElement = document.getElementById("game-sidebar");
    if (!this.sidebarElement) {
      console.error("Sidebar element not found in the DOM");
      return;
    }
    this.createTabs();
    this.showTab("rules"); // Show Rules tab by default
  },

  createTabs: function () {
    const tabsHTML = `
      <div class="tabs">
        <button class="tab-button" data-tab="rules">Rules</button>
        <button class="tab-button" data-tab="history">History</button>
        <button class="tab-button" data-tab="purchase">Purchase</button>
      </div>
      <div class="tab-content" id="rules">
        <h2>${content.rules.title}</h2>
        <p>${content.rules.body}</p>
      </div>
      <div class="tab-content" id="history">
        <h2>${content.history.title}</h2>
        <p>${content.history.body}</p>
      </div>
      <div class="tab-content" id="purchase">
        <h2>${content.purchase.title}</h2>
        <p>${content.purchase.body}</p>
      </div>
      <div id="game-info"></div>
    `;
    this.sidebarElement.innerHTML = tabsHTML;

    // Add event listeners to tabs
    const tabButtons = this.sidebarElement.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => this.showTab(button.dataset.tab));
    });
  },

  showTab: function (tabId) {
    // Hide all tab content
    const tabContents = this.sidebarElement.querySelectorAll(".tab-content");
    tabContents.forEach((content) => (content.style.display = "none"));

    // Show the selected tab content
    const selectedTab = this.sidebarElement.querySelector(`#${tabId}`);
    if (selectedTab) {
      selectedTab.style.display = "block";
    }

    // Update active tab button
    const tabButtons = this.sidebarElement.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === tabId);
    });
  },

  updateInfo: function (info) {
    const gameInfoElement = this.sidebarElement.querySelector("#game-info");
    if (gameInfoElement) {
      gameInfoElement.innerHTML = info;
    } else {
      console.warn("Game info element not found. Creating a new one.");
      const newInfoElement = document.createElement("div");
      newInfoElement.id = "game-info";
      newInfoElement.innerHTML = info;
      this.sidebarElement.appendChild(newInfoElement);
    }
  },
};
