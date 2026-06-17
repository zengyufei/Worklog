import type { CommandAction } from "$lib/components/app/types";

// ── Fuzzy Match ────────────────────────────────────────────────────────────
// Lightweight fuzzy search with relevance scoring and match indices for
// character-level highlighting in the palette UI.

export interface FuzzyMatchResult {
    score: number;
    indices: number[];
}

/**
 * Fuzzy-match `query` against `text`. Returns a score + array of matched
 * character indices (for highlighting) or null if no acceptable match.
 *
 * Scoring tiers:
 *   1000 – exact match
 *    800 – query is a prefix of text
 *    600 – query is a substring (not at start)
 *    500 – all chars matched consecutively (fuzzy) but with possible gaps before
 *    400 – fuzzy with small gaps
 *    300+ – fuzzy with larger gaps
 *    null – could not match or score below threshold
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatchResult | null {
    const q = query.toLowerCase().trim();
    const t = text.toLowerCase().trim();

    if (!q) return { score: 1000, indices: [] };
    if (q.length > t.length) return null;

    // 1. Exact match
    if (t === q) return { score: 1000, indices: Array.from({ length: q.length }, (_, i) => i) };

    // 2. Prefix match (query is at the start)
    if (t.startsWith(q)) {
        return {
            score: 800,
            indices: Array.from({ length: q.length }, (_, i) => i),
        };
    }

    // 3. Substring (anywhere)
    const subIdx = t.indexOf(q);
    if (subIdx !== -1) {
        return {
            score: subIdx === 0 ? 800 : 600,
            indices: Array.from({ length: q.length }, (_, i) => subIdx + i),
        };
    }

    // 4. Fuzzy — scan left-to-right matching each query char with possible gaps
    const indices: number[] = [];
    let textIdx = 0;
    let gaps = 0;
    let consecutive = true;

    for (let qi = 0; qi < q.length; qi++) {
        const qc = q[qi];
        // Advance to next matching char in text
        while (textIdx < t.length && t[textIdx] !== qc) {
            textIdx++;
        }
        if (textIdx >= t.length) return null; // Couldn't match all chars

        if (indices.length > 0 && textIdx !== indices[indices.length - 1] + 1) {
            consecutive = false;
            gaps += textIdx - indices[indices.length - 1] - 1;
        }

        indices.push(textIdx);
        textIdx++;
    }

    // Reject very poor fuzzy matches (lots of gaps for short queries)
    if (gaps > q.length * 3) return null;

    const score = consecutive ? 500 : Math.max(300, 500 - gaps * 10);
    return { score, indices };
}

/**
 * Wrap matched characters in `<mark>` tags for highlighting.
 */
export function highlightMatches(text: string, indices: number[]): string {
    if (!indices || indices.length === 0) return escapeHtml(text);
    const chars: string[] = [];
    let lastIdx = 0;

    // Sort indices and deduplicate
    const sorted = [...new Set(indices)].sort((a, b) => a - b);

    for (const idx of sorted) {
        if (idx >= text.length) continue;
        // Push text before this match
        if (idx > lastIdx) {
            chars.push(escapeHtml(text.slice(lastIdx, idx)));
        }
        chars.push(`<mark class="palette-match">${escapeHtml(text[idx])}</mark>`);
        lastIdx = idx + 1;
    }
    // Push remaining text
    if (lastIdx < text.length) {
        chars.push(escapeHtml(text.slice(lastIdx)));
    }
    return chars.join('');
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── Palette Mode ───────────────────────────────────────────────────────────
export type PaletteMode = "commands" | "shortcuts" | "boards" | "navigate";

// ── Command Palette State ──────────────────────────────────────────────────
// Module-level runes state shared across the app.

let _open = $state(false);
let _query = $state("");
let _baseActions = $state<CommandAction[]>([]);
let _dynamicActions = $state<CommandAction[]>([]);
let _selectedIndex = $state(0);
let _mode = $state<PaletteMode>("commands");

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
        // Detect mode prefix from first character
        const first = q[0];
        if (first === "?") _mode = "shortcuts";
        else if (first === "#") _mode = "boards";
        else if (first === "/") _mode = "navigate";
        else _mode = "commands";
    }

    function setSelectedIndex(idx: number) {
        _selectedIndex = idx;
    }

    function setMode(mode: PaletteMode) {
        _mode = mode;
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
        get mode() { return _mode; },
        open,
        close,
        toggle,
        setQuery,
        setSelectedIndex,
        setMode,
        registerActions,
        appendActions,
        removeActionsByPrefix,
        runAction,
    };
}
