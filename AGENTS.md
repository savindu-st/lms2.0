# Workspace Agent Rules

## Git & Version Control
- **Do not commit changes autonomously:** Never execute `git commit` or `git push` unless the user explicitly requests it in their message.
- Always present the changed files and ask the user for confirmation before performing any Git commit actions.

## Progress Tracking
- **Automatically update [`progress.md`](file:///home/savindust/Documents/projects/lms%202.0/progress.md):** Whenever you complete a milestone, architectural task, bug fix, code review remediation, or major feature, you must automatically update `progress.md`.
- Maintain all 5 key tracking sections in `progress.md`:
  1. **System Health Matrix:** Keep component statuses, passing test counts, and last verified dates current.
  2. **Architecture Decision Records (ADR) Registry:** Whenever an ADR is created or modified in [`ARCHITECTURE_DECISIONS.md`](file:///home/savindust/Documents/projects/lms%202.0/ARCHITECTURE_DECISIONS.md), synchronize the ADR registry table.
  3. **5-Axis Code Review & Remediation Status:** Whenever code review findings are created or resolved in [`CODE_REVIEW_FINDINGS.md`](file:///home/savindust/Documents/projects/lms%202.0/CODE_REVIEW_FINDINGS.md), update the findings status table.
  4. **Milestones & Feature Backlog:** Check off completed milestone checklist items, record new milestones, and keep roadmap items aligned.
  5. **Activity & Agent Update Log:** Add a chronological row detailing the date, contributor, action summary, and status.

