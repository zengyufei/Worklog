// ── Types ───────────────────────────────────────────────────────────────────

export type UndoRedoEventType = 'ticket:update' | 'ticket:create' | 'ticket:delete';

/**
 * An undo/redo history entry.
 *
 * - `ticket:update` — `before` holds the old values for changed fields,
 *   `after` holds the new values. Inversion applies the opposite delta.
 * - `ticket:create` — `before` is null, `after` holds the full created ticket.
 *   Undo deletes the ticket; redo recreates it.
 * - `ticket:delete` — `before` holds the full deleted ticket, `after` is null.
 *   Undo recreates the ticket; redo deletes it again.
 */
export interface UndoRedoEvent {
    type: UndoRedoEventType;
    ticketId: string;
    /** Snapshot of what changed / what existed before the action */
    before: Record<string, unknown> | null;
    /** Snapshot of the new state / the created entity */
    after: Record<string, unknown> | null;
    /** Human-readable label shown in UI and notifications */
    description: string;
    timestamp: number;
}

// ── Mutation handler ────────────────────────────────────────────────────────
// Registered by the tickets hook so the layout can call undo/redo without
// knowing about the ticket module internals.

type MutationHandler = (event: UndoRedoEvent) => Promise<void>;

let _mutationHandler: MutationHandler | null = null;

/**
 * Register a callback that the undo system calls to apply an event's inversion.
 * Should be called once at module init time by the tickets hook.
 */
export function registerMutationHandler(handler: MutationHandler): void {
    _mutationHandler = handler;
}

// ── Event persistence ───────────────────────────────────────────────────────
// Registered by the tickets hook to persist undo-redo events to the events
// table. Keeps the in-memory stack reactive for immediate UX while also
// maintaining an immutable audit log.

type EventPersistenceHandler = (
    event: UndoRedoEvent,
    direction: 'push' | 'undo' | 'redo',
) => Promise<void>;

let _eventPersistence: EventPersistenceHandler | null = null;

/**
 * Register a callback that persists undo-redo events to the events table.
 */
export function registerEventPersistence(
    handler: EventPersistenceHandler,
): void {
    _eventPersistence = handler;
}

// ── Module-level state (singleton) ──────────────────────────────────────────

const MAX_STACK_SIZE = 50;

let _undoStack = $state<UndoRedoEvent[]>([]);
let _redoStack = $state<UndoRedoEvent[]>([]);

// ── Hook ────────────────────────────────────────────────────────────────────

export function getUndoRedo() {
    // ── Derived ──────────────────────────────────────────────────────────
    const canUndo = $derived(_undoStack.length > 0);
    const canRedo = $derived(_redoStack.length > 0);

    const lastUndoDesc = $derived(
        _undoStack.length > 0 ? _undoStack[_undoStack.length - 1].description : '',
    );
    const lastRedoDesc = $derived(
        _redoStack.length > 0 ? _redoStack[_redoStack.length - 1].description : '',
    );

    // ── Push ─────────────────────────────────────────────────────────────
    function push(event: UndoRedoEvent): void {
        _undoStack = [..._undoStack.slice(-(MAX_STACK_SIZE - 1)), event];
        // New action invalidates the redo stack
        _redoStack = [];

        // Persist to events table (fire-and-forget — never blocks UX)
        _eventPersistence?.(event, 'push').catch((err) =>
            console.error('Failed to persist event:', err),
        );
    }

    // ── Undo ─────────────────────────────────────────────────────────────
    async function undo(): Promise<boolean> {
        const event = _undoStack[_undoStack.length - 1];
        if (!event) return false;

        _undoStack = _undoStack.slice(0, -1);
        _redoStack = [..._redoStack, event];

        if (_mutationHandler) {
            try {
                await _mutationHandler(invertEvent(event));
                // Persist the undo action
                _eventPersistence?.(event, 'undo').catch((err) =>
                    console.error('Failed to persist undo event:', err),
                );
            } catch (error) {
                // Push back on failure
                _redoStack = _redoStack.slice(0, -1);
                _undoStack = [..._undoStack, event];
                throw error;
            }
        }
        return true;
    }

    // ── Redo ─────────────────────────────────────────────────────────────
    async function redo(): Promise<boolean> {
        const event = _redoStack[_redoStack.length - 1];
        if (!event) return false;

        _redoStack = _redoStack.slice(0, -1);
        _undoStack = [..._undoStack, event];

        if (_mutationHandler) {
            try {
                await _mutationHandler(event);
                // Persist the redo action
                _eventPersistence?.(event, 'redo').catch((err) =>
                    console.error('Failed to persist redo event:', err),
                );
            } catch (error) {
                // Push back on failure
                _undoStack = _undoStack.slice(0, -1);
                _redoStack = [..._redoStack, event];
                throw error;
            }
        }
        return true;
    }

    // ── Clear ────────────────────────────────────────────────────────────
    function clear(): void {
        _undoStack = [];
        _redoStack = [];
    }

    return {
        get canUndo() { return canUndo; },
        get canRedo() { return canRedo; },
        get lastUndoDesc() { return lastUndoDesc; },
        get lastRedoDesc() { return lastRedoDesc; },
        get undoStack() { return _undoStack; },
        get redoStack() { return _redoStack; },
        push,
        undo,
        redo,
        clear,
    };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Produces the inverted event for undo.
 * - ticket:update → swaps `before` ↔ `after` so the handler applies the old values.
 * - ticket:create → returns a `ticket:delete` event (before=full ticket, after=null).
 * - ticket:delete → returns a `ticket:create` event (before=null, after=full ticket).
 */
function invertEvent(event: UndoRedoEvent): UndoRedoEvent {
    switch (event.type) {
        case 'ticket:update':
            return {
                ...event,
                before: event.after,
                after: event.before,
                description: `Undo ${event.description.toLowerCase()}`,
            };
        case 'ticket:create':
            return {
                type: 'ticket:delete',
                ticketId: event.ticketId,
                before: event.after as Record<string, unknown>,
                after: null,
                description: `Delete ${event.description.toLowerCase()}`,
                timestamp: Date.now(),
            };
        case 'ticket:delete':
            return {
                type: 'ticket:create',
                ticketId: event.ticketId,
                before: null,
                after: event.before as Record<string, unknown>,
                description: `Restore ${event.description.toLowerCase()}`,
                timestamp: Date.now(),
            };
    }
}
