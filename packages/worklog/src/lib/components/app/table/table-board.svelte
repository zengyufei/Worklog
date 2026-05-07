<script lang="ts">
    import { InlineNotification } from "carbon-components-svelte";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import type { Ticket } from "$lib/components/app/types";
    
    // Extracted Components
    import { TableState, setTableState } from "./table-state.svelte";
    import TableToolbar from "./table-toolbar.svelte";
    import TableGroup from "./table-group.svelte";
    
    // Modals
    import TicketAddEditModal from "../kanban/ticket-add-edit-modal.svelte";
    import TicketDeleteConfirm from "../kanban/ticket-delete-confirm.svelte";

    const shell = getWorkspaceShellContext();
    const getWorkspacePath = () => shell.workspace.path;
    const getBoardId = () => shell.boardsApi.active?.id ?? null;

    const ticketsHook = useTickets(getWorkspacePath, getBoardId);

    // Initialize State Context
    const tableState = new TableState(ticketsHook);
    setTableState(tableState);

    // Actions
    let editModalOpen = $state(false);
    let editTicket = $state<Ticket | null>(null);
    let deleteModalOpen = $state(false);
    let deleteTarget = $state<Ticket | null>(null);

    function handleEdit(ticketId: string) {
        const t = tableState.filteredTickets.find((t: Ticket) => t.id === ticketId);
        if (t) {
            editTicket = t;
            editModalOpen = true;
        }
    }

    function handleDelete(ticketId: string) {
        const t = tableState.filteredTickets.find((t: Ticket) => t.id === ticketId);
        if (t) {
            deleteTarget = t;
            deleteModalOpen = true;
        }
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
            await tableState.deleteTicket(deleteTarget.id);
            deleteTarget = null;
        }
    }
</script>

<div class="table-view-shell">
    <TableToolbar />

    <!-- Empty State -->
    {#if tableState.totalCount === 0 && tableState.searchQuery.trim()}
        <div class="table-empty-state">
            <InlineNotification
                kind="info"
                title="No results"
                subtitle="No tickets match '{tableState.searchQuery}'."
                hideCloseButton
            />
        </div>
    {/if}

    <!-- Grouped Table Content -->
    <div class="table-content">
        {#each tableState.groupedTickets as group}
            <TableGroup
                {group}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        {/each}
    </div>
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
    .table-view-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cds-ui-background);
    }

    .table-empty-state {
        padding: 1rem;
    }

    .table-content {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem 0;

        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) transparent;
    }

    .table-content::-webkit-scrollbar {
        width: 5px;
    }
    .table-content::-webkit-scrollbar-track {
        background: transparent;
    }
    .table-content::-webkit-scrollbar-thumb {
        background: var(--cds-ui-04);
        border-radius: 3px;
    }
</style>
