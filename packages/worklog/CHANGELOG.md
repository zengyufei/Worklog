## [unreleased]

### 🚀 Features

- Add calendar view component with date-based ticket visualization and management
- Enhance calendar grid with dynamic row count and improved ticket display
- Update month view to display ticket chips with overflow count instead of dots
- Implement global calendar view with ticket management and display
- Add workspace overview component with metrics and status breakdown
- Bump version to 1.3.6 across package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
## [app-v1.3.5] - 2026-05-21

### 🚀 Features

- Implement markdown formatting toolbar and keyboard shortcuts in ticket edit modal

### 🚜 Refactor

- Update TagManager UI for density and redesign ticket modal attributes into a compact strip
- Replace Carbon Tabs with custom animated tab switcher and add board description header
- Move global search and sort controls to the workspace page shell
- Remove redundant table-toolbar component in favor of unified controls bar

### 📚 Documentation

- Update changelog with version history and release notes through v1.3.4

### 🎨 Styling

- Update layout styles for improved responsiveness and spacing

### ⚙️ Miscellaneous Tasks

- Update changelogs to reflect v1.3.4 release and consolidate historical version history
- Bump project version to 1.3.5
## [app-v1.3.4] - 2026-05-19

### 🚀 Features

- Include archived_at timestamp when initializing new imported records
- Add markdown preview support for ticket descriptions with a new viewer component
- Add ticket preview functionality and comment handling in Gantt board
- Add collapsible description to ticket preview and refine typography and details layout

### 🚜 Refactor

- Remove conditional rendering for Kanban modal components and update project version in changelog
- Enable text selection in ticket sheet and refine context menu suppression rules

### 🎨 Styling

- Increase ticket preview sheet width to 640px

### ⚙️ Miscellaneous Tasks

- Bump project version to 1.3.4
## [app-v1.3.3] - 2026-05-16

### 🚀 Features

- Implement ticket preview sheet for kanban board cards
- Hide scrollbar in kanban column drop zone across all browsers
- Enhance board-not-found state with updated UI components and styling
- Implement board archiving functionality including database schema update and management UI
- Initialize CHANGELOG.md with historical version release notes
- Add interactive comment section to ticket preview sheet with support for posting new comments

### 🐛 Bug Fixes

- Derive preview ticket from ID to ensure synchronization with live store data

### 📚 Documentation

- Update changelog with version 1.3.3 release notes and new comment feature summary

### ⚙️ Miscellaneous Tasks

- Bump project version to 1.3.3
## [app-v1.3.2] - 2026-05-15

### 🐛 Bug Fixes

- Prevent false discard popup for unsaved changes in create board modal

### ⚙️ Miscellaneous Tasks

- Bump version to 1.3.2 in package.json, Cargo.toml, and tauri.conf.json
## [app-v1.3.1] - 2026-05-12

### 🚀 Features

- Implement centralized loading state and error handling for ticket data in board pages

### ⚙️ Miscellaneous Tasks

- Bump version to 1.3.1
## [app-v1.3.0] - 2026-05-11

### 🚜 Refactor

- Deprecate automatic update installation in favor of manual downloads

### ⚙️ Miscellaneous Tasks

- Bump version to 1.3.0 and update changelog
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
