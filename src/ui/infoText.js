import {
    AdvancedDynamicTexture,
    TextBlock,
    Control,
    Rectangle,
    TextWrapping,
    ScrollViewer,
  } from "@babylonjs/gui";
  
  export function createInfoText(scene) {
    var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
  
    // Create dynamic text object to display information
    var infoText = new TextBlock();
    infoText.text = "";
    infoText.color = "white";
    infoText.fontSize = 24;
    infoText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    infoText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    infoText.top = "20px";
    infoText.left = "20px";
    infoText.isVisible = true;
    advancedTexture.addControl(infoText);
  
    var messageRect = new Rectangle("messageRect");
    messageRect.width = "40%";
    messageRect.height = "20%";
    messageRect.cornerRadius = 20;
    messageRect.color = "white";
    messageRect.thickness = 4;
    messageRect.background = "rgba(0, 0, 0, 0.7)";
    messageRect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    messageRect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    messageRect.isVisible = false;
    advancedTexture.addControl(messageRect);
  
    var messageText = new TextBlock("messageText");
    messageText.text = "";
    messageText.color = "white";
    messageText.fontSize = 24;
    messageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    messageText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    messageText.resizeToFit = true;
    messageText.textWrapping = TextWrapping.WordWrap;
    messageText.paddingLeft = "5%";
    messageText.paddingRight = "5%";
    messageRect.addControl(messageText);
  
    // Create a container for the move history
    var moveHistoryContainer = new Rectangle("moveHistoryContainer");
    moveHistoryContainer.width = "100px";
    moveHistoryContainer.height = "200px";
    moveHistoryContainer.background = "rgba(0, 0, 0, 0.7)";
    moveHistoryContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    moveHistoryContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    moveHistoryContainer.top = "80px";
    moveHistoryContainer.left = "20px";
    advancedTexture.addControl(moveHistoryContainer);
  
    // Create a scroll viewer for the move history
    var moveHistoryViewer = new ScrollViewer("moveHistoryViewer");
    moveHistoryViewer.width = "100%";
    moveHistoryViewer.height = "100%";
    moveHistoryContainer.addControl(moveHistoryViewer);
  
    // Create a text block to display the move history
    var moveHistoryText = new TextBlock("moveHistoryText");
    moveHistoryText.text = "";
    moveHistoryText.color = "white";
    moveHistoryText.fontSize = 16;
    moveHistoryText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    moveHistoryText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    moveHistoryText.resizeToFit = true;
    moveHistoryText.textWrapping = TextWrapping.WordWrap;
    moveHistoryViewer.addControl(moveHistoryText);
  
    return {
      messageRect: messageRect,
      messageText: messageText,
      moveHistoryText: moveHistoryText,
      };
  }