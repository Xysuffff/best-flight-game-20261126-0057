// Drawing only: sky, terrain, runway, the aircraft in chase view, and the instrument HUD.
// The world's 3D points are projected through world.project() onto the 1280x720 playfield.
import { FIELD, PLANE, TERRAIN, RUNWAY, PALETTE, FONT } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_LANDED = 'landed';

const PANEL = { width: 620, top: 130, line: 36, bottom: 72 };
const HUD_X = 26;
const HUD_Y = 22;

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const altLabel = cachedLabel('ALT ');
  const spdLabel = cachedLabel('SPD ');
  const hdgLabel = cachedLabel('HDG ');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }

  context.textBaseline = 'alphabetic';

  function text(value, x, y, size, color, align) {
    context.font = `${size}px ${FONT}`;
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function line(x1, y1, x2, y2, color, width) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.stroke();
  }

  function rect(x, y, w, h, color) {
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
  }

  /** Draw the sky gradient above the horizon. */
  function drawSky() {
    const grad = context.createLinearGradient(0, 0, 0, TERRAIN.horizonY);
    grad.addColorStop(0, PALETTE.skyTop);
    grad.addColorStop(1, PALETTE.skyHorizon);
    rect(0, 0, FIELD.width, TERRAIN.horizonY, '');
    context.fillStyle = grad;
    context.fillRect(0, 0, FIELD.width, TERRAIN.horizonY);
  }

  /** Projected ground grid scrolling toward the player. */
  function drawGround(project) {
    rect(0, TERRAIN.horizonY, FIELD.width, FIELD.height - TERRAIN.horizonY, PALETTE.ground);
    context.strokeStyle = PALETTE.groundDark;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, TERRAIN.horizonY);
    context.lineTo(FIELD.width, TERRAIN.horizonY);
    context.stroke();

    // Draw concentric ground rings ahead of the plane, projected.
    const cx = FIELD.width / 2;
    const baseY = TERRAIN.horizonY + 120;
    for (let ring = 1; ring <= TERRAIN.gridCount; ring += 1) {
      const depth = ring * TERRAIN.gridSize;
      const p = project(0, 0, depth); // centre of ring
      if (!p) continue;
      const radius = depth * 0.18;
      context.beginPath();
      context.arc(cx + (p.sx - cx) * 0.5, p.sy, radius, 0, Math.PI * 2);
      context.stroke();
    }
  }

  /** Draw the runway as a projected rectangle on the ground ahead. */
  function drawRunway(project, runwayX, runwayZ) {
    const halfW = RUNWAY.width / 2;
    const halfL = RUNWAY.length / 2;
    const corners = [
      { x: runwayX - halfW, z: runwayZ - halfL },
      { x: runwayX + halfW, z: runwayZ - halfL },
      { x: runwayX + halfW, z: runwayZ + halfL },
      { x: runwayX - halfW, z: runwayZ + halfL },
    ];
    const pts = corners.map((c) => project(c.x, 0, c.z));
    if (pts.some((p) => !p)) return;
    context.fillStyle = 'rgba(242, 201, 74, 0.55)';
    context.beginPath();
    context.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 1; i < pts.length; i += 1) context.lineTo(pts[i].sx, pts[i].sy);
    context.closePath();
    context.fill();
    context.strokeStyle = PALETTE.runwayEdge;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 1; i < pts.length; i += 1) context.lineTo(pts[i].sx, pts[i].sy);
    context.closePath();
    context.stroke();
  }

  /** Draw the aircraft as a simple silhouette in chase view (below centre). */
  function drawAircraft(roll) {
    const cx = FIELD.width / 2;
    const cy = FIELD.height - 150;
    const w = PLANE.wingspan;
    const h = PLANE.radius * 2;
    context.save();
    context.translate(cx, cy);
    context.rotate(roll * 0.5);
    // Fuselage
    rect(-8, -h / 2, 16, h, PALETTE.plane);
    // Wings
    rect(-w / 2, -6, w, 12, PALETTE.planeAccent);
    // Tail
    rect(-6, h / 2 - 14, 12, 14, PALETTE.planeAccent);
    context.restore();
    // Nose dot
    context.fillStyle = PALETTE.planeAccent;
    context.beginPath();
    context.arc(cx, cy - h / 2 - 4, 6, 0, Math.PI * 2);
    context.fill();
  }

  function drawHud(state) {
    text(altLabel(Math.floor(state.plane.y)), HUD_X, HUD_Y, 30, PALETTE.hud, 'left');
    text(spdLabel(Math.floor(state.plane.speed)), HUD_X, HUD_Y + 40, 30, PALETTE.hud, 'left');
    const hdgDeg = Math.floor(((state.plane.heading * 180) / Math.PI + 360) % 360);
    text(hdgLabel(hdgDeg), HUD_X, HUD_Y + 80, 30, PALETTE.hud, 'left');

    // Artificial horizon top-left
    const ahX = FIELD.width - 220;
    const ahY = 26;
    const ahSize = 160;
    rect(ahX, ahY, ahSize, ahSize, '#101824');
    context.strokeStyle = PALETTE.hudDim;
    context.lineWidth = 2;
    context.strokeRect(ahX, ahY, ahSize, ahSize);
    // Roll horizon line
    context.save();
    context.translate(ahX + ahSize / 2, ahY + ahSize / 2);
    context.rotate(-state.plane.roll);
    context.beginPath();
    context.moveTo(-ahSize / 2, Math.sin(state.plane.pitch) * 60);
    context.lineTo(ahSize / 2, Math.sin(state.plane.pitch) * 60);
    context.strokeStyle = PALETTE.hud;
    context.lineWidth = 3;
    context.stroke();
    context.restore();
    // Pitch mark
    context.fillStyle = PALETTE.hud;
    context.fillRect(ahX + ahSize / 2 - 10, ahY + ahSize / 2, 20, 3);
    text('H', ahX + 10, ahY + ahSize + 24, 14, PALETTE.hudDim, 'left');
    text('P', ahX + ahSize - 30, ahY + ahSize + 24, 14, PALETTE.hudDim, 'right');

    // Throttle bar bottom-left
    const thX = HUD_X;
    const thY = FIELD.height - 60;
    rect(thX, thY, 150, 14, '#24303c');
    rect(thX, thY, 150 * state.plane.throttle, 14, PALETTE.hud);
    context.strokeStyle = PALETTE.hudDim;
    context.lineWidth = 1;
    context.strokeRect(thX, thY, 150, 14);
    text('THR', thX, thY - 6, 14, PALETTE.hudDim, 'left');

    // Altitude warning
    if (state.plane.y < 60) {
      text('!! TOO LOW !!', FIELD.width / 2, 120, 26, PALETTE.warn, 'center');
    }
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    rect(x, y, PANEL.width, height, PALETTE.ground);
    context.strokeStyle = PALETTE.hudDim;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 80, 46, PALETTE.text, 'center');
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + PANEL.top + i * PANEL.line, 22, PALETTE.hudDim, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 40, 24, PALETTE.runway, 'center');
  }

  const TITLE_LINES = ['Flight Sim: line up with the runway and land.', 'Pitch: ↑ ↓ / W S   Roll: ← → / A D   Throttle: T', ''];
  const PAUSED_LINES = ['Hold your heading.'];
  const OVER_LINES = ['', ''];
  const LANDED_LINES = ['Touchdown.'];

  /** Paint one frame: sky, ground, runway, aircraft, then HUD or panel. */
  function draw(state, project, screen, runwayX, runwayZ) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    rect(0, 0, FIELD.width, FIELD.height, PALETTE.skyTop);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    drawSky();
    drawGround(project);
    drawRunway(project, runwayX, runwayZ);
    drawAircraft(state.plane.roll);

    context.setTransform(1, 0, 0, 1, 0, 0);
    drawHud(state);

    if (screen === SCREEN_TITLE) {
      TITLE_LINES[2] = 'Best ' + (state.score ? Math.floor(state.score) : 0);
      drawPanel('FLIGHT SIM', TITLE_LINES, 'Press Space or click to take off');
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', PAUSED_LINES, 'Press P to resume');
    } else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = 'Crashed. Score ' + Math.floor(state.score);
      OVER_LINES[1] = 'Pull up sooner next time.';
      drawPanel('Crash', OVER_LINES, 'Press Space or click to retry');
    } else if (screen === SCREEN_LANDED) {
      LANDED_LINES[1] = 'Score ' + Math.floor(state.score) + ' — landing bonus applied.';
      drawPanel('Landed', LANDED_LINES, 'Press Space or click to fly again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
