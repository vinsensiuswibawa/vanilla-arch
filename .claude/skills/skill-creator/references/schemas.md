# Skill Creator JSON Schemas

Reference for all JSON data files used by skill-creator scripts.

---

## evals.json

Defines skill evaluations with prompts, expected outputs, and verifiable expectations.

```json
[
  {
    "id": "eval-0",
    "prompt": "User query to test",
    "should_trigger": true,
    "expected_output": "Optional description of expected output",
    "input_files": [],
    "expectations": [
      {
        "text": "The response should include X",
        "weight": 1.0
      }
    ]
  }
]
```

---

## history.json

Tracks version iterations in Improve mode, recording pass rates and grading results across versions.

```json
[
  {
    "iteration": 1,
    "description": "The skill description text used in this iteration",
    "train_pass_rate": 0.75,
    "test_pass_rate": 0.60,
    "grading_summary": {
      "passed": 3,
      "failed": 1,
      "total": 4
    }
  }
]
```

---

## grading.json

Comprehensive grader output including expectations with evidence, summary counts, execution metrics, and timing.

```json
{
  "summary": {
    "passed": 3,
    "failed": 1,
    "total": 4,
    "pass_rate": 0.75
  },
  "expectations": [
    {
      "text": "Description of what was checked",
      "passed": true,
      "evidence": "Quoted text or observation supporting the result"
    }
  ],
  "execution_metrics": {
    "total_tool_calls": 12,
    "files_created": 2,
    "errors_encountered": 0,
    "output_chars": 1500
  },
  "timing": {
    "total_duration_seconds": 45.2
  },
  "user_notes_summary": {
    "uncertainties": [],
    "needs_review": [],
    "workarounds": []
  }
}
```

---

## metrics.json

Executor metrics tracking tool usage, file creation, errors, and character counts.

```json
{
  "total_tool_calls": 12,
  "tool_breakdown": {
    "Read": 3,
    "Write": 2,
    "Bash": 5,
    "Grep": 2
  },
  "files_created": 2,
  "errors_encountered": 0,
  "output_chars": 1500,
  "input_chars": 800
}
```

---

## timing.json

Wall clock timing data. **Important:** task notifications include `total_tokens` and `duration_ms` — save these immediately as they are not persisted anywhere else.

```json
{
  "total_duration_seconds": 45.2,
  "total_tokens": 3200,
  "start_time": "2026-01-15T10:30:00Z",
  "end_time": "2026-01-15T10:30:45Z"
}
```

---

## benchmark.json

Comparative performance data. Requires exact field names (`configuration`, nested `result`) for viewer compatibility. Use `"with_skill"` and `"without_skill"` as configuration names.

```json
{
  "metadata": {
    "skill_name": "my-skill",
    "skill_path": "skills/my-skill",
    "executor_model": "claude-sonnet-4-6",
    "analyzer_model": "claude-sonnet-4-6",
    "timestamp": "2026-01-15T10:30:00Z",
    "evals_run": [0, 1, 2],
    "runs_per_configuration": 3
  },
  "runs": [
    {
      "eval_id": 0,
      "configuration": "with_skill",
      "run_number": 1,
      "result": {
        "pass_rate": 1.0,
        "passed": 4,
        "failed": 0,
        "total": 4,
        "time_seconds": 45.2,
        "tokens": 3200,
        "tool_calls": 12,
        "errors": 0
      },
      "expectations": [],
      "notes": []
    }
  ],
  "run_summary": {
    "with_skill": {
      "pass_rate": {"mean": 0.85, "stddev": 0.05, "min": 0.75, "max": 1.0},
      "time_seconds": {"mean": 42.0, "stddev": 3.0, "min": 38.0, "max": 46.0},
      "tokens": {"mean": 3100, "stddev": 200, "min": 2800, "max": 3400}
    },
    "without_skill": {
      "pass_rate": {"mean": 0.60, "stddev": 0.10, "min": 0.50, "max": 0.75},
      "time_seconds": {"mean": 38.0, "stddev": 2.0, "min": 35.0, "max": 41.0},
      "tokens": {"mean": 2800, "stddev": 150, "min": 2600, "max": 3000}
    },
    "delta": {
      "pass_rate": "+0.25",
      "time_seconds": "+4.0",
      "tokens": "+300"
    }
  },
  "notes": []
}
```

---

## comparison.json

Blind comparator output with winner determination and rubric scoring.

```json
{
  "winner": "A",
  "confidence": "high",
  "rubric": {
    "content_quality": {"A": 4, "B": 3},
    "structure": {"A": 4, "B": 4},
    "instruction_following": {"A": 5, "B": 3}
  },
  "expectation_results": {
    "A": [{"text": "...", "passed": true, "evidence": "..."}],
    "B": [{"text": "...", "passed": false, "evidence": "..."}]
  },
  "reasoning": "A better addressed the user's goal because..."
}
```

---

## analysis.json

Post-hoc analysis summarizing comparison outcomes with improvement suggestions.

```json
{
  "comparison_winners": {"A": 7, "B": 3, "tie": 0},
  "strengths": ["Clear structure", "Addresses edge cases"],
  "weaknesses": ["Verbose in section 2", "Misses format requirement"],
  "instruction_following_score": 0.85,
  "execution_patterns": {
    "tool_usage": "efficient",
    "file_creation": "appropriate"
  },
  "improvement_suggestions": [
    {
      "priority": "high",
      "suggestion": "Reduce verbosity in section 2"
    }
  ]
}
```
