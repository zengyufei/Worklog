# Plan: Per-Board Configurable Tabs (Stored in DB)

> **Goal**: Make the set of visible tabs per-board configurable and persisted in the database instead of `localStorage`. Only **Kanban** is enabled by default; users can opt in to Table, Timeline, Calendar, and Docs. Tab selection (which tab is active) stays in `localStorage` for session continuity.

---

## Current State

The board detail page (`/workspace/[board_id]/+page.svelte`) currently has **5 hardcoded tabs**:

| Index | Tab | Component | Always shown? |
|-------|-----|-----------|:---:|
| 0 | Board (Kanban) | `KanbanBoard` | ✅ |
| 1 | Table | `TableView` | ✅ |
| 2 | Timeline | `GanttView` | ✅ |
| 3 | Calendar | `CalendarView` | ✅ |
| 4 | Docs | `BoardDocs` | ✅ |

Tab **active index** is persisted per-board via `localStorage` (`worklog:last_tab_index:<board_id>`). There is no database-level tab configuration — all tabs are hardcoded in the template.

---

## Design Decisions

### 1. Storage: JSON column on `boards` table

Following the existing pattern (`labels` and `comments` are stored as JSON strings in the `tickets` table), we add a `tabs_config` TEXT column to `boards`. This keeps the schema simple — no new table, no joins.

Default value: `["kanban"]` — only Kanban visible. When a board is created, only Kanban is active.

Column content is a JSON array of enabled tab type strings, e.g.:
```json
["kanban", "table", "docs"]
```

### 2. Tab type enum

```typescript
export type TabType = "kanban" | "table" | "timeline" | "calendar" | "docs";
```

### 3. Tab active index: stays in `localStorage`

The *currently active tab index* remains in `localStorage` per board. The *enabled tab set* moves to the DB. These are orthogonal concerns.

### 4. Tab management UI

A small **gear icon button** appears at the right edge of the tab bar (before search+sort). Clicking it opens a dropdown checklist where users toggle individual tabs on/off. Kanban is always enabled and cannot be unchecked.

---

## Implementation Phases

---

### Phase 0 — Data Layer: Schema + Types + Repo

**Schema migration (v15)**: Add `tabs_config` column to `boards` table.

```sql
ALTER TABLE boards ADD COLUMN tabs_config TEXT NOT NULL DEFAULT '["kanban"]';
```

**Types update** (`src/lib/components/app/types.ts`):

```typescript
export type TabType = "kanban" | "table" | "timeline" | "calendar" | "docs";

export const DEFAULT_BOARD_TABS: TabType[] = ["kanban"];

export const ALL_BOARD_TABS: TabType[] = [
  "kanban", "table", "timeline", "calendar", "docs"
];
```

**Board type update**: Add `tabs_config` field to `Board` interface.

```typescript
export interface Board {
  id: string;
  name: string;
  description: string;
  tabs_config: string; // JSON array of TabType
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**Board repo** (`src/lib/db/repositories/board.repo.ts`):

Add methods:
- `updateBoardTabs(db, id, tabs: TabType[])` — updates `tabs_config` column
- `getBoardTabs(db, id): TabType[]` — reads and JSON-parses `tabs_config` (returns default if null/empty)

Update `createBoard` to write `tabs_config`.

Update `renameBoard` to also accept an optional `tabs_config` param (or keep it separate).

**Files to change:**
| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Bump `SCHEMA_VERSION` to 15 |
| `src/lib/db/migrate.ts` | Add `migrate_v15` — `ALTER TABLE boards ADD COLUMN tabs_config TEXT NOT NULL DEFAULT '["kanban"]'` |
| `src/lib/components/app/types.ts` | Add `TabType`, `DEFAULT_BOARD_TABS`, `ALL_BOARD_TABS`, update `Board` |
| `src/lib/db/repositories/board.repo.ts` | Add `updateBoardTabs()`, `getBoardTabs()`, update `createBoard` |

---

### Phase 1 — Board Tab Hook

**New file**: `src/lib/hooks/board-tabs.svelte.ts`

A hook that:
- Accepts a `getBoardId()` getter and `getWorkspacePath()` getter
- Provides reactive `enabledTabs: TabType[]` derived from the DB
- Provides `isTabEnabled(tab: TabType): boolean`
- Provides `toggleTab(tab: TabType)` — calls `updateBoardTabs()` in the repo
- Provides `setTabs(tabs: TabType[])` — bulk set
- Loads tab config from DB when board changes

```typescript
export function getBoardTabs(
  getWorkspacePath: () => string | null,
  getBoardId: () => string | null,
) {
  // ... reactive state, load, toggle, setTabs
}
```

**Files to create:**
| File | Purpose |
|------|---------|
| `src/lib/hooks/board-tabs.svelte.ts` | Reactive hook for board tab config |

---

### Phase 2 — UI: Tab Bar Becomes Dynamic

**Update** `src/routes/workspace/[board_id]/+page.svelte`:

1. Import `getBoardTabs` hook, wire it up with the workspace path and board ID
2. Replace hardcoded tabs with a loop over `enabledTabs`
3. Add a **gear icon** button at the right of the tab bar that opens a small dropdown
4. Dropdown contains checkboxes for all non-kanban tab types (kanban is always enabled and shown as locked)
5. Tab indicator positioning needs to derive from the dynamic tab count
6. Fix the `selectedTab` index to be stable (derive from the enabled tabs list, or use tab type as the key instead of index)

**Key considerations:**
- `selectedTab` should be based on tab type, not index, since indices shift when tabs are toggled
- Document-based tabs (docs) may need special treatment — if Docs is disabled, the next visit doesn't force the user back to a broken tab
- The gear dropdown should use Carbon `Dropdown` or a custom popover for consistency

**Tab management dropdown component** (new): `src/lib/components/app/board/board-tab-manager.svelte`

A small popover/dropdown that renders checkboxes for each available tab type. Kanban is shown as disabled/always-on.

**Files to change:**
| File | Change |
|------|--------|
| `src/routes/workspace/[board_id]/+page.svelte` | Dynamic tab rendering, wire up hook, add gear button |
| `src/lib/components/app/board/board-tab-manager.svelte` | **New** — dropdown for toggling tabs |

---

### Phase 3 — i18n Messages

**Add messages** to `messages/en.json` (and `fr.json`):

```json
"board_tab_kanban": "Board",
"board_tab_table": "Table",
"board_tab_timeline": "Timeline",
"board_tab_calendar": "Calendar",
"board_tab_docs": "Docs",
"board_tab_manage": "Manage tabs",
"board_tab_enable": "Enable {tab} tab",
"board_tab_always_visible": "Kanban is always visible",
```

Update `messages/fr.json` with French equivalents.

---

### Phase 4 — Validation

1. Run `bun run check` to verify TypeScript types
2. Test scenario: create new board → only Kanban visible
3. Test scenario: enable Table + Calendar → tabs appear, indicators work
4. Test scenario: switch to Docs tab, disable Docs → auto-switch back to Kanban
5. Test scenario: verify tab config persists across app restart (DB-backed)
6. Test scenario: verify legacy boards (no `tabs_config`) default to `["kanban"]`

---

## Migration Compatibility

- Boards created before this change have no `tabs_config` column. Migration v15 adds the column with default `'["kanban"]'`.
- For safety, the `getBoardTabs()` repo method will treat empty/null/malformed values as the default `["kanban"]`.
- After migration, users will only see the Kanban tab on existing boards until they opt in to other views.

---

## Components / Files Summary

### New files
| # | Path | Purpose |
|---|------|---------|
| 1 | `src/lib/hooks/board-tabs.svelte.ts` | Reactive hook for tab config |
| 2 | `src/lib/components/app/board/board-tab-manager.svelte` | Tab toggle dropdown UI |

### Modified files
| # | Path | What changes |
|---|------|-------------|
| 1 | `src/lib/db/schema.ts` | Bump schema version |
| 2 | `src/lib/db/migrate.ts` | Add v15 migration |
| 3 | `src/lib/components/app/types.ts` | Add `TabType`, update `Board` |
| 4 | `src/lib/db/repositories/board.repo.ts` | Add tab CRUD methods |
| 5 | `src/routes/workspace/[board_id]/+page.svelte` | Dynamic tabs + gear UI |
| 6 | `messages/en.json` | i18n messages |
| 7 | `messages/fr.json` | French translations |

---

## Sequence: User Flow

```
1. User opens board
2. Board page calls getBoardTabs() → reads tabs_config from DB
3. enabledTabs = JSON.parse(board.tabs_config) → e.g. ["kanban"]
4. Tab bar renders only Kanban tab
5. User clicks gear icon → dropdown opens
6. User checks "Table" → toggleTab("table") → repo.updateBoardTabs()
7. Tab bar re-renders: [Kanban] [Table]
8. Tab indicator slides to the new active tab
9. On next app launch, tab config is read from DB → Table still there
```

---

## Out of Scope (for this plan)

- Reordering tabs (drag or configurable order)
- Tab-specific permissions or per-user settings (Worklog is local-first, single-user)
- Tab-specific data isolation beyond what the board already provides
- Keyboard shortcuts for tab switching (already handled by `Ctrl+Tab` patterns? — defer)
