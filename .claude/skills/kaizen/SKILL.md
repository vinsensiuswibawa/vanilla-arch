---
name: kaizen
description: Use when Code implementation and refactoring, architecturing or designing systems, process and workflow improvements, error handling and validation. Provide tehniquest to avoid over-engineering and apply iterative improvements.
---

# Kaizen: Continuous Improvement

Apply continuous improvement mindset - suggest small iterative improvements, error-proof designs, follow established patterns, avoid over-engineering; automatically applied to guide quality and simplicity

## Overview

Small improvements, continuously. Error-proof by design. Follow what works. Build only what's needed.

**Core principle:** "Many small improvements beat one big change. Prevent errors at design time, not with fixes."

## When to Use

**Always applied for:**

- Code implementation and refactoring
- Architecture and design decisions
- Process and workflow improvements
- Error handling and validation

**Philosophy:** Quality through incremental progress and prevention, not perfection through massive effort.

## The Four Pillars

### 1. Continuous Improvement (Kaizen)

Small, frequent improvements compound into major gains.

**Incremental over revolutionary:**
- Make smallest viable change that improves quality
- One improvement at a time
- Verify each change before next
- Build momentum through small wins

**Iterative refinement:**
- First version: make it work
- Second pass: make it clear
- Third pass: make it efficient
- Don't try all three at once

**In Practice:**
- Start with simplest version that works
- Add one improvement (error handling, validation, etc.)
- Test and verify
- Don't try to make it perfect immediately

### 2. Poka-Yoke (Error Proofing)

Design systems that prevent errors at compile/design time, not runtime.

**Make errors impossible:**
- Type system catches mistakes
- Compiler enforces contracts
- Invalid states unrepresentable
- Errors caught early (left of production)

**Defense in layers:**
1. Type system (compile time)
2. Validation (runtime, early)
3. Guards (preconditions)
4. Error boundaries (graceful degradation)

**In Practice:**
- Use types to constrain inputs
- Make invalid states unrepresentable
- Validate at system boundaries once; use safely everywhere else
- Required config over optional with defaults; fail at startup, not in production

### 3. Standardized Work

Follow established patterns. Document what works. Make good practices easy to follow.

**Consistency over cleverness:**
- Follow existing codebase patterns
- Don't reinvent solved problems
- New pattern only if significantly better
- Team agreement on new patterns

**Before adding new patterns:**
- Search codebase for similar problems solved
- Check CLAUDE.md for project conventions
- Discuss with team if breaking from pattern
- Update docs when introducing new pattern

### 4. Just-In-Time (JIT)

Build what's needed now. No more, no less.

**YAGNI (You Aren't Gonna Need It):**
- Implement only current requirements
- No "just in case" features
- No "we might need this later" code
- Delete speculation

**When to add complexity:**
- Current requirement demands it
- Pain points identified through use
- Measured performance issues
- Multiple use cases emerged (Rule of Three for abstractions)

**Performance Optimization:**
- Profile before optimizing
- Measure before and after
- No premature optimization

## Red Flags

**Violating Continuous Improvement:**
- "I'll refactor it later" (never happens)
- Leaving code worse than you found it
- Big bang rewrites instead of incremental

**Violating Poka-Yoke:**
- "Users should just be careful"
- Validation after use instead of before
- Optional config with no validation

**Violating Standardized Work:**
- "I prefer to do it my way"
- Not checking existing patterns
- Ignoring project conventions

**Violating Just-In-Time:**
- "We might need this someday"
- Building frameworks before using them
- Optimizing without measuring

## Remember

**Kaizen is about:**
- Small improvements continuously
- Preventing errors by design
- Following proven patterns
- Building only what's needed

**Mindset:** Good enough today, better tomorrow. Repeat.
