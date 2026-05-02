import type { WorklogSnapshot } from './types';

/**
 * Serializes the full snapshot into a single JSON string.
 */
export function snapshotToSingleJson(snapshot: WorklogSnapshot): string {
    return JSON.stringify(snapshot, null, 2);
}

/**
 * Serializes the snapshot into multiple JSON files for folder-mode export.
 * Returns a Map of relative filename → file content string.
 */
export function snapshotToFolderJsonFiles(snapshot: WorklogSnapshot): Map<string, string> {
    const files = new Map<string, string>();

    // metadata.json — export envelope
    files.set('metadata.json', JSON.stringify({
        export_version: snapshot.export_version,
        exported_at: snapshot.exported_at,
    }, null, 2));

    // workspace.json
    if (snapshot.workspace_meta) {
        files.set('workspace.json', JSON.stringify(snapshot.workspace_meta, null, 2));
    }

    // settings.json
    if (snapshot.app_settings) {
        files.set('settings.json', JSON.stringify(snapshot.app_settings, null, 2));
    }

    // boards/<id>.json — each board with its tickets
    for (const boardSnap of snapshot.boards) {
        const filename = `boards/${boardSnap.board.id}.json`;
        files.set(filename, JSON.stringify({
            board: boardSnap.board,
            tickets: boardSnap.tickets,
        }, null, 2));
    }

    return files;
}
