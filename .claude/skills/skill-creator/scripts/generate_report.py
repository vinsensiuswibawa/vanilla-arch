#!/usr/bin/env python3
"""
Generate HTML report from run_loop.py iteration results.

Source: https://github.com/anthropics/claude-plugins-official/blob/main/plugins/skill-creator/skills/skill-creator/scripts/generate_report.py

Produces a color-coded HTML report showing pass/fail per eval across iterations,
with the best-performing iteration highlighted.

Usage:
    python scripts/generate_report.py results.json -o report.html --skill-name "my-skill"
    cat results.json | python scripts/generate_report.py - -o report.html

Options:
    input               Path to run_loop_results.json (or '-' for stdin)
    -o, --output PATH   Output path for HTML report (default: report.html)
    --skill-name NAME   Name to display in report header

Report features:
- Table of iterations × evals with ✓ (green) / ✗ (red) per cell
- Overall pass rate column and row
- Best iteration highlighted with a gold border
- Per-eval breakdown of which expectations failed
- Precision / recall / accuracy trend chart per iteration (if available)

Stdlib-only; no external dependencies.
"""

# NOTE: Full implementation not available. Install from source:
#   https://github.com/anthropics/claude-plugins-official/tree/main/plugins/skill-creator/skills/skill-creator/scripts/
raise NotImplementedError("Fetch full source from anthropics/claude-plugins-official")
