#!/usr/bin/env python3
"""
Validate SKILL.md structure and frontmatter before packaging or publishing.

Source: https://github.com/anthropics/claude-plugins-official/blob/main/plugins/skill-creator/skills/skill-creator/scripts/quick_validate.py

Usage:
    python scripts/quick_validate.py skills/my-skill/
    python scripts/quick_validate.py skills/my-skill/SKILL.md

Exit code 0 if valid, 1 if any validation errors found.

Validation rules:
    Required fields:
        name        - kebab-case, max 64 characters
        description - max 1024 characters, no angle brackets (<>)

    Allowed optional fields:
        name, description, license, allowed-tools, metadata, compatibility

    Structural checks:
        - SKILL.md must exist in the skill folder
        - Frontmatter must open and close with ---
        - No unrecognized frontmatter keys (warns, does not fail)

    Content checks:
        - name must match regex [a-z][a-z0-9-]* (kebab-case)
        - description must not contain < or > characters (injection prevention)
        - description length checked after collapsing whitespace

Example valid frontmatter:
    ---
    name: my-skill
    description: >
      What the skill does and when to use it. Under 1024 characters.
    ---
"""

import re
import sys
from pathlib import Path


def validate_skill(skill_path: Path) -> tuple[bool, str]:
    """
    Validate a skill directory.

    Returns (is_valid, message).
    """
    if skill_path.suffix == ".md":
        skill_md = skill_path
    else:
        skill_md = skill_path / "SKILL.md"

    if not skill_md.exists():
        return False, f"SKILL.md not found at {skill_md}"

    content = skill_md.read_text(encoding="utf-8")
    lines = content.split("\n")

    if not lines or lines[0].strip() != "---":
        return False, "SKILL.md missing frontmatter opening ---"

    end_idx = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_idx = i
            break

    if end_idx is None:
        return False, "SKILL.md missing frontmatter closing ---"

    ALLOWED_KEYS = {"name", "description", "license", "allowed-tools", "metadata", "compatibility"}
    errors = []
    warnings = []

    name = ""
    description = ""
    frontmatter_lines = lines[1:end_idx]
    i = 0
    while i < len(frontmatter_lines):
        line = frontmatter_lines[i]
        if not line or line.startswith("#") or line.startswith(" ") or line.startswith("\t"):
            i += 1
            continue
        if ":" in line:
            key = line.split(":")[0].strip()
            value = line[len(key) + 1:].strip()
            if key not in ALLOWED_KEYS:
                warnings.append(f"Unrecognized frontmatter key: '{key}'")
            if key == "name":
                name = value.strip('"').strip("'")
            elif key == "description":
                if value in (">", "|", ">-", "|-"):
                    desc_lines = []
                    i += 1
                    while i < len(frontmatter_lines) and (
                        frontmatter_lines[i].startswith("  ") or frontmatter_lines[i].startswith("\t")
                    ):
                        desc_lines.append(frontmatter_lines[i].strip())
                        i += 1
                    description = " ".join(desc_lines)
                    continue
                else:
                    description = value.strip('"').strip("'")
        i += 1

    if not name:
        errors.append("Missing required field: name")
    else:
        if not re.match(r'^[a-z][a-z0-9-]*$', name):
            errors.append(f"name must be kebab-case (lowercase letters, digits, hyphens): '{name}'")
        if len(name) > 64:
            errors.append(f"name exceeds 64 character limit ({len(name)} chars): '{name}'")

    if not description:
        errors.append("Missing required field: description")
    else:
        desc_normalized = " ".join(description.split())
        if len(desc_normalized) > 1024:
            errors.append(f"description exceeds 1024 character limit ({len(desc_normalized)} chars)")
        if "<" in description or ">" in description:
            errors.append("description must not contain angle brackets (< or >)")

    if warnings:
        for w in warnings:
            print(f"Warning: {w}")

    if errors:
        return False, "Validation failed:\n" + "\n".join(f"  - {e}" for e in errors)

    return True, f"Valid: '{name}' — {len(description)} char description"


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/quick_validate.py <skill-folder-or-SKILL.md>")
        sys.exit(1)

    path = Path(sys.argv[1])
    valid, message = validate_skill(path)
    print(message)
    sys.exit(0 if valid else 1)


if __name__ == "__main__":
    main()
