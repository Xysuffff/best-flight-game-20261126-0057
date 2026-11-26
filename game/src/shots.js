// The screenshot scenes behind ?shot=start|play|landed|end. Each one plays the real flight rules
// forward from a fresh world for a fixed number of steps, steered by a simple autopilot, so the
// frame is what a real flight looks like and the same seed always gives the same frame.
import { FIELD, PLANE, STEP } from './config.js';
import { EVENT_LANDED, EVENT_CRASHED } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_LANDED } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 30;
const LAND_SECONDS = 45;
const SAMPLE = 1 / 30;

/** How far ahead, in seconds, the autopilot looks when steering toward the runway. */
const HORIZON = 1.2;

function timeToRunway(state, runwayX, runwayZ) {
  const dx = runwayX - state.plane.x;
  const dz = runwayZ - state.plane.z;
  return Math.sqrt(dx * dx + dz * dz) / Math.max(state.plane.speed, 1);
}

/** Steer toward the runway: pitch down to descend, roll to align heading. */
function autopilot(state, runwayX, runwayZ) {
  const dx = runwayX - state.plane.x;
  const dz = runwayZ - state.plane.z;
  const wantedHeading = Math.atan2(dx, dz);
  let headingDiff = wantedHeading - state.plane.heading;
  while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
  while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
  const roll = Math.max(-1, Math.min(1, headingDiff * 1.6));
  const clearance = state.plane.y - state.groundHeight(state.plane.x, state.plane.z);
  const dist = timeToRunway(state, runwayX, runwayZ);
  let pitch = 0;
  if (dist < 1200 && clearance > 60) pitch = -0.5; // descend toward runway
  else if (clearance < 100) pitch = 0.4; // pull up if too low
  else if (state.plane.y < 300) pitch = 0.2;
  return { pitch, roll };
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'start' || name === 'title') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, 0, 0, 0);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'landed' ? LAND_SECONDS : PLAY_SECONDS;
  let over = false;
  let landed = false;
  for (let i = 0; i < limit / STEP; i += 1) {
    const { pitch, roll } = autopilot(world.state, world.runwayX, world.runwayZ);
    const events = world.step(STEP, pitch, roll, 1);
    if (events & EVENT_LANDED) { landed = true; break; }
    if (events & EVENT_CRASHED) { over = true; break; }
  }
  if (landed) return { screen: SCREEN_LANDED, best: Math.floor(world.state.score) };
  if (over) return { screen: SCREEN_OVER, best: Math.floor(world.state.score) };
  return { screen: SCREEN_PLAY, best: Math.floor(world.state.score) };
}
