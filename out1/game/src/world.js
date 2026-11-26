// The flight model and world state: the aircraft's position and attitude, the scrolling terrain,
// the runway target ahead, and landing/crash detection. step() advances one fixed step and
// returns event flags, so the caller can react without the world knowing about screens.
import { FIELD, PLANE, TERRAIN, RUNWAY, LEVEL } from './config.js';

export const EVENT_NONE = 0;
export const EVENT_LANDED = 1;
export const EVENT_CRASHED = 2;

const camDist = 700;     // chase camera distance behind the plane
const camHeight = 300;   // chase camera height above the plane
const focal = 700;       // projection focal length

export function createWorld(random) {
  const plane = {
    x: 0, y: 420, z: 0,       // position, y is up / altitude
    heading: 0, pitch: 0, roll: 0,  // attitude in radians
    speed: 200, throttle: 0.6,
  };
  const state = {
    plane,
    score: 0,
    level: 1,
    elapsed: 0,
    landed: false,
    crashed: false,
    finished: false,
  };
  state.groundHeight = groundHeight;

  /** Height of the terrain at (x, z): rolling hills. */
  function groundHeight(x, z) {
    return Math.sin(x * 0.0018) * 28 + Math.cos(z * 0.0014) * 42 + 10;
  }

  /** World-space position of the runway centre. */
  const runwayX = RUNWAY.distance * Math.sin(0);
  const runwayZ = RUNWAY.distance * Math.cos(0);

  function reset() {
    plane.x = 0; plane.y = 420; plane.z = 0;
    plane.heading = 0; plane.pitch = 0; plane.roll = 0;
    plane.speed = 200; plane.throttle = 0.6;
    state.score = 0; state.level = 1; state.elapsed = 0;
    state.landed = false; state.crashed = false; state.finished = false;
  }

  /**
   * One fixed step.
   * pitch: -1 (nose down) .. 1 (nose up)
   * roll: -1 (bank left) .. 1 (bank right)
   * throttleCmd: 1 = throttle up, -1 = throttle down, 0 = hold
   */
  function step(dt, pitch, roll, throttleCmd) {
    if (state.finished) return EVENT_NONE;
    let events = 0;
    state.elapsed += dt;
    state.level = Math.min(LEVEL.max, 1 + Math.floor(state.elapsed / LEVEL.seconds));

    // Throttle
    if (throttleCmd === 1) plane.throttle = Math.min(1, plane.throttle + 0.5 * dt);
    else if (throttleCmd === -1) plane.throttle = Math.max(0, plane.throttle - 0.5 * dt);

    // Attitude
    plane.pitch += pitch * PLANE.pitchRate * dt;
    plane.pitch = Math.max(-1.3, Math.min(1.3, plane.pitch));
    plane.roll += roll * PLANE.rollRate * dt;
    plane.roll = Math.max(-2.6, Math.min(2.6, plane.roll));

    // Speed: thrust minus drag, climbing costs speed
    const thrust = plane.throttle * PLANE.accel;
    const drag = (plane.speed / PLANE.maxSpeed) * PLANE.drag * 55;
    const pitchDrag = Math.sin(plane.pitch) * 50;
    plane.speed += (thrust - drag - pitchDrag) * dt;
    plane.speed = Math.max(PLANE.minSpeed, Math.min(PLANE.maxSpeed, plane.speed));

    // Forward movement along heading
    const dirX = Math.sin(plane.heading);
    const dirZ = Math.cos(plane.heading);
    plane.x += dirX * plane.speed * dt;
    plane.z += dirZ * plane.speed * dt;

    // Bank and turn: roll changes heading
    plane.heading += plane.roll * PLANE.turnEfficiency * dt;

    // Climb / dive from pitch
    plane.y += Math.sin(plane.pitch) * plane.speed * 0.85 * dt;

    // Gravity vs lift (lift strongest when wings level)
    plane.y -= PLANE.gravity * dt;
    plane.y += Math.cos(plane.roll) * PLANE.lift * dt;

    // Score for staying airborne and gaining distance
    state.score += Math.floor(plane.speed * 0.05 * dt);

    // Terrain collision
    const gHeight = groundHeight(plane.x, plane.z);
    const clearance = plane.y - gHeight;
    if (clearance < 14) {
      // On or near the runway surface: attempt landing
      const onRunway = Math.abs(plane.x - runwayX) < RUNWAY.width / 2 + 40 &&
        Math.abs(plane.z - runwayZ) < RUNWAY.length / 2 + 60;
      if (onRunway && plane.speed < 160 && Math.abs(plane.pitch) < 0.25 && Math.abs(plane.roll) < 0.3) {
        plane.y = gHeight + 2;
        state.landed = true;
        state.finished = true;
        events |= EVENT_LANDED;
        state.score += 500;
      } else if (clearance < 2) {
        plane.y = gHeight + 2;
        state.crashed = true;
        state.finished = true;
        events |= EVENT_CRASHED;
      } else {
        // Too low but not crashed: nudge up, penalise
        plane.y = gHeight + 14;
      }
    }

    return events;
  }

  /** Project a 3D world point to 2D screen from the chase camera. Returns null if behind camera. */
  function project(wx, wy, wz) {
    // Camera position: behind and above the plane
    const chX = plane.x - Math.sin(plane.heading) * camDist;
    const chY = plane.y + camHeight;
    const chZ = plane.z - Math.cos(plane.heading) * camDist;
    const dx = wx - chX;
    const dy = wy - chY;
    const dz = wz - chZ;
    // Camera basis: forward = heading direction, right = perpendicular, up = world up
    const hx = Math.sin(plane.heading);
    const hz = Math.cos(plane.heading);
    const rx = -hz;
    const rz = hx;
    const localZ = dx * hx + dy * 0 + dz * hz;
    if (localZ <= 40) return null;
    const localX = dx * rx + dy * 0 + dz * rz;
    const localY = dy;
    const scale = focal / localZ;
    return {
      sx: FIELD.width / 2 + localX * scale,
      sy: FIELD.height / 2 - localY * scale - 60,
      scale,
    };
  }

  reset();
  return { state, reset, step, groundHeight, project, runwayX, runwayZ };
}
