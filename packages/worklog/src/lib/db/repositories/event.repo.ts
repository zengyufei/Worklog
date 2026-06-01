import type Database from '@tauri-apps/plugin-sql';
import { generateId } from '$lib/utils';

// ── Types ───────────────────────────────────────────────────────────────────

export type EntityType = 'ticket' | 'board';

export type TicketEventType =
	| 'ticket_created'
	| 'ticket_updated'
	| 'ticket_deleted'
	| 'ticket_moved'
	| 'ticket_archived'
	| 'ticket_restored';

export type BoardEventType =
	| 'board_created'
	| 'board_updated'
	| 'board_deleted'
	| 'board_archived'
	| 'board_restored';

export type EventType = TicketEventType | BoardEventType;

export interface EventRecord {
	id: string;
	entity_type: EntityType;
	entity_id: string;
	event_type: EventType;
	/** Structured JSON payload — always includes before/after when applicable */
	payload: Record<string, unknown>;
	actor: string;
	created_at: string;
}

export interface CreateEventInput {
	entity_type: EntityType;
	entity_id: string;
	event_type: EventType;
	payload: Record<string, unknown>;
	actor: string;
}

// ── Repository ──────────────────────────────────────────────────────────────

/**
 * Insert an event into the append-only events table.
 * Returns the created EventRecord.
 */
export async function insertEvent(
	db: Database,
	input: CreateEventInput,
): Promise<EventRecord> {
	const event: EventRecord = {
		id: generateId('EVT'),
		entity_type: input.entity_type,
		entity_id: input.entity_id,
		event_type: input.event_type,
		payload: input.payload,
		actor: input.actor,
		created_at: new Date().toISOString(),
	};

	await db.execute(
		`INSERT INTO events (id, entity_type, entity_id, event_type, payload, actor, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[
			event.id,
			event.entity_type,
			event.entity_id,
			event.event_type,
			JSON.stringify(event.payload),
			event.actor,
			event.created_at,
		],
	);

	return event;
}

/**
 * List events with optional filters, ordered by created_at ASC (oldest first)
 * or DESC (newest first) when `desc` is true.
 */
export async function listEvents(
	db: Database,
	options: {
		entity_type?: EntityType;
		entity_id?: string;
		event_type?: EventType;
		limit?: number;
		offset?: number;
		desc?: boolean;
	} = {},
): Promise<EventRecord[]> {
	const conditions: string[] = [];
	const params: unknown[] = [];

	if (options.entity_type) {
		conditions.push('entity_type = ?');
		params.push(options.entity_type);
	}
	if (options.entity_id) {
		conditions.push('entity_id = ?');
		params.push(options.entity_id);
	}
	if (options.event_type) {
		conditions.push('event_type = ?');
		params.push(options.event_type);
	}

	const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
	const order = options.desc ? 'DESC' : 'ASC';

	let query = `SELECT * FROM events ${where} ORDER BY created_at ${order}, id ${order}`;

	if (options.limit !== undefined) {
		query += ` LIMIT ?`;
		params.push(options.limit);
	}
	if (options.offset !== undefined) {
		query += ` OFFSET ?`;
		params.push(options.offset);
	}

	const rows = await db.select<any[]>(query, params);
	return rows.map(deserialize);
}

/**
 * Get the most recent events across all entities, newest first.
 * This is the primary source for reconstructing the undo/redo stack on startup.
 */
export async function listRecentEvents(
	db: Database,
	limit: number = 100,
): Promise<EventRecord[]> {
	return listEvents(db, { desc: true, limit });
}

/**
 * Count total events.
 */
export async function countEvents(db: Database): Promise<number> {
	const rows = await db.select<{ count: number }[]>(
		'SELECT COUNT(*) as count FROM events',
	);
	return rows[0]?.count ?? 0;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function deserialize(row: any): EventRecord {
	return {
		...row,
		payload:
			typeof row.payload === 'string'
				? JSON.parse(row.payload)
				: row.payload,
	};
}
