#!/usr/bin/env python3
"""
Iterative skill improvement loop: eval → improve → eval.

Source: https://github.com/anthropics/claude-plugins-official/blob/main/plugins/skill-creator/skills/skill-creator/scripts/run_loop.py

Runs multiple rounds of improvement on a skill description, measuring pass rate
after each iteration, until the pass rate stabilizes or max iterations is reached.

Usage:
    python scripts/run_loop.py evals/evals.json skills/my-skill/ [OPTIONS]

Options:
    --max-iterations N  Maximum improvement iterations (default: 5)
    --target FLOAT      Target pass rate to stop early (default: 0.9)
    --train-split FLOAT Fraction of evals used for training (default: 0.8)
    --output PATH       Path to write loop results JSON

Behavior:
- Splits evals into train/test sets using stratified sampling (preserving
  should_trigger ratio)
- Each iteration: runs evals → calls improve_description.py on failures →
  re-runs evals
- Generates a live HTML progress report after each iteration via generate_report.py
- Tracks precision, recall, and accuracy across iterations
- Saves history.json recording each iteration's description and pass rates
- Stops early when target pass rate is reached on the test split

Output: run_loop_results.json with full history and final test pass rate.
"""

# NOTE: Full implementation not available. Install from source:
#   https://github.com/anthropics/claude-plugins-official/tree/main/plugins/skill-creator/skills/skill-creator/scripts/
raise NotImplementedError("Fetch full source from anthropics/claude-plugins-official")
