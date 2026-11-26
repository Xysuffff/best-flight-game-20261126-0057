// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps,
// and the renderer paints sky, terrain, runway, the aircraft in chase view and the instrument HUD.
// ?seed=N fixes the flight pattern. ?shot=start|play|landed|end stages a scene, paints it twice
// and sets window.__shotReady so a screenshot can be taken.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_NONE } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_THROTTLE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_LANDED } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}
function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  // Gambar secara sinkron dan ekspos redraw agar ukuran jendela dapat disesuaikan sebelum tangkap layar.
  lastShot = { state: world.state, project: world.project.bind(world), screen: scene.screen, runwayX: world.runwayX, runwayZ: world.runwayZ };
  renderer.draw(lastShot.state, lastShot.project, lastShot.screen, lastShot.runwayX, lastShot.runwayZ);
  window.__shotReady = true;
  window.__redrawShot = () => renderer.draw(lastShot.state, lastShot.project, lastShot.screen, lastShot.runwayX, lastShot.runwayZ);
}
let lastShot = null;

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let throttleDir = 0;

  function announce(message) {
    const el = document.getElementById('status');
    if (el) el.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Taking off. Pitch ↑/↓, Roll ←/→, Throttle T.');
  }

  function finish() {
    if (world.state.landed) screen = SCREEN_LANDED;
    else screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = Math.floor(world.state.score);
      saveBest(best);
    }
    announce(world.state.landed ? 'Landed. Score ' + best : 'Crashed. Score ' + best);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_LANDED)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (actions & ACTION_THROTTLE) throttleDir = throttleDir === 0 ? 1 : throttleDir === 1 ? -1 : 0;
  }

  function step(dt) {
    const pitch = input.pitch();
    const roll = input.roll();
    const events = world.step(dt, pitch, roll, throttleDir);
    if (events) finish();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(STEP);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, world.project.bind(world), screen, world.runwayX, world.runwayZ);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Flight Sim. Press Space or click to take off.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
