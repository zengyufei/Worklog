# Worklog Sync & Data Portability

> Portable workspace data — export, import, and sync to GitHub.

---

## Overview

Worklog is local-first by design. Your data lives in a SQLite database inside your workspace folder (`.worklog/worklog.db`). This module adds a **mapper layer** that converts that database into portable flat files, enabling three capabilities:

1. **Export** — Save your entire workspace as a JSON or CSV file (or a folder of per-board files)
2. **Import** — Restore a workspace from previously exported files
3. **Git Sync** — Push and pull workspace state to a private GitHub repository

All three features share the same mapper infrastructure, ensuring consistency between exported files and synced files.

---

## Architecture

```
┌─────────────┐     extract      ┌──────────────┐     serialize     ┌──────────────┐
│  SQLite DB   │ ──────────────▶ │   Snapshot    │ ──────────────▶  │  Flat Files   │
│  (source of  │                 │  (in-memory)  │                  │  (JSON/CSV)   │
│   truth)     │ ◀────────────── │               │ ◀──────────────  │               │
└─────────────┘     import       └──────────────┘    deserialize    └──────────────┘
                                                                          │
                                                                     git push/pull
                                                                          │
                                                                    ┌─────▼─────┐
                                                                    │  GitHub    │
                                                                    │  Remote    │
                                                                    └───────────┘
```

### Mapper Pipeline

The mapper module (`src/lib/db/mappers/`) is the core of this system:

| Step | Module | Description |
|------|--------|-------------|
| **Extract** | `extract.ts` | Reads all tables from SQLite into a typed `WorklogSnapshot` object |
| **Serialize** | `serialize-json.ts`, `serialize-csv.ts` | Converts a snapshot into file content strings |
| **Deserialize** | `deserialize-json.ts`, `deserialize-csv.ts` | Parses file content back into a snapshot |
| **Import** | `import.ts` | Writes a snapshot into the database with conflict resolution |

---

## Export

### Formats

| Format | Best For |
|--------|----------|
| **JSON** | Full fidelity round-trip. All data types preserved exactly. |
| **CSV** | Opening in spreadsheets, sharing with non-technical stakeholders. |

### Modes

| Mode | Description |
|------|-------------|
| **Single File** | Everything in one `.json` or `.csv` file |
| **Folder** | One file per board, plus metadata files. Better for large workspaces and git-friendly diffs. |

### Folder Structure (JSON)

```
worklog_export/
├── metadata.json        # export version, timestamp
├── workspace.json       # workspace name, schema version, sync mode
├── settings.json        # author, default branch, autosave config
└── boards/
    ├── BRD-abc123.json  # { board: {...}, tickets: [...] }
    ├── BRD-def456.json
    └── ...
```

### Folder Structure (CSV)

```
worklog_export/
├── metadata.json        # always JSON (too small for CSV)
├── workspace.json       # always JSON
├── settings.json        # always JSON
└── boards/
    ├── BRD-abc123.json  # board metadata (name, description, dates)
    ├── BRD-abc123.csv   # tickets as CSV rows
    └── ...
```

### CSV Column Spec

```
id, board_id, title, description, status, priority, ticket_type, position,
due_date, start_date, labels, comments, created_at, updated_at
```

- `labels` → semicolon-separated: `frontend;urgent;v2`
- `comments` → JSON string: `[{"author":"...", "body":"...", "timestamp":"..."}]`

---

## Import

### Conflict Strategies

| Strategy | Behavior |
|----------|----------|
| **Merge** (default) | Upsert by ID. Existing items are updated, new items are inserted, items not in the import are left untouched. |
| **Replace** | Wipes the current database and inserts everything from the import. Clean slate. |

### Import Sources

The import flow auto-detects the source type:

- **Single `.json` file** → parsed as a complete workspace snapshot
- **Single `.csv` file** → parsed as tickets for the currently active board
- **Folder** → read `metadata.json` to determine structure, then parse all files

---

## GitHub Sync

### Concept

GitHub sync turns a private repository into a shared workspace backend. The flow is explicit — the user manually pushes and pulls, or optionally enables auto-sync on save.

The sync directory lives inside the workspace:

```
.worklog/
├── worklog.db           # SQLite — local source of truth
└── sync/                # Git repo with flat JSON files
    ├── .git/
    ├── metadata.json    # { schema_version, sync_version, last_synced_at }
    ├── workspace.json
    ├── settings.json
    └── boards/
        ├── BRD-abc123.json
        └── ...
```

### Authentication

Sync uses a **GitHub Personal Access Token (PAT)** with `repo` scope:

- No SSH keys to manage
- No OAuth flow to implement
- Token stored locally via `tauri-plugin-store` (encrypted per-app storage)
- Used for HTTPS git operations: `https://<token>@github.com/<owner>/<repo>.git`

#### Creating a PAT

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Create a token with **Repository access** → select your sync repo
3. Grant **Contents: Read and write** permission
4. Copy the token into Worklog's Settings → Sync → Access Token field

### Push Flow

```
1. Extract snapshot from SQLite
2. Serialize to flat JSON files
3. Write to .worklog/sync/
4. git add . → git commit → git push
```

### Pull Flow

```
1. git fetch → git merge (fast-forward preferred)
2. Read flat JSON files from .worklog/sync/
3. Deserialize into snapshot
4. Import snapshot into SQLite with 'merge' strategy
```

### Conflict Handling

If both local and remote have diverged:

1. The pull will attempt a fast-forward merge
2. If conflicts exist in the JSON files, the sync engine reports a `conflict` status
3. The user can choose to **force push** (overwrite remote) or **force pull** (overwrite local)
4. A future iteration could add field-level merge resolution

### Sync Configuration

Stored in the `sync_config` database table:

| Field | Type | Description |
|-------|------|-------------|
| `remote_url` | TEXT | GitHub repository HTTPS URL |
| `access_token` | TEXT | GitHub PAT |
| `branch` | TEXT | Branch to sync (default: `main`) |
| `auto_sync` | BOOLEAN | Push automatically on save |
| `last_synced_at` | TEXT | ISO timestamp of last successful sync |

---

## Security

- **Tokens are stored locally** in the Tauri app's encrypted store. They never leave the machine except when authenticating with GitHub.
- **The `.worklog/sync/` directory should be gitignored** from the workspace's own git repo (if any) to avoid nesting repos.
- **The PAT should have minimal scope** — only `Contents: Read and write` on the specific sync repository.
- **No data is sent to any server other than the configured GitHub remote.**

---

## Limitations & Future Work

- **No real-time collaboration** — Sync is explicit push/pull, not live multiplayer.
- **No branch-level merge** — V1 uses a simple overwrite/upsert model. Field-level merge is a future enhancement.
- **Git must be installed** — The sync feature shells out to the system `git` binary. A future version could bundle `libgit2`.
- **Single remote** — V1 supports one remote per workspace. Multi-remote is out of scope.

---

## Usage

### From the Command Palette

| Command | Shortcut | Description |
|---------|----------|-------------|
| Export Data | `Ctrl+Shift+E` | Export workspace to JSON/CSV |
| Import Data | — | Import from JSON/CSV file or folder |
| Sync: Push | — | Push local changes to GitHub |
| Sync: Pull | — | Pull remote changes from GitHub |

### From Settings

Navigate to **Settings → Data Management** for export/import controls with format selection.

Navigate to **Settings → Sync** to configure GitHub remote, token, and sync preferences.
