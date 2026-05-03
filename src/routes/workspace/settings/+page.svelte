<script lang="ts">
    import { goto } from "$app/navigation";
    import { Button, TextArea, TextInput } from "carbon-components-svelte";
    // import { Theme } from "carbon-components-svelte";
    import { useWorkspace } from "$lib/hooks/workspace.svelte";
    import { getDb } from "$lib/db";
    import { exportDatabaseToFile } from "$lib/db/export";
    import { notifications } from "$lib/hooks/notifications.svelte";
    import { useAppZoom } from "$lib/hooks/app-zoom.svelte";
    import ZoomControls from "$lib/components/app/layout/workspace/zoom-controls.svelte";

    const workspace = useWorkspace();
    const appZoom = useAppZoom();

    const workspaceName = $derived(workspace.meta?.name ?? "Workspace");
    const workspacePath = $derived(workspace.path ?? "Not available");
    const workspaceStatus = $derived(workspace.status);

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
            const success = await exportDatabaseToFile(db);
            if (success) {
                notifications.add({
                    kind: "success",
                    title: "Export Successful",
                    subtitle: "Your workspace data has been saved.",
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
        <Button kind="primary" onclick={handleExport}>
            Export Data
        </Button>
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

        <!-- <Theme
            persistKey="_carbon-theme"
            persist
            render="toggle"
            toggle={{
                themes: ["g10", "g100"],
                labelA: "Enable dark mode",
                labelB: "Enable dark mode",
                hideLabel: true,
                size: "sm",
            }}
        /> -->
    </section>

    <!-- Application Zoom -->
    <section class="workspace-settings-section">
        <h2>Application Zoom</h2>
        <p style="margin-bottom: var(--cds-spacing-05); color: var(--cds-text-secondary);">
            Adjust the global scale of the application interface.
            You can also use <kbd>Ctrl</kbd> + <kbd>+</kbd> and <kbd>Ctrl</kbd> + <kbd>-</kbd> anywhere.
        </p>
        <div style="max-width: 16rem;">
            <ZoomControls />
        </div>
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

    .workspace-settings-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--cds-spacing-03, 0.5rem);
    }

    .workspace-settings-actions :global(.bx--btn) {
        margin: 0;
    }
</style>
