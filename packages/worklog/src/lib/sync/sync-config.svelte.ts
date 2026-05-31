import type Database from '@tauri-apps/plugin-sql';
import type { SyncConfig, SyncStatus } from './types';
import { DEFAULT_SYNC_CONFIG } from './types';

// ── Module-level reactive state ────────────────────────────────────────────

let _config = $state<SyncConfig>({ ...DEFAULT_SYNC_CONFIG });
let _status = $state<SyncStatus>('not_configured');

/**
 * Reactive hook for sync configuration.
 * Config is persisted in the sync_config database table.
 */
export function getSyncConfig() {
    async function load(db: Database): Promise<void> {
        try {
            const rows = await db.select<any[]>(
                `SELECT remote_url, access_token, branch, git_name, git_email, auto_sync, auto_sync_interval, last_synced_at
                 FROM sync_config WHERE id = 1`
            );

            if (rows.length > 0) {
                const row = rows[0];
                _config = {
                    remote_url: row.remote_url || '',
                    access_token: row.access_token || '',
                    branch: row.branch || 'main',
                    git_name: row.git_name || '',
                    git_email: row.git_email || '',
                    auto_sync: Boolean(row.auto_sync),
                    auto_sync_interval: row.auto_sync_interval || 15,
                    last_synced_at: row.last_synced_at || null,
                };
                _status = _config.remote_url ? 'idle' : 'not_configured';
            } else {
                _config = { ...DEFAULT_SYNC_CONFIG };
                _status = 'not_configured';
            }
        } catch {
            // Table might not exist yet (pre-migration)
            _config = { ...DEFAULT_SYNC_CONFIG };
            _status = 'not_configured';
        }
    }

    async function save(db: Database): Promise<void> {
        const now = new Date().toISOString();
        await db.execute(
            `INSERT INTO sync_config (id, remote_url, access_token, branch, git_name, git_email, auto_sync, auto_sync_interval, last_synced_at, updated_at)
             VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
                remote_url = excluded.remote_url,
                access_token = excluded.access_token,
                branch = excluded.branch,
                git_name = excluded.git_name,
                git_email = excluded.git_email,
                auto_sync = excluded.auto_sync,
                auto_sync_interval = excluded.auto_sync_interval,
                last_synced_at = excluded.last_synced_at,
                updated_at = excluded.updated_at`,
            [
                _config.remote_url,
                _config.access_token,
                _config.branch,
                _config.git_name,
                _config.git_email,
                _config.auto_sync ? 1 : 0,
                _config.auto_sync_interval,
                _config.last_synced_at,
                now,
            ]
        );
    }

    function updateLastSynced(timestamp: string) {
        _config.last_synced_at = timestamp;
    }

    function setStatus(status: SyncStatus) {
        _status = status;
    }

    return {
        get config() { return _config; },
        set config(value: SyncConfig) { _config = value; },
        get status() { return _status; },
        load,
        save,
        updateLastSynced,
        setStatus,
    };
}
