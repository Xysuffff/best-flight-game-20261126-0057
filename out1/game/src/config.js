// Every tuning number and colour in one place. The world is a fixed 1280x720 logical playfield;
// the renderer scales it to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The aircraft. */
export const PLANE = {
  radius: 22,          // drawing radius of the fuselage
  wingspan: 46,        // wingtip to wingtip
  maxSpeed: 420,       // units per second at full throttle
  minSpeed: 90,        // stall speed
  accel: 160,          // thrust acceleration
  drag: 0.85,          // speed decay per second (fraction kept)
  pitchRate: 1.6,      // radians per second of stick
  rollRate: 2.6,       // radians per second of stick
  yawRate: 1.0,        // radians per second of rudder
  lift: 110,           // upward force per second when wings level
  gravity: 260,        // downward pull per second
  turnEfficiency: 0.6, // how much roll converts into heading change
};

/** Terrain. */
export const TERRAIN = {
  gridSize: 200,       // spacing of ground grid lines
  gridCount: 12,       // how many grid rings to draw
  hillScale: 0.003,    // how quickly ground height changes with distance
  hillHeight: 90,      // max bump height
  horizonY: 430,       // horizon line in playfield pixels
};

/** The runway: a target rectangle on the ground ahead of the player. */
export const RUNWAY = {
  length: 340,
  width: 46,
  distance: 2600,      // how far ahead it starts
};

/** HUD colours. */
export const PALETTE = {
  skyTop: '#0b162a',
  skyHorizon: '#3a6ea5',
  ground: '#1e2a20',
  groundDark: '#161e17',
  plane: '#eef1f5',
  planeAccent: '#7dd3fc',
  runway: '#f2c94c',
  runwayEdge: '#eef1f5',
  hud: '#7dd3fc',
  hudDim: '#5b7fa3',
  warn: '#f87171',
  text: '#eef1f5',
};

/** Font used everywhere. */
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Seconds of play per level, and the last level. */
export const LEVEL = { seconds: 15, max: 6 };

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'flight-game.best';
