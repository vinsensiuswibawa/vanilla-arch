---
name: skill-creator
description: Build, test, and refine Claude Code skills through iterative evaluation. Use when creating a new skill from scratch, improving an existing skill's trigger accuracy, benchmarking a skill against a baseline, or packaging a skill for distribution. Runs draft → eval → iterate loop with deterministic scorers and a quality gate before shipping. Activated by requests like "create a new skill", "build a skill for X", "improve this skill's description", "test whether this skill triggers correctly", or "package my skill".
metadata:
  source: anthropics/claude-plugins-official
  version: official
---

# Skill Creator

Build, test, and refine Claude skills through an iterative evaluation loop. The workflow enforces a hard gate: **GENERATE THE EVAL VIEWER BEFORE evaluating inputs yourself** — get examples in front of humans first for assessment.

## Core Workflow

**Draft → Test → Review → Improve → Repeat → Package**

### Step 1 — Capture Intent

Understand:
- What the skill should do
- When it should trigger (be "a little bit pushy" in descriptions — include both what the skill does AND specific contexts for when to use it, to combat undertriggering)
- Expected output format
- Whether test cases are needed

### Step 2 — Interview & Research

Before writing, ask about:
- Edge cases and anti-trigger cases (what should NOT trigger this skill)
- Input/output formats
- Success criteria
- Dependencies on other skills or tools
- Domain the skill serves

### Step 3 — Draft SKILL.md

Create with YAML frontmatter:
```yaml
---
name: skill-name-kebab-case
description: >
  What the skill does AND specific contexts for when to use it.
  100-200 words. Under 1024 characters. Focus on user intent, not implementation.
---
```

Rules for strong descriptions:
- Explain the WHY behind instructions; avoid rigid ALL-CAPS directives
- Keep prompts lean — remove elements that don't affect output
- "Make the description a little bit pushy" to combat undertriggering
- Focus on the user's goal, not the skill's mechanics

### Step 4 — Write Test Cases

Create 2-3 realistic test prompts users would actually submit. Save to `evals/evals.json`:
```json
[
  {
    "id": "eval-0",
    "prompt": "user query that should trigger the skill",
    "should_trigger": true
  },
  {
    "id": "eval-1", 
    "prompt": "user query that should NOT trigger this skill",
    "should_trigger": false
  }
]
```

Do not add assertions yet — gather outputs first.

### Step 5 — Run Evaluations

Spawn **both** with-skill AND baseline runs **simultaneously** in separate directories:

```
iteration-1/
├── eval-0/
│   ├── with_skill/run-1/
│   └── without_skill/run-1/
```

While runs complete, draft quantitative assertions.

Use `scripts/run_eval.py` for trigger rate testing:
```bash
python3 scripts/run_eval.py evals/evals.json skills/my-skill/ --workers 4
```

Use `scripts/run_loop.py` for iterative improvement:
```bash
python3 scripts/run_loop.py evals/evals.json skills/my-skill/ --max-iterations 5
```

### Step 6 — Draft Assertions

While tests run, create quantitative evaluations with clear, descriptive names. Focus on:
- Does the output address the user's actual goal?
- Is the format correct?
- Are the key elements present?

### Step 7 — Evaluate Results

Use `scripts/generate_report.py` to show the user outputs and benchmark data:
```bash
python3 scripts/generate_report.py results.json -o report.html --skill-name "my-skill"
```

Get qualitative and quantitative review from the user. **Do not evaluate inputs yourself until the viewer is generated.**

### Step 8 — Iterate

Based on feedback:
- **Generalize from feedback** rather than making fiddly changes to match specific examples
- If a description fails, try something structurally different — not a minor tweak
- Keep track of history to avoid re-trying failed approaches
- Bundle repeated work into reusable scripts

Repeat until the user is satisfied, then:
- Run `scripts/improve_description.py` to optimize trigger accuracy
- Validate with `scripts/quick_validate.py`
- Package with `scripts/package_skill.py`

## Key Principles

- **Generalize, don't overfit**: changes should improve the skill on unseen examples, not just the test cases
- **Explain the why**: instructions with reasoning are followed better than rules alone
- **Keep prompts lean**: remove unproductive elements; every sentence should earn its place
- **Bundle repeated work**: if the same task appears in 3+ test cases, write a script for it

## Platform Differences

| Feature | Claude Code | Claude.ai | Cowork |
|---|---|---|---|
| Subagents | Yes — spawn with-skill and baseline in parallel | No — run sequentially | Yes |
| Eval viewer | Full browser viewer | Present results inline in chat | Use `--static` flag |
| Feedback | Interactive | In-message | Downloads as file |

## Scripts

All scripts are stdlib-only Python 3. Run with `--help` for full usage.

| Script | Purpose |
|---|---|
| `scripts/run_eval.py` | Test trigger rate for a skill description against eval set |
| `scripts/run_loop.py` | Iterative improvement loop: eval → improve → eval |
| `scripts/generate_report.py` | Generate HTML report from loop results |
| `scripts/improve_description.py` | Use Claude to improve a description based on eval failures |
| `scripts/quick_validate.py` | Validate SKILL.md structure and frontmatter |
| `scripts/aggregate_benchmark.py` | Aggregate run results into benchmark statistics |
| `scripts/package_skill.py` | Package a skill folder into a distributable .skill file |
| `scripts/utils.py` | Shared utilities (parse_skill_md) |

## Packaging

When the skill is ready:
```bash
python3 scripts/quick_validate.py skills/my-skill/
python3 scripts/package_skill.py skills/my-skill/ ./dist
```

The `.skill` file is a ZIP archive containing all skill files except `evals/`, `__pycache__/`, and build artifacts.

## References

- `references/schemas.md` — JSON schema definitions for evals.json, grading.json, benchmark.json, etc.
