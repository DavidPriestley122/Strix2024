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
    this.showCategory("game-intro"); // Show Game Introduction category by default
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

  showContent: function (categoryId, subCategoryId) {
    const contentArea = this.sidebarElement.querySelector(".content-area");
    const subCategoryContent = content[categoryId]?.[subCategoryId];

    if (subCategoryContent) {
      contentArea.innerHTML = `
        <h2>${subCategoryContent.title}</h2>
        <div>${subCategoryContent.body}</div>
      `;
    } else {
      contentArea.innerHTML = "<p>Content not available.</p>";
      console.warn(
        `Content not found for category: ${categoryId}, subcategory: ${subCategoryId}`
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

    // Re-add event listeners to ensure they're always active
    this.addSubCategoryListeners();
  },

  getSubCategories: function (categoryId) {
    switch (categoryId) {
      case "game-intro":
        return [
          { id: "what-is-strix", title: "What is Strix?" },
          { id: "game-history", title: "History of Strix" },
        ];
      case "gameplay":
        return [
          { id: "ui-guide", title: "3D Interface Guide" },
          { id: "game-rules", title: "Official Rules" },
          { id: "animated-tutorial", title: "Animated Tutorial" },
        ];
      case "extras":
        return [
          { id: "strix-lore", title: "Strix Lore" },
          { id: "community-corner", title: "Community Corner" },
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
