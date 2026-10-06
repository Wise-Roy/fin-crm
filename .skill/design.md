# Design System Discovery & Documentation Instructions

## 1. Purpose

This document defines how an AI agent must discover, analyze, and document the existing design system of this repository.

The goal is to generate a repository-specific:

```text
design-system.md
```

The agent must derive this document from the **actual implementation in the repository**, not from generic design-system assumptions.

`design-system.md` becomes the source of truth for future UI implementation tasks.

---

# 2. Core Principle

Do not invent the design system.

The repository already contains design decisions distributed across:

* Components
* Pages
* Layouts
* Tailwind configuration
* CSS
* SCSS
* Theme files
* Design tokens
* Utility classes
* Typography definitions
* Icons
* Images
* Existing UI patterns
* Responsive breakpoints
* Form components
* Tables
* Modals
* Navigation
* Existing feature implementations

The agent must structurally inspect these sources and reconstruct the design system that is actually being used.

When inconsistencies exist, document them rather than silently inventing a new standard.

---

# 3. Required Output

The agent must create:

```text
design-system.md
```

at the appropriate repository root/location defined by the task.

The document should be:

* Repository-specific
* Implementation-aware
* Structured
* Concise enough to be usable
* Detailed enough for an AI agent to implement UI consistently
* Based on evidence found in the codebase
* Explicit about inconsistencies
* Explicit about uncertain or inferred values

---

# 4. Repository Audit

Before creating `design-system.md`, inspect the repository structurally.

Do not begin by opening a random component and assuming it represents the system.

First identify the UI architecture.

Inspect:

```text
package.json
```

and determine:

* Frontend framework
* UI framework
* CSS solution
* Styling libraries
* Component libraries
* Icon libraries
* Theme libraries
* Animation libraries
* Design-token libraries
* Utility libraries relevant to UI

Then identify the major UI directories.

Typical examples:

```text
src/
app/
pages/
components/
ui/
layouts/
styles/
theme/
design/
public/
```

The actual repository structure takes precedence over these examples.

---

# 5. Strategy

Follow this order.

## Step 1 — Identify Styling Architecture

Project uses:

* Tailwind

Document the actual architecture.

---

## Step 2 — Find Design Tokens

Search for:

* Colors
* Font definitions
* Font sizes
* Font weights
* Spacing values
* Border radius
* Shadows
* Breakpoints
* Z-index values
* Opacity
* Transitions
* Animation durations
* CSS variables
* Tailwind theme extensions
* Theme objects

Inspect files such as:

```text
tailwind.config.*
theme.*
tokens.*
variables.*
globals.*
*.css
*.scss
```

Do not assume the token source is named `theme`.

---

# 6. Color Discovery

Identify all meaningful colors used by the application.

Group them semantically.

Example:

```text
Primary
Secondary
Background
Surface
Text
Border
Success
Warning
Error
Info
Disabled
Hover
Focus
```

For every important color, record:

```text
Token / Variable
Value
Semantic purpose
Where it is defined
Where it is commonly used
```

Prefer semantic tokens over raw color values.

For example:

```text
--color-primary
```

is more important than finding:

```text
#7639C8
```

repeated across files.

---

# 7. Detect Hardcoded Design Values

Search for repeated hardcoded values.

Examples:

```text
#7639C8
#F4E9FF
22px
24px
16px
rounded-[22px]
text-[14px]
```

Determine whether they represent an established design convention.

Do not automatically convert every repeated value into a token.

Instead classify it as:

```text
Established token
Likely convention
Component-specific value
One-off value
Potential inconsistency
```

---

# 8. Typography Audit

Identify:

* Font families
* Font loading
* Font weights
* Font sizes
* Line heights
* Letter spacing
* Heading styles
* Body styles
* Caption styles
* Button typography
* Input typography

Determine the actual typography hierarchy used by the product.

Document:

```text
Display
H1
H2
H3
Body
Body Small
Caption
Label
Button
```

If the application does not have a formal type scale, derive the currently used hierarchy from implementation and clearly mark it as an observed convention.

---

# 9. Spacing Audit

Inspect spacing patterns across the repository.

Look for:

* Padding
* Margin
* Gap
* Grid gaps
* Section spacing
* Card padding
* Form spacing
* Table spacing
* Page padding

Determine whether spacing follows:

* Tailwind's default scale
* A customized scale
* Custom CSS variables
* Arbitrary values
* Mixed conventions

Document the observed system.

---

# 10. Layout Audit

Identify:

* Page container widths
* Sidebar widths
* Header heights
* Content widths
* Grid structures
* Flex patterns
* Page padding
* Section spacing
* Alignment conventions
* Vertical rhythm

Document common page structures.

For example:

```text
Dashboard

Header
↓
Page title
↓
Summary / KPI
↓
Filters
↓
Data table
```

Do not assume this pattern exists; derive it from the repository.

---

# 11. Responsive Design Audit

Find all actual breakpoints.

Inspect:

* Tailwind breakpoints
* Media queries
* Responsive utility classes
* Mobile-specific components
* Desktop-specific components

Document:

```text
Breakpoint
Value
Observed usage
Behavior
```

Also identify responsive patterns for:

* Navigation
* Tables
* Forms
* Modals
* Cards
* Sidebars
* Grids
* Buttons

---

# 12. Component Inventory

Build an inventory of existing reusable UI components.

Search for components representing:

```text
Button
Input
Textarea
Select
Dropdown
Checkbox
Radio
Switch
Date Picker
File Upload
Modal
Drawer
Popover
Tooltip
Toast
Alert
Badge
Avatar
Card
Table
Pagination
Tabs
Accordion
Breadcrumb
Navigation
Sidebar
Header
Loader
Skeleton
Empty State
Error State
```

The actual repository may contain additional components.

Document them.

For each major component determine:

```text
Component name
Location
Purpose
Variants
Sizes
States
Common usage
Responsive behavior
Important implementation notes
```

---

# 13. Existing Component Reuse

Identify components that should be reused rather than recreated.

For example:

```text
Primary button
→ existing Button component

Modal
→ existing Modal component

Input
→ existing Input component
```

Record the actual import/path where useful.

This section is particularly important for AI agents.

---

# 14. Component State Audit

For interactive components, identify actual states.

Look for:

```text
Default
Hover
Active
Focus
Disabled
Loading
Error
Success
Selected
Checked
Expanded
Collapsed
Read-only
```

Document which states are implemented.

Do not claim a state exists merely because it would be desirable.

---

# 15. Forms Audit

Inspect existing forms and identify conventions for:

* Labels
* Required fields
* Placeholder text
* Inputs
* Selects
* Validation
* Error messages
* Help text
* Disabled fields
* Loading states
* Submit buttons
* Field spacing
* Form sections

Also inspect the validation implementation where relevant.

Document the visual convention separately from the business validation logic.

---

# 16. Tables & Data-Dense UI

Inspect existing tables.

Determine:

* Header styling
* Row height
* Cell padding
* Border usage
* Alignment
* Typography
* Status badges
* Action placement
* Pagination
* Sorting
* Filtering
* Loading state
* Empty state
* Error state
* Mobile behavior
* Truncation behavior

Document recurring patterns.

---

# 17. Navigation Audit

Inspect:

* Header
* Sidebar
* Top navigation
* Tabs
* Breadcrumbs
* Dropdown navigation
* Mobile navigation

Document:

* Active state
* Hover state
* Selected state
* Icons
* Typography
* Spacing
* Collapse behavior
* Responsive behavior

---

# 18. Modal / Drawer Audit

Inspect all modal and drawer implementations.

Determine:

* Width
* Maximum height
* Padding
* Header structure
* Footer structure
* Close button
* Overlay
* Scroll behavior
* Action placement
* Responsive behavior

Identify whether there is a reusable implementation.

---

# 19. Iconography Audit

Identify:

* Icon libraries
* Custom SVGs
* Icon components
* Icon sizes
* Stroke widths
* Fill conventions
* Icon alignment
* Icon-button patterns

Determine whether multiple icon systems are being used.

If multiple systems exist, document where each is used.

---

# 20. Images & Illustration Audit

Inspect:

* Logos
* Illustrations
* Empty-state graphics
* Avatars
* Product imagery
* Background images
* SVG assets

Document recurring visual patterns.

Do not list every image in the repository.

Only document assets that represent a reusable design convention.

---

# 21. Border & Radius Audit

Identify:

* Border widths
* Border colors
* Border styles
* Radius conventions

Determine common values and where they are used.

Example:

```text
Small controls → X
Cards → Y
Large containers → Z
Pills → full
```

Only document this if supported by repository evidence.

---

# 22. Shadow & Elevation Audit

Identify all meaningful shadows.

Group them into semantic levels where possible:

```text
None
Subtle
Medium
Strong
```

Document where each is used.

Avoid treating every individual box-shadow as a design token.

---

# 23. Motion & Animation Audit

Search for:

* CSS transitions
* CSS animations
* Framer Motion
* React Transition libraries
* Tailwind transitions
* Loading animations
* Hover animations
* Modal animations

Document:

* Duration
* Easing
* Common transition patterns
* Component-specific animation patterns

Also document whether reduced-motion handling exists.

---

# 24. Accessibility Audit

Inspect implementation for:

* Semantic HTML
* ARIA
* Labels
* Keyboard navigation
* Focus states
* Focus trapping
* Screen-reader text
* Button semantics
* Color contrast conventions
* Tooltips
* Icon-only controls

Document existing accessibility conventions.

Do not claim accessibility compliance unless it has actually been verified.

---

# 25. Content & Copy Patterns

Inspect UI copy patterns.

Document conventions for:

* Page titles
* Section titles
* Button labels
* Error messages
* Empty states
* Confirmation messages
* Toasts
* Tooltips
* Form errors

Identify recurring tone:

```text
Professional
Concise
Action-oriented
Technical
Friendly
```

Base this on actual application copy.

---

# 26. Page Pattern Discovery

Identify recurring page-level patterns.

Examples:

```text
Dashboard
List Page
Detail Page
Create Page
Edit Page
Settings Page
Wizard
Search / Filter Page
```

For each recurring pattern document:

```text
Structure
Header
Actions
Filters
Content
Footer
Responsive behavior
```

---

# 27. Product-Specific UI Patterns

Identify patterns specific to the product.

Examples may include:

```text
Document workflows
Signing workflows
Transaction status
Contract status
eStamp status
Audit trail
Recipient management
File upload
Document preview
```

Do not assume these exist.

Discover them from the repository.

These patterns are often more valuable than generic component documentation.

---

# 28. Inconsistency Detection

This is mandatory.

Identify cases where the same design concept is implemented differently.

Examples:

```text
Same button → different radius

Same status → different colors

Same modal → different padding

Same heading → different typography

Same spacing → different values

Same icon → different library
```

Create an:

```text
## Design Inconsistencies
```

section in `design-system.md`.

For each inconsistency include:

```text
Pattern
Observed implementations
Files/components involved
Frequency
Likely convention
Confidence
```

Do not arbitrarily decide which implementation is correct unless there is clear repository evidence.

---

# 29. Design System Confidence

When deriving a convention, classify confidence.

Use:

```text
High
Medium
Low
```

### High

Repeated across many components or explicitly defined as a token.

### Medium

Repeated across several related components.

### Low

Observed in only one or two places or inferred from implementation.

This prevents inferred conventions from being mistaken for established design rules.

---

# 30. Source References

Where useful, include repository references.

Example:

```md
### Primary Button

Implementation:
`src/components/Button/Button.tsx`

Observed usage:
`src/pages/...`

Token:
`--color-primary`

Confidence:
High
```

The purpose is to make the design-system document traceable back to implementation.

---

# 31. Separate Facts From Recommendations

`design-system.md` must distinguish between:

### Observed

What currently exists in the repository.

### Derived Convention

A repeated pattern inferred from multiple implementations.

### Recommendation

A proposed future standard.

Do not present recommendations as existing design-system rules.

---

# 32. Do Not Refactor the Repository

During this task:

```text
DO:
✓ Inspect
✓ Analyze
✓ Categorize
✓ Document
✓ Detect inconsistencies
✓ Identify patterns
```

Do NOT:

```text
✗ Rewrite components
✗ Change CSS
✗ Change Tailwind configuration
✗ Rename components
✗ Introduce tokens
✗ Refactor UI
✗ Change visual behavior
```

The task is **discovery and documentation**, not implementation.

---

# 33. Avoid Exhaustive Noise

Do not turn `design-system.md` into a dump of every CSS value.

Do not document:

```text
every individual margin
every one-off color
every SVG
every component prop
every className
```

Document reusable design decisions and meaningful patterns.

The final document should help an engineer or AI agent make UI decisions quickly.

---

# 34. Required design-system.md Structure

The generated document should follow this structure:

```text
# Design System

1. Overview
2. Design Principles
3. Technology / Styling Architecture
4. Design Tokens
   4.1 Colors
   4.2 Typography
   4.3 Spacing
   4.4 Border Radius
   4.5 Borders
   4.6 Shadows
   4.7 Breakpoints
   4.8 Z-Index
   4.9 Motion
5. Layout System
6. Responsive System
7. Component Inventory
8. Component Patterns
   8.1 Buttons
   8.2 Forms
   8.3 Inputs
   8.4 Selects
   8.5 Cards
   8.6 Tables
   8.7 Modals
   8.8 Drawers
   8.9 Tabs
   8.10 Navigation
   8.11 Feedback
   8.12 Loading
   8.13 Empty States
   8.14 Error States
9. Iconography
10. Images & Illustrations
11. Forms & Validation
12. Data Display
13. Page Patterns
14. Product-Specific Patterns
15. Accessibility
16. Content & Copy
17. Animation & Interaction
18. Design Inconsistencies
19. Existing Component Mapping
20. Recommended Design Tokens
21. Agent Implementation Rules
22. Evidence / Source References
```

Not every section must contain information.

If something does not exist in the repository, explicitly state:

```text
Not currently established in the repository.
```

Do not invent values.

---

# 35. Existing vs Recommended Design System

The generated document must clearly separate:

## Current System

What the repository currently uses.

## Recommended Standard

Potential consolidation opportunities.

For example:

```md
## Current System

Cards currently use 16px and 20px radius across different areas.

## Recommended Standard

Consider standardizing card radius to a single token.

Status: Recommendation only.
```

Do not silently convert the recommendation into an existing rule.

---

# 36. Agent Implementation Rules

At the end of `design-system.md`, generate a concise set of rules for future AI agents.

The rules should communicate:

```text
1. Reuse existing components.
2. Reuse existing tokens.
3. Search before creating a new component.
4. Follow established page patterns.
5. Follow established responsive behavior.
6. Do not introduce arbitrary colors.
7. Do not introduce arbitrary spacing.
8. Implement loading/error/empty/disabled states.
9. Preserve accessibility patterns.
10. Prefer consistency over novelty.
11. Do not create duplicate design patterns.
12. When the existing system is inconsistent, follow the dominant documented
    convention and mention the inconsistency when relevant.
13. Do not invent a design rule when repository evidence is unavailable.
```

---

# 37. Final Validation

Before finishing, verify:

```text
[ ] Styling architecture identified
[ ] Design tokens discovered
[ ] Colors documented
[ ] Typography documented
[ ] Spacing documented
[ ] Radius documented
[ ] Borders documented
[ ] Shadows documented
[ ] Breakpoints documented
[ ] Layout patterns documented
[ ] Responsive patterns documented
[ ] Component inventory created
[ ] Component states documented
[ ] Forms documented
[ ] Tables documented
[ ] Navigation documented
[ ] Modals documented
[ ] Icons documented
[ ] Loading states documented
[ ] Empty states documented
[ ] Error states documented
[ ] Accessibility patterns documented
[ ] Motion documented
[ ] Page patterns documented
[ ] Product-specific patterns documented
[ ] Inconsistencies identified
[ ] Existing component mapping created
[ ] Current vs recommended clearly separated
[ ] Evidence/source references included
[ ] No repository code was modified
```

---

# 38. Final Deliverable

The agent must produce:

```text
design-system.md
```

The document should allow a future AI agent to answer questions such as:

* What color should this button use?
* What font size should this heading use?
* What radius should this card have?
* Which existing component should I use?
* How should this modal be structured?
* How should this page behave on mobile?
* How should loading/empty/error states look?
* Which icon library should I use?
* What spacing should exist between form fields?
* What is the standard page layout?
* Which existing component implements this pattern?
* Is this proposed UI consistent with the existing product?
* Is a new component actually necessary?

The final `design-system.md` should answer these questions using evidence from the repository rather than generic assumptions.

