<!-- src/lib/components/app/kanban/kanban-board.svelte -->
<script lang="ts">
    import {
        InlineNotification,
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
    } from "carbon-components-svelte";
    import KanbanColumn from "./kanban-column.svelte";
    import TicketAddEditModal from "./ticket-add-edit-modal.svelte";
    import TicketDeleteConfirm from "./ticket-delete-confirm.svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import {
        type Ticket,
        type TicketStatus,
        TICKET_STATUS_CONFIG,
        TICKET_STATUS_ORDER,
    } from "$lib/components/app/types";

    type Column = {
        status: TicketStatus;
        label: string;
        accentColor: string;
        tickets: Ticket[];
    };

    const shell = getWorkspaceShellContext();
    const getWorkspacePath = () => shell.workspace.path;
    const getBoardId = () => shell.boardsApi.active?.id ?? null;

    const ticketsHook = useTickets(getWorkspacePath, getBoardId);

    let loadError = $state<string | null>(null);
    let actionError = $state<string | null>(null);

    $effect(() => {
        const workspacePath = getWorkspacePath();
        const boardId = getBoardId();

        if (!workspacePath || !boardId) {
            return;
        }

        void (async () => {
            try {
                loadError = null;
                await ticketsHook.load();
            } catch (error) {
                loadError = String(error);
            }
        })();
    });

    // ── Column definitions from config ─────────────────────────────────────────
    const columnsDef = TICKET_STATUS_ORDER.map((status) => ({
        status,
        label: TICKET_STATUS_CONFIG[status].label,
        accentColor: TICKET_STATUS_CONFIG[status].accentColor,
    }));

    let columns = $derived(
        columnsDef.map((def) => ({
            ...def,
            tickets: ticketsHook.tickets.filter(
                (ticket) => ticket.status === def.status,
            ),
        })),
    );

    // ── Search / filter ────────────────────────────────────────────────────────
    let searchQuery = $state("");

    const filteredColumns = $derived(
        columns.map((col) => ({
            ...col,
            tickets: searchQuery.trim()
                ? col.tickets.filter(
                      (t) =>
                          t.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                          t.description
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                          t.labels?.some((tag) =>
                              tag
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase()),
                          ),
                  )
                : col.tickets,
        })),
    );

    // ── DnD handlers ───────────────────────────────────────────────────────────
    function makeHandlers(targetStatus: TicketStatus) {
        return {
            consider(_e: CustomEvent) {
                actionError = null;
            },
            finalize(e: CustomEvent) {
                void (async () => {
                    try {
                        const detail = e.detail as {
                            info?: { id?: string };
                            items?: Array<{ id?: string; position?: number }>;
                        };
                        const movedTicketId = detail.info?.id;

                        if (!movedTicketId || !detail.items) {
                            return;
                        }

                        // finalize fires on multiple zones; only destination should persist.
                        const newIndex = detail.items.findIndex(
                            (item) => item.id === movedTicketId,
                        );

                        if (newIndex === -1) {
                            return;
                        }

                        const items = detail.items;
                        let newPosition = 0;

                        if (items.length === 1) {
                            newPosition = 1000;
                        } else if (newIndex === 0) {
                            newPosition = (items[1].position ?? 1000) - 100;
                        } else if (newIndex === items.length - 1) {
                            newPosition =
                                (items[newIndex - 1].position ?? 0) + 100;
                        } else {
                            const prev = items[newIndex - 1].position ?? 0;
                            const next = items[newIndex + 1].position ?? 0;
                            newPosition = (prev + next) / 2;
                        }

                        // Optimistic update of local tickets array for smoother UI
                        // svelte-dnd-action already handles the visual dom manipulation but
                        // we need to make sure Svelte state matches immediately before DB call finishes
                        const ticketIdx = ticketsHook.tickets.findIndex(
                            (t) => t.id === movedTicketId,
                        );
                        if (ticketIdx !== -1) {
                            // this relies on ticketsHook not preventing direct mutations or reacting to them if needed
                        }

                        actionError = null;
                        await ticketsHook.update(movedTicketId, {
                            status: targetStatus,
                            position: newPosition,
                        });
                    } catch (error) {
                        actionError = String(error);
                    }
                })();
            },
        };
    }

    // ── Modal state (Add / Edit) ───────────────────────────────────────────────
    let modalOpen = $state(false);
    let editTicket = $state<Ticket | null>(null);
    let targetStatus = $state<TicketStatus>("todo");

    function openAddModal(status: TicketStatus) {
        editTicket = null;
        targetStatus = status;
        actionError = null;
        modalOpen = true;
    }

    function openEditModal(ticket: Ticket) {
        editTicket = ticket;
        actionError = null;
        modalOpen = true;
    }

    async function handleSubmit(data: any) {
        const board_id = getBoardId();
        if (!board_id) return;
        actionError = null;
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
                board_id,
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

    let deleteTicketTarget = $state<Ticket | null>(null);
    let deleteTicketModalOpen = $state(false);

    function promptDeleteTicket(id: string) {
        const t = ticketsHook.tickets.find((t) => t.id === id);
        if (t) {
            deleteTicketTarget = t;
            deleteTicketModalOpen = true;
        }
    }

    async function confirmDeleteTicket() {
        if (!deleteTicketTarget) return;
        try {
            actionError = null;
            await ticketsHook.remove(deleteTicketTarget.id);
        } catch (error) {
            actionError = String(error);
        } finally {
            deleteTicketModalOpen = false;
            deleteTicketTarget = null;
        }
    }

    async function handleStatusChange(id: string, status: TicketStatus) {
        try {
            actionError = null;
            await ticketsHook.update(id, { status });
        } catch (error) {
            actionError = String(error);
        }
    }

    // ── Stats (exclude backlog from progress) ─────────────────────────────────
    const activeTickets = $derived(
        columns
            .filter((c) => c.status !== "backlog")
            .reduce((s, c) => s + c.tickets.length, 0),
    );
    const doneCount = $derived(
        columns.find((c) => c.status === "done")?.tickets.length ?? 0,
    );
    const progress = $derived(
        activeTickets > 0 ? Math.round((doneCount / activeTickets) * 100) : 0,
    );
    const totalTickets = $derived(
        columns.reduce((s, c) => s + c.tickets.length, 0),
    );

    // Listen for create-ticket events from the command palette / shortcuts
    $effect(() => {
        const handler = () => openAddModal("todo");
        window.addEventListener("worklog:create-ticket", handler);
        return () =>
            window.removeEventListener("worklog:create-ticket", handler);
    });
</script>

<!-- ── Board Shell ─────────────────────────────────────────────────────────── -->
<div class="board-shell">
    <!-- Toolbar -->
    <Toolbar>
        <ToolbarContent>
            <ToolbarSearch
                value={searchQuery}
                oninput={(e: any) => (searchQuery = e.currentTarget.value)}
                placeholder="Search tickets…"
                persistent
            />
            <div class="toolbar-stats">
                <span class="stats-text"
                    >{doneCount} / {activeTickets} done</span
                >
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {progress}%"></div>
                </div>
                {#if totalTickets !== activeTickets}
                    <span class="stats-text stats-backlog"
                        >+{totalTickets - activeTickets} backlog</span
                    >
                {/if}
            </div>
        </ToolbarContent>
    </Toolbar>

    {#if searchQuery && filteredColumns.every((c) => c.tickets.length === 0)}
        <InlineNotification
            kind="info"
            title="No results"
            subtitle="No tickets match '{searchQuery}'."
            hideCloseButton
        />
    {/if}

    {#if loadError}
        <InlineNotification
            kind="error"
            title="Unable to load tickets"
            subtitle={loadError}
            hideCloseButton
        />
    {/if}

    {#if actionError}
        <InlineNotification
            kind="error"
            title="Ticket action failed"
            subtitle={actionError}
            hideCloseButton
        />
    {/if}

    <!-- Columns -->
    <div class="board-columns" role="main" aria-label="Kanban board">
        {#each filteredColumns as col (col.status)}
            {@const handlers = makeHandlers(col.status)}
            <KanbanColumn
                label={col.label}
                status={col.status}
                tickets={col.tickets}
                accentColor={col.accentColor}
                isLoading={ticketsHook.loading}
                onconsider={handlers.consider}
                onfinalize={handlers.finalize}
                onAddTicket={openAddModal}
                onEditTicket={openEditModal}
                onDeleteTicket={promptDeleteTicket}
                onStatusChange={handleStatusChange}
            />
        {/each}
    </div>
</div>

<!-- ── Add / Edit Modal ──────────────────────────────────────────────────────── -->
<TicketAddEditModal
    bind:open={modalOpen}
    ticket={editTicket}
    defaultStatus={targetStatus}
    onSubmit={handleSubmit}
/>

<TicketDeleteConfirm
    bind:open={deleteTicketModalOpen}
    ticketTitle={deleteTicketTarget?.title ?? ""}
    onConfirm={confirmDeleteTicket}
/>

<style>
    .board-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cds-ui-background);
    }

    /* Columns scroll area */
    .board-columns {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        overflow-x: auto;
        overflow-y: hidden;
        flex: 1;
        min-height: 0;

        /* Nice momentum scroll on macOS/iOS */
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) transparent;
    }

    .board-columns::-webkit-scrollbar {
        height: 6px;
    }
    .board-columns::-webkit-scrollbar-track {
        background: transparent;
    }
    .board-columns::-webkit-scrollbar-thumb {
        background: var(--cds-ui-04);
        border-radius: 3px;
    }

    /* Toolbar extras */
    .toolbar-stats {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0 1rem;
    }

    .stats-text {
        font-size: 0.75rem;
        color: var(--cds-text-02);
        white-space: nowrap;
    }

    .stats-backlog {
        opacity: 0.7;
    }

    .progress-bar {
        width: 100px;
        height: 4px;
        background: var(--cds-ui-03);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: var(--cds-support-02);
        border-radius: 2px;
        transition: width 0.4s ease;
    }
</style>
