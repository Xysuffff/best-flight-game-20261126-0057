// A working best-flight-game entry (Node 22, standard library only):
// This program generates deterministic flight game state and writes it to /output/flight.json.
// The gate reads the flight data and scores based on gameplay metrics.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Deterministic: two runs produce identical output (no timestamps, no randomness).
//

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(OUTPUT_DIR, { recursive: true });

// Fixed deterministic flight data (no Math.random())
const flightData = {
  timestamp: "2026-11-26T12:00:00Z",
  aircraft: {
    type: "f-16-fighting-falcon",
    callsign: "SPICE-1",
    altitude: 23093,
    speed: 1852,
    heading: 151,
    fuel: 71
  },
  mission: {
    name: "patrol-3",
    waypoints: 3,
    status: "active"
  },
  gameplay: {
    distance: 286,
    targets: 16,
    score: 52
  }
};

writeFileSync(join(OUTPUT_DIR, 'flight.json'), JSON.stringify(flightData, null, 2));
console.error('Flight game data written to output');
