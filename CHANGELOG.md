## [app-v1.3.0] - 2026-05-11

### 🚀 Features

- **Database Lazy Loading**: Implemented infinite scroll and deferred rendering for Kanban boards to support large datasets with paginated SQL queries.
- **Linux Stability**: Hardcoded internal environment overrides (`WEBKIT_DISABLE_DMABUF_RENDERER`, `GDK_BACKEND=x11`) to prevent EGL crashes and grey-screens on Wayland.
- **Native Installer**: Refactored Linux distribution to a "native extraction" model via a new shell installer that handles high-res icons and desktop integration automatically.

### 🚜 Refactor

- **Manual Updater**: Deprecated automatic update installation in favor of a robust version discovery and manual download model for better platform reliability.
- **Settings Cleanup**: Removed legacy updater UI components and unused assets.

### ⚙️ Miscellaneous Tasks

- Bump project version to 1.3.0 across all package manifests and build configs.

## [app-v1.2.20] - 2026-05-11

### ⚙️ Miscellaneous Tasks

- Bump version to 1.2.20 and hardcode AppImage download URL in install script
## [app-v1.2.19] - 2026-05-11

### 🐛 Bug Fixes

- Disable hardware acceleration and force X11 backend in AppImage to prevent rendering crashes
## [app-v1.2.17] - 2026-05-10

### 🚀 Features

- Implement ticket pagination support and add performance testing data seeders

### ⚙️ Miscellaneous Tasks

- Bump project version to 1.2.17
## [app-v1.2.16] - 2026-05-09

### 🐛 Bug Fixes

- Improve Linux compatibility and update handling by patching WebKitGTK crashes, adding explicit installation failure states, and providing manual download paths.

### ⚙️ Miscellaneous Tasks

- Bump project version to 1.2.16
## [app-v1.2.15] - 2026-05-09

### ⚙️ Miscellaneous Tasks

- Bump application version to 1.2.15
## [app-v1.2.14] - 2026-05-09

### 🚀 Features

- Refactor updater into a reactive state-driven API with improved UI feedback and update process control

### ⚙️ Miscellaneous Tasks

- Bump application version to 1.2.14
## [app-v1.2.12] - 2026-05-07

### 🚀 Features

- Bump version to 1.2.12 across package.json, Cargo.toml, and tauri.conf.json
## [app-v1.2.11] - 2026-05-07

### 🚀 Features

- Bump version to 1.2.11 and update dependencies with new process plugin integration
## [app-v1.2.10] - 2026-05-07

### 🚀 Features

- Bump version to 1.2.10 across package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
## [app-v1.2.9] - 2026-05-07

### 🚀 Features

- Implement updater functionality and configuration for Tauri v2
- Bump version to 1.2.9 across package.json, Cargo.toml, Cargo.lock, and tauri.conf.json

### 🐛 Bug Fixes

- Improve formatting of update instructions in settings page
## [app-v1.2.7] - 2026-05-07
