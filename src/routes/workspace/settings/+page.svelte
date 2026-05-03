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
</script>

<main class="workspace-settings">
    <header class="workspace-settings-header">
        <h1>Settings</h1>
        <p>Workspace-level preferences and diagnostics.</p>
    </header>

    <section class="workspace-settings-actions" aria-label="Settings actions">
        <Button kind="secondary" onclick={goToBoards}>Back to workspace</Button>
        <Button kind="ghost" onclick={refreshWorkspaceState}>
            Refresh workspace state
        </Button>
    </section>

    <Tabs>
        <Tab label="General" />
        <Tab label="Data" />
        <Tab label="Git Sync" />
        <Tab label="Zoom" />

        <svelte:fragment slot="content">
            <!-- ── General Tab ────────────────────────────────────────── -->
            <TabContent>
                <section
                    class="tab-section"
                    aria-labelledby="workspace-info-title"
                >
                    <h2 id="workspace-info-title">Workspace</h2>

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
                </section>
            </TabContent>

            <!-- ── Data Tab ───────────────────────────────────────────── -->
            <TabContent>
                <section
                    class="tab-section"
                    aria-labelledby="data-management-title"
                >
                    <h2 id="data-management-title">Export / Import</h2>
                    <p class="section-desc">
                        Export or import your workspace data as JSON or CSV.
                    </p>

                    <div class="data-controls">
                        <div class="data-control-group">
                            <RadioButtonGroup
                                legendText="Format"
                                bind:selected={exportFormat}
                            >
                                <RadioButton labelText="JSON" value="json" />
                                <RadioButton labelText="CSV" value="csv" />
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
            </TabContent>

            <!-- ── Git Sync Tab ───────────────────────────────────────── -->
            <TabContent>
                <section class="tab-section" aria-labelledby="git-sync-title">
                    <div class="section-header-row">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <h2 id="git-sync-title">Git Synchronization</h2>
                            <Tag type="teal" size="sm">Experimental</Tag>
                        </div>
                        <Tag type={syncStatusColor} size="sm"
                            >{syncStatusLabel}</Tag
                        >
                    </div>
                    <p class="section-desc">
                        Sync your workspace to a private GitHub repository using
                        a Personal Access Token.
                    </p>

                    {#if gitAvailable === false}
                        <aside class="git-warning" role="alert">
                            <strong>Git not found.</strong>
                            <span>
                                The <code>git</code> command was not found on your
                                system. Install Git to use this feature.
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
                                <SelectItem value={1} text="Every 1 minutes" />
                                <SelectItem value={5} text="Every 5 minutes" />
                                <SelectItem
                                    value={15}
                                    text="Every 15 minutes"
                                />
                                <SelectItem
                                    value={30}
                                    text="Every 30 minutes"
                                />
                                <SelectItem value={60} text="Every 1 hour" />
                                <SelectItem value={120} text="Every 2 hours" />
                                <SelectItem value={360} text="Every 6 hours" />
                            </Select>
                        {/if}

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

                    <ButtonSet>
                        <Button
                            kind="primary"
                            onclick={saveSyncConfig}
                            disabled={gitAvailable === false}
                        >
                            Save Configuration
                        </Button>
                    </ButtonSet>

                    {#if syncConfigured && gitAvailable !== false}
                        <div class="sync-actions">
                            <h3>Actions</h3>
                            {#if syncLoading}
                                <InlineLoading
                                    description={syncLoadingMessage}
                                />
                            {:else}
                                <ButtonSet>
                                    <Button
                                        kind="primary"
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
                </section>
            </TabContent>

            <!-- ── Zoom Tab ───────────────────────────────────────────── -->
            <TabContent>
                <section class="tab-section" aria-labelledby="zoom-title">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <h2 id="zoom-title" style="margin: 0;">Application Zoom</h2>
                        <Tag type="teal" size="sm">Experimental</Tag>
                    </div>
                    <p class="section-desc">
                        Adjust the global scale of the application interface.
                        You can also use <kbd>Ctrl</kbd> + <kbd>+</kbd> and <kbd>Ctrl</kbd> + <kbd>-</kbd> anywhere.
                    </p>
                    <div style="max-width: 16rem;">
                        <ZoomControls />
                    </div>
                </section>
            </TabContent>
        </svelte:fragment>
    </Tabs>
</main>

<style>
    .workspace-settings {
        min-height: 100%;
        padding: var(--cds-spacing-05, 1rem);
        display: grid;
        gap: var(--cds-spacing-05, 1rem);
        align-content: start;
        max-width: 52rem;
    }

    .workspace-settings-header {
        display: grid;
        gap: var(--cds-spacing-02, 0.25rem);
    }

    .workspace-settings-header h1,
    .workspace-settings-header p {
        margin: 0;
    }

    .workspace-settings-header p {
        font-size: 0.875rem;
        opacity: 0.8;
    }

    .workspace-settings-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cds-spacing-03, 0.5rem);
    }

    .workspace-settings-actions :global(.bx--btn) {
        margin: 0;
    }

    /* Tab content sections */
    .tab-section {
        display: grid;
        gap: var(--cds-spacing-04, 0.75rem);
        padding: var(--cds-spacing-05, 1rem) 0;
    }

    .tab-section h2 {
        margin: 0;
        font-size: 1rem;
    }

    .tab-section h3 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .section-desc {
        margin: 0;
        font-size: 0.8125rem;
        opacity: 0.7;
    }

    .section-header-row {
        display: flex;
        align-items: center;
        gap: var(--cds-spacing-03, 0.5rem);
    }

    /* Data export controls */
    .data-controls {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cds-spacing-05, 1rem);
    }

    .data-control-group {
        flex: 1;
        min-width: 10rem;
    }

    /* Sync form */
    .sync-form {
        display: grid;
        gap: var(--cds-spacing-04, 0.75rem);
    }

    .sync-actions {
        display: grid;
        gap: var(--cds-spacing-04, 0.75rem);
        margin-top: var(--cds-spacing-04, 0.75rem);
        padding-top: var(--cds-spacing-04, 0.75rem);
        border-top: 1px solid
            color-mix(
                in srgb,
                var(--color-border-primary, #525252) 30%,
                transparent
            );
    }

    .git-warning {
        padding: var(--cds-spacing-04, 0.75rem);
        display: grid;
        gap: var(--cds-spacing-02, 0.25rem);
        border: 1px solid
            color-mix(in srgb, var(--cds-support-03, #f1c21b) 40%, transparent);
        border-radius: 0.5rem;
        background: color-mix(
            in srgb,
            var(--cds-support-03, #f1c21b) 10%,
            transparent
        );
        font-size: 0.8125rem;
    }

    .git-warning code {
        font-family: var(--cds-code-01-font-family, "IBM Plex Mono", monospace);
        font-size: 0.8125rem;
        background: color-mix(
            in srgb,
            var(--cds-ui-03, #e0e0e0) 40%,
            transparent
        );
        padding: 0.1em 0.3em;
        border-radius: 2px;
    }
</style>
