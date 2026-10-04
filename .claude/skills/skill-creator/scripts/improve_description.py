#!/usr/bin/env python3
"""
Use Claude to improve a skill description based on eval failures.

Source: https://github.com/anthropics/claude-plugins-official/blob/main/plugins/skill-creator/skills/skill-creator/scripts/improve_description.py

Calls `claude -p` as a subprocess with the current description, failing eval prompts,
and false-trigger examples, then generates an improved description.

Usage:
    python scripts/improve_description.py skills/my-skill/ evals/evals.json results.json

Behavior:
- Reads current description from skills/my-skill/SKILL.md
- Reads eval results to identify which prompts failed or false-triggered
- Calls `claude -p` with a structured prompt asking for improvements
- Output is a 100-200 word description focused on user intent
- Hard limit: 1024 characters on the output description
- Safety mechanism: if generated description exceeds 1024 chars, truncates at
  the last complete sentence before the limit
- Writes improved description back to SKILL.md (or to --output path)
- Records the change in history.json

Options:
    --output PATH       Write improved SKILL.md here instead of in-place
    --dry-run           Print improved description without writing
    --model MODEL       Claude model to use (default: claude-haiku-4-5-20251001)
"""

# NOTE: Full implementation not available. Install from source:
#   https://github.com/anthropics/claude-plugins-official/tree/main/plugins/skill-creator/skills/skill-creator/scripts/
raise NotImplementedError("Fetch full source from anthropics/claude-plugins-official")
