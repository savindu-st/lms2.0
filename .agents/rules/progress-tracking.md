# Agent Progress Tracking Rule

## Automatic Progress Updates
- Whenever an agent completes a significant task, feature, architectural modification, bug fix, code review remediation, or milestone, the agent **must automatically update [`progress.md`](../../progress.md)** at the root of the workspace.
- Specific update requirements:
  1. **System Health Matrix:** Update component status, automated test results, and last verified dates if modified.
  2. **Architecture Decision Records (ADR) Registry:** Synchronize the ADR table whenever an architectural decision is added or updated in [`ARCHITECTURE_DECISIONS.md`](../../ARCHITECTURE_DECISIONS.md).
  3. **5-Axis Code Review & Remediation Status:** Update the review findings table whenever a blocker, warning, or suggestion is resolved or added in [`CODE_REVIEW_FINDINGS.md`](../../CODE_REVIEW_FINDINGS.md).
  4. **Milestones & Feature Backlog:** Check off completed checklist items, register new completed milestones, and maintain the backlog.
  5. **Activity Log:** Add a new chronological entry to the `Activity & Agent Update Log` table detailing the date, contributor, action summary, and status.
- Keep `progress.md` accurate, structured, and free of sensitive private credentials or passwords.
