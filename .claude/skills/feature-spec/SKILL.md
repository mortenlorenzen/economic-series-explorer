---
name: feature-spec
description: Plan the next roadmap phase as a dated spec folder (plan, requirements, validation) before any code. Use when starting a new feature in a project with specs/roadmap.md.
disable-model-invocation: true
---

1. Read specs/mission.md, specs/tech-stack.md and specs/roadmap.md. Find the next unchecked phase. If BRIEF.md exists, read the sections that phase covers — they hold the detailed design.
2. Make a git branch for it, named after the feature.
3. Interview the user with the AskUserQuestion tool, grouped on the three files below, before writing anything to disk. Skip what BRIEF.md already answers; ask about gaps and contradictions.
4. Create specs/YYYY-MM-DD-feature-name/ (today's date) with:
   - plan.md — a series of numbered task groups
   - requirements.md — scope, decisions, context, plus WHEN/THEN scenarios
   - validation.md — how to know the implementation succeeded and can be merged
   Use the headings in specs/_templates/.
5. Flag anything that conflicts with the constitution. Do not implement. Stop for review.
