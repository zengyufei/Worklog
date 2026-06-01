import type Database from '@tauri-apps/plugin-sql';
import {
	EventRepo,
	type EntityType,
	type EventType,
	type CreateEventInput,
} from '$lib/db';
import type { EventRecord } from '$lib/db/repositories/event.repo';

// ── Types ───────────────────────────────────────────────────────────────────

export type TicketLifecycleEventType =
	| 'ticket_created'
	| 'ticket_updated'
	| 'ticket_deleted'
	| 'ticket_moved'
	| 'ticket_archived'
	| 'ticket_restored';

export type BoardLifecycleEventType =
	| 'board_created'
	| 'board_updated'
	| 'board_deleted'
	| 'board_archived'
	| 'board_restored';

export type LifecycleEventType = TicketLifecycleEventType | BoardLifecycleEventType;

export interface LifecycleEventPayload {
	/** Snapshot of the entity state before the change (null for creates) */
	before: Record<string, unknown> | null;
	/** Snapshot of the entity state after the change (null for deletes) */
	after: Record<string, unknown> | null;
	/** Optional human-readable description */
	description?: string;
}

// ── Actor cache ─────────────────────────────────────────────────────────────
// Read from settings lazily and cache per DB connection.

let _actorCache = $state<string>('');

/**
 * Resolve the actor name from app_settings. Lazily loaded.
 * Returns the cached value if already resolved for the given DB.
 */
async function resolveActor(db: Database): Promise<string> {
	if (_actorCache) return _actorCache;
	try {
		const { SettingsRepo } = await import('$lib/db');
		const settings = await SettingsRepo.getSettings(db);
		_actorCache = settings.author_name || 'unknown';
	} catch {
		_actorCache = 'unknown';
	}
	return _actorCache;
}

/**
 * Invalidate the actor cache (call when settings are updated).
 */
export function invalidateActorCache(): void {
	_actorCache = '';
}

// ── Emit ────────────────────────────────────────────────────────────────────

/**
 * Emit a lifecycle event to the append-only events table.
 * Returns the created EventRecord, or null on failure.
 */
export async function emitEvent(
	db: Database,
	input: {
		entity_type: EntityType;
		entity_id: string;
		event_type: LifecycleEventType;
		payload: LifecycleEventPayload;
	},
): Promise<EventRecord | null> {
	try {
		const actor = await resolveActor(db);
		const eventInput: CreateEventInput = {
			entity_type: input.entity_type,
			entity_id: input.entity_id,
			event_type: input.event_type as EventType,
			payload: input.payload as unknown as Record<string, unknown>,
			actor,
		};
		return await EventRepo.insertEvent(db, eventInput);
	} catch (error) {
		console.error('Failed to emit event:', error);
		return null;
	}
}

// ── Convenience helpers ─────────────────────────────────────────────────────

export const TicketEvents = {
	created(db: Database, ticketId: string, after: Record<string, unknown>) {
		return emitEvent(db, {
			entity_type: 'ticket',
			entity_id: ticketId,
			event_type: 'ticket_created',
			payload: { before: null, after },
		});
	},

	updated(
		db: Database,
		ticketId: string,
		before: Record<string, unknown> | null,
		after: Record<string, unknown>,
	) {
		return emitEvent(db, {
			entity_type: 'ticket',
			entity_id: ticketId,
			event_type: 'ticket_updated',
			payload: { before, after },
		});
	},

	deleted(db: Database, ticketId: string, before: Record<string, unknown>) {
		return emitEvent(db, {
			entity_type: 'ticket',
			entity_id: ticketId,
			event_type: 'ticket_deleted',
			payload: { before, after: null },
		});
	},

	moved(
		db: Database,
		ticketId: string,
		fromStatus: string,
		toStatus: string,
		extra?: Record<string, unknown>,
	) {
		return emitEvent(db, {
			entity_type: 'ticket',
			entity_id: ticketId,
			event_type: 'ticket_moved',
			payload: {
				before: { status: fromStatus, ...extra },
				after: { status: toStatus, ...extra },
			},
		});
	},

	archived(db: Database, ticketId: string, before: Record<string, unknown>) {
		return emitEvent(db, {
			entity_type: 'ticket',
			entity_id: ticketId,
			event_type: 'ticket_archived',
			payload: { before, after: { ...before, archived: true } },
		});
	},

	restored(db: Database, ticketId: string, after: Record<string, unknown>) {
		return emitEvent(db, {
			entity_type: 'ticket',
			entity_id: ticketId,
			event_type: 'ticket_restored',
			payload: {
				before: { ...after, archived: true },
				after,
			},
		});
	},
};

export const BoardEvents = {
	created(db: Database, boardId: string, after: Record<string, unknown>) {
		return emitEvent(db, {
			entity_type: 'board',
			entity_id: boardId,
			event_type: 'board_created',
			payload: { before: null, after },
		});
	},

	updated(
		db: Database,
		boardId: string,
		before: Record<string, unknown> | null,
		after: Record<string, unknown>,
	) {
		return emitEvent(db, {
			entity_type: 'board',
			entity_id: boardId,
			event_type: 'board_updated',
			payload: { before, after },
		});
	},

	deleted(db: Database, boardId: string, before: Record<string, unknown>) {
		return emitEvent(db, {
			entity_type: 'board',
			entity_id: boardId,
			event_type: 'board_deleted',
			payload: { before, after: null },
		});
	},

	archived(db: Database, boardId: string, before: Record<string, unknown>) {
		return emitEvent(db, {
			entity_type: 'board',
			entity_id: boardId,
			event_type: 'board_archived',
			payload: { before, after: { ...before, archived_at: new Date().toISOString() } },
		});
	},

	restored(db: Database, boardId: string, after: Record<string, unknown>) {
		return emitEvent(db, {
			entity_type: 'board',
			entity_id: boardId,
			event_type: 'board_restored',
			payload: { before: null, after },
		});
	},
};
