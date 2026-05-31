# Worklog — Improvement Analysis

> Generated: May 31, 2026
> Based on full codebase review of `packages/worklog`

---

## Overall Assessment

The project has a **solid foundation**: clean SvelteKit + Tauri v2 architecture, runes-based state management, good separation of concerns (hooks / repositories), and a clear local-first philosophy. Below are the areas that need attention, roughly ordered by impact.

---

## 🔴 Critical / High Impact

### 1. Git Access Token Stored in Plaintext

| Area | Files |
|---|---|
| Security | `src/lib/sync/types.ts`, `src/lib/sync/git-client.ts` |

The GitHub Personal Access Token is stored **unencrypted** in the SQLite `sync_config` table and embedded directly into HTTPS URLs (`https://${token}@github.com/...`). Anyone with filesystem access to the `.worklog/` directory can read it. There is also risk of token leak through `git remote -v` output.

**Recommendation:** Use the OS keychain (via `tauri-plugin-store` with encryption, or `secret-service` APIs on Linux), or at minimum store an encrypted version. Never embed tokens in remote URLs that could leak through git metadata.

---

### 2. Rust Backend Is Largely Scaffolding

| Area | File |
|---|---|
| Performance | `src-tauri/src/lib.rs` |

The only Tauri command is the boilerplate `greet` — never called by any front-end code. All business logic lives in JS/TS. This means every database query, file read, and git operation marshals through the Tauri plugin IPC layer. Performance-sensitive operations (batch inserts, complex joins, file scanning) could be **10–100× faster** as native Rust commands.

**Recommendation:** Move at least the DB repository layer to Rust commands. Start with performance-critical paths: ticket batch operations, search, and sync snapshot generation.

---

### 3. Duplicate & Stale Ticket State ✅ Fixed

| Area | Files |
|---|---|
| Architecture | `src/lib/hooks/tickets.svelte.ts`, `src/lib/hooks/all-tickets.svelte.ts` |

Two independent hooks maintained their own `_tickets` arrays, causing stale data across different views.

**Fix applied:** Merged `useTickets` and `useAllTickets` into a single unified `useTickets` hook in `src/lib/hooks/tickets.svelte.ts`. Both modes (board-scoped paginated, and all-tickets) now share the same module-level reactive `_tickets` state. Mutations from any view (`create/update/remove/addComment`) are immediately reflected in all consumers. `useAllTickets` is preserved as a deprecated re-export for backward compatibility.

---

### 4. `window.location.reload()` After Data Mutations (not related, The behavior is correct)

| Area | File |
|---|---|
| UX | `src/routes/+layout.svelte` (import function) |

After a successful data import, the app does a full hard reload (`window.location.reload()`). This destroys all in-memory state, causes a visual flash, and is poor UX.

**Recommendation:** After import, invalidate the relevant hooks (`boardsApi.load()`, `ticketsHook.load()`) instead of reloading the window.

---

## 🟡 Medium Impact

### 5. Three Different Drag-and-Drop Libraries (FIXED)

| Area | File |
|---|---|
| Bundle size | `package.json` (dependencies) |

Three DnD libraries for one app — `@dnd-kit-svelte/svelte`, `svelte-dnd-action`, and `@thisux/sveltednd` — is unnecessary weight and complexity. The Kanban board uses `svelte-dnd-action` but the other two also exist as dependencies. This adds ~50–100+ KB to the bundle and increases maintenance burden.

**Recommendation:** Pick one DnD library and remove the others.

---

### 6. Heavy Carbon Components Bundle ✅ Already Optimized

| Area | File |
|---|---|
| Bundle size | `src/routes/+layout.svelte` |

A full CSS import (`import "carbon-components-svelte/css/all.css"`) is present, but `carbon-preprocess-svelte`'s `optimizeCss()` Vite plugin is already configured and handles this at build time — it purges unused Carbon styles, reducing the CSS bundle from ~606 kB to ~53 kB. The `optimizeImports()` preprocessor also rewrites barrel JS imports to source paths for faster compilation.

**Status:** This is actually the recommended setup per the carbon-preprocess-svelte documentation. During development the full CSS is loaded (no workaround), but production builds are properly optimized.

---

### 7. Unused and Orphaned Dependencies ✅ Fixed

| Package | Action |
|---|---|
| `clsx` + `tailwind-merge` | Removed — `cn()` utility was dead code (never called) |
| `layerchart`, `d3-scale`, `d3-shape` | Removed — no source imports exist |
| `bits-ui`, `vaul-svelte` | Removed — no source imports exist |
| `@internationalized/date` | Removed — no source imports exist |
| `svelte-sonner` | Removed — no source imports exist |
| `@dnd-kit/helpers` | Removed — unused after DnD consolidation |
| `@types/d3-scale`, `@types/d3-shape` | Removed — types for removed packages |
| `carbon-preprocess-svelte` | **Kept** — actively used (`optimizeImports` + `optimizeCss`) |

**11 packages removed in total.** `bun install` confirms clean resolution.

---

### 8. `getDb()` Runs CREATE + Migrations on Every Call

| Area | File |
|---|---|
| Performance | `src/lib/db/connection.ts` |

Every call to `getDb()` executes `CREATE TABLE IF NOT EXISTS` statements and triggers migration logic — even for read-only operations. This is wasted I/O on every ticket/board fetch.

**Recommendation:** Separate connection acquisition from schema initialization. Run schema + migrations only once after the database is first opened, not on every `getDb()` call.

---

### 9. Race Condition Risk in Workspace Init

| Area | File |
|---|---|
| Reliability | `src/lib/hooks/workspace.svelte.ts` |

```typescript
await open_workspace(saved);
if (_path !== saved) {  // _path may have been partially updated before a throw
```

If `open_workspace()` partially updates `_path` then throws, the comparison and cleanup logic can misbehave and leave state inconsistent.

**Recommendation:** Use a clear transactional pattern — set `_path` only after `open_workspace()` fully succeeds, and catch errors before mutating state.

---

### 10. Notifications Dropped When Queue Not Mounted

| Area | File |
|---|---|
| UX | `src/lib/hooks/notifications.svelte.ts` |

`notifications.add()` silently drops notifications (with only a `console.warn`) if the Carbon `NotificationQueue` component hasn't mounted yet. This can happen during initial load or route transitions.

**Recommendation:** Buffer notifications until the queue ref is available, or use an independent notification system not tied to a component `bind:this`.

---

## 🟢 Lower Impact / Polish

### 11. `use*` Naming Convention for Singletons ✅ Fixed

| Area | Files |
|---|---|
| Clarity | All `src/lib/hooks/*.svelte.ts`, `src/lib/sync/sync-config.svelte.ts` |

Module-level singletons (state defined at module level) now use `get*` prefix to distinguish them from instance-based hooks that create new state each call.

| Before | After | Nature |
|---|---|---|
| `useWorkspace()` | `getWorkspace()` | Singleton |
| `useBoards(path)` | `getBoards(path)` | Singleton |
| `useTickets(path, boardId?)` | `getTickets(path, boardId?)` | Singleton |
| `useCommandPalette()` | `getCommandPalette()` | Singleton |
| `useAppZoom()` | `getAppZoom()` | Singleton |
| `useSyncConfig()` | `getSyncConfig()` | Singleton |
| `useTicketSort()` | `getTicketSort()` | Singleton |
| `useTicketTypes(path)` | *(kept)* | Instance-based (new state per call) |
| `useAllTickets(path)` | *(kept, deprecated)* | Alias → calls `getTickets(path)` |

**17 files updated.** `svelte-check` passes with 0 errors.

---

### 12. Leftover Debug Comments

| Area | File |
|---|---|
| Cleanliness | `src/routes/workspace/+layout.svelte` |

```svelte
<!-- <h1>Hello World</h1>
<h1>Hello World</h1>
<h1>Hello World</h1>
<h1>{JSON.stringify(}</h1> -->
```

**Recommendation:** Remove commented-out debug markup.

---

### 13. i18n Detection Runs on Every Layout Render

| Area | File |
|---|---|
| Performance | `src/routes/+layout.svelte` (top-level script block) |

The language detection and `localStorage` read run on every component instantiation, not just once at app boot.

**Recommendation:** Guard with a module-level `let initialized = false` flag, or move to an `$effect` / `$effect.root`.

---

### 14. Hard Reliance on `customEvent` for Cross-Component Communication

| Area | File |
|---|---|
| Maintainability | `src/routes/+layout.svelte` |

Actions like "create board", "create ticket", "toggle theme" are dispatched as `window` custom events. This is fragile — no TypeScript checking, no way to trace listeners, and no compile-time guarantees.

**Recommendation:** Use Svelte context API or shared reactive state (the hooks already exist) instead of custom events.

---

### 15. Scrollbar Suppression Is a Fragile Hack

| Area | File |
|---|---|
| CSS | `src/routes/layout.css` |

```css
html.preview-open *::-webkit-scrollbar {
  display: none !important;
}
```

This disables **all** scrollbars globally when the preview sheet is open, relying on WebKitGTK compositing behavior. It is brittle across browser versions and platforms.

**Recommendation:** Target scroll suppression at the specific scrollable containers that overlap with the sheet, rather than the entire document.

---

### 16. No Test Infrastructure

| Area | Scope |
|---|---|
| Quality | Entire project |

The project has zero tests — no unit tests, no integration tests, no E2E tests. For a data-management application that handles migrations, sync, and import/export, this is a significant risk.

**Recommendation:** Start with Vitest for unit tests on repositories and hooks, then add Playwright E2E tests for critical flows (workspace open, board CRUD, ticket CRUD, drag-and-drop).

---

### 17. `$effect.root()` at Module Level in App Zoom

| Area | File |
|---|---|
| Correctness | `src/lib/hooks/app-zoom.svelte.ts` |

Using `$effect.root()` at module scope for a persistent effect is unconventional. The `init()` method is now a no-op. Module-level effects can cause unexpected behavior if the module is re-imported or hot-reloaded during development.

**Recommendation:** Restructure to use a plain `$effect` inside the layout component, or use the standard `$state` + manual persistence pattern without module-level effects.

---

## Quick Wins Summary

| Priority | Task | Estimated Effort |
|---|---|---|
| 🔴 | Remove dead `greet` Rust command | 5 minutes |
| 🟡 | Clean up debug comments in workspace layout | 1 minute |
| 🟡 | Audit and remove unused dependencies | ✅ Done (11 removed) |
| 🟡 | Replace `window.location.reload()` with hook invalidation | 1–2 hours |
| 🟢 | Fix i18n initialization to run once | 15 minutes |
| 🟢 | Consolidate three DnD libraries into one | 2–3 hours |
| 🔴 | Centralize ticket state management (`useTickets` vs `useAllTickets`) | ✅ Done |
| 🔴 | Encrypt stored access token or use OS keychain | 4–6 hours |
| 🔴 | Move critical DB operations to Rust commands | Medium-term |
| 🟡 | Separate DB connection from schema initialization | 2–3 hours |
| 🟡 | Add test infrastructure (Vitest + Playwright) | 1–2 weeks |
| 🟢 | Replace custom events with context/state | 2–3 hours |

---

## Architecture Diagram (Current vs. Target)

```mermaid
flowchart TD
    subgraph Current
        UI[UI Components] --> Hooks[Hooks .svelte.ts]
        Hooks --> getDb[getDb() - JS/TS]
        getDb --> SQLite[SQLite via tauri-plugin-sql]
        Hooks --> GitClient[GitClient - JS shell]
        GitClient --> GitCLI[system git CLI]
    end

    subgraph Target
        UI2[UI Components] --> Hooks2[Hooks .svelte.ts]
        Hooks2 --> RustCmds[Rust Tauri Commands]
        RustCmds --> SQLite2[SQLite direct]
        RustCmds --> Git2[Git via git2 crate]
    end
```

Moving DB and git operations to native Rust commands eliminates the IPC marshalling overhead, removes the system git CLI dependency, and keeps the access token in process memory instead of plaintext on disk.
