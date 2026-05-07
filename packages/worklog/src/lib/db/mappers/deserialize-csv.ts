import type { Ticket, TicketStatus, TicketPriority, TicketType } from '$lib/components/app/types';

/**
 * Parses a CSV line respecting quoted fields.
 * Handles commas inside quoted values and escaped double quotes ("").
 */
function parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                // Check for escaped quote ("")
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // skip next quote
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
    }

    values.push(current); // push last value
    return values;
}

/**
 * Parses a full CSV string into an array of Tickets.
 * The first row must be the header row matching the expected columns.
 * @param csvContent The raw CSV string
 * @param boardId The board_id to assign if the CSV doesn't contain one
 */
export function csvToTickets(csvContent: string, boardId?: string): Ticket[] {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');

    if (lines.length < 2) return []; // Need at least header + 1 data row

    const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const tickets: Ticket[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const row: Record<string, string> = {};

        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] ?? '';
        }

        // Parse labels from semicolon-separated string
        let labels: string[] = [];
        if (row.labels) {
            labels = row.labels.split(';').map(l => l.trim()).filter(Boolean);
        }

        // Parse comments from JSON string
        let comments: any[] = [];
        if (row.comments) {
            try {
                comments = JSON.parse(row.comments);
            } catch {
                comments = [];
            }
        }

        const ticket: Ticket = {
            id: row.id || '',
            board_id: row.board_id || boardId || '',
            title: row.title || '',
            description: row.description || '',
            status: (row.status || 'todo') as TicketStatus,
            priority: (row.priority || 'p2') as TicketPriority,
            ticket_type: (row.ticket_type || 'feature') as TicketType,
            position: parseFloat(row.position) || 0,
            due_date: row.due_date || null,
            start_date: row.start_date || null,
            labels,
            comments,
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || new Date().toISOString(),
        };

        tickets.push(ticket);
    }

    return tickets;
}
