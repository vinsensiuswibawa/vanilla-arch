# Skills and agents in this repo: where they came from

## Vendored third-party skills (update from upstream; don't edit in place)

| Package | Source | Commit (2026-10-04) | License | Installed to |
| --- | --- | --- | --- | --- |
| Impeccable 4.5.0 | https://github.com/pbakaus/impeccable (`plugin/`) | 6e802bd0ed99f53180e2359fddab6da8d97970d9 | Apache-2.0 (`LICENSE.txt`, `NOTICE.md` in the skill folder) | `.claude/skills/impeccable/`, `.claude/agents/impeccable/` |
| Emil Kowalski's skills | https://github.com/emilkowalski/skills | e8a175de22ae1e49370fc144c1f3bb9aeedf988d | MIT (`LICENSE.txt` in each folder) | `.claude/skills/` (`emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `apple-design`, `pick-ui-library`, `prototype`, `break-ui`, `mobile-native`) |

Impeccable's hooks are not installed by this copy. Run `/impeccable hooks on` at the start of Shot 0; it writes a machine-local `.claude/settings.local.json` and downloads its engine binary to `%USERPROFILE%\.impeccable`.

Emil Kowalski's `animate-expo`, `ask-sonner` and `write-swift` were left out as not relevant to this web project.

## Copied from the author's collection

Source: `Zara Hathaway Portfolio Project/Claude Skills` (44 skills, 1 agent), copied byte for byte.

- Grouped skills (`designer-toolkit/*`, `interaction-design/*`, `ux-strategy/*`) were flattened into `.claude/skills/<name>/`, because Claude Code only discovers `.claude/skills/<name>/SKILL.md`.
- `For Claude/` was not copied; every file in it is an exact duplicate of a skill file here.
- The two portfolio screenshots (`The Atlas Portfolio Entry.png`, `WIP Portfolio Landing.png`) are not skills and were not copied.
- `agents/marketing/cs-content-creator.md` refers to a `content-production` skill and `.py` scorers that are not in this repo.
