---
name: run-phase
description: Run the next roadmap phase end to end without a human — spec, implement, validate, review, PR. Never interviews, never merges.
disable-model-invocation: true
---

Run one roadmap phase with nobody watching. Nobody can answer you: never ask, never wait. Every stop ends with the short report in step 10.

Hard rules:
- Never merge, never push to main, never force-push.
- Never guess a product decision. Undecided → specs/questions.md and stop (step 4).
- Never edit BRIEF.md or anything in .claude/.
- A command denied by permissions is a stop, not a puzzle: don't work around it. Record it in specs/questions.md ("needs permission for `<command>`") and stop.
- Tests use saved data, never the network.

## 1. Preflight

- `specs/mission.md` missing → report "no constitution — run /constitution first" and stop.
- Uncommitted changes → report them and stop.
- Read CLAUDE.md, specs/mission.md, specs/tech-stack.md, specs/roadmap.md, specs/questions.md, specs/retro.md, and BRIEF.md if present.
- Find the first unchecked phase (`- [ ]`) in specs/roadmap.md. None → append `- <today> roadmap done` to specs/retro.md, commit on main, report "roadmap done", stop.

## 2. Branch

- Branch name: `phase-<N>-<short-slug>`, e.g. `phase-3-front-end-core`.
- Branch already exists (an earlier run stopped on questions): switch to it and run `git merge --no-edit main`. Reuse its spec folder.
- Otherwise: `git switch main && git pull --ff-only` (skip the pull if there's no remote), then `git switch -c <branch>`.

## 3. Spec

- Unticked boxes under this phase's heading in specs/questions.md → not answered yet; go to step 4 straight away and report them again.
- Ticked answers under this phase's heading → fold each into the spec (requirements.md Decisions, or the specs/tech-stack.md decisions log). Spec is the source of truth; leave the question as it is.
- No spec folder yet: create `specs/<YYYY-MM-DD>-<slug>/` (today's date) with plan.md, requirements.md and validation.md, using the headings in specs/_templates/.
  - Sources: specs/ first, then the BRIEF.md sections the phase names. Where they disagree, specs/ wins.
  - plan.md: numbered task groups, each small enough to check on its own.
  - requirements.md: scope, decisions, context, WHEN/THEN scenarios.
  - validation.md: exact commands that pass or fail, plus manual checks. Prefer the test command from CLAUDE.md.
- Do not interview. Do not use AskUserQuestion.

## 4. Questions gate

Anything needed for this phase still undecided — a product choice, a conflict between specs/ and BRIEF.md, a missing permission?

- Append under a heading `## Phase <N> — <name> (<today>)` in specs/questions.md, one entry each:
  `- [ ] <question> — options: <A> / <B>; blocks: <file § section>`
- Commit the spec files and questions.md: `Phase <N>: spec + questions`.
- Push the branch (`git push -u origin <branch>`) if there's a remote.
- Report "questions" and stop. Do not implement.

Not a question: a detail you can decide from specs/, the brief or the code. Decide it and write the decision into requirements.md.

## 5. Implement

For each task group in plan.md, in order:
- Implement it.
- Run the automated checks in validation.md. Fix until green.
- Commit: `Phase <N>: <task group>`.

A group that stays red after three honest attempts: commit what you have, record the failure in specs/questions.md, push, report "blocked", stop.

## 6. Review

- List the changed files: `git diff --name-only main...HEAD`.
- Ask the reviewer agent to compare those files with the spec folder: every requirement implemented, every scenario tested.
- Fix only correctness gaps. Skip style, naming, extra abstractions and tests for impossible cases.
- When a fix changes a decision, update the spec too.
- Re-run every automated check in validation.md. Keep the full output for the PR.

## 7. Close

- Tick the phase in specs/roadmap.md.
- Add a line under today's date in CHANGELOG.md (create the date heading if missing).
- Append one line to specs/retro.md:
  `- <today> Phase <N> <slug>: <what went wrong or what the spec missed> → kit: <what to change, or "nothing">`
- Commit: `Phase <N>: close`.

## 8. Push and PR

- No `origin` remote → skip this step; report "done, no remote".
- `git push -u origin <branch>`.
- `gh pr create --base main --title "Phase <N> — <name>" --body-file <file>` with a body of:
  - Summary: two or three lines.
  - Spec: the spec folder path.
  - Checks: each command from validation.md and its output, in fenced blocks (trim long output to the last 40 lines).
  - Review: findings fixed, findings skipped and why.
  - Manual checks left for the human, from validation.md.
- Never merge.

## 9. Don'ts

- No changes outside this phase's scope. Ideas for later go to specs/research/ or the retro line.
- No new dependencies the tech stack doesn't name. Needed anyway → question.

## 10. Report

End with at most five lines, no more:
- Status: `pr` | `questions` | `blocked` | `roadmap done` | `done, no remote`
- Phase and branch
- PR URL, or the open questions
- Final check result (pass/fail and the command)
