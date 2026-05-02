<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        Button,
        TextArea,
        TextInput,
        RadioButtonGroup,
        RadioButton,
        ButtonSet,
    } from "carbon-components-svelte";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";
    import { getDb } from "$lib/db";
    import { exportDatabaseWithOptions, type ExportOptions } from "$lib/db/export";
    import { importFromFile } from "$lib/db/mappers";
    import { notifications } from "$lib/hooks/notifications.svelte";
    import type { ExportFormat, ExportMode } from "$lib/db/mappers";

    const workspace = useWorkspace();

    const workspaceName = $derived(workspace.meta?.name ?? "Workspace");
    const workspacePath = $derived(workspace.path ?? "Not available");
    const workspaceStatus = $derived(workspace.status);

    let exportFormat = $state<ExportFormat>("json");
    let exportMode = $state<ExportMode>("single-file");

    function goToBoards() {
        void goto("/workspace");
    }

    function refreshWorkspaceState() {
        void workspace.init();
    }

    async function handleExport() {
        if (workspace.status !== "ready" || !workspace.path) return;
        try {
            const db = await getDb(workspace.path);
            const options: ExportOptions = { format: exportFormat, mode: exportMode };
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
                // Reload the workspace to reflect imported data
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

    <section
        class="workspace-settings-section"
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

    <section
        class="workspace-settings-section"
        aria-labelledby="data-management-title"
    >
        <h2 id="data-management-title">Data Management</h2>
        <p class="section-desc">Export or import your workspace data.</p>

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
                    <RadioButton labelText="Single file" value="single-file" />
                    <RadioButton labelText="Per-board folder" value="folder" />
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

    .workspace-settings-section {
        display: grid;
        gap: var(--cds-spacing-04, 0.75rem);
        margin: 2rem 0;
        padding: var(--cds-spacing-05, 1rem);
        border-radius: 0.5rem;
        border: 1px solid
            color-mix(
                in srgb,
                var(--color-border-primary, #525252) 45%,
                transparent
            );
    }

    .workspace-settings-section h2 {
        margin: 0;
        font-size: 1rem;
    }

    .section-desc {
        margin: 0;
        font-size: 0.8125rem;
        opacity: 0.7;
    }

    .data-controls {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cds-spacing-05, 1rem);
    }

    .data-control-group {
        flex: 1;
        min-width: 10rem;
    }

    .workspace-settings-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cds-spacing-03, 0.5rem);
    }

    .workspace-settings-actions :global(.bx--btn) {
        margin: 0;
    }
</style>
