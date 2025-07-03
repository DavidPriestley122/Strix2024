// GAME CONFIGURATION MODULE
// Centralized configuration constants and settings

import { Vector3 } from "@babylonjs/core";

export const GAME_CONFIG = {
  // Camera settings
  CAMERA: {
    INITIAL_ALPHA: 0,
    INITIAL_BETA: Math.PI / 4,
    INITIAL_RADIUS: 30,
    TARGET_OFFSET: new Vector3(0, 0, 0),
    POSITION_OFFSET_Y: -3,
    TARGET_OFFSET_Y: 5
  },

  // Lighting settings
  LIGHTING: {
    HEMISPHERIC_INTENSITY: 0.7,
    DIRECTIONAL_INTENSITY_1: 0.1,
    DIRECTIONAL_INTENSITY_2: 0.5,
    DIRECTIONAL_INTENSITY_3: 0.5
  },

  // Background settings
  BACKGROUND: {
    PLANE_SIZE: 1000,
    COLOR_RGB: {
      R: 24.3 / 100,
      G: 43.9 / 100,
      B: 57.6 / 100
    }
  },

  // Board settings
  BOARD: {
    CONTAINER_ROTATION: {
      X: -(1 / Math.sqrt(3)),
      Y: 0,
      Z: Math.cos(Math.asin(1 / Math.sqrt(3)))
    },
    CONTAINER_POSITION_Y: 1.45
  },

  // Piece offset vectors for different board faces
  PIECE_OFFSETS: {
    BROWN: { x: 0, y: 3.75, z: 0 },
    YELLOW: { x: 3.75, y: 0, z: 0 },
    GREEN: { x: 0, y: 0, z: 3.75 }
  },

  // Owl Halla offset vectors
  OWL_HALLA_OFFSETS: {
    BROWN: { x: 0, y: 3.5, z: 0 },
    YELLOW: { x: 3.5, y: 0, z: 0 },
    GREEN: { x: 0, y: 0, z: 3.5 }
  },

  // Starting positions for pieces
  STARTING_POSITIONS: {
    brownOwl: "b7-1",
    brownKite: "b6-2",
    brownRaven: "b5-3",
    yellowOwl: "y7-1",
    yellowKite: "y6-2",
    yellowRaven: "y5-3",
    greenOwl: "g7-1",
    greenKite: "g6-2",
    greenRaven: "g5-3"
  },

  // Owl Halla cube mappings
  OWL_HALLA_CUBES: {
    brownOwl: "b7--1",
    brownKite: "b6--1",
    brownRaven: "b5--1",
    yellowOwl: "y7--1",
    yellowKite: "y6--1",
    yellowRaven: "y5--1",
    greenOwl: "g7--1",
    greenKite: "g6--1",
    greenRaven: "g5--1"
  },

  // Animation settings
  ANIMATION: {
    PIECE_MOVEMENT_DURATION: 30,
    PIECE_MOVEMENT_FPS: 60,
    CAPTURE_ANIMATION_DURATION: 30
  },

  // Material colors
  MATERIALS: {
    BROWN: { r: 88, g: 54, b: 41 },
    YELLOW: { r: 255, g: 204, b: 0 },
    GREEN: { r: 8, g: 64, b: 0 }
  },

  // Loading progress steps
  LOADING_STEPS: {
    CAMERA_SETUP: 10,
    LIGHTING_SETUP: 20,
    BACKGROUND_CREATION: 30,
    BOARD_CONTAINER: 40,
    BASE_AND_FINS: 50,
    GUI_ELEMENTS: 60,
    CHECKER_BOARDS: 70,
    PLAYING_PIECES: 80,
    INITIAL_POSITIONS: 90,
    COMPLETE: 100
  },

  // Timers
  TIMERS: {
    BUTTON_LISTENER_DELAY: 2000, // 2 seconds
    CAPTURE_DECISION_TIMEOUT: 7000, // 7 seconds
    HYBRID_CAPTURE_TIMEOUT: 7000 // 7 seconds
  }
};

export default GAME_CONFIG;