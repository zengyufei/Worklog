/**
 * Legacy export module — delegates to the new mappers infrastructure.
 * Kept for backward compatibility with existing callers.
 */
import type Database from '@tauri-apps/plugin-sql';
import { exportToFile, type ExportOptions } from './mappers';

export type { ExportOptions };

/**
 * Exports the full database to a single JSON file.
 * This is the default export behavior used by the command palette and settings page.
 */
export async function exportDatabaseToFile(db: Database): Promise<boolean> {
    return exportToFile(db, { format: 'json', mode: 'single-file' });
}

/**
 * Exports the database with custom format and mode options.
 */
export async function exportDatabaseWithOptions(db: Database, options: ExportOptions): Promise<boolean> {
    return exportToFile(db, options);
}
