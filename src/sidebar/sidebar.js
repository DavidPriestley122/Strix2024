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
    this.showCategory("about-strix"); // Show About Strix category by default
  },

  createNavigation: function () {
    const categoryButtons =
      this.sidebarElement.querySelectorAll(".category-button");
    categoryButtons.forEach((button) => {
      button.addEventListener("click", () =>
        this.showCategory(button.dataset.category)
      );
    });
  },

  showCategory: function (categoryId) {
    console.log("showCategory called with:", categoryId);
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
    this.addSubCategoryListeners();

    // Show the first subcategory content by default
    if (subCategories.length > 0) {
      this.showContent(categoryId, subCategories[0].id);
    }
  },

  addSubCategoryListeners: function () {
    const subCategoryButtons = this.sidebarElement.querySelectorAll(
      ".sub-category-button"
    );
    subCategoryButtons.forEach((button) => {
      button.addEventListener("click", () =>
        this.showContent(button.dataset.category, button.dataset.subcategory)
      );
    });
  },

  /*showContent: function (categoryId, subCategoryId) {
    console.log("showContent called with:", categoryId, subCategoryId);
    const mainContentArea = document.getElementById("main-content-area");
    console.log("mainContentArea:", mainContentArea);
    const subCategoryContent = content[categoryId]?.[subCategoryId];
    console.log("subCategoryContent:", subCategoryContent);

    if (subCategoryContent && mainContentArea) {
      mainContentArea.innerHTML = `
      <h2>${subCategoryContent.title}</h2>
      <div>${subCategoryContent.body}</div>
    `;
      console.log("Content set to mainContentArea");
    } else {
      console.log(
        "Failed to set content. mainContentArea or subCategoryContent is null/undefined"
      );
    }

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
*/
  /*showContent: function (categoryId, subCategoryId) {
    console.log("showContent called with:", categoryId, subCategoryId);
    const sidebarContent = this.sidebarElement.querySelector(".content-area");
    const subCategoryContent = content[categoryId]?.[subCategoryId];
    console.log("subCategoryContent:", subCategoryContent);

    if (subCategoryContent && sidebarContent) {
      sidebarContent.innerHTML = `
      <h2>${subCategoryContent.title}</h2>
      <div>${subCategoryContent.body}</div>
    `;
      console.log("Content set to sidebarContent");

      // Expand sidebar for sample games
      if (subCategoryId === "what-is-strix" || subCategoryId === "sample-games") {
        this.sidebarElement.classList.add("expanded");
      } else {
        this.sidebarElement.classList.remove("expanded");
      }
    } else {
      console.log(
        "Failed to set content. sidebarContent or subCategoryContent is null/undefined"
      );
    }

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

  */
  showCategory: function (categoryId) {
    console.log("showCategory called with:", categoryId);
    // Update active category button
    const categoryButtons = this.sidebarElement.querySelectorAll(".category-button");
    categoryButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.category === categoryId);
    });

    // Show subcategories for the selected category
    const subCategories = this.getSubCategories(categoryId);
    const subCategoriesElement = this.sidebarElement.querySelector(".sub-categories");
    subCategoriesElement.innerHTML = subCategories
      .map(
        (sub) =>
          `<button class="sub-category-button" data-category="${categoryId}" data-subcategory="${sub.id}">${sub.title}</button>`
      )
      .join("");

    // Add event listeners to subcategory buttons
    this.addSubCategoryListeners();

    // Collapse sidebar when showing main category
    this.sidebarElement.classList.remove("expanded");

    // Clear content area
    const contentArea = this.sidebarElement.querySelector(".content-area");
    contentArea.innerHTML = "";
  },

  showContent: function (categoryId, subCategoryId) {
    console.log("showContent called with:", categoryId, subCategoryId);
    const sidebarContent = this.sidebarElement.querySelector(".content-area");
    const subCategoryContent = content[categoryId]?.[subCategoryId];
    console.log("subCategoryContent:", subCategoryContent);

    if (subCategoryContent && sidebarContent) {
      sidebarContent.innerHTML = `
        <h2>${subCategoryContent.title}</h2>
        <div>${subCategoryContent.body}</div>
      `;
      console.log("Content set to sidebarContent");

      // Expand sidebar for all subcategories
      this.sidebarElement.classList.add("expanded");
    } else {
      console.log(
        "Failed to set content. sidebarContent or subCategoryContent is null/undefined"
      );
      this.sidebarElement.classList.remove("expanded");
    }

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

    // Call resizeGame to adjust game wrapper position
    if (window.resizeGame) {
      window.resizeGame();
    }
  },





  getSubCategories: function (categoryId) {
    switch (categoryId) {
      case "about-strix":
        return [
          { id: "what-is-strix", title: "What is Strix?" },
          { id: "game-history", title: "History of Strix" },
        ];
      case "gameplay":
        return [
          { id: "online-strix", title: "Online Strix" },
          { id: "official-rules", title: "The Rules of Strix" },
          { id: "board-notation", title: "Board Notation" },
          { id: "sample-games", title: "Sample Games" },
          { id: "two-player-variant", title: "Two-Player Strix" },
        ];

      case "gallery":
        return [{ id: "strix-sightings", title: "Sightings of Strix" }];

      case "quill":
        return [
          { id: "strix-lore", title: "Strix Lore" },
          { id: "parliament", title: "Parliament" },
        ];

      case "shop":
        return [{ id: "purchase", title: "Order Game Sets" }];
      default:
        return [];
    }
  },

  updateInfo: function (info) {
    const contentArea = this.sidebarElement.querySelector(".content-area");
    if (contentArea) {
      contentArea.innerHTML = info;
    } else {
      console.warn("Content area not found. Unable to update info.");
    }
  },
};
