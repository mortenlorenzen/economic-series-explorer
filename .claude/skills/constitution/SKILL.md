---
name: constitution
description: Write the project constitution (specs/mission.md, tech-stack.md, roadmap.md) from BRIEF.md or README.md by interviewing the user about gaps only. Run once, interactively, before /run-phase.
disable-model-invocation: true
---

Interactive, once per project. The human approves the result; after that, /run-phase works from specs/ alone.

1. Read BRIEF.md if present, else README.md (idea + stakeholder input). Read CLAUDE.md and the headings in specs/_templates/.
   - specs/mission.md already exists → say so and stop. Changes now go through a replan branch, not this skill.
2. New or existing project? Code in the folder (anything besides README, BRIEF, CLAUDE, CHANGELOG, specs/, .claude/) or BRIEF.md §1 says fork/existing → existing.
   - Existing: read the code first. tech-stack.md records the versions and decisions the code actually reflects. Don't change any code.
3. Interview with the AskUserQuestion tool before writing anything, grouped on mission, tech stack and roadmap.
   - Ask only about gaps, contradictions, and every item in the brief's Open questions.
   - Skip what the brief already answers. Offer the brief's proposals as the first option.
   - Always settle: the test command (step 5), and whether each phase must leave the product working.
4. Write, using the headings in specs/_templates/:
   - specs/mission.md — why, who it's for, success, scope, non-goals.
   - specs/tech-stack.md — stack with pinned versions, conventions not visible in code, constraints, and a decisions log holding every decision the brief made and every interview answer.
   - specs/roadmap.md — `- [ ] Phase <N> — <name> (covers BRIEF §<x>)`, very small phases; each one PR a reviewer can read in one sitting, each leaving the product working.
5. Fill in the Commands section of CLAUDE.md:
   - The Test line, command in backticks, e.g. ``- Test: `npm test` `` — one command, non-zero exit on failure, no network, finishes in minutes. The Stop hook runs it at the end of every turn.
   - No tests yet → ``- Test: `none` `` and make "add a test harness" an early roadmap phase.
   - Keep CLAUDE.md short: commands and the Specs section only.
6. Each question the human deferred: an unticked box in specs/questions.md under `## Phase <N> — <name>` for the phase it blocks. /run-phase stops at that phase until it's answered.
7. Show a short summary: files written, decisions taken, deferred questions. Ask the human to review specs/.
8. On approval: `git add specs CLAUDE.md && git commit -m "Constitution"` on main. Don't push — the human pushes main.
