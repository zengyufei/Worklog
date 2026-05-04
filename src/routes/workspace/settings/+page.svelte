<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        Button,
        TextArea,
        TextInput,
        RadioButtonGroup,
        RadioButton,
        ButtonSet,
        Tabs,
        Tab,
        TabContent,
        Toggle,
        Select,
        SelectItem,
        PasswordInput,
        InlineLoading,
        Tag,
    } from "carbon-components-svelte";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";
    import { getDb } from "$lib/db";
    import {
        exportDatabaseWithOptions,
        type ExportOptions,
    } from "$lib/db/export";
    import { importFromFile } from "$lib/db/mappers";
    import { notifications } from "$lib/hooks/notifications.svelte";
    import type { ExportFormat, ExportMode } from "$lib/db/mappers";
    import { useSyncConfig } from "$lib/sync/sync-config.svelte";
    import { SyncEngine } from "$lib/sync/sync-engine";
    import type { SyncStatus } from "$lib/sync/types";
    import { useAppZoom } from "$lib/hooks/app-zoom.svelte";
    import ZoomControls from "$lib/components/app/layout/workspace/zoom-controls.svelte";
    import {
        Settings,
        View,
        DataBase,
        Cloud,
        Code,
        Search,
        ArrowLeft,
        Renew,
    } from "carbon-icons-svelte";

    type SettingsCategory =
        | "general"
        | "appearance"
        | "data"
        | "sync"
        | "advanced";
    let activeCategory = $state<SettingsCategory>("general");
    let searchQuery = $state("");

    const workspace = useWorkspace();
    const syncConfig = useSyncConfig();
    const appZoom = useAppZoom();

    const workspaceName = $derived(workspace.meta?.name ?? "Workspace");
    const workspacePath = $derived(workspace.path ?? "Not available");
    const workspaceStatus = $derived(workspace.status);
    const schemaVersion = $derived(workspace.meta?.schema_version ?? "Unknown");

    let exportFormat = $state<ExportFormat>("json");
    let exportMode = $state<ExportMode>("single-file");

    // ── Sync state ─────────────────────────────────────────────────────────
    let syncRemoteUrl = $state("");
    let syncAccessToken = $state("");
    let syncBranch = $state("main");
    let syncGitName = $state("");
    let syncGitEmail = $state("");
    let syncAutoSync = $state(false);
    let syncAutoSyncInterval = $state(15);
    let syncLoading = $state(false);
    let syncLoadingMessage = $state("");
    let gitAvailable = $state<boolean | null>(null);

    // Load sync config on mount
    $effect(() => {
        if (workspace.status === "ready" && workspace.path) {
            void loadSyncConfig();
        }
    });

    async function loadSyncConfig() {
        if (!workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            await syncConfig.load(db);
            syncRemoteUrl = syncConfig.config.remote_url;
            syncAccessToken = syncConfig.config.access_token;
            syncBranch = syncConfig.config.branch;
            syncGitName = syncConfig.config.git_name;
            syncGitEmail = syncConfig.config.git_email;
            syncAutoSync = syncConfig.config.auto_sync;
            syncAutoSyncInterval = syncConfig.config.auto_sync_interval;

            // Check git availability
            const engine = new SyncEngine(workspace.path);
            gitAvailable = await engine.isGitAvailable();
        } catch (e) {
            console.error("Failed to load sync config", e);
        }
    }

    async function saveSyncConfig() {
        if (!workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            syncConfig.config = {
                remote_url: syncRemoteUrl,
                access_token: syncAccessToken,
                branch: syncBranch,
                git_name: syncGitName,
                git_email: syncGitEmail,
                auto_sync: syncAutoSync,
                auto_sync_interval: syncAutoSyncInterval,
                last_synced_at: syncConfig.config.last_synced_at,
            };
            await syncConfig.save(db);
            notifications.add({
                kind: "success",
                title: "Sync Settings Saved",
                subtitle: "Your Git sync configuration has been updated.",
                timeout: 3000,
            });
        } catch (error) {
            notifications.add({
                kind: "error",
                title: "Save Failed",
                subtitle: String(error),
                timeout: 5000,
            });
        }
    }

    async function handleSyncPush() {
        if (!workspace.path) return;
        syncLoading = true;
        syncLoadingMessage = "Pushing to remote...";
        syncConfig.setStatus("pushing");
        try {
            const db = await getDb(workspace.path);
            const engine = new SyncEngine(workspace.path);
            await engine.initialize(syncConfig.config);
            const result = await engine.push(db, syncConfig.config);

            if (result.status === "success") {
                syncConfig.updateLastSynced(result.timestamp);
                await syncConfig.save(db);
                notifications.add({
                    kind: "success",
                    title: "Push Successful",
                    subtitle: result.message,
                    timeout: 3000,
                });
            } else {
                notifications.add({
                    kind: "error",
                    title: "Push Failed",
                    subtitle: result.message,
                    timeout: 5000,
                });
            }
            syncConfig.setStatus(
                result.status === "success" ? "idle" : "error",
            );
        } catch (error) {
            notifications.add({
                kind: "error",
                title: "Push Failed",
                subtitle: String(error),
                timeout: 5000,
            });
            syncConfig.setStatus("error");
        } finally {
            syncLoading = false;
            syncLoadingMessage = "";
        }
    }

    async function handleSyncPull() {
        if (!workspace.path) return;
        syncLoading = true;
        syncLoadingMessage = "Pulling from remote...";
        syncConfig.setStatus("pulling");
        try {
            const db = await getDb(workspace.path);
            const engine = new SyncEngine(workspace.path);
            await engine.initialize(syncConfig.config);
            const result = await engine.pull(db, syncConfig.config);

            if (result.status === "success") {
                syncConfig.updateLastSynced(result.timestamp);
                await syncConfig.save(db);
                notifications.add({
                    kind: "success",
                    title: "Pull Successful",
                    subtitle: result.message,
                    timeout: 3000,
                });
                window.location.reload();
            } else if (result.status === "conflict") {
                notifications.add({
                    kind: "warning",
                    title: "Merge Conflict",
                    subtitle: result.message,
                    timeout: 8000,
                });
                syncConfig.setStatus("conflict");
            } else {
                notifications.add({
                    kind: "error",
                    title: "Pull Failed",
                    subtitle: result.message,
                    timeout: 5000,
                });
                syncConfig.setStatus("error");
            }
        } catch (error) {
            notifications.add({
                kind: "error",
                title: "Pull Failed",
                subtitle: String(error),
                timeout: 5000,
            });
            syncConfig.setStatus("error");
        } finally {
            syncLoading = false;
            syncLoadingMessage = "";
        }
    }

    // ── Navigation ─────────────────────────────────────────────────────────
    function goToBoards() {
        void goto("/workspace");
    }

    function refreshWorkspaceState() {
        void workspace.init();
    }

    // ── Export / Import ────────────────────────────────────────────────────
    async function handleExport() {
        if (workspace.status !== "ready" || !workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            const options: ExportOptions = {
                format: exportFormat,
                mode: exportMode,
            };
            const success = await exportDatabaseWithOptions(db, options);
            if (success) {
                notifications.add({
                    kind: "success",
                    title: "Export Successful",
                    subtitle: `Workspace exported as ${exportFormat.toUpperCase()} (${exportMode}).`,
                    timeout: 3000,
                });
            }
        } catch (error) {
            console.error("Failed to export data", error);
            notifications.add({
                kind: "error",
                title: "Export Failed",
                subtitle: String(error),
                timeout: 5000,
            });
        }
    }

    async function handleImport() {
        if (workspace.status !== "ready" || !workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            const result = await importFromFile(db, "merge");
            if (result) {
                notifications.add({
                    kind: "success",
                    title: "Import Successful",
                    subtitle: `Created ${result.boardsCreated} boards, ${result.ticketsCreated} tickets. Updated ${result.ticketsUpdated} tickets.`,
                    timeout: 5000,
                });
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to import data", error);
            notifications.add({
                kind: "error",
                title: "Import Failed",
                subtitle: String(error),
                timeout: 5000,
            });
        }
    }

    // ── Derived ────────────────────────────────────────────────────────────
    const syncConfigured = $derived(
        syncRemoteUrl.length > 0 && syncAccessToken.length > 0,
    );
    const syncStatusLabel = $derived.by(() => {
        const s = syncConfig.status;
        if (s === "not_configured") return "Not configured";
        if (s === "idle") return "Ready";
        if (s === "pushing") return "Pushing…";
        if (s === "pulling") return "Pulling…";
        if (s === "conflict") return "Conflict";
        if (s === "error") return "Error";
        return s;
    });
    const syncStatusColor = $derived.by(
        (): "green" | "red" | "blue" | "warm-gray" | "magenta" => {
            const s = syncConfig.status;
            if (s === "idle") return "green";
            if (s === "pushing" || s === "pulling") return "blue";
            if (s === "error") return "red";
            if (s === "conflict") return "magenta";
            return "warm-gray";
        },
    );

    // @ts-ignore
    const version = __APP_VERSION__;

    const categories = [
        { id: "general", label: "General", icon: Settings },
        { id: "appearance", label: "Appearance", icon: View },
        { id: "data", label: "Data Management", icon: DataBase },
        { id: "sync", label: "Synchronization", icon: Cloud },
        { id: "advanced", label: "Advanced", icon: Code },
    ] as const;

    function matchesSearch(text: string) {
        if (!searchQuery) return true;
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    }
</script>

<div class="settings-layout">
    <!-- Sidebar -->
    <aside class="settings-sidebar">
        <header class="sidebar-header">
            <Button
                kind="ghost"
                iconDescription="Back"
                icon={ArrowLeft}
                onclick={goToBoards}
            />
            <span>Settings</span>
        </header>

        <nav class="sidebar-nav">
            {#each categories as category}
                <button
                    class="nav-item"
                    class:active={activeCategory === category.id}
                    onclick={() => (activeCategory = category.id)}
                >
                    <category.icon size={20} />
                    <span>{category.label}</span>
                </button>
            {/each}
        </nav>

        <footer class="sidebar-footer">
            <div class="app-version">
                v{version}
            </div>
            <Button
                kind="ghost"
                size="small"
                icon={Renew}
                onclick={refreshWorkspaceState}
            >
                Refresh
            </Button>
        </footer>
    </aside>

    <!-- Main Content -->
    <main class="settings-content">
        <header class="content-header">
            <div class="search-container">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Search settings..."
                    bind:value={searchQuery}
                />
            </div>
            <div class="breadcrumbs">
                Settings &gt; {categories.find((c) => c.id === activeCategory)
                    ?.label}
            </div>
        </header>

        <div class="content-body">
            <!-- ── General Category ────────────────────────────────────── -->
            {#if activeCategory === "general"}
                <div class="category-view">
                    {#if matchesSearch("Workspace Information Database schema version Worklog version")}
                        <section class="settings-section">
                            <h2>Workspace Information</h2>
                            <div class="settings-grid">
                                <TextInput
                                    id="workspace-name"
                                    labelText="Workspace name"
                                    value={workspaceName}
                                    readonly
                                />
                                <TextInput
                                    id="workspace-status"
                                    labelText="Workspace status"
                                    value={workspaceStatus}
                                    readonly
                                />
                                <TextInput
                                    id="workspace-schema"
                                    labelText="Database schema version"
                                    value={schemaVersion}
                                    readonly
                                />
                                <TextArea
                                    id="workspace-path"
                                    labelText="Workspace path"
                                    value={workspacePath}
                                    rows={3}
                                    readonly
                                />
                                <TextInput
                                    id="app-version"
                                    labelText="Worklog version"
                                    value={version}
                                    readonly
                                />
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Appearance Category ────────────────────────────────── -->
            {#if activeCategory === "appearance"}
                <div class="category-view">
                    {#if matchesSearch("Application Zoom global scale")}
                        <section class="settings-section">
                            <div class="header-with-tag">
                                <h2>Application Zoom</h2>
                                <Tag type="teal" size="sm">Experimental</Tag>
                            </div>
                            <p class="section-desc">
                                Adjust the global scale of the application
                                interface. You can also use <kbd>Ctrl</kbd> +
                                <kbd>+</kbd> and <kbd>Ctrl</kbd> + <kbd>-</kbd>
                                anywhere.
                            </p>
                            <div class="control-box">
                                <ZoomControls />
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Data Category ──────────────────────────────────────── -->
            {#if activeCategory === "data"}
                <div class="category-view">
                    {#if matchesSearch("Export Import Data Management JSON CSV")}
                        <section class="settings-section">
                            <h2>Export / Import</h2>
                            <p class="section-desc">
                                Export or import your workspace data as JSON or
                                CSV.
                            </p>

                            <div class="data-controls">
                                <div class="data-control-group">
                                    <RadioButtonGroup
                                        legendText="Format"
                                        bind:selected={exportFormat}
                                    >
                                        <RadioButton
                                            labelText="JSON"
                                            value="json"
                                        />
                                        <RadioButton
                                            labelText="CSV"
                                            value="csv"
                                        />
                                    </RadioButtonGroup>
                                </div>

                                <div class="data-control-group">
                                    <RadioButtonGroup
                                        legendText="Mode"
                                        bind:selected={exportMode}
                                    >
                                        <RadioButton
                                            labelText="Single file"
                                            value="single-file"
                                        />
                                        <RadioButton
                                            labelText="Per-board folder"
                                            value="folder"
                                        />
                                    </RadioButtonGroup>
                                </div>
                            </div>

                            <ButtonSet>
                                <Button kind="primary" onclick={handleExport}>
                                    Export
                                </Button>
                                <Button kind="tertiary" onclick={handleImport}>
                                    Import
                                </Button>
                            </ButtonSet>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Sync Category ──────────────────────────────────────── -->
            {#if activeCategory === "sync"}
                <div class="category-view">
                    {#if matchesSearch("Git Synchronization Personal Access Token GitHub Auto-sync")}
                        <section class="settings-section">
                            <div class="header-with-status">
                                <div class="header-with-tag">
                                    <h2>Git Synchronization</h2>
                                    <Tag type="teal" size="sm">Experimental</Tag
                                    >
                                </div>
                                <Tag type={syncStatusColor} size="sm"
                                    >{syncStatusLabel}</Tag
                                >
                            </div>
                            <p class="section-desc">
                                Sync your workspace to a private GitHub
                                repository using a Personal Access Token.
                            </p>

                            {#if gitAvailable === false}
                                <aside class="git-warning" role="alert">
                                    <strong>Git not found.</strong>
                                    <span>
                                        The <code>git</code> command was not found
                                        on your system. Install Git to use this feature.
                                    </span>
                                </aside>
                            {/if}

                            <div class="sync-form">
                                <TextInput
                                    id="sync-remote-url"
                                    labelText="Remote URL"
                                    placeholder="https://github.com/user/repo.git"
                                    bind:value={syncRemoteUrl}
                                    disabled={gitAvailable === false}
                                />

                                <PasswordInput
                                    id="sync-access-token"
                                    labelText="Access Token"
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                    bind:value={syncAccessToken}
                                    disabled={gitAvailable === false}
                                />

                                <div class="settings-grid">
                                    <TextInput
                                        id="sync-branch"
                                        labelText="Branch"
                                        placeholder="main"
                                        bind:value={syncBranch}
                                        disabled={gitAvailable === false}
                                    />

                                    <TextInput
                                        id="sync-git-name"
                                        labelText="Git Name"
                                        placeholder="Worklog User"
                                        bind:value={syncGitName}
                                        disabled={gitAvailable === false}
                                    />

                                    <TextInput
                                        id="sync-git-email"
                                        labelText="Git Email"
                                        placeholder="user@example.com"
                                        bind:value={syncGitEmail}
                                        disabled={gitAvailable === false}
                                    />
                                </div>

                                <div class="sync-options">
                                    <Toggle
                                        id="sync-auto-sync"
                                        labelText="Auto-sync"
                                        labelA="Off"
                                        labelB="On"
                                        bind:toggled={syncAutoSync}
                                        disabled={gitAvailable === false}
                                    />

                                    {#if syncAutoSync}
                                        <Select
                                            id="sync-auto-sync-interval"
                                            labelText="Sync Interval"
                                            bind:selected={syncAutoSyncInterval}
                                            disabled={gitAvailable === false}
                                        >
                                            <SelectItem
                                                value={1}
                                                text="Every 1 minutes"
                                            />
                                            <SelectItem
                                                value={5}
                                                text="Every 5 minutes"
                                            />
                                            <SelectItem
                                                value={15}
                                                text="Every 15 minutes"
                                            />
                                            <SelectItem
                                                value={30}
                                                text="Every 30 minutes"
                                            />
                                            <SelectItem
                                                value={60}
                                                text="Every 1 hour"
                                            />
                                            <SelectItem
                                                value={120}
                                                text="Every 2 hours"
                                            />
                                            <SelectItem
                                                value={360}
                                                text="Every 6 hours"
                                            />
                                        </Select>
                                    {/if}
                                </div>

                                {#if syncConfig.config.last_synced_at}
                                    <TextInput
                                        id="sync-last-synced"
                                        labelText="Last synced"
                                        value={new Date(
                                            syncConfig.config.last_synced_at,
                                        ).toLocaleString()}
                                        readonly
                                    />
                                {/if}
                            </div>

                            <div class="actions-group">
                                <Button
                                    kind="primary"
                                    onclick={saveSyncConfig}
                                    disabled={gitAvailable === false}
                                >
                                    Save Configuration
                                </Button>

                                {#if syncConfigured && gitAvailable !== false}
                                    <div class="manual-actions">
                                        <h3>Manual Actions</h3>
                                        {#if syncLoading}
                                            <InlineLoading
                                                description={syncLoadingMessage}
                                            />
                                        {:else}
                                            <ButtonSet>
                                                <Button
                                                    kind="tertiary"
                                                    onclick={handleSyncPush}
                                                >
                                                    Push
                                                </Button>
                                                <Button
                                                    kind="tertiary"
                                                    onclick={handleSyncPull}
                                                >
                                                    Pull
                                                </Button>
                                            </ButtonSet>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}

            <!-- ── Advanced Category ──────────────────────────────────── -->
            {#if activeCategory === "advanced"}
                <div class="category-view">
                    {#if matchesSearch("Developer Tools Experimental Advanced Diagnostics")}
                        <section class="settings-section">
                            <h2>Developer Tools</h2>
                            <p class="section-desc">
                                Advanced tools for troubleshooting and database
                                diagnostics.
                            </p>
                            <div class="advanced-grid">
                                <Button
                                    kind="ghost"
                                    onclick={refreshWorkspaceState}
                                >
                                    Force State Re-init
                                </Button>
                                <p class="help-text">
                                    Re-scans the workspace directory and reloads
                                    all board metadata.
                                </p>
                            </div>
                        </section>
                    {/if}
                </div>
            {/if}
        </div>
    </main>
</div>

<style>
    .settings-layout {
        height: 100vh;
        display: flex;
        overflow: hidden;
        background: var(--cds-ui-01);
    }

    /* ── Sidebar ───────────────────────────────────────────────────────── */
    .settings-sidebar {
        width: 260px;
        flex-shrink: 0;
        /* background: var(--cds-ui-02); */
        border-right: 1px solid var(--cds-ui-03);
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        height: 48px;
        display: flex;
        align-items: center;
        padding-left: 0.5rem;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .sidebar-nav {
        flex: 1;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 0.75rem;
        background: transparent;
        border: none;
        border-radius: 4px;
        color: var(--cds-text-secondary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.1s ease;
        text-align: left;
    }

    .nav-item:hover {
        background: var(--cds-ui-03);
        color: var(--cds-text-primary);
    }

    .nav-item.active {
        background: var(--cds-interactive-01);
        color: white;
        font-weight: 500;
    }

    .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid var(--cds-ui-03);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .app-version {
        font-size: 0.75rem;
        color: var(--cds-text-helper);
        font-family: var(--cds-code-01-font-family);
    }

    /* ── Main Content ──────────────────────────────────────────────────── */
    .settings-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .content-header {
        padding: 1.5rem 2rem;
        background: var(--cds-ui-01);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .search-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: var(--cds-field-01);
        border: 1px solid var(--cds-ui-03);
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        max-width: 600px;
    }

    .search-container input {
        border: none;
        background: transparent;
        color: var(--cds-text-primary);
        font-size: 0.875rem;
        flex: 1;
        outline: none;
    }

    .breadcrumbs {
        font-size: 0.75rem;
        color: var(--cds-text-helper);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .content-body {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
    }

    .category-view {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 3rem;
    }

    .settings-section {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .settings-section h2 {
        font-size: 1.25rem;
        font-weight: 400;
        margin: 0;
    }

    .settings-section h3 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
    }

    .section-desc {
        font-size: 0.875rem;
        color: var(--cds-text-secondary);
        margin: -0.75rem 0 0.5rem 0;
        max-width: 600px;
    }

    .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .control-box {
        background: var(--cds-ui-02);
        padding: 1.5rem;
        border-radius: 4px;
        border: 1px solid var(--cds-ui-03);
    }

    .header-with-tag,
    .header-with-status {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .header-with-status {
        justify-content: space-between;
    }

    .data-controls {
        display: flex;
        gap: 3rem;
        padding: 1rem;
        background: var(--cds-ui-02);
        border-radius: 4px;
    }

    .sync-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .sync-options {
        display: flex;
        align-items: flex-end;
        gap: 2rem;
        padding: 1rem;
        background: var(--cds-ui-02);
        border-radius: 4px;
    }

    .actions-group {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin-top: 1rem;
    }

    .manual-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid var(--cds-ui-03);
        background: var(--cds-ui-02);
        border-radius: 0 0 4px 4px;
    }

    .git-warning {
        padding: 1rem;
        background: #fff8e1;
        border-left: 4px solid #ffc107;
        color: #856404;
        font-size: 0.875rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .advanced-grid {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1.5rem;
        background: var(--cds-ui-02);
        border-radius: 4px;
    }

    .help-text {
        font-size: 0.8125rem;
        color: var(--cds-text-helper);
        margin: 0;
    }

    /* Custom scrollbar */
    .content-body::-webkit-scrollbar {
        width: 10px;
    }
    .content-body::-webkit-scrollbar-track {
        background: transparent;
    }
    .content-body::-webkit-scrollbar-thumb {
        background: var(--cds-ui-03);
        border: 2px solid transparent;
        background-clip: padding-box;
        border-radius: 10px;
    }
    .content-body::-webkit-scrollbar-thumb:hover {
        background: var(--cds-ui-04);
    }
</style>
