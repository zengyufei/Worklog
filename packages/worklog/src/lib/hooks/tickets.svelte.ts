import type { Ticket, CreateTicketInput, UpdateTicketInput, Comment } from '$lib/components/app/types';
import { getDb, TicketRepo } from '$lib/db';


let _tickets = $state<Ticket[]>([]);
let _counts = $state<Record<string, number>>({});
let _loading = $state(false);

export function useTickets(
    getWorkspacePath: () => string | null,
    getBoardId: () => string | null,
) {
    function requireWorkspacePath(): string {
        const path = getWorkspacePath();
        if (!path) throw new Error('No workspace selected');
        return path;
    }

    function requireBoardId(): string {
        const boardId = getBoardId();
        if (!boardId) throw new Error('No active board selected');
        return boardId;
    }

    async function load() {
        const workspacePath = getWorkspacePath();
        const boardId = getBoardId();

        // Clear existing tickets immediately to avoid flashing old data
        _tickets = [];
        _counts = {};

        if (!workspacePath || !boardId) {
            return;
        }

        _loading = true;
        try {
            const db = await getDb(workspacePath);
            
            // Fetch initial batches for all statuses to ensure columns aren't empty
            const statuses: string[] = ["backlog", "todo", "in_progress", "done"];
            const [batchResults, countResults] = await Promise.all([
                Promise.all(statuses.map(s => TicketRepo.listTickets(db, boardId, { status: s, limit: 20 }))),
                Promise.all(statuses.map(s => TicketRepo.countTicketsByStatus(db, boardId, s)))
            ]);

            _tickets = batchResults.flat();
            _counts = Object.fromEntries(statuses.map((s, i) => [s, countResults[i]]));
        } finally {
            _loading = false;
        }
    }

    async function loadMore(status: string) {
        const workspacePath = getWorkspacePath();
        const boardId = getBoardId();
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

    async function update(id: string, input: UpdateTicketInput) {
        const workspacePath = requireWorkspacePath();
        requireBoardId();
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

    async function addComment(id: string, comment: Comment) {
        const ticket = _tickets.find(t => t.id === id);
        if (!ticket) throw new Error(`Ticket ${id} not found`);

        const updatedComments: Comment[] = [...ticket.comments, comment];
        return update(id, { comments: updatedComments });
    }

    async function remove(id: string) {
        const workspacePath = requireWorkspacePath();
        requireBoardId();
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
        load, loadMore, create, update, addComment, remove
    };
}
