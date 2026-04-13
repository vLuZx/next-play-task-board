# Components

This folder contains reusable UI components used across the NextPlay client. Some are shared primitives, some are board-specific building blocks, and a few are older components that are no longer part of the main board rendering path.

## How to Read This Folder

Broadly, the components fall into these groups:

- App shell and navigation: sidebar and its control components
- Board rendering: board container plus row and column views
- Task workflows: modal, detail panel, selectors, and form inputs
- Shared primitives: avatar, text field, date picker, priority indicator
- Legacy board UI: task card

## Component Overview

### avatar

Files:

- [src/components/avatar/Avatar.tsx](src/components/avatar/Avatar.tsx)
- [src/components/avatar/Avatar.css](src/components/avatar/Avatar.css)

Purpose:

- Renders either a member avatar image or generated initials with deterministic colors.

Used in:

- [src/components/board-row/BoardRow.tsx](src/components/board-row/BoardRow.tsx)
- [src/components/board-column/BoardColumn.tsx](src/components/board-column/BoardColumn.tsx)
- [src/components/member-select/MemberSelect.tsx](src/components/member-select/MemberSelect.tsx)
- [src/components/task-detail-panel/TaskDetailPanel.tsx](src/components/task-detail-panel/TaskDetailPanel.tsx)
- [src/pages/TeamMembersPage.tsx](src/pages/TeamMembersPage.tsx)

### board

Files:

- [src/components/board/Board.tsx](src/components/board/Board.tsx)
- [src/components/board/Board.css](src/components/board/Board.css)
- [src/components/board/boardTaskUtils.ts](src/components/board/boardTaskUtils.ts)

Purpose:

- Acts as the board container.
- Chooses between row view and column view.
- Handles sorting, drag state, and shared board utility logic.

Used in:

- [src/pages/BoardPage.tsx](src/pages/BoardPage.tsx)

Notes:

- `Board.css` now mainly holds shared board styles and board-page layout styles.
- `boardTaskUtils.ts` contains reusable board formatting and indicator helpers.

### board-column

Files:

- [src/components/board-column/BoardColumn.tsx](src/components/board-column/BoardColumn.tsx)
- [src/components/board-column/BoardColumn.css](src/components/board-column/BoardColumn.css)

Purpose:

- Renders the Kanban-style column view of the task board.
- Supports drag/drop, assignees, due indicators, and task actions.

Used in:

- [src/components/board/Board.tsx](src/components/board/Board.tsx)

### board-row

Files:

- [src/components/board-row/BoardRow.tsx](src/components/board-row/BoardRow.tsx)
- [src/components/board-row/BoardRow.css](src/components/board-row/BoardRow.css)

Purpose:

- Renders the table-style row view of the task board.
- Supports collapse/expand by status, drag/drop, and inline task metadata.

Used in:

- [src/components/board/Board.tsx](src/components/board/Board.tsx)

### date-picker

Files:

- [src/components/date-picker/DatePickerField.tsx](src/components/date-picker/DatePickerField.tsx)
- [src/components/date-picker/DatePickerField.css](src/components/date-picker/DatePickerField.css)

Purpose:

- Reusable due-date input field used inside task forms.

Used in:

- [src/components/task-form-modal/TaskFormModal.tsx](src/components/task-form-modal/TaskFormModal.tsx)

### member-select

Files:

- [src/components/member-select/MemberSelect.tsx](src/components/member-select/MemberSelect.tsx)
- [src/components/member-select/MemberSelect.css](src/components/member-select/MemberSelect.css)

Purpose:

- Multi-select UI for assigning team members to a task.

Used in:

- [src/components/task-form-modal/TaskFormModal.tsx](src/components/task-form-modal/TaskFormModal.tsx)

### priority-signal

Files:

- [src/components/priority-signal/PrioritySignal.tsx](src/components/priority-signal/PrioritySignal.tsx)
- [src/components/priority-signal/PrioritySignal.css](src/components/priority-signal/PrioritySignal.css)

Purpose:

- Small visual indicator that renders low, normal, and high priority as stacked bars.

Used in:

- [src/components/board-row/BoardRow.tsx](src/components/board-row/BoardRow.tsx)
- [src/components/board-column/BoardColumn.tsx](src/components/board-column/BoardColumn.tsx)

### sidebar

Files:

- [src/components/sidebar/Sidebar.tsx](src/components/sidebar/Sidebar.tsx)
- [src/components/sidebar/Sidebar.css](src/components/sidebar/Sidebar.css)
- [src/components/sidebar/theme-switch/ThemeSwitch.tsx](src/components/sidebar/theme-switch/ThemeSwitch.tsx)
- [src/components/sidebar/theme-switch/ThemeSwitch.css](src/components/sidebar/theme-switch/ThemeSwitch.css)
- [src/components/sidebar/view-mode-switch/ViewModeSwitch.tsx](src/components/sidebar/view-mode-switch/ViewModeSwitch.tsx)
- [src/components/sidebar/view-mode-switch/ViewModeSwitch.css](src/components/sidebar/view-mode-switch/ViewModeSwitch.css)

Purpose:

- Renders the main application navigation.
- Hosts theme controls and board view mode controls.
- Handles mobile collapse/expand behavior.

Used in:

- [src/App.tsx](src/App.tsx)

Notes:

- `ThemeSwitch` is focused only on light, dark, and system mode.
- `ViewModeSwitch` is focused only on row and column board presentation.

### task-card

Files:

- [src/components/task-card/TaskCard.tsx](src/components/task-card/TaskCard.tsx)
- [src/components/task-card/TaskCard.css](src/components/task-card/TaskCard.css)

Purpose:

- Older standalone task card component with its own menu, tooltip, and due-date logic.

Current status:

- Present in the codebase, but not part of the current main board rendering path after the board row/column refactor.

### task-detail-panel

Files:

- [src/components/task-detail-panel/TaskDetailPanel.tsx](src/components/task-detail-panel/TaskDetailPanel.tsx)
- [src/components/task-detail-panel/TaskDetailPanel.css](src/components/task-detail-panel/TaskDetailPanel.css)

Purpose:

- Shows the selected task in a right-side detail panel.
- Includes task metadata, comments, and activity history.

Used in:

- [src/pages/BoardPage.tsx](src/pages/BoardPage.tsx)

### task-form-modal

Files:

- [src/components/task-form-modal/TaskFormModal.tsx](src/components/task-form-modal/TaskFormModal.tsx)
- [src/components/task-form-modal/TaskFormModal.css](src/components/task-form-modal/TaskFormModal.css)

Purpose:

- Modal used for creating and editing tasks.
- Composes shared form building blocks such as text fields, date picker, and member select.

Used in:

- [src/pages/BoardPage.tsx](src/pages/BoardPage.tsx)

### text-field

Files:

- [src/components/text-field/TextField.tsx](src/components/text-field/TextField.tsx)

Purpose:

- Shared labeled text input / textarea wrapper used by forms.

Used in:

- [src/components/task-form-modal/TaskFormModal.tsx](src/components/task-form-modal/TaskFormModal.tsx)

## Typical Component Relationships

Common composition paths in the current app:

- [src/App.tsx](src/App.tsx) -> [src/components/sidebar/Sidebar.tsx](src/components/sidebar/Sidebar.tsx)
- [src/App.tsx](src/App.tsx) -> [src/pages/BoardPage.tsx](src/pages/BoardPage.tsx) -> [src/components/board/Board.tsx](src/components/board/Board.tsx)
- [src/components/board/Board.tsx](src/components/board/Board.tsx) -> [src/components/board-row/BoardRow.tsx](src/components/board-row/BoardRow.tsx)
- [src/components/board/Board.tsx](src/components/board/Board.tsx) -> [src/components/board-column/BoardColumn.tsx](src/components/board-column/BoardColumn.tsx)
- [src/pages/BoardPage.tsx](src/pages/BoardPage.tsx) -> [src/components/task-form-modal/TaskFormModal.tsx](src/components/task-form-modal/TaskFormModal.tsx)
- [src/pages/BoardPage.tsx](src/pages/BoardPage.tsx) -> [src/components/task-detail-panel/TaskDetailPanel.tsx](src/components/task-detail-panel/TaskDetailPanel.tsx)

## Guidance for New Components

When adding a new component in this folder:

- Keep the folder name aligned with the component name
- Co-locate CSS with the component when the styles are component-specific
- Prefer composing from existing primitives before creating a new custom input or display pattern
- Document whether the component is shared, board-specific, or page-specific
- If a component becomes unused after a refactor, mark it clearly before removing it
