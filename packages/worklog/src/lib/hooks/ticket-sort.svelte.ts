import type { Ticket, TicketPriority } from "$lib/components/app/types";

export type TicketSortField = "position" | "priority" | "due_date" | "created_at" | "title" | "ticket_type";
export type SortOrder = "asc" | "desc";

const PRIORITY_VALUE: Record<TicketPriority, number> = {
    p1: 1, // High
    p2: 2, // Medium
    p3: 3, // Low
};

const STORAGE_KEY_BY = "worklog:sort-by";
const STORAGE_KEY_ORDER = "worklog:sort-order";

let _sortBy = $state<TicketSortField>(
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_BY) as TicketSortField) || "position"
);
let _sortOrder = $state<SortOrder>(
    (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY_ORDER) as SortOrder) || "asc"
);

export function getTicketSort() {
    $effect(() => {
        localStorage.setItem(STORAGE_KEY_BY, _sortBy);
        localStorage.setItem(STORAGE_KEY_ORDER, _sortOrder);
    });

    function sortTickets(tickets: Ticket[]): Ticket[] {
        const sorted = [...tickets].sort((a, b) => {
            let comparison = 0;

            switch (_sortBy) {
                case "priority":
                    comparison = (PRIORITY_VALUE[a.priority] || 99) - (PRIORITY_VALUE[b.priority] || 99);
                    break;
                case "due_date":
                    if (!a.due_date && !b.due_date) comparison = 0;
                    else if (!a.due_date) comparison = 1;
                    else if (!b.due_date) comparison = -1;
                    else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                    break;
                case "created_at":
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
                case "title":
                    comparison = a.title.localeCompare(b.title);
                    break;
                case "ticket_type":
                    comparison = a.ticket_type.localeCompare(b.ticket_type);
                    break;
                case "position":
                default:
                    comparison = a.position - b.position;
                    break;
            }

            return _sortOrder === "asc" ? comparison : -comparison;
        });

        return sorted;
    }

    return {
        get sortBy() { return _sortBy },
        set sortBy(val: TicketSortField) { _sortBy = val },
        get sortOrder() { return _sortOrder },
        set sortOrder(val: SortOrder) { _sortOrder = val },
        sortTickets,
        toggleOrder() {
            _sortOrder = _sortOrder === "asc" ? "desc" : "asc";
        }
    };
}
