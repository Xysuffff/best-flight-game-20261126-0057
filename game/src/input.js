// Keyboard and pointer input for flight. Held keys give pitch/roll/rudder; one-shot presses
// (start or restart, pause, throttle) are queued as bit flags and taken once by the loop.
export const ACTION_CONFIRM = 1;   // start / restart
export const ACTION_PAUSE = 2;     // pause
export const ACTION_THROTTLE = 4;  // toggle throttle up

const PITCH_UP = new Set(['ArrowUp', 'KeyW']);
const PITCH_DOWN = new Set(['ArrowDown', 'KeyS']);
const ROLL_LEFT = new Set(['ArrowLeft', 'KeyA']);
const ROLL_RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const THROTTLE = new Set(['KeyT']);

export function createInput(target) {
  let pitch = 0;   // -1 down, 0 neutral, 1 up
  let roll = 0;    // -1 left, 0 neutral, 1 right
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (PITCH_UP.has(event.code)) pitch = 1;
    else if (PITCH_DOWN.has(event.code)) pitch = -1;
    else if (ROLL_LEFT.has(event.code)) roll = -1;
    else if (ROLL_RIGHT.has(event.code)) roll = 1;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (THROTTLE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_THROTTLE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (PITCH_UP.has(event.code) && pitch === 1) pitch = 0;
    else if (PITCH_DOWN.has(event.code) && pitch === -1) pitch = 0;
    else if (ROLL_LEFT.has(event.code) && roll === -1) roll = 0;
    else if (ROLL_RIGHT.has(event.code) && roll === 1) roll = 0;
  });
  // Keys released while the tab is hidden never send keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    pitch = 0;
    roll = 0;
  });
  target.addEventListener('pointerdown', () => {
    actions |= ACTION_CONFIRM;
  });

  return {
    /** -1 pitch down, 0 neutral, 1 pitch up. */
    pitch() { return pitch; },
    /** -1 roll left, 0 neutral, 1 roll right. */
    roll() { return roll; },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
