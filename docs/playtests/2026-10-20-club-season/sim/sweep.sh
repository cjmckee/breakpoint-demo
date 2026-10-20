#!/usr/bin/env bash
# careerSim sweep: one careerSim process per setting, each appending a JSON line per career.
# Usage: sweep.sh <out-dir>   (run from the repo root); one .jsonl per setting
set -euo pipefail
OUT=${1:?out-dir}
mkdir -p "$OUT"
JOBS=()
add() { JOBS+=("$*"); }

# Baseline: the default player, 50 careers per identity, with and without team-match abilities.
add TAG=baseline RUNS=50 TEAM_ABILITIES=1
add TAG=baseline-noTeamAbilities RUNS=50 TEAM_ABILITIES=0

# Wide sweep: skill x spending x drill adherence x practice cadence.
declare -A SKILL=(
  [casual]="REPS_P=0.5 MINIGAME_PASS=0.4 CHALLENGE_P=0.3 STORY_PICK=random"
  [average]="REPS_P=0.7 MINIGAME_PASS=0.6 CHALLENGE_P=0.5 STORY_PICK=random"
  [averageBest]="REPS_P=0.7 MINIGAME_PASS=0.6 CHALLENGE_P=0.5 STORY_PICK=best"
  [skilled]="REPS_P=0.9 MINIGAME_PASS=0.85 CHALLENGE_P=0.8 STORY_PICK=best"
)
for skill in casual average averageBest skilled; do
  for spend in patient affordable impatient; do
    for adapt in 0.4 0.7 1.0; do
      for every in 1 2 4; do
        add TAG=sweep SKILL=$skill ${SKILL[$skill]} SPEND=$spend ADAPT=$adapt MATCH_EVERY=$every RUNS=3 TEAM_ABILITIES=1
      done
    done
  done
done

# Gear shop on, and a story-heavy calendar.
add TAG=gear GEAR=all RUNS=25 TEAM_ABILITIES=1
add TAG=storyHeavy STORY_CHANCE=70 RUNS=25 TEAM_ABILITIES=1

printf '%s\n' "${JOBS[@]}" | xargs -P "${PAR:-2}" -I{} bash -c 'f="$1/$(echo "$2" | md5sum | cut -c1-10).jsonl"; rm -f "$f"; env $2 CAREERS="$f" npx tsx src/test/analysis/careerSim.ts || echo "FAILED: $2" >&2' _ "$OUT" {}
