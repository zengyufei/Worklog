# Fix: Windows "forbidden path" error on app relaunch

## Problem

On Windows 11, reopening Worklog after selecting a workspace folder results in a **"forbidden path"** error. The app fails to initialize and shows an error screen, blocking access to boards and tickets.

**Workaround discovered by users:** Placing the workspace folder at the same directory level as `worklog.exe` avoids the error.

## Root Cause

Tauri v2's `tauri-plugin-fs` enforces strict filesystem access scopes defined in `src-tauri/capabilities/default.json`. The scopes were originally limited to drive-specific variables (`$DOCUMENT`, `$HOME`, `$APPDATA`, `$RESOURCE`, `$DESKTOP`) — all of which resolve to paths on the `C:` drive on Windows.

When a user selected a workspace on a **different drive** (e.g. `E:\MyFiles\Worklog`) — external USB drive, secondary partition, SD card, etc. — the path didn't match any configured scope. Calls to `exists()`, `mkdir()`, `Database.load()`, and other filesystem operations threw a **"forbidden path"** error.

The same error also occurred for workspaces in `$APPDATA`, `$DESKTOP`, `$RESOURCE` before those scopes were added.

## Changes

### `src-tauri/capabilities/default.json`

Replaced all per-variable scope lists with a single catch-all `**` pattern for each filesystem operation (`write-text-file`, `read-text-file`, `read-dir`, `mkdir`, `exists`). This allows the user to choose **any local folder** regardless of drive letter.

**Before:**
```json
{"path": "$DOCUMENT/**/*"},
{"path": "$HOME/**/*"},
{"path": "$APPDATA/**/*"},
{"path": "$RESOURCE/**/*"},
{"path": "$DESKTOP/**/*"}
```

**After:**
```json
{"path": "**"}
```

### `src/lib/hooks/workspace.svelte.ts`

**1. Path normalization** — Added `normalizePath()` that converts Windows backslashes to forward slashes. Applied at all three entry points:
   - **Dialog result** in `pick()` — the OS file picker returns native paths (`E:\MyFiles\Worklog`)
   - **Saved path** in `init()` — localStorage may contain backslash paths from previous sessions
   - **`open_workspace()` body** — safety net for any callers that might pass raw paths

   This prevents mixed-separator paths like `E:\MyFiles\Worklog/.worklog` which could confuse Tauri's filesystem scope matching.

**2. Two layers of resilience** for unrecoverable path errors:

1. **`classifyWorkspaceError()`** — Translates raw Tauri FS errors (`forbidden`, `not allowed`, `permission denied`, `ENOSYS`) into a user-friendly message explaining the folder is inaccessible and suggesting a different location.

2. **Automatic saved-path clearing** — When `init()` catches a filesystem-scope or missing-directory error, the invalid saved path is cleared from `localStorage` and the status is set to `no_workspace` instead of `error`. This means the **next launch goes straight to the workspace selector** instead of re-triggering the same error.

## Before vs After

| Scenario | Before | After |
|---|---|---|
| Workspace on Desktop | "forbidden path" error on relaunch | Works normally |
| Workspace alongside worklog.exe | Works (workaround) | Works |
| Workspace in AppData | "forbidden path" error on relaunch | Works normally |
| Workspace on **external drive** (E:, D:, etc.) | "forbidden path" error (no scope matched) | ✅ **Fixed** — `**` covers any drive |
| Workspace on now-unplugged drive | Stuck error screen on every relaunch | Saved path cleared; shows selector with clear message |
| Workspace in restricted system dir | Raw error message shown | Friendly message: "choose a different folder" |
