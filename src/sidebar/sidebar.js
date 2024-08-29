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
/*
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
    this.createNavigation();
    this.showCategory("game-info"); // Show Game Info category by default
  },

  createNavigation: function () {
    const navHTML = `
      <div class="main-categories">
        <button class="category-button" data-category="game-info">Game Info</button>
        <button class="category-button" data-category="how-to-play">How to Play</button>
        <button class="category-button" data-category="shop">Shop</button>
        <button class="category-button" data-category="more">More</button>
      </div>
      <div class="sub-categories"></div>
      <div class="content-area"></div>
    `;
    this.sidebarElement.innerHTML = navHTML;

    // Add event listeners to main category buttons
    const categoryButtons =
      this.sidebarElement.querySelectorAll(".category-button");
    categoryButtons.forEach((button) => {
      button.addEventListener("click", () =>
        this.showCategory(button.dataset.category)
      );
    });
  },

  showCategory: function (categoryId) {
    // Update active category button
    const categoryButtons =
      this.sidebarElement.querySelectorAll(".category-button");
    categoryButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.category === categoryId);
    });

    // Show subcategories for the selected category
    const subCategories = this.getSubCategories(categoryId);
    const subCategoriesElement =
      this.sidebarElement.querySelector(".sub-categories");
    subCategoriesElement.innerHTML = subCategories
      .map(
        (sub) =>
          `<button class="sub-category-button" data-category="${categoryId}" data-subcategory="${sub.id}">${sub.title}</button>`
      )
      .join("");

    // Add event listeners to subcategory buttons
    const subCategoryButtons = subCategoriesElement.querySelectorAll(
      ".sub-category-button"
    );
    subCategoryButtons.forEach((button) => {
      button.addEventListener("click", () =>
        this.showContent(button.dataset.category, button.dataset.subcategory)
      );
    });

    // Show the first subcategory content by default
    if (subCategories.length > 0) {
      this.showContent(categoryId, subCategories[0].id);
    }
  },

  showContent: function (categoryId, subCategoryId) {
    const contentArea = this.sidebarElement.querySelector(".content-area");
    const subCategoryContent = content[categoryId][subCategoryId];
    contentArea.innerHTML = `
      <h2>${subCategoryContent.title}</h2>
      <div>${subCategoryContent.body}</div>
    `;

    // Update active subcategory button
    const subCategoryButtons = this.sidebarElement.querySelectorAll(
      ".sub-category-button"
    );
    subCategoryButtons.forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.subcategory === subCategoryId
      );
    });
  },

  getSubCategories: function (categoryId) {
    switch (categoryId) {
      case "game-info":
        return [
          { id: "introduction", title: "Introduction" },
          { id: "history", title: "History" },
        ];
      case "how-to-play":
        return [
          { id: "gui-instructions", title: "GUI Instructions" },
          { id: "game-rules", title: "Game Rules" },
        ];
      case "shop":
        return [{ id: "purchase", title: "Purchase Game Sets" }];
      case "more":
        return [{ id: "miscellaneous", title: "Miscellaneous" }];
      default:
        return [];
    }
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
