import type { CommandAction } from "$lib/components/app/types";

// ── Command Palette State ──────────────────────────────────────────────────
// Module-level runes state shared across the app.

let _open = $state(false);
let _query = $state("");
let _baseActions = $state<CommandAction[]>([]);
let _dynamicActions = $state<CommandAction[]>([]);
let _selectedIndex = $state(0);

export function getCommandPalette() {

    function open() {
        _open = true;
        _query = "";
        _selectedIndex = 0;
    }

    function close() {
        _open = false;
        _query = "";
        _selectedIndex = 0;
    }

    function toggle() {
        if (_open) {
            close();
        } else {
            open();
        }
    }

    function setQuery(q: string) {
        _query = q;
        _selectedIndex = 0;
    }

    function setSelectedIndex(idx: number) {
        _selectedIndex = idx;
    }

    function registerActions(actions: CommandAction[]) {
        _baseActions = actions;
    }

    function appendActions(actions: CommandAction[]) {
        // Remove any existing actions with the same IDs first, then add new ones
        const newIds = new Set(actions.map(a => a.id));
        _dynamicActions = [
            ..._dynamicActions.filter(a => !newIds.has(a.id)),
            ...actions,
        ];
    }

    function removeActionsByPrefix(prefix: string) {
        _dynamicActions = _dynamicActions.filter(a => !a.id.startsWith(prefix));
    }

    function runAction(action: CommandAction) {
        close();
        action.run();
    }

    return {
        get isOpen() { return _open; },
        get query() { return _query; },
        get actions() { return [..._baseActions, ..._dynamicActions]; },
        get selectedIndex() { return _selectedIndex; },
        open,
        close,
        toggle,
        setQuery,
        setSelectedIndex,
        registerActions,
        appendActions,
        removeActionsByPrefix,
        runAction,
    };
}
