# Fix: Windows "forbidden path" error on app relaunch

## Problem

On Windows 11, reopening Worklog after selecting a workspace folder results in a **"forbidden path"** error. The app fails to initialize and shows an error screen, blocking access to boards and tickets.

**Workaround discovered by users:** Placing the workspace folder at the same directory level as `worklog.exe` avoids the error.

## Root Cause

Tauri v2's `tauri-plugin-fs` enforces strict filesystem access scopes defined in `src-tauri/capabilities/default.json`. The scopes were limited to `$DOCUMENT/**/*` and `$HOME/**/*` — but the user-chosen workspace path often falls outside these:

| Scope variable | Windows 11 resolution | In original config? |
|---|---|---|
| `$DOCUMENT` | `C:\Users\<user>\Documents` | ✅ |
| `$HOME` | `C:\Users\<user>` | ✅ |
| `$RESOURCE` | The app's install directory (same dir as `worklog.exe`) | ❌ |
| `$APPDATA` | `C:\Users\<user>\AppData\Roaming` | ❌ |
| `$DESKTOP` | `C:\Users\<user>\Desktop` | ❌ |

When the saved workspace path resolved to a location outside the allowed scopes, calls to `exists()`, `mkdir()`, and other filesystem operations threw a "forbidden path" error on every relaunch — the app was stuck in an error loop.

## Changes

### `src-tauri/capabilities/default.json`

Added three missing scope variables to all filesystem operations (`write-text-file`, `read-text-file`, `read-dir`, `mkdir`, `exists`):

- **`$RESOURCE/**/*`** — Covers workspaces stored alongside `worklog.exe` (the user-reported workaround)
- **`$APPDATA/**/*`** — Covers workspaces in `AppData\Roaming`
- **`$DESKTOP/**/*`** — Covers workspaces on the desktop (common choice)

### `src/lib/hooks/workspace.svelte.ts`

Added two layers of resilience for unrecoverable path errors:

1. **`classifyWorkspaceError()`** — Translates raw Tauri FS errors (`forbidden`, `not allowed`, `permission denied`, `ENOSYS`) into a user-friendly message explaining the folder is inaccessible and suggesting a different location.

2. **Automatic saved-path clearing** — When `init()` catches a filesystem-scope or missing-directory error, the invalid saved path is cleared from `localStorage` and the status is set to `no_workspace` instead of `error`. This means the **next launch goes straight to the workspace selector** instead of re-triggering the same error.

## Before vs After

| Scenario | Before | After |
|---|---|---|
| Workspace on Desktop | "forbidden path" error on relaunch | Works normally |
| Workspace alongside worklog.exe | Works (workaround) | Works |
| Workspace in AppData | "forbidden path" error on relaunch | Works normally |
| Workspace on now-unplugged drive | Stuck error screen on every relaunch | Saved path cleared; shows selector with clear message |
| Workspace in restricted system dir | Raw error message shown | Friendly message: "choose a different folder" |
