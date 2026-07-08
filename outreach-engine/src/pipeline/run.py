"""Work-order runner — the loop's worker entry point.

loop.sh calls `python -m src.pipeline.run --work-order <file>` with a
conductor-produced JSON work order:

    {"action": "execute", "skill": "scrape-npi",
     "spec": "...", "done_when": ["..."]}

Each skill maps to a deterministic script invocation. Skills that
touch the outside world only ever QUEUE outreach; sending requires
rows already approved by a human (or an auto-tier trust decision made
upstream in the loop).
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

from src.pipeline.common import ENGINE_ROOT, jlog

# skill -> argv (relative to engine root). Kebab-case, stable across runs.
SKILLS: dict[str, list[str]] = {
    "scrape-npi":        [sys.executable, "src/lead-sources/npi-registry.py"],
    "scrape-indeed":     [sys.executable, "src/lead-sources/indeed-scraper.py"],
    "scrape-maps":       [sys.executable, "src/lead-sources/maps-scraper.py"],
    "scrape-intent":     [sys.executable, "src/lead-sources/intent-signals.py"],
    "enrich-leads":      [sys.executable, "src/enrichment/apollo-enrich.py", "--max-credits", "20"],
    "score-leads":       [sys.executable, "src/scoring/lead-scorer.py"],
    "queue-email-step1": [sys.executable, "src/outreach/email-sender.py", "--queue", "--step", "1"],
    "queue-email-step2": [sys.executable, "src/outreach/email-sender.py", "--queue", "--step", "2"],
    "queue-email-step3": [sys.executable, "src/outreach/email-sender.py", "--queue", "--step", "3"],
    "queue-email-step4": [sys.executable, "src/outreach/email-sender.py", "--queue", "--step", "4"],
    "send-approved-email": [sys.executable, "src/outreach/email-sender.py", "--send"],
    "queue-hot-calls":   [sys.executable, "src/outreach/vapi-caller.py", "--queue"],
    "place-approved-calls": [sys.executable, "src/outreach/vapi-caller.py", "--call"],
    "weekly-report":     ["bash", "scheduled-tasks/weekly-report.sh"],
    "init-db":           [sys.executable, "-m", "src.pipeline.database"],
}


def run_skill(skill: str) -> int:
    argv = SKILLS.get(skill)
    if argv is None:
        jlog("unknown_skill", level="error", skill=skill,
             known=sorted(SKILLS.keys()))
        return 2
    jlog("skill_start", skill=skill, argv=argv)
    proc = subprocess.run(argv, cwd=ENGINE_ROOT, text=True,
                          capture_output=True, timeout=1800)
    # Relay the worker's structured logs so the loop's dispatch log has them.
    for line in proc.stdout.splitlines():
        print(line, flush=True)
    if proc.stderr.strip():
        jlog("skill_stderr", level="warn", skill=skill,
             stderr=proc.stderr[-2000:])
    jlog("skill_done", skill=skill, exit_code=proc.returncode)
    return proc.returncode


def main() -> None:
    ap = argparse.ArgumentParser(description="Run a conductor work order")
    ap.add_argument("--work-order", required=True,
                    help="Path to the work-order JSON file")
    ap.add_argument("--skill", default=None,
                    help="Override: run this skill directly, ignoring the file")
    args = ap.parse_args()

    if args.skill:
        sys.exit(run_skill(args.skill))

    path = Path(args.work_order)
    try:
        order: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        jlog("work_order_unreadable", level="error", path=str(path), error=str(exc))
        sys.exit(2)

    skill = str(order.get("skill", ""))
    jlog("work_order", skill=skill, item=order.get("item", ""),
         done_when=order.get("done_when", []))
    sys.exit(run_skill(skill))


if __name__ == "__main__":
    main()
