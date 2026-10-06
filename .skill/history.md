Redesign the "History" section in the task detail side panel (right-side modal)
into a cleaner "Activity" timeline.

## Step 1: Explore first
- Find the component that renders the History list in the task detail panel
  (search for "History", "reassigned", "changed status").
- Identify how history entries are fetched and their shape (actor, action
  type, from/to values, createdAt). Don't change the API or DB schema.
- Check the existing stack (Tailwind, shadcn, icon library, date library) and
  reuse it. Match the panel's existing typography, spacing, and colors. Do not
  add new dependencies.

## Step 2: Scope
Only the Activity/History section changes. Do NOT add:
- a progress stepper or To do to Completed status tracker at the top
Leave the rest of the panel untouched.

## Step 3: Design requirements
1. Rename the section heading from "HISTORY" to "Activity". Use sentence case,
   14px, medium weight.
2. Group entries by day under small muted headers: "Today", "Yesterday", then
   "06 Oct 2026". Show the date once per group, and show only the time
   (e.g. 11:24 PM) on each row.
3. Show newest first, in a vertical timeline. Each row has a small circular
   icon on the left, joined to the next row by a thin vertical line (no line
   after the last row).
4. Row content:
   - Status change: neutral icon (arrows-exchange). Text is
     [From tag] → [To tag].
   - Status set to Completed: green check icon, and the text is
     "Marked [Completed]".
   - Reassignment: blue/accent icon (user-share). Text is
     "Reassigned [Old] → [New]".
   - Tags are small rounded chips (12px, subtle border, light surface bg).
   - Under the main text, a muted 12px line: "{actor first name} · {time}".
5. Convert enum values to readable labels with a single shared helper:
   WAITING_CLIENT → "Waiting client", IN_PROGRESS → "In progress",
   TODO → "To do". Fall back to sentence-casing any unknown value.
6. Collapse long lists: show the latest 5 entries, with a
   "Show all activity (N)" text button that expands the rest inline. Don't
   nest scrolling inside the panel.
7. Optional: above the timeline, show a one-line handoff strip of assignee
   avatars (initials) in order, e.g. GG → PI → SG → GG, with "Now with
   {current assignee}" on the right. Derive it from the reassignment entries,
   and hide it if there are no reassignments.
8. Empty state: "No activity yet." in muted text.

## Step 4: Quality
- Add aria-hidden to decorative icons and use semantic list markup
  (<ol>/<li>) for the timeline.
- Keep the component small and typed. Put the grouping and label helpers in
  a util file with unit tests if a test setup exists.
- Don't refactor unrelated code.

## Step 5: Verify
- Run the typecheck and lint, and fix any errors you introduced.
- Open the task panel on localhost:3000 and confirm it with a task that has
  status changes and reassignments. Confirm there is no horizontal overflow
  and the text doesn't truncate badly in a narrow panel.
- Summarize the files changed and any assumptions you made.