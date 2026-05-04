<script lang="ts">
    import { InlineNotification } from "carbon-components-svelte";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import type { Ticket } from "$lib/components/app/types";
    
    // Extracted Components
    import GanttToolbar from "./gantt-toolbar.svelte";
    import GanttColHeaders from "./gantt-col-headers.svelte";
    import GanttLabels from "./gantt-labels.svelte";
    import GanttCanvas from "./gantt-canvas.svelte";
    import GanttTooltip from "./gantt-tooltip.svelte";
    import { GanttState, setGanttState } from "./gantt-state.svelte";
    
    // Modals
    import TicketAddEditModal from "../kanban/ticket-add-edit-modal.svelte";
    import TicketDeleteConfirm from "../kanban/ticket-delete-confirm.svelte";

    const shell = getWorkspaceShellContext();
    const getWorkspacePath = () => shell.workspace.path;
    const getBoardId = () => shell.boardsApi.active?.id ?? null;
    const ticketsHook = useTickets(getWorkspacePath, getBoardId);

    // Initialize State Context
    const gantt = new GanttState(ticketsHook);
    setGanttState(gantt);

    // Auto-scroll to today on mount
    let hasScrolledToToday = false;
    $effect(() => {
        const _offset = gantt.todayOffset;
        const _canvas = gantt.canvasRef;

        if (!_canvas || _offset <= 0 || hasScrolledToToday) return;

        const tryScroll = () => {
            if (!gantt.canvasRef || gantt.canvasRef.clientWidth === 0) {
                setTimeout(tryScroll, 50);
                return;
            }
            hasScrolledToToday = true;
            const viewportWidth = gantt.canvasRef.clientWidth;
            gantt.canvasRef.scrollLeft = Math.max(0, _offset - viewportWidth / 3);
            if (gantt.rightPanelRef) gantt.rightPanelRef.scrollLeft = gantt.canvasRef.scrollLeft;
        };

        requestAnimationFrame(tryScroll);
    });

    // Modals State
    let editModalOpen = $state(false);
    let editTicket = $state<Ticket | null>(null);
    let deleteModalOpen = $state(false);
    let deleteTarget = $state<Ticket | null>(null);

    function handleBarClick(ticket: Ticket) {
        editTicket = ticket;
        editModalOpen = true;
    }

    async function submitTicket(data: any) {
        const boardId = getBoardId();
        if (!boardId) return;
        if (data.id) {
            await ticketsHook.update(data.id, {
                title: data.title,
                description: data.description,
                priority: data.priority,
                ticket_type: data.ticketType,
                start_date: data.startDate || null,
                due_date: data.dueDate || null,
                labels: data.tags,
            });
        } else {
            await ticketsHook.create({
                board_id: boardId,
                title: data.title,
                description: data.description,
                status: data.status,
                priority: data.priority,
                ticket_type: data.ticketType,
                start_date: data.startDate || null,
                due_date: data.dueDate || null,
                labels: data.tags,
            });
        }
    }

    async function confirmDelete() {
        if (deleteTarget) {
            await ticketsHook.remove(deleteTarget.id);
            deleteTarget = null;
        }
    }
</script>

<div class="gantt-shell">
    <GanttToolbar />

    {#if gantt.filteredTickets.length === 0}
        <div class="gantt-empty">
            <InlineNotification
                kind="info"
                title="No tickets"
                subtitle={gantt.searchQuery
                    ? `No tickets match '${gantt.searchQuery}'.`
                    : "Create tickets to see the timeline."}
                hideCloseButton
            />
        </div>
    {:else}
        <div class="gantt-grid">
            <div class="gantt-corner">
                <span>Ticket</span>
            </div>
            
            <GanttColHeaders />
            <GanttLabels />
            <GanttCanvas onTicketClick={handleBarClick} />
        </div>
    {/if}

    <GanttTooltip />
</div>

<!-- Modals -->
<TicketAddEditModal
    bind:open={editModalOpen}
    ticket={editTicket}
    onSubmit={submitTicket}
/>

<TicketDeleteConfirm
    bind:open={deleteModalOpen}
    ticketTitle={deleteTarget?.title ?? ""}
    onConfirm={confirmDelete}
/>

<style>
    .gantt-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cds-ui-background);
        overflow: hidden;
    }

    .gantt-empty {
        padding: 1rem;
    }

    .gantt-grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 220px 1fr;
        grid-template-rows: 48px 1fr;
    }

    .gantt-corner {
        grid-row: 1;
        grid-column: 1;
        display: flex;
        align-items: flex-end;
        padding: 0 0.75rem 0.375rem;
        background: var(--cds-ui-01);
        border-bottom: 1px solid var(--cds-ui-03);
        border-right: 1px solid var(--cds-ui-03);
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--cds-text-02);
        z-index: 4;
    }
</style>
