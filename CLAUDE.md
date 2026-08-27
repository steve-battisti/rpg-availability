# Red Planet Groove — Band Availability

Shared calendar-availability tracker for a 6-person band. Members mark each date
Available / Unavailable / Maybe; the band reads a combined report and gets
suggested "best gig dates" (Fri–Sun) and "best practice dates" (Mon–Thu) for the
next six months. Personal use, no public signup, mobile-first.

- Requirements of record: `concepts/rpg-availability.md`
- Active plan: `plans/` (one markdown file per shipped thing, with checkboxes)
- Visual direction: `design/`

**Note on the close-out pass below:** it was inherited from another project and
names commands that do not exist here yet (`design:fixtures`, `design:previews`,
`design:pushed`, `strategy/north-star.md`, `Backlog.md`). Until this repo grows
equivalents, the close-out pass here is: working tree clean → `npm run typecheck`
→ `npm run lint` → concept doc + plan + `TestScript.md` updated → `tasks/lessons.md`
only if a correction revealed a real pattern.

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

### 7. Clean Session Close
- The transcript is disposable; the repo is the memory. A loose end is state that exists only in
  the conversation — if the session vanished, the next one starts from `CLAUDE.md`,
  `tasks/lessons.md`, the repo, and git log. Nothing else survives.
- Exit at task boundaries, not time boundaries. One shipped thing per session; don't roll from one
  subsystem into another in the same context. Don't exit mid-debug — finish it, or write the
  finding into the plan first.
- **The close-out pass**, in order:
  1. Working tree clean. Commit with `git commit --only <paths>` and never `git reset` — sessions
     share this worktree, so uncommitted work is a hazard for the other session, not just unsaved.
  2. `npm run typecheck`, plus whichever `:check` harness the change touched. If spelling or
     fixture data moved, `npm run design:fixtures` and `npm run design:previews` — `design:fixtures`
     ends by running `design:claims`, so it is also what tells you which brief sentences the new
     data just made false.
  3. The homes agree: concept doc updated, plan has its Review / *Still owed* section,
     `Backlog.md` item deleted if shipped, `design/status.md` current, `TestScript.md` has a case if
     the change is human-verifiable, and `content/` updated if the change alters anything the game
     **says** to a player. **If anything under `design/` moved, `npm run design:pushed -- --check`**
     — a brief, a fixture or a `system.md` rule that exists only in this checkout has not been
     handed off, and a green repo says nothing about that (`tasks/lessons.md` L73).
  4. `tasks/lessons.md` if a correction revealed a real pattern — only then; volume there costs
     attention at every session start.
- Unfinished work is parked in the plan's *Still owed* section, never left in the transcript.
- "Close out the session" is a request to run this pass.

## Task Management

1. **Plan First**: Write plans to markdown files in the /plans subfolder of the project, with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to the plan markdown file
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections
7. **Plan for Human Testing**: With each change, update TestScript.md with test cases suitable for human testing. Add a human test case only when a change is actually human-verifiable; mechanical checks go in the harness. Prefer "find a game where X happens" over pinning a seed, since every new random draw shifts every seed.

## Core Principles

- **Follow the north star.** `strategy/north-star.md` states what the product is, who it's for, and the order things get built. Check any substantial piece of work against its build sequence (§6) and its decision rules (§9) before starting. It settles contested calls; `strategy/README.md` explains how it differs from `concepts/` and `plans/`.
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

