import { getContext, setContext } from 'svelte';
import {
    type Ticket,
    type TicketStatus,
    TICKET_STATUS_ORDER,
    TICKET_STATUS_CONFIG
} from "$lib/components/app/types";
import { Pending, TaskComplete, InProgress as InProgressIcon, CheckmarkFilled } from "carbon-icons-svelte";

export type RowItem =
    | { kind: "group"; status: TicketStatus; label: string; color: string; icon: any; count: number }
    | { kind: "ticket"; ticket: Ticket; color: string };

const statusIconMap: Record<TicketStatus, any> = {
    backlog: Pending,
    todo: TaskComplete,
    in_progress: InProgressIcon,
    done: CheckmarkFilled,
};

const statusColorMap: Record<TicketStatus, string> = {
    backlog: "#e5399e",
    todo: "#009d9a",
    in_progress: "#0f62fe",
    done: "#198038",
};

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getWeekNumber(d: Date): number {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const DAY_MS = 86400000;
    return Math.ceil(((d.getTime() - oneJan.getTime()) / DAY_MS + oneJan.getDay() + 1) / 7);
}

export class GanttState {
    DAY_MS = 86400000;
    ROW_H = 36;
    GROUP_H = 32;

    #ticketsHook: any;

    searchQuery = $state("");
    zoomLevel = $state<"day" | "week" | "month">("day");

    hoveredTicketId = $state<string | null>(null);
    tooltipX = $state(0);
    tooltipY = $state(0);

    leftPanelRef = $state<HTMLElement | null>(null);
    rightPanelRef = $state<HTMLElement | null>(null);
    canvasRef = $state<HTMLElement | null>(null);

    dragTicketId = $state<string | null>(null);

    constructor(ticketsHook: any) {
        this.#ticketsHook = ticketsHook;
    }

    get filteredTickets(): Ticket[] {
        return this.searchQuery.trim()
            ? this.#ticketsHook.tickets.filter(
                (t: Ticket) =>
                    t.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    t.description?.toLowerCase().includes(this.searchQuery.toLowerCase())
            )
            : this.#ticketsHook.tickets;
    }

    get groupedTickets() {
        return TICKET_STATUS_ORDER.map((status) => ({
            status,
            label: TICKET_STATUS_CONFIG[status].label,
            icon: statusIconMap[status],
            color: statusColorMap[status],
            tickets: this.filteredTickets.filter((t: Ticket) => t.status === status),
        })).filter((g) => g.tickets.length > 0);
    }

    get timeRange() {
        const now = new Date();
        const tickets = this.filteredTickets;
        if (tickets.length === 0) {
            const s = startOfDay(new Date(now.getTime() - 7 * this.DAY_MS));
            const e = startOfDay(new Date(now.getTime() + 14 * this.DAY_MS));
            return { start: s, end: e };
        }
        let minDate = now.getTime();
        let maxDate = now.getTime();
        for (const t of tickets) {
            const created = new Date(t.created_at).getTime();
            if (created < minDate) minDate = created;
            if (t.due_date) {
                const due = new Date(t.due_date).getTime();
                if (due > maxDate) maxDate = due;
                if (due < minDate) minDate = due;
            }
            if (created > maxDate) maxDate = created;
        }
        const pad = 3 * this.DAY_MS;
        return {
            start: startOfDay(new Date(minDate - pad)),
            end: startOfDay(new Date(maxDate + pad + this.DAY_MS)),
        };
    }

    get totalDays() {
        return Math.max(1, Math.round((this.timeRange.end.getTime() - this.timeRange.start.getTime()) / this.DAY_MS));
    }

    get columns() {
        const cols: { label: string; subLabel: string; span: number; date: Date }[] = [];
        const s = this.timeRange.start;
        if (this.zoomLevel === "day") {
            for (let i = 0; i < this.totalDays; i++) {
                const d = new Date(s.getTime() + i * this.DAY_MS);
                cols.push({
                    label: d.toLocaleDateString("en-US", { weekday: "short" }),
                    subLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    span: 1, date: d,
                });
            }
        } else if (this.zoomLevel === "week") {
            let i = 0;
            while (i < this.totalDays) {
                const d = new Date(s.getTime() + i * this.DAY_MS);
                const span = Math.min(7, this.totalDays - i);
                cols.push({
                    label: `W${getWeekNumber(d)}`,
                    subLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    span, date: d,
                });
                i += span;
            }
        } else {
            let i = 0;
            while (i < this.totalDays) {
                const d = new Date(s.getTime() + i * this.DAY_MS);
                const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                const daysLeft = Math.round((monthEnd.getTime() - d.getTime()) / this.DAY_MS) + 1;
                const span = Math.min(daysLeft, this.totalDays - i);
                cols.push({
                    label: d.toLocaleDateString("en-US", { month: "long" }),
                    subLabel: d.getFullYear().toString(),
                    span, date: d,
                });
                i += span;
            }
        }
        return cols;
    }

    get colWidth() {
        return this.zoomLevel === "day" ? 48 : this.zoomLevel === "week" ? 28 : 10;
    }

    get timelineWidth() {
        return this.totalDays * this.colWidth;
    }

    get flatRows() {
        const rows: RowItem[] = [];
        for (const g of this.groupedTickets) {
            rows.push({ kind: "group", status: g.status, label: g.label, color: g.color, icon: g.icon, count: g.tickets.length });
            for (const t of g.tickets) {
                rows.push({ kind: "ticket", ticket: t, color: g.color });
            }
        }
        return rows;
    }

    get contentHeight() {
        return this.flatRows.reduce((h, r) => h + (r.kind === "group" ? this.GROUP_H : this.ROW_H), 0);
    }

    get todayOffset() {
        const now = new Date();
        return ((startOfDay(now).getTime() - this.timeRange.start.getTime()) / this.DAY_MS) * this.colWidth;
    }

    get hoveredTicket() {
        return this.hoveredTicketId ? this.filteredTickets.find((t: Ticket) => t.id === this.hoveredTicketId) ?? null : null;
    }

    getBarLeft(ticket: Ticket): number {
        const rangeStart = this.timeRange.start.getTime();
        const created = new Date(ticket.created_at).getTime();
        return Math.max(0, (created - rangeStart) / this.DAY_MS) * this.colWidth;
    }

    getBarWidth(ticket: Ticket): number {
        const now = new Date();
        const created = new Date(ticket.created_at).getTime();
        if (!ticket.due_date) {
            return Math.max(this.colWidth, ((now.getTime() - created) / this.DAY_MS) * this.colWidth);
        }
        const due = new Date(ticket.due_date).getTime();
        return Math.max(this.colWidth, ((due - created) / this.DAY_MS) * this.colWidth);
    }

    getElapsedPercent(ticket: Ticket): number {
        const now = new Date();
        if (!ticket.due_date) return 100;
        const created = new Date(ticket.created_at).getTime();
        const due = new Date(ticket.due_date).getTime();
        if (due <= created) return 100;
        return Math.min(100, Math.max(0, ((now.getTime() - created) / (due - created)) * 100));
    }

    isOverdue(ticket: Ticket): boolean {
        const now = new Date();
        if (!ticket.due_date || ticket.status === "done") return false;
        return new Date(ticket.due_date).getTime() < now.getTime();
    }

    getDaysLeft(ticket: Ticket): string {
        const now = new Date();
        if (!ticket.due_date) return "No due date";
        const diff = Math.ceil((new Date(ticket.due_date).getTime() - now.getTime()) / this.DAY_MS);
        if (diff < 0) return `${Math.abs(diff)}d overdue`;
        if (diff === 0) return "Due today";
        if (diff === 1) return "Tomorrow";
        return `${diff}d left`;
    }

    handleBarHover(e: MouseEvent, ticketId: string) {
        this.hoveredTicketId = ticketId;
        this.tooltipX = e.clientX;
        this.tooltipY = e.clientY;
    }

    handleBarLeave() {
        this.hoveredTicketId = null;
    }

    getDragDueDate(barLeftPx: number, barWidthPx: number): string {
        const rightPx = barLeftPx + barWidthPx;
        const dayOffset = rightPx / this.colWidth;
        const newDue = new Date(this.timeRange.start.getTime() + dayOffset * this.DAY_MS);
        return newDue.toISOString().split("T")[0];
    }

    async updateDueDate(ticketId: string, dueDate: string) {
        await this.#ticketsHook.update(ticketId, { due_date: dueDate });
    }
}

const GANTT_KEY = Symbol('gantt');

export function setGanttState(state: GanttState) {
    setContext(GANTT_KEY, state);
}

export function getGanttState(): GanttState {
    return getContext<GanttState>(GANTT_KEY);
}
