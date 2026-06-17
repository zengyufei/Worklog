# Plan: Board Docs Tab — Markdown Notes per Board

> **Goal**: Add a **Docs** tab on each board where users can browse, create, and edit markdown note files — stored as real `.md` files on the filesystem.
>
> **Principle**: Start small. A file tree + a textarea with live preview. No new deps. No schema changes.

---

## Current State

The board detail page (`/workspace/[board_id]`) has 4 tabs:

| Tab | Component | Mode |
|-----|-----------|------|
| Kanban | `KanbanBoard` | visual |
| Table | `TableView` | grid |
| Timeline | `GanttView` | planning |
| Calendar | `CalendarView` | calendar |

There is currently **no docs/notes tab**. The user wants a 5th tab where markdown files live alongside each board.

---

## Storage Strategy

Markdown files are stored **on the filesystem**, not in SQLite. This is the git-native approach — the files are plain text, diffable, and editable outside the app.

```
.worklog/
├── worklog.db                    # SQLite (existing)
├── sync/                         # sync artifacts (existing)
└── boards/
    └── <board_id>/
        └── docs/                 # ← NEW: user's markdown files
            ├── README.md
            ├── architecture.md
            └── meeting-notes/
                └── 2026-06-17.md
```

**Why `.worklog/boards/<board_id>/docs/`**:
- Scoped per board, naturally grouped by board ID
- Plain `.md` files — zero lock-in, viewable in any editor
- Tracked by git if the workspace is a git repo (user opt-in by committing them)
- No schema migration needed — zero DB changes

---

## Phase 0 — Docs Tab + File Tree + Read-Only Preview (the MVP)

**Deliverable**: A 5th tab "Docs" appears on the board detail page. Shows a **file tree** of `.md` files inside `.worklog/boards/<board_id>/docs/`. Clicking a file renders it as HTML.

**Files to create**:
- `src/lib/hooks/board-docs.svelte.ts` — hook for listing/reading `.md` files via Tauri FS plugin
- `src/lib/components/app/board/board-docs.svelte` — tab component (file tree sidebar + content area)

**Files to update**:
- `src/routes/workspace/[board_id]/+page.svelte` — add 5th tab "Docs", wire it in

**What it looks like**:
```
┌──────────────────────────────────────────────────┐
│ [Kanban] [Table] [Timeline] [Calendar] [📄 Docs] │  ← new tab
├──────────────┬───────────────────────────────────┤
│ 📁 docs/     │  # Architecture                   │
│  ├ README.md │                                   │
│  ├ arch.md   │  This document describes the...   │
│  └ meeting.. │                                   │
│              │  ## Overview                      │
│              │                                   │
│              │  The system uses...                │
└──────────────┴───────────────────────────────────┘
```

**File tree** (left, ~220px):
- Recursively lists `.md` files in the board's docs directory
- Folders are collapsible
- Click a file to select it

**Content area** (right):
- Renders selected file as HTML via a simple inline markdown-to-HTML converter
- No npm dependency — just handle: `#` headings, `**bold**`, `- list`, `` `code` ``, `[links](url)`, blank-line paragraphs
- If no file selected, show a welcome/empty state

**If docs directory doesn't exist yet**:
- Show empty state: "No docs yet — create your first note"
- A button "New Note" that creates a blank `README.md`

---

## Phase 1 — Inline Editor (edit .md files)

**Deliverable**: Clicking a file switches to split-pane mode: textarea (left) + rendered preview (right). Auto-saves on blur or Ctrl+S.

**Changes**:
- `board-docs.svelte` — add edit mode toggle, textarea, save handler
- `board-docs.svelte.ts` — add `writeDoc()` function (writes to filesystem via Tauri)

**UX**:
- Default: read-only rendered view
- Click "Edit" button (or press `e`) → split pane
- Left: `<textarea>` with the raw markdown content
- Right: live rendered preview, updates as you type
- `Ctrl+S` or blur → save to filesystem
- "Done" or `Esc` exits edit mode

---

## Phase 2 — Create, Rename, Delete Notes

**Deliverable**: File tree gains toolbar actions: New Note, New Folder, Rename, Delete.

**Changes**:
- `board-docs.svelte` — add toolbar buttons / context menu
- `board-docs.svelte.ts` — add `createDoc()`, `deleteDoc()`, `renameDoc()` functions

---

## Phase 3 — Polish (Deferred)

- Drag-and-drop file reordering in tree
- Folder collapse/expand persistence
- File search within docs
- Auto-create `README.md` when board is created (optional)

Only if Phases 0-2 prove useful.

---

## Non-Goals (Explicitly Out of Scope)

- **No schema changes** — markdown lives on the filesystem, not in SQLite
- **No npm markdown parser** — inline rendering keeps deps at zero
- **No rich text editor** — plain textarea + preview is the ceiling for now
- **No sync integration** — these files are already on the filesystem, accessible to git directly
- **No board-delete cleanup** — orphaned docs dirs are harmless; can add later

---

## File Manifest

| Phase | File | Action |
|-------|------|--------|
| 0 | `src/lib/hooks/board-docs.svelte.ts` | **Create** — FS listing/reading hook |
| 0 | `src/lib/components/app/board/board-docs.svelte` | **Create** — file tree + preview tab |
| 0 | `src/routes/workspace/[board_id]/+page.svelte` | **Update** — add 5th tab "Docs" |
| 1 | `src/lib/hooks/board-docs.svelte.ts` | **Update** — add `writeDoc()` |
| 1 | `src/lib/components/app/board/board-docs.svelte` | **Update** — add split-pane editor |
| 2 | `src/lib/hooks/board-docs.svelte.ts` | **Update** — add `createDoc`, `deleteDoc`, `renameDoc` |
| 2 | `src/lib/components/app/board/board-docs.svelte` | **Update** — add file tree toolbar/context menu |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Tauri FS plugin unavailable in browser dev mode | Lazy dynamic import with try/catch; fallback to mock data in dev |
| User deletes docs directory externally | File tree gracefully shows empty state + "Create first note" |
| Large directory trees slow to list | Recursive listing initially; virtual scroll if needed later |
| Markdown rendering quality | Inline renderer handles 80% of cases. If inadequate, swap for a lightweight marked.js — still no heavy dep |
| Orphaned docs dirs after board deletion | Harmless — just empty folders. Cleanup can be a follow-up |
