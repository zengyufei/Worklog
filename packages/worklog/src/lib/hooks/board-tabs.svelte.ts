import type { TabType } from '$lib/components/app/types';
import { getDb, BoardRepo } from '$lib/db';

/**
 * Reactive hook for per-board tab configuration.
 *
 * Reads tabs_config from the DB and provides methods to toggle tabs on/off.
 * Kanban is always enabled and cannot be disabled.
 *
 * @param getWorkspacePath - Getter for the current workspace path
 * @param getBoardId - Getter for the current board ID
 */
export function getBoardTabs(
    getWorkspacePath: () => string | null,
    getBoardId: () => string | null,
) {
    let _enabledTabs = $state<TabType[]>(['kanban']);
    let _loading = $state(false);
    let _lastLoadedBoardId = $state<string | null>(null);

    // ── Load tab config from DB when board changes ────────────────────────
    async function load() {
        const workspacePath = getWorkspacePath();
        const boardId = getBoardId();

        if (!workspacePath || !boardId) {
            _enabledTabs = ['kanban'];
            _lastLoadedBoardId = null;
            return;
        }

        // Skip if same board already loaded
        if (boardId === _lastLoadedBoardId) return;

        _loading = true;
        try {
            const db = await getDb(workspacePath);
            _enabledTabs = await BoardRepo.getBoardTabs(db, boardId);
            _lastLoadedBoardId = boardId;
        } catch (e) {
            console.error('[board-tabs] Failed to load tab config:', e);
            _enabledTabs = ['kanban'];
        } finally {
            _loading = false;
        }
    }

    /**
     * Reload tab config even if the same board ID — useful after direct DB changes.
     */
    async function reload() {
        _lastLoadedBoardId = null;
        await load();
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    function isTabEnabled(tab: TabType): boolean {
        return _enabledTabs.includes(tab);
    }

    /**
     * Toggle a single tab on/off. Kanban cannot be disabled.
     */
    async function toggleTab(tab: TabType) {
        if (tab === 'kanban') return; // Kanban is always enabled

        const workspacePath = getWorkspacePath();
        const boardId = getBoardId();
        if (!workspacePath || !boardId) return;

        let newTabs: TabType[];
        if (_enabledTabs.includes(tab)) {
            newTabs = _enabledTabs.filter((t) => t !== tab);
        } else {
            newTabs = [..._enabledTabs, tab];
        }

        // Ensure kanban is first
        newTabs = ['kanban', ...newTabs.filter((t) => t !== 'kanban')];

        try {
            const db = await getDb(workspacePath);
            const updated = await BoardRepo.updateBoardTabs(db, boardId, newTabs);
            if (updated) {
                _enabledTabs = BoardRepo.parseBoardTabs(updated.tabs_config);
            }
        } catch (e) {
            console.error('[board-tabs] Failed to toggle tab:', e);
        }
    }

    /**
     * Bulk-set the enabled tabs. Kanban is always preserved.
     */
    async function setTabs(tabs: TabType[]) {
        const workspacePath = getWorkspacePath();
        const boardId = getBoardId();
        if (!workspacePath || !boardId) return;

        // Ensure kanban is first
        const safeTabs = tabs.includes('kanban')
            ? ['kanban', ...tabs.filter((t) => t !== 'kanban')]
            : ['kanban', ...tabs];

        try {
            const db = await getDb(workspacePath);
            const updated = await BoardRepo.updateBoardTabs(db, boardId, safeTabs as TabType[]);
            if (updated) {
                _enabledTabs = BoardRepo.parseBoardTabs(updated.tabs_config);
            }
        } catch (e) {
            console.error('[board-tabs] Failed to set tabs:', e);
        }
    }

    return {
        get enabledTabs() { return _enabledTabs; },
        get loading() { return _loading; },
        load,
        reload,
        isTabEnabled,
        toggleTab,
        setTabs,
    };
}
