# Worklog : Local-first Desktop Project Manager

<img width="1922" height="818" alt="ChatGPT Image Apr 27, 2026, 04_45_44 PM" src="https://github.com/user-attachments/assets/aee54de1-58de-4bca-a3f4-246ec4dd4713" />

***

Worklog is a local-first desktop project manager for small development teams.
It is designed for fast, keyboard-driven planning with a Kanban workflow, transparent local data, and no cloud dependency for core usage.

<img width="1920" height="1043" alt="Screenshot From 2026-05-03 02-08-32" src="https://github.com/user-attachments/assets/d594e8a5-478c-481d-8c85-77a51831994c" />
<img width="1920" height="1043" alt="Screenshot From 2026-05-03 02-08-38" src="https://github.com/user-attachments/assets/5f490ae9-9a70-4d48-a857-2a931747d9d3" />
<img width="1920" height="1043" alt="Screenshot From 2026-05-03 02-08-43" src="https://github.com/user-attachments/assets/ef247d55-a48c-40dd-93d8-81e4d2f6accb" />
<img width="1920" height="1043" alt="Screenshot From 2026-05-03 02-08-48" src="https://github.com/user-attachments/assets/b440515b-fc2e-47fc-a829-ee895010b133" />
<img width="1920" height="1043" alt="Screenshot From 2026-05-03 02-08-52" src="https://github.com/user-attachments/assets/c24f6428-204c-49e6-962e-f37fee2ed120" />
<img width="1920" height="1043" alt="Screenshot From 2026-05-03 02-09-02" src="https://github.com/user-attachments/assets/86a387f0-abce-4e89-bbac-0fb3e36212b5" />
<img width="1920" height="1043" alt="Screenshot From 2026-05-03 02-09-34" src="https://github.com/user-attachments/assets/dff3f483-0a7d-4d7e-ac1f-41ce2eb95403" />


## What Worklog Is

Worklog is built around a simple hierarchy:

Workspace -> Board -> Ticket

That structure keeps the app focused on one job: help a small team organize work without turning the product into a heavyweight project suite. The app is meant to feel instant, predictable, and easy to operate from the keyboard.

The concept is intentionally local-first:

- data stays on the machine that owns the workspace
- the app works offline
- the storage model remains transparent and portable
- every meaningful action is explicit

## Product Direction

Worklog is not trying to be a cloud PM platform. The long-term idea is a desktop tool that stays small, fast, and honest about where data lives, while still covering the everyday planning flow a team actually needs.

The product direction centers on:

- board-based planning that stays easy to scan
- quick navigation and command-driven workflows
- lightweight collaboration through transparent local or project data
- Git-friendly, portable project state instead of vendor lock-in
- a clean path from personal planning to small-team coordination

## Current Shape

The app already supports:

- workspace, board, and ticket management
- a Kanban board with Todo, In Progress, and Done columns
- ticket details with inline editing and comments
- board and ticket context actions
- command palette and keyboard shortcuts
- workspace persistence with restore on startup

## Future Plans

The roadmap is intentionally gradual. The goal is to make Worklog more useful without breaking the core principles above.

Planned areas of growth include:

- stronger board organization tools, such as filters, saved views, and better prioritization
- richer ticket metadata, including more flexible fields for planning and handoff
- better search and navigation across workspaces, boards, and tickets
- more explicit project history and portable workspace snapshots
- improved backup, export, and restore workflows
- deeper Git-native workflows for teams that want work state to stay visible and auditable
- more keyboard shortcuts and faster bulk actions for power users
- continued UI polish, accessibility work, and responsiveness improvements

## How It Works

Worklog uses a layered local architecture:

UI -> hooks -> repository layer -> SQLite

That keeps the app predictable and makes the persistence layer the source of truth for local data. Route and layout boundaries own workspace and board scope, while hooks handle the async work and repository calls.

## Stack

- Desktop shell: Tauri v2
- Frontend: SvelteKit + TypeScript
- Runtime and package manager: Bun
- Persistence: SQLite via the Tauri SQL plugin
- Styling: semantic HTML, app shell styles, and compact desktop-oriented UI patterns

## Project Structure

- [src](src): SvelteKit frontend app
- [src/lib/components/app](src/lib/components/app): App feature components
- [src/lib/hooks](src/lib/hooks): Runes-based state and domain hooks
- [src/lib/db](src/lib/db): Repository and local database layer
- [src-tauri](src-tauri): Rust and Tauri desktop runtime
- [docs](docs): Architecture and dataflow notes
- [.github/workflows](.github/workflows): CI and release pipelines

## Local Data

Worklog stores app data inside the selected workspace path:

- `.worklog/worklog.db`

No cloud backend is required for normal operation.

## Installation

### Debian / Ubuntu

Worklog can be installed through the APT repository using a dedicated keyring file and the `signed-by` option, which is the recommended modern APT setup.[1][2]

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo mkdir -p /usr/share/keyrings
curl -fsSL https://regisx001.github.io/worklog-apt/pubkey.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/worklog-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/worklog-archive-keyring.gpg] https://regisx001.github.io/worklog-apt any main" \
  | sudo tee /etc/apt/sources.list.d/worklog.list

sudo apt update
sudo apt install worklog
```

If the repository is already configured, future updates can be installed with the normal system update flow using `sudo apt update && sudo apt upgrade`.[2][3]

### Arch Linux / AUR

Worklog is also available from the Arch User Repository, where AUR packages are typically installed through helpers such as `yay`.[4][5]

```bash
yay -S worklog-bin
```

If `yay` is not installed yet, install it first and then use the command above to install `worklog-bin` from the AUR.[6][5]

## Getting Started

Install dependencies:

```bash
bun install --frozen-lockfile
```

Run the frontend during development:

```bash
bun run dev
```

Run the desktop app during development:

```bash
bun run tauri dev
```

## Development Commands

Type and Svelte checks:

```bash
bun run check
```

Frontend build:

```bash
bun run build
```

Desktop build:

```bash
bun run tauri:build
```

## Keyboard Shortcuts

- Ctrl/Cmd + K: open command palette
- Ctrl/Cmd + N: create ticket
- Ctrl/Cmd + B: open create board dialog
- Ctrl/Cmd + S: manual sync action
- M on a focused ticket: move it to the next status
- Escape: close the ticket detail panel

## Prerequisites

- Bun
- Rust stable toolchain
- Tauri system dependencies for your OS

Linux dependencies used in CI:

```bash
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    pkg-config \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf
```

## CI And Releases

The CI workflow lives in [ci.yml](.github/workflows/ci.yml). It runs on pushes and pull requests when core source or build files change.

The publish workflow lives in [release.yml](.github/workflows/release.yml). Releases are tag-driven and trigger when a tag matching `app-v*` is pushed.

### Release Steps

1. Update version in [package.json](package.json), [src-tauri/Cargo.toml](src-tauri/Cargo.toml), and [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json).
2. Commit and push the changes.
3. Create and push a release tag:

```bash
git tag -a app-v0.1.0 -m "Release app-v0.1.0"
git push origin app-v0.1.0
```

4. GitHub Actions builds and uploads artifacts for macOS, Linux, and Windows.
5. The workflow also produces AUR-ready artifacts.

## Recommended IDE Setup

- VS Code
- Svelte extension
- Tauri extension
- rust-analyzer extension

## License

MIT
