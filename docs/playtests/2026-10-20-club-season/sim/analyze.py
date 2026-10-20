"""Aggregate careerSim CAREERS=... output (one JSON line per career) into tables + a summary JSON."""

import glob
import json
import statistics as st
import sys
from collections import defaultdict

src, out = sys.argv[1], sys.argv[2]
rows = [json.loads(l) for f in glob.glob(f"{src}/*.jsonl") for l in open(f) if l.strip()]
CUR = ["power", "quickness", "technique", "mind"]
TEAM_DAYS = ["15", "19", "23", "27", "31"]
ROUNDS = ["Keith", "Chris", "Max", "Jordan"]


def tag(r):
    return r["settings"].get("TAG", "?")


def summarize(group):
    n = len(group)
    if n == 0:
        return {}
    teams = [sum(r["teamWon"].get(d, False) for d in TEAM_DAYS) for r in group]
    stats = [r["stats"] for r in group]
    return {
        "n": n,
        "ovr": round(st.mean(r["ovr"] for r in group), 1),
        "ovrSd": round(st.pstdev(r["ovr"] for r in group), 1),
        "ovrMin": min(r["ovr"] for r in group),
        "ovrMax": max(r["ovr"] for r in group),
        "teamWinsMean": round(st.mean(teams), 2),
        "teamWinsDist": [teams.count(k) for k in range(6)],
        "teamByMatch": {d: round(100 * st.mean(r["teamWon"].get(d, False) for r in group)) for d in TEAM_DAYS},
        "champion%": round(100 * st.mean(r["riverside"]["champion"] for r in group), 1),
        "roundsWonDist": [sum(r["riverside"]["roundsWon"] == k for r in group) for k in range(5)],
        "roundWinShare": {
            k: round(100 * st.mean(r["riverside"]["winShare"][k] for r in group)) for k in ROUNDS
        },
        # Probability of a full bracket from each career's per-round win shares.
        "pTitle%": round(
            100
            * st.mean(
                r["riverside"]["winShare"]["Keith"]
                * r["riverside"]["winShare"]["Chris"]
                * r["riverside"]["winShare"]["Max"]
                * r["riverside"]["winShare"]["Jordan"]
                for r in group
            ),
            1,
        ),
        "practiceWin%": round(
            100 * sum(r["practice"]["won"] for r in group) / max(1, sum(r["practice"]["played"] for r in group))
        ),
        "practicePlayed": round(st.mean(r["practice"]["played"] for r in group), 1),
        "unspent": {c: round(st.mean(r["wallet"][c] for r in group)) for c in CUR},
        "earned": {c: round(st.mean(r["earned"][c] for r in group)) for c in CUR},
        "earnedBySource": {
            s: round(st.mean(sum(r["ledger"]["earned"][s].values()) for r in group))
            for s in ["training", "practice", "team", "story"]
        },
        "slots": {s: round(st.mean(r["ledger"]["slots"][s] for r in group), 1) for s in group[0]["ledger"]["slots"]},
        "storyEvents": round(st.mean(r["ledger"]["storyEvents"] for r in group), 1),
        "abilityLevels": round(st.mean(sum(r["abilities"].values()) for r in group), 2),
        "xpUnspent": round(st.mean(r["xp"] for r in group)),
        "meanStats": {k: round(st.mean(s[k] for s in stats), 1) for k in stats[0]},
        "lowestStat": round(st.mean(min(s.values()) for s in stats), 1),
        "highestStat": round(st.mean(max(s.values()) for s in stats), 1),
    }


def by(keys, rows):
    g = defaultdict(list)
    for r in rows:
        g[tuple(r["identity"] if k == "identity" else r["settings"].get(k, "") for k in keys)].append(r)
    return {" / ".join(k): summarize(v) for k, v in sorted(g.items())}


report = {"total": len(rows), "byTag": by(["TAG"], rows)}
for t in sorted({tag(r) for r in rows}):
    report[f"{t}:identity"] = by(["identity"], [r for r in rows if tag(r) == t])
sweep = [r for r in rows if tag(r) == "sweep"]
for k in ["SKILL", "SPEND", "ADAPT", "MATCH_EVERY"]:
    report[f"sweep:{k}"] = by([k], sweep)
    report[f"sweep:{k}xidentity"] = by([k, "identity"], sweep)
report["sweep:SKILLxSPEND"] = by(["SKILL", "SPEND"], sweep)
report["sweep:SKILLxMATCH_EVERY"] = by(["SKILL", "MATCH_EVERY"], sweep)
json.dump(report, open(out, "w"), indent=1)

# Compact console view.
COLS = ["n", "ovr", "ovrSd", "teamWinsMean", "champion%", "pTitle%", "practiceWin%", "abilityLevels"]
for section, groups in report.items():
    if section == "total":
        print("total careers", groups)
        continue
    print(f"\n== {section}")
    print("group".ljust(34) + "".join(c.rjust(13) for c in COLS) + "  teamByMatch  roundWinShare  unspent")
    for name, s in groups.items():
        print(
            name.ljust(34)
            + "".join(str(s[c]).rjust(13) for c in COLS)
            + f"  {list(s['teamByMatch'].values())}  {list(s['roundWinShare'].values())}  {list(s['unspent'].values())}"
        )
