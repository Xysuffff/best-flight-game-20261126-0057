// best-flight-game-20261126-0057 entry program (Node 22, standard library only).
// Copies game/ and screenshots/ from this repository to /output (MAKEFUN_OUTPUT_DIR outside the
// grader) and writes /output/dossier.json with buildDossier from vendor/makefun-game.ts.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Deterministic: two runs produce identical output (no timestamps, no randomness).
//
// The vendor/makefun-game.ts file is the kit's copy, unchanged: the scorer rebuilds the dossier
// with the same library and compares byte for byte.

import { buildDossier } from './vendor/makefun-game.ts';
import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = import.meta.dirname; // repository root (this file lives at repo root)
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

// Start from a clean output directory.
if (existsSync(OUTPUT_DIR)) rmSync(OUTPUT_DIR, { recursive: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

// Copy the playable game and the screenshots into /output.
cpSync(join(ROOT, 'game'), join(OUTPUT_DIR, 'game'), { recursive: true });
cpSync(join(ROOT, 'screenshots'), join(OUTPUT_DIR, 'screenshots'), { recursive: true });

// Build the dossier from what was written, byte for byte as the scorer expects.
// buildDossier(dir) expects the output directory (parent of game/), then joins 'game' internally.
const dossier = buildDossier(OUTPUT_DIR, CAPS);
writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);

console.error('Flight game entry written to', OUTPUT_DIR);
