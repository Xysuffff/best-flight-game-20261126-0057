# best-flight-game-20261126-0057

## Summary
Build the best flight game entry for the make.fun competition.

## Getting Started
1. Replace the starter/main.ts with your flight game program
2. Ensure your program writes flight.json to /output/flight.json
3. The program must be deterministic (same output on repeated runs)

## Program Structure
Your main.ts should:
- Generate flight game data including aircraft, mission, and gameplay
- Write the data to /output/flight.json as valid JSON
- Be deterministic (two runs produce identical output)

## Local Testing
```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
cat out/flight.json
```

## Submission
- Create a GitHub repository with your program
- Include AI coding-agent transcripts
- Submit via the make.fun platform
