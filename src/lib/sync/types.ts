// ── Sync Types ─────────────────────────────────────────────────────────────

export interface SyncConfig {
    /** GitHub repository HTTPS URL (e.g. https://github.com/user/repo.git) */
    remote_url: string;
    /** GitHub Personal Access Token with repo scope */
    access_token: string;
    /** Branch to sync against (default: 'main') */
    branch: string;
    /** Whether to automatically push after every save */
    auto_sync: boolean;
    /** ISO timestamp of last successful sync, or null */
    last_synced_at: string | null;
}

export type SyncStatus =
    | 'idle'
    | 'pushing'
    | 'pulling'
    | 'error'
    | 'conflict'
    | 'not_configured';

export interface SyncResult {
    status: 'success' | 'conflict' | 'error';
    message: string;
    timestamp: string;
}

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
    remote_url: '',
    access_token: '',
    branch: 'main',
    auto_sync: false,
    last_synced_at: null,
};
