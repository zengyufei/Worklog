import { useWorkspace } from "$lib/hooks/workspace.svelte";
import { useSyncConfig } from "$lib/sync/sync-config.svelte";
import { SyncEngine } from "$lib/sync/sync-engine";
import { getDb } from "$lib/db";
import { notifications } from "$lib/hooks/notifications.svelte";

let schedulerInterval: number | null = null;
let isSyncing = false;

/**
 * Initializes the background synchronization loop.
 * It checks every minute if an auto-sync is due based on the configured interval.
 */
export function initSyncScheduler() {
    const workspace = useWorkspace();
    const syncConfig = useSyncConfig();

    if (schedulerInterval !== null) {
        clearInterval(schedulerInterval);
    }

    // Check every minute
    schedulerInterval = window.setInterval(async () => {
        if (workspace.status !== "ready" || !workspace.path) return;
        if (!syncConfig.config.auto_sync || !syncConfig.config.remote_url) return;
        if (isSyncing) return;

        // Check if interval has elapsed
        const lastSyncedStr = syncConfig.config.last_synced_at;
        const intervalMs = syncConfig.config.auto_sync_interval * 60 * 1000;
        
        let shouldSync = false;
        if (!lastSyncedStr) {
            shouldSync = true;
        } else {
            const lastSyncedAt = new Date(lastSyncedStr).getTime();
            if (Date.now() - lastSyncedAt >= intervalMs) {
                shouldSync = true;
            }
        }

        if (shouldSync) {
            isSyncing = true;
            try {
                const db = await getDb(workspace.path);
                const engine = new SyncEngine(workspace.path);
                const isGitAvailable = await engine.isGitAvailable();
                
                if (isGitAvailable) {
                    await engine.initialize(syncConfig.config);
                    // Fast-forward pull before push to avoid conflicts when possible
                    await engine.pull(db, syncConfig.config);
                    const result = await engine.push(db, syncConfig.config);
                    
                    if (result.status === "success") {
                        syncConfig.updateLastSynced(result.timestamp);
                        await syncConfig.save(db);
                    } else if (result.status === "error") {
                        notifications.add({
                            kind: "error",
                            title: "Auto-Sync Failed",
                            subtitle: result.message,
                            timeout: 5000,
                        });
                    }
                }
            } catch (error) {
                console.error("Auto-sync error:", error);
            } finally {
                isSyncing = false;
            }
        }
    }, 60 * 1000); // 1 minute
}

export function destroySyncScheduler() {
    if (schedulerInterval !== null) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}
