## [app-v1.2.7] - 2026-05-07

### 🚀 Features

- Add cross-platform download dropdown menu to Hero component
- Update documentation design, add download route, and implement auto-scroll navigation reset.
- Implement prioritized category-based sorting for command palette actions

### 🚜 Refactor

- Migrate documentation to MDsvex and add interactive Table of Contents component
- Overhaul landing page showcase section and add FAQ page with screenshot assets
- Update CI/CD workflows to support monorepo structure by adjusting file paths and working directories

### ⚙️ Miscellaneous Tasks

- Add conventional-changelog-cli dependency and create CHANGELOG.md
- Update CHANGELOG.md header and aur subproject commit reference
- Update CHANGELOG.md to reflect recent changes and version updates
## [app-v1.2.6] - 2026-05-06

### 🚀 Features

- Add manual sync control UI to workspace sidebar
- Configure base path support for GitHub Pages deployment
- Implement documentation section and update landing page with project-focused messaging

### 🐛 Bug Fixes

- Update build steps to reference site subdirectory in deployment workflow

### ⚙️ Miscellaneous Tasks

- Update node_modules dependencies and Lucide icon library assets
- Update site favicon to use icon.png asset
- Bump version to 1.2.6 in package.json, Cargo.toml, and tauri.conf.json
## [app-v1.2.5] - 2026-05-05

### 🚀 Features

- Add discard unsaved changes confirmation modals and prevent Enter key submission in forms
## [app-v1.2.4] - 2026-05-04

### 🚀 Features

- Add global scrollbar styling and implement board-specific state restoration for active boards and tabs
- Implement dynamic ticket types management with database schema support and settings UI

### ⚙️ Miscellaneous Tasks

- Bump application version to 1.2.4
## [app-v1.2.3] - 2026-05-04

### 🚀 Features

- Redesign workspace settings page with categorized navigation and search functionality

### ⚙️ Miscellaneous Tasks

- Remove unused file and associated references
- Optimize release workflow with sccache, bun caching, and explicit frontend builds
- Bump project version to 1.2.3
## [app-v1.2.2] - 2026-05-04

### 🚀 Features

- Implement reusable ticket sorting hook and integrate sorting controls into gantt, kanban, and table views
- Add start_date field, update icons to sort variants, and implement dirty-state confirmation for ticket modal
- Implement TagManager component and integrate it into ticket-add-edit-modal replacing MultiSelect

### 🚜 Refactor

- Remove deprecated service integration files
- Implement app-wide zoom using CSS variables and reactive effects to replace manual scaling and state management

### ⚙️ Miscellaneous Tasks

- Remove unused files and associated references
- Bump project version to 1.2.2
## [app-v1.2.1] - 2026-05-03

### 🚀 Features

- Add sync status indicator to toolbar and display experimental tags in settings

### 📚 Documentation

- Enhance README with v1.2 release section, organized screenshot grids, and updated feature list

### ⚙️ Miscellaneous Tasks

- Bump project version to 1.2.1
## [app-v1.2.0] - 2026-05-03

### 🚀 Features

- Add Flatpak build configuration and build system dependencies for Worklog
- Add Flatpak build support for Worklog including manifest and dependency management
- Add board editing functionality and UI to workspace sidebar
- Add global application zoom functionality with persistence and keyboard shortcuts
- Implement extensible database export/import system supporting JSON and CSV formats with single-file or folder-based output.
- Add Git sync configuration and management UI to workspace settings
- Add configurable git name and email to sync settings
- Add automated sync scheduler with configurable intervals to workspace settings

### ⚙️ Miscellaneous Tasks

- Remove obsolete Flatpak build configuration and dependency source files
- Update tauri capabilities with explicit shell permissions and refine git-client initialization
- Bump application version to 1.2.0
## [app-v1.1.0] - 2026-05-02

### 🚀 Features

- Update theme names to g10 and expose app version in UI and settings
- Implement grouped command palette with category and icon support and dynamic action registration
- Add context menu options to update ticket status directly from the board
- Add start_date support to tickets, enabling interactive drag-to-resize functionality on the Gantt chart for both start and due dates.
- Expand ticket types and update database schema to version 8

### 🚜 Refactor

- Update overdue logic to exclude completed tickets across table, gantt, and kanban views

### ⚙️ Miscellaneous Tasks

- Implement workspace data export functionality with keyboard shortcut and notification support
- Bump project version to 1.1.0
## [app-v1.0.0] - 2026-04-30

### 🚀 Features

- Refactor kanban board to support new gantt view and ticket management components
- Replace legacy kanban gantt with a custom-built, modular Gantt chart implementation

### 🚜 Refactor

- Rewrite table view components and state management with Svelte 5 runes

### 📚 Documentation

- Update README with installation instructions for Debian/Ubuntu and Arch Linux; add APT package update guide

### ⚙️ Miscellaneous Tasks

- Comment out the AUR package build job in the release workflow
- Merge master into release/alpha, resolving submodule conflict
- Bump project version to 1.0.0
## [app-v0.6.0] - 2026-04-28

### 🐛 Bug Fixes

- Ensure proper handling of aur directory in .gitignore and update subproject commit

### ⚙️ Miscellaneous Tasks

- Update version to 0.6.0 across project files
## [app-v0.5.0] - 2026-04-28

### 🚀 Features

- Add Gantt view component and integrate into workspace tabs

### 🚜 Refactor

- Improve code formatting and readability in Gantt view component
- Update font imports and adjust workspace board height styling

### ⚙️ Miscellaneous Tasks

- Update version to 0.5.0 and add IBM Plex Sans font dependency
## [app-v0.4.0] - 2026-04-28

### 🚀 Features

- Replace Select components with Dropdown for priority and type selection in ticket form
- Add context menus with common actions to workspace boards and kanban tickets
- Add confirmation modals for board and ticket deletion workflows
- Implement persistent ticket reordering with new position column and migration
- Add table view option for workspace boards and fix dndzone synchronization and command palette accessibility

### 📚 Documentation

- Update README.md for clarity and structure; enhance descriptions of features and future plans

### 🎨 Styling

- Add padding to drag handle in ticket card for improved usability

### ⚙️ Miscellaneous Tasks

- Update version to 0.4.0 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
## [app-v0.3.0] - 2026-04-27

### 🚀 Features

- Implement command palette with keyboard shortcuts and event handling

### 🚜 Refactor

- Streamline board selection handling in workspace sidebar

### ⚙️ Miscellaneous Tasks

- Update version to 0.3.0 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json; update various icon files
## [app-v0.2.0] - 2026-04-27

### ⚙️ Miscellaneous Tasks

- Update version to 0.2.0 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
## [list] - 2026-04-27

### 🚀 Features

- Implement Kanban board functionality with ticket management
- Enhance TicketCard and Sidebar context menus with additional actions and icons
- Improve UI consistency and add timestamp formatting in ticket details
- Update AppToolbar and Sheet components for improved layout and styling
- Update keyboard shortcuts for creating tickets and clean up ToolbarActions component
- Bump version to 0.1.1 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
- Update CSS variables for improved theming and adjust toolbar height styles
- Update version to 0.1.2 and enhance release workflow for AUR artifacts
- Update version to 0.2.0 and enhance AUR release workflow
- Update version to 0.2.1 across package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
- Update version to 0.2.2 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
- Update version to 0.2.3 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
- Add sidebar navigation components and dashboard layout
- Update font sizes in TicketDetail components for improved readability
- Enhance ticket label handling across components for improved user experience
- Improve spacing and formatting in TicketDetail sections for better readability
- Enhance file system permissions and improve database connection handling
- Implement alert dialog component with delete confirmation functionality
- Add delete confirmation dialog for ticket deletion
- Implement board renaming functionality in sidebar and repository
- Update @lucide/svelte version and implement tag input component with chip functionality
- Add Markdown component and integrate it into TicketDescriptionSection for enhanced text formatting
- Update styles for various components to enhance UI consistency and improve accessibility
- Enhance CommandPalette UI with improved styling and functionality, add no-scrollbar utility
- Implement settings management with UI for user preferences and autosave configuration
- Update version to 0.3.0 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
- Integrate mode-watcher for theme toggling and update dependencies
- Enhance KanbanColumn with status-based styling and improve Sidebar tooltip accessibility
- Update TicketCard styling for improved visual consistency and accessibility
- Update layout.css with new color variables and improved shadow settings
- Add ticket priority management with filtering and sorting options
- Implement app toolbar with window control functionality and enhance layout styles
- Enhance window control functionality with toggle-maximize feature and improve toolbar layout
- Integrate drag-and-drop functionality using @thisux/sveltednd and enhance kanban board interactivity
- Implement Kanban board components with drag-and-drop functionality and enhance task management
- Add Kanban sidebar component and integrate board selection functionality
- Add initial PlantUML diagrams for Worklog system architecture, runtime flow, persistence flow, workspace state machine, and domain data model
- Enhance Kanban board functionality with open, rename, and delete actions for boards
- Implement board details editor with description and update functionality in Kanban components
- Migrate tickets schema to version 4 with new fields and constraints
- Update Kanban layout with improved sizing and padding for better usability
- Adjust Kanban layout height and AppToolbar position for improved responsiveness
- Implement AppDrawer component for enhanced ticket panel layout
- Implement new workspace layout with Kanban board integration and improved navigation
- Enhance AppToolbar with window control icons and remove unused styles
- Enhance window control icons with improved styling and focus effects
- Add FolderKanbanIcon to KanbanSidebar and improve layout styling
- Implement new board creation functionality in KanbanSidebar and layout
- Update version numbers in configuration files to 0.1.0
- Refactor KanbanSidebar to use BoardSelectorCard component and remove unused functions
- Add TicketPanel component for managing ticket details in Kanban board
- Start the configuration for the migration to carbon design system by IBM.
- Update layout structure by adding app-shell ID and styling, remove AppToolbar from workspace page
- Refactor layout structure by removing AppToolbar and integrating Content component; add workspace sidebar component
- Enhance layout structure by integrating WorkspaceSidebar and updating Content styling for improved responsiveness
- Update workspace layout by integrating TileGroup for service pricing tiers and restructuring sidebar component
- Enhance workspace navigation and loading states; update layout and error handling
- Enhance workspace sidebar with board creation modal and loading states; update layout for improved user experience
- Improve button styling and layout in workspace components for better readability and user experience
- Add settings functionality to workspace components; implement settings page and integrate with toolbar and sidebar
- Add board selection functionality; implement board navigation and create board page
- Update theme selection in settings page; import Theme component and add dropdown for theme options
- Add theme toggle functionality to app toolbar and enhance settings page with action buttons
- Integrate svelte-dnd-action for drag-and-drop functionality in kanban board; add kanban components and update routing
- Implement Kanban board with drag-and-drop functionality; add ticket management features and integrate components
- Add search functionality with toolbar and input for ticket management
- Update navigation to workspace and integrate Kanban board component in workspace page
- Refactor Kanban components to use updated ticket model and improve drag-and-drop functionality
- Add refresh button to app toolbar for reloading the application
- Add backlog status and ticket types to Kanban board with UI enhancements

### 🐛 Bug Fixes

- Rename AUR package artifact to worklog-aur-package
- Improve user and group management in AUR build process
- Remove Tauri binary build steps due to frequent failures
- Improve formatting of Kanban components for better readability
- Update pico font size for improved readability
- Improve formatting and readability of KanbanSidebar and +page components
- Update Kanban board status to include 'backlog' and improve task hints
- Update padding and margin for improved layout of Kanban column header
- Refactor KanbanCard component layout and remove unused priority dot
- Remove background gradients from Kanban components and AppToolbar for a cleaner design
- Update event binding syntax for search input and drag-and-drop events in Kanban and sortable list components
- Format dndzone usage for improved readability in Kanban column component
- Increase width of Kanban column for better ticket visibility
- Remove empty state styling from drop zone in Kanban column component

### 🚜 Refactor

- Enhance layout by reintroducing AppToolbar and updating toolbar state management
- Remove unused components and schemas from the project
- Format boardPendingRename function for improved readability
- Remove unused dependencies and optimize layout styles
- Clean up code formatting in KanbanBoard and page components for improved readability
- Remove unused Theme component import and related code from settings page

### 📚 Documentation

- Update README with project overview, features, and development instructions

### ⚙️ Miscellaneous Tasks

- Update version to 0.2.4 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
- Update version to 0.2.5 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
- Update version to 0.2.6 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
- Update version to 0.2.7 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
- Bump version to 0.3.1 in package.json, Cargo.toml, Cargo.lock, and tauri.conf.json
## [app-v0.1.0] - 2026-03-19

### 🚀 Features

- Add initial design for Worklog desktop application with Kanban board and ticket management
- Add comprehensive design document for CADENCE, detailing UI philosophy, color palette, typography, and interaction principles
- Add tauri-plugin-sql for SQLite support
- Implement database schema and migration functions for SQLite support
- Restructure database schema and implement CRUD operations for boards and tickets
- Update ticket structure to use labels instead of label and refactor related components
- Implement toolbar state management with Svelte store and refactor related components
- Add filesystem plugin and ensure .worklog directory exists for database management
- Add SvelteKit Svelte 5 agent, instructions, and skill documentation
- Add sidebar components and skeleton loaders
- Enhance Kanban board functionality with context menus and ticket management
- Add GitHub Actions workflow for publishing Tauri app releases
- Add release instructions for tagging and publishing
- Implement IsMobile class for responsive design handling

### 🐛 Bug Fixes

- Update Tauri build command and ensure newline at end of extensions.json
- Update branch name from main to master in CI workflow
- Format noop function for consistency
- Simplify button text and improve formatting in debug page
- Update Rust cache step and downgrade tauri-action version

### 🚜 Refactor

- Update project documentation for clarity and structure
- Update package dependencies and improve drawer content component

### ⚙️ Miscellaneous Tasks

- Update CI workflow to include paths for push and pull_request events
