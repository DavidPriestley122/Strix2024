// SCENE SETUP MODULE
// Handles initial scene creation, camera, lighting, and background

import {
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  ActionManager
} from "@babylonjs/core";
import { GAME_CONFIG } from "../../config/gameConfig.js";

export function createScene(engine, canvas) {
  const scene = new Scene(engine);
  
  // Configure double-click delay for better trackpad compatibility
  scene.actionManager = new ActionManager(scene);
  scene.actionManager.doubleClickDelay = 600; // Increased from default 300ms for trackpad support
  
  function updateProgress(progress) {
    if (window.updateLoadingBar) {
      window.updateLoadingBar(progress);
    }
  }

  updateProgress(GAME_CONFIG.LOADING_STEPS.CAMERA_SETUP);
  const camera = setupCamera(scene, canvas);
  
  updateProgress(GAME_CONFIG.LOADING_STEPS.LIGHTING_SETUP);
  setupLighting(scene);
  
  updateProgress(GAME_CONFIG.LOADING_STEPS.BACKGROUND_CREATION);
  createBackground(scene);
  
  updateProgress(GAME_CONFIG.LOADING_STEPS.BOARD_CONTAINER);
  const boardContainer = createBoardContainer(scene);

  return { scene, camera, boardContainer, updateProgress };
}

export function setupCamera(scene, canvas) {
  const camera = new ArcRotateCamera(
    "camera1",
    GAME_CONFIG.CAMERA.INITIAL_ALPHA,
    GAME_CONFIG.CAMERA.INITIAL_BETA,
    GAME_CONFIG.CAMERA.INITIAL_RADIUS,
    GAME_CONFIG.CAMERA.TARGET_OFFSET,
    scene
  );
  
  const currentPosition = camera.position;
  const currentTarget = camera.target;
  
  camera.position = new Vector3(
    currentPosition.x,
    currentPosition.y + GAME_CONFIG.CAMERA.POSITION_OFFSET_Y,
    currentPosition.z
  );
  
  camera.target = new Vector3(
    currentTarget.x,
    currentTarget.y + GAME_CONFIG.CAMERA.TARGET_OFFSET_Y,
    currentTarget.z
  );
  
  camera.attachControl(canvas, true);
  return camera;
}

export function setupLighting(scene) {
  const light1 = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
  const light2 = new DirectionalLight("light2", new Vector3(0, 0, -1), scene);
  const light3 = new DirectionalLight("light3", new Vector3(-1, 0, 0), scene);
  const light4 = new DirectionalLight("light4", new Vector3(0, -1, 0), scene);

  light1.intensity = GAME_CONFIG.LIGHTING.HEMISPHERIC_INTENSITY;
  light2.intensity = GAME_CONFIG.LIGHTING.DIRECTIONAL_INTENSITY_1;
  light3.intensity = GAME_CONFIG.LIGHTING.DIRECTIONAL_INTENSITY_2;
  light4.intensity = GAME_CONFIG.LIGHTING.DIRECTIONAL_INTENSITY_3;

  return { light1, light2, light3, light4 };
}

export function createBackground(scene) {
  const backgroundPlane = MeshBuilder.CreatePlane(
    "backgroundPlane",
    { size: GAME_CONFIG.BACKGROUND.PLANE_SIZE },
    scene
  );
  
  backgroundPlane.position.y = 0;
  backgroundPlane.rotation.x = Math.PI / 2;
  backgroundPlane.rotation.y = 0;
  backgroundPlane.rotation.z = 0;

  const backgroundMaterial = new StandardMaterial("backgroundMaterial", scene);
  backgroundMaterial.diffuseColor = new Color3(
    GAME_CONFIG.BACKGROUND.COLOR_RGB.R,
    GAME_CONFIG.BACKGROUND.COLOR_RGB.G,
    GAME_CONFIG.BACKGROUND.COLOR_RGB.B
  );
  backgroundMaterial.specularColor = new Color3(0, 0, 0);
  backgroundMaterial.backFaceCulling = false;
  backgroundPlane.material = backgroundMaterial;

  return backgroundPlane;
}

export function createBoardContainer(scene) {
  const boardContainer = new TransformNode("boardContainer", scene);
  
  // Rotate by the sine of the "magic angle" for x and the cosine of it for z, to make the set stand on its point
  boardContainer.rotation = new Vector3(
    GAME_CONFIG.BOARD.CONTAINER_ROTATION.X,
    GAME_CONFIG.BOARD.CONTAINER_ROTATION.Y,
    GAME_CONFIG.BOARD.CONTAINER_ROTATION.Z
  );
  
  boardContainer.position.y += GAME_CONFIG.BOARD.CONTAINER_POSITION_Y;
  
  return boardContainer;
}