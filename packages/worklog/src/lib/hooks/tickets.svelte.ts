import type { Ticket, CreateTicketInput, UpdateTicketInput, Comment } from '$lib/components/app/types';
import { getDb, TicketRepo } from '$lib/db';


// ── Module-level shared state ──────────────────────────────────────────────
// All consumers share the same reactive _tickets array, so mutations in one
// view (e.g. Kanban reorder) are reflected in every other view (e.g. Overview).
//
// Two load modes:
//   board mode (getBoardId returns a string) — paginated per-status loading
//   all mode   (getBoardId returns null)     — loads every ticket in the workspace
//
// The mode is determined by whether a boardId getter is supplied at call time.

type TicketsMode = 'board' | 'all';

let _tickets = $state<Ticket[]>([]);
let _counts = $state<Record<string, number>>({});
let _loading = $state(false);
let _mode = $state<TicketsMode | null>(null);

/**
 * Unified ticket hook — replaces both useTickets and useAllTickets.
 *
 * Pass a boardId getter to load board-scoped tickets (paginated by status).
 * Omit it (or return null) to load all tickets across the workspace.
 *
 * Example — board scope:
 *   const tickets = useTickets(() => path, () => boardId);
 *
 * Example — all scope:
 *   const tickets = useTickets(() => path);
 */
export function useTickets(
    getWorkspacePath: () => string | null,
    getBoardId?: () => string | null,
) {
    const hasBoardScope = !!getBoardId;

    function requireWorkspacePath(): string {
        const path = getWorkspacePath();
        if (!path) throw new Error('No workspace selected');
        return path;
    }

    // ── Load ────────────────────────────────────────────────────────────────
    async function load() {
        const workspacePath = getWorkspacePath();
        const boardId = hasBoardScope ? getBoardId!() : null;

        // Clear existing tickets immediately to avoid flashing old data
        _tickets = [];
        _counts = {};

        if (!workspacePath) return;

        // In board mode, also require a board ID
        if (hasBoardScope && !boardId) return;

        _mode = hasBoardScope ? 'board' : 'all';
        _loading = true;
        try {
            const db = await getDb(workspacePath);

            if (hasBoardScope && boardId) {
                // ── Board-scoped: paginated by status ────────────────────────
                const statuses: string[] = ["backlog", "todo", "in_progress", "done"];
                const [batchResults, countResults] = await Promise.all([
                    Promise.all(statuses.map(s => TicketRepo.listTickets(db, boardId, { status: s, limit: 20 }))),
                    Promise.all(statuses.map(s => TicketRepo.countTicketsByStatus(db, boardId, s)))
                ]);

                _tickets = batchResults.flat();
                _counts = Object.fromEntries(statuses.map((s, i) => [s, countResults[i]]));
            } else {
                // ── All tickets: full workspace ──────────────────────────────
                _tickets = await TicketRepo.listAllTickets(db);
            }
        } finally {
            _loading = false;
        }
    }

    // ── Load More (board scope only) ────────────────────────────────────────
    async function loadMore(status: string) {
        const workspacePath = getWorkspacePath();
        const boardId = hasBoardScope ? getBoardId!() : null;
        if (!workspacePath || !boardId) return;

        const currentCount = _tickets.filter(t => t.status === status).length;
        const total = _counts[status] ?? 0;

        if (currentCount >= total) return;

        const db = await getDb(workspacePath);
        const batch = await TicketRepo.listTickets(db, boardId, {
            status,
            limit: 20,
            offset: currentCount
        });

        // Append new tickets and sort them by position
        _tickets = [..._tickets, ...batch].sort((a, b) => a.position - b.position);
    }

    // ── Create ──────────────────────────────────────────────────────────────
    async function create(input: CreateTicketInput) {
        const workspacePath = requireWorkspacePath();
        const db = await getDb(workspacePath);
        const ticket = await TicketRepo.createTicket(db, input);
        _tickets = [..._tickets, ticket].sort((a, b) => a.position - b.position);
        if (ticket.status) {
            _counts[ticket.status] = (_counts[ticket.status] ?? 0) + 1;
        }
        return ticket;
    }

    // ── Update ──────────────────────────────────────────────────────────────
    async function update(id: string, input: UpdateTicketInput) {
        const workspacePath = requireWorkspacePath();
        const db = await getDb(workspacePath);
        const oldTicket = _tickets.find(t => t.id === id);
        const ticket = await TicketRepo.updateTicket(db, id, input);

        _tickets = _tickets.map(t => t.id === id ? ticket : t).sort((a, b) => a.position - b.position);

        // Update counts if status changed
        if (oldTicket && input.status && oldTicket.status !== input.status) {
            _counts[oldTicket.status] = Math.max(0, (_counts[oldTicket.status] ?? 0) - 1);
            _counts[input.status] = (_counts[input.status] ?? 0) + 1;
        }

        return ticket;
    }

    // ── Add Comment ─────────────────────────────────────────────────────────
    async function addComment(id: string, comment: Comment) {
        const ticket = _tickets.find(t => t.id === id);
        if (!ticket) throw new Error(`Ticket ${id} not found`);

        const updatedComments: Comment[] = [...ticket.comments, comment];
        return update(id, { comments: updatedComments });
    }

    // ── Remove ──────────────────────────────────────────────────────────────
    async function remove(id: string) {
        const workspacePath = requireWorkspacePath();
        const ticket = _tickets.find(t => t.id === id);
        const db = await getDb(workspacePath);
        await TicketRepo.deleteTicket(db, id);
        _tickets = _tickets.filter(t => t.id !== id);
        if (ticket?.status) {
            _counts[ticket.status] = Math.max(0, (_counts[ticket.status] ?? 0) - 1);
        }
    }

    return {
        get tickets() { return _tickets },
        get counts() { return _counts },
        get loading() { return _loading },
        get mode() { return _mode },
        load, loadMore, create, update, addComment, remove
    };
}

// ── Backward-compatible alias ───────────────────────────────────────────────
// useAllTickets(getWorkspacePath) === useTickets(getWorkspacePath)
/** @deprecated Use `useTickets(path)` instead. Will be removed in a future release. */
export function useAllTickets(getWorkspacePath: () => string | null) {
    return useTickets(getWorkspacePath);
}
