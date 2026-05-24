import type { Ticket, UpdateTicketInput, Comment } from '$lib/components/app/types';
import { getDb, TicketRepo } from '$lib/db';

let _tickets = $state<Ticket[]>([]);
let _loading = $state(false);

export function useAllTickets(getWorkspacePath: () => string | null) {
    function requireWorkspacePath(): string {
        const path = getWorkspacePath();
        if (!path) throw new Error('No workspace selected');
        return path;
    }

    async function load() {
        const workspacePath = getWorkspacePath();
        
        // Clear existing tickets immediately to avoid flashing old data
        _tickets = [];

        if (!workspacePath) {
            return;
        }

        _loading = true;
        try {
            const db = await getDb(workspacePath);
            _tickets = await TicketRepo.listAllTickets(db);
        } finally {
            _loading = false;
        }
    }

    async function update(id: string, input: UpdateTicketInput) {
        const workspacePath = requireWorkspacePath();
        const db = await getDb(workspacePath);
        const ticket = await TicketRepo.updateTicket(db, id, input);
        
        _tickets = _tickets.map(t => t.id === id ? ticket : t).sort((a, b) => a.position - b.position);
        
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
        const db = await getDb(workspacePath);
        await TicketRepo.deleteTicket(db, id);
        _tickets = _tickets.filter(t => t.id !== id);
    }

    return {
        get tickets() { return _tickets },
        get loading() { return _loading },
        load, update, addComment, remove
    };
}
