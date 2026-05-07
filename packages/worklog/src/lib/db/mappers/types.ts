import type { Board, Ticket, WorkspaceMeta, AppSettings } from '$lib/components/app/types';

// ── Export / Import Types ──────────────────────────────────────────────────

export type ExportFormat = 'json' | 'csv';
export type ExportMode = 'single-file' | 'folder';

export interface ExportOptions {
    format: ExportFormat;
    mode: ExportMode;
}

export interface ImportSource {
    type: 'single-file' | 'folder';
    format: ExportFormat;
    path: string;
}

export type ImportStrategy = 'merge' | 'replace';

// ── Snapshot Types ─────────────────────────────────────────────────────────

/**
 * A complete in-memory representation of a workspace.
 * Used as the intermediate format between DB ↔ flat files.
 */
export interface WorklogSnapshot {
    export_version: number;
    exported_at: string;
    workspace_meta: WorkspaceMeta | null;
    app_settings: AppSettings | null;
    boards: BoardSnapshot[];
}

export interface BoardSnapshot {
    board: Board;
    tickets: Ticket[];
}

// ── Import Result ──────────────────────────────────────────────────────────

export interface ImportResult {
    boardsCreated: number;
    boardsUpdated: number;
    ticketsCreated: number;
    ticketsUpdated: number;
    ticketsSkipped: number;
}

/** Current export format version */
export const EXPORT_VERSION = 1;
