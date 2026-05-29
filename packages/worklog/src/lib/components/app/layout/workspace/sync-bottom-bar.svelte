<script lang="ts">
    import {
        WatsonHealthLaunchStudy_1,
        WatsonHealthLaunchStudy_2,
        Checkmark,
        ErrorFilled,
        Cloud,
    } from "carbon-icons-svelte";
    import { Button } from "carbon-components-svelte";

    import { syncState } from "$lib/sync/sync-scheduler.svelte";
    import { useSyncConfig } from "$lib/sync/sync-config.svelte";

    import { useWorkspace } from "$lib/hooks/workspace.svelte";
    import { SyncEngine } from "$lib/sync/sync-engine";
    import { getDb } from "$lib/db";

    import { notifications } from "$lib/hooks/notifications.svelte";
    import * as m from "$lib/paraglide/messages.js";

    const syncConfig = useSyncConfig();
    const workspace = useWorkspace();

    let manualSyncing = $state(false);
    let lastResult = $state<{
        status: "success" | "error" | "conflict";
        message: string;
    } | null>(null);

    const isSyncEnabled = $derived(
        !!syncConfig.config.remote_url && !!syncConfig.config.access_token,
    );
    const isWorking = $derived(syncState.isSyncing || manualSyncing);

    async function handlePull() {
        if (isWorking || !workspace.path) return;
        manualSyncing = true;
        lastResult = null;

        try {
            const db = await getDb(workspace.path);
            const engine = new SyncEngine(workspace.path);
            await engine.initialize(syncConfig.config);
            const result = await engine.pull(db, syncConfig.config);

            lastResult = result;
            if (result.status === "success") {
                syncConfig.updateLastSynced(result.timestamp);
                await syncConfig.save(db);
                notifications.add({
                    kind: "success",
                    title: m.sync_pull_success(),
                    subtitle: result.message,
                });
            } else {
                notifications.add({
                    kind: result.status === "conflict" ? "warning" : "error",
                    title:
                        result.status === "conflict"
                            ? m.sync_conflict()
                            : m.sync_pull_failed(),
                    subtitle: result.message,
                });
            }
        } catch (e) {
            notifications.add({
                kind: "error",
                title: m.sync_error(),
                subtitle: String(e),
            });
        } finally {
            manualSyncing = false;
        }
    }

    async function handlePush() {
        if (isWorking || !workspace.path) return;
        manualSyncing = true;
        lastResult = null;

        try {
            const db = await getDb(workspace.path);
            const engine = new SyncEngine(workspace.path);
            await engine.initialize(syncConfig.config);
            const result = await engine.push(db, syncConfig.config);

            lastResult = result;
            if (result.status === "success") {
                syncConfig.updateLastSynced(result.timestamp);
                await syncConfig.save(db);
                notifications.add({
                    kind: "success",
                    title: m.sync_push_success(),
                    subtitle: result.message,
                });
            } else {
                notifications.add({
                    kind: "error",
                    title: m.sync_push_failed(),
                    subtitle: result.message,
                });
            }
        } catch (e) {
            notifications.add({
                kind: "error",
                title: m.sync_error(),
                subtitle: String(e),
            });
        } finally {
            manualSyncing = false;
        }
    }

    function formatTimeRemaining(ms: number) {
        if (ms <= 0) return m.sync_time_due_now();
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return m.sync_time_seconds({ s: seconds });
        const minutes = Math.floor(seconds / 60);
        return m.sync_time_mins_secs({ m: minutes, s: seconds % 60 });
    }

    function formatLastSynced(dateStr: string | null) {
        if (!dateStr) return m.sync_last_synced_never();
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="sync-bar" class:is-syncing={isWorking}>
    {#if !isSyncEnabled}
        <div class="sync-info">
            <div class="status-icon">
                <Cloud size={16} class="cloud-icon disabled" />
            </div>
            <div class="status-text">
                <span class="label">{m.sync_not_configured()}</span>
                <span class="subtext">{m.sync_setup_settings()}</span>
            </div>
        </div>
    {:else}
        <div class="sync-info">
            <div class="status-icon">
                {#if isWorking}
                    <div class="spinner"></div>
                {:else if lastResult?.status === "error"}
                    <ErrorFilled size={16} class="error-icon" />
                {:else}
                    <Cloud size={16} class="cloud-icon" />
                {/if}
            </div>
            <div class="status-text">
                {#if isWorking}
                    <span class="label">{m.sync_syncing()}</span>
                {:else}
                    <span class="label"
                        >{m.sync_last_sync({
                            time: formatLastSynced(syncConfig.config.last_synced_at)
                        })}</span
                    >
                    {#if syncConfig.config.auto_sync && syncState.timeRemainingMs > 0}
                        <span class="subtext"
                            >{m.sync_next_in({
                                time: formatTimeRemaining(syncState.timeRemainingMs)
                            })}</span
                        >
                    {/if}
                {/if}
            </div>
        </div>

        <div class="sync-actions">
            <Button
                kind="ghost"
                size="small"
                icon={WatsonHealthLaunchStudy_1}
                iconDescription={m.sync_action_pull()}
                tooltipPosition="top"
                tooltipAlignment="end"
                disabled={isWorking}
                on:click={handlePull}
            />
            <Button
                kind="ghost"
                size="small"
                icon={WatsonHealthLaunchStudy_2}
                iconDescription={m.sync_action_push()}
                tooltipPosition="top"
                tooltipAlignment="end"
                disabled={isWorking}
                on:click={handlePush}
            />
        </div>
    {/if}
</div>

<style>
    .sync-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: var(--cds-ui-01);
        border-top: 1px solid var(--cds-ui-03);
        font-family: var(--cds-label-01-font-family);
        transition: background 0.2s ease;
    }

    .sync-bar.is-syncing {
        background: color-mix(
            in srgb,
            var(--cds-interactive-01) 5%,
            var(--cds-ui-01)
        );
    }

    .sync-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        overflow: hidden;
    }

    .status-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        color: var(--cds-text-02);
    }

    :global(.cloud-icon) {
        color: var(--cds-interactive-01);
    }

    :global(.cloud-icon.disabled) {
        color: var(--cds-text-03);
        opacity: 0.5;
    }

    .status-text {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
        min-width: 0;
    }

    .label {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--cds-text-01);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .subtext {
        font-size: 0.625rem;
        color: var(--cds-text-03);
    }

    .sync-actions {
        display: flex;
        gap: 0.25rem;
    }

    :global(.sync-actions .bx--btn--ghost) {
        color: var(--cds-text-02) !important;
        padding: 4px !important;
        min-height: 28px !important;
        width: 28px !important;
    }

    :global(.sync-actions .bx--btn--ghost:hover) {
        color: var(--cds-interactive-01) !important;
        background: var(--cds-ui-03) !important;
    }

    .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid var(--cds-interactive-01);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
