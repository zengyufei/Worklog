import type Database from '@tauri-apps/plugin-sql';
import { save } from '@tauri-apps/plugin-dialog';
import { documentDir } from '@tauri-apps/api/path';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { WorkspaceRepo, BoardRepo, SettingsRepo, TicketRepo } from './index';
import type { Board, Ticket } from '$lib/components/app/types';

export interface DatabaseExport {
    workspace_meta: any;
    app_settings: any;
    boards: Board[];
    tickets: Ticket[];
    exported_at: string;
    version: number;
}

/**
 * Maps all data from the database into a single JSON object.
 */
export async function mapDatabaseToJson(db: Database): Promise<DatabaseExport> {
    const workspaceMeta = await WorkspaceRepo.getWorkspaceMeta(db);
    const appSettings = await SettingsRepo.getSettings(db);
    const boards = await BoardRepo.listBoards(db);

    // listTickets in TicketRepo requires a board_id, so we'll fetch them per board
    // or we could write a custom query here to get all tickets at once.
    // Let's use a custom query to get all tickets for the export to be efficient.
    const rawTickets = await db.select<any[]>(`SELECT * FROM tickets ORDER BY created_at ASC`);

    // We need to deserialize the labels and comments since SQLite stores them as JSON strings
    const tickets = rawTickets.map(row => ({
        ...row,
        priority: row.priority ?? 'p2',
        ticket_type: row.ticket_type ?? 'feature',
        due_date: row.due_date ?? null,
        start_date: row.start_date ?? null,
        labels: typeof row.labels === 'string' ? JSON.parse(row.labels) : row.labels,
        comments: typeof row.comments === 'string' ? JSON.parse(row.comments) : row.comments,
    }));

    return {
        workspace_meta: workspaceMeta,
        app_settings: appSettings,
        boards,
        tickets,
        exported_at: new Date().toISOString(),
        version: 1 // version of the export format itself
    };
}

/**
 * Maps the database to a JSON string and prompts the user to save it to a file.
 */
export async function exportDatabaseToFile(db: Database): Promise<boolean> {
    try {
        const documentsPath = await documentDir();
        const data = await mapDatabaseToJson(db);
        const jsonString = JSON.stringify(data, null, 2);

        // Prompt the user for where to save the file
        const filePath = await save({
            title: 'Export Database',
            defaultPath: `${documentsPath}/.worklog/worklog_export_${new Date().toISOString().split('T')[0]}.json`,
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });

        if (filePath) {
            await writeTextFile(filePath, jsonString);
            return true;
        }

        return false; // User cancelled
    } catch (error) {
        console.error("Failed to export database:", error);
        throw error;
    }
}
