<script lang="ts">
    import {
        Tag,
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
        InlineNotification,
        Button,
    } from "carbon-components-svelte";
    import {
        Pending,
        TaskComplete,
        InProgress as InProgressIcon,
        CheckmarkFilled,
        Calendar,
    } from "carbon-icons-svelte";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import TicketAddEditModal from "./ticket-add-edit-modal.svelte";
    import TicketDeleteConfirm from "./ticket-delete-confirm.svelte";
    import {
        type Ticket,
        type TicketStatus,
        TICKET_STATUS_ORDER,
        TICKET_STATUS_CONFIG,
        TICKET_PRIORITY_CONFIG,
    } from "$lib/components/app/types";

    const shell = getWorkspaceShellContext();
    const getWorkspacePath = () => shell.workspace.path;
    const getBoardId = () => shell.boardsApi.active?.id ?? null;
    const ticketsHook = useTickets(getWorkspacePath, getBoardId);

    let searchQuery = $state("");
    let zoomLevel = $state<"day" | "week" | "month">("day");
    let hoveredTicketId = $state<string | null>(null);
    let tooltipX = $state(0);
    let tooltipY = $state(0);

    // Refs for scroll-driven sync (only the canvas drives scroll)
    let leftPanelRef = $state<HTMLElement | null>(null);
    let rightPanelRef = $state<HTMLElement | null>(null);
    let canvasRef = $state<HTMLElement | null>(null);

    // Auto-scroll to today on mount
    let hasScrolledToToday = false;
    $effect(() => {
        // Re-read reactive deps so this effect re-runs when they change
        const _offset = todayOffset;
        const _canvas = canvasRef;

        if (!_canvas || _offset <= 0 || hasScrolledToToday) return;

        // Wait for the canvas to actually be visible (inside a tab)
        const tryScroll = () => {
            if (!canvasRef || canvasRef.clientWidth === 0) {
                // Not visible yet — retry shortly
                setTimeout(tryScroll, 50);
                return;
            }
            hasScrolledToToday = true;
            const viewportWidth = canvasRef.clientWidth;
            canvasRef.scrollLeft = Math.max(0, _offset - viewportWidth / 3);
            if (rightPanelRef) rightPanelRef.scrollLeft = canvasRef.scrollLeft;
        };

        requestAnimationFrame(tryScroll);
    });

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

    // ── Filtering ──────────────────────────────────────────────────────────
    const filteredTickets = $derived(
        searchQuery.trim()
            ? ticketsHook.tickets.filter(
                  (t) =>
                      t.title
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      t.description
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()),
              )
            : ticketsHook.tickets,
    );

    // ── Grouping ───────────────────────────────────────────────────────────
    const groupedTickets = $derived(
        TICKET_STATUS_ORDER.map((status) => ({
            status,
            label: TICKET_STATUS_CONFIG[status].label,
            icon: statusIconMap[status],
            color: statusColorMap[status],
            tickets: filteredTickets.filter((t) => t.status === status),
        })).filter((g) => g.tickets.length > 0),
    );

    // ── Time range ─────────────────────────────────────────────────────────
    const now = new Date();
    const DAY_MS = 86400000;

    function startOfDay(d: Date): Date {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    const timeRange = $derived.by(() => {
        const tickets = filteredTickets;
        if (tickets.length === 0) {
            const s = startOfDay(new Date(now.getTime() - 7 * DAY_MS));
            const e = startOfDay(new Date(now.getTime() + 14 * DAY_MS));
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
        const pad = 3 * DAY_MS;
        return {
            start: startOfDay(new Date(minDate - pad)),
            end: startOfDay(new Date(maxDate + pad + DAY_MS)),
        };
    });

    const totalDays = $derived(
        Math.max(
            1,
            Math.round(
                (timeRange.end.getTime() - timeRange.start.getTime()) / DAY_MS,
            ),
        ),
    );

    // ── Column generation ──────────────────────────────────────────────────
    const columns = $derived.by(() => {
        const cols: {
            label: string;
            subLabel: string;
            span: number;
            date: Date;
        }[] = [];
        const s = timeRange.start;
        if (zoomLevel === "day") {
            for (let i = 0; i < totalDays; i++) {
                const d = new Date(s.getTime() + i * DAY_MS);
                cols.push({
                    label: d.toLocaleDateString("en-US", { weekday: "short" }),
                    subLabel: d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    }),
                    span: 1,
                    date: d,
                });
            }
        } else if (zoomLevel === "week") {
            let i = 0;
            while (i < totalDays) {
                const d = new Date(s.getTime() + i * DAY_MS);
                const span = Math.min(7, totalDays - i);
                cols.push({
                    label: `W${getWeekNumber(d)}`,
                    subLabel: d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                    }),
                    span,
                    date: d,
                });
                i += span;
            }
        } else {
            let i = 0;
            while (i < totalDays) {
                const d = new Date(s.getTime() + i * DAY_MS);
                const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                const daysLeft =
                    Math.round((monthEnd.getTime() - d.getTime()) / DAY_MS) + 1;
                const span = Math.min(daysLeft, totalDays - i);
                cols.push({
                    label: d.toLocaleDateString("en-US", { month: "long" }),
                    subLabel: d.getFullYear().toString(),
                    span,
                    date: d,
                });
                i += span;
            }
        }
        return cols;
    });

    function getWeekNumber(d: Date): number {
        const oneJan = new Date(d.getFullYear(), 0, 1);
        return Math.ceil(
            ((d.getTime() - oneJan.getTime()) / DAY_MS + oneJan.getDay() + 1) /
                7,
        );
    }

    // ── Bar positioning ────────────────────────────────────────────────────
    const colWidth = $derived(
        zoomLevel === "day" ? 48 : zoomLevel === "week" ? 28 : 10,
    );
    const timelineWidth = $derived(totalDays * colWidth);
    const ROW_H = 36;
    const GROUP_H = 32;

    function getBarLeft(ticket: Ticket): number {
        const rangeStart = timeRange.start.getTime();
        const created = new Date(ticket.created_at).getTime();
        return Math.max(0, (created - rangeStart) / DAY_MS) * colWidth;
    }

    function getBarWidth(ticket: Ticket): number {
        const created = new Date(ticket.created_at).getTime();
        if (!ticket.due_date) {
            return Math.max(
                colWidth,
                ((now.getTime() - created) / DAY_MS) * colWidth,
            );
        }
        const due = new Date(ticket.due_date).getTime();
        return Math.max(colWidth, ((due - created) / DAY_MS) * colWidth);
    }

    function getElapsedPercent(ticket: Ticket): number {
        if (!ticket.due_date) return 100;
        const created = new Date(ticket.created_at).getTime();
        const due = new Date(ticket.due_date).getTime();
        if (due <= created) return 100;
        return Math.min(
            100,
            Math.max(0, ((now.getTime() - created) / (due - created)) * 100),
        );
    }

    function isOverdue(ticket: Ticket): boolean {
        if (!ticket.due_date || ticket.status === "done") return false;
        return new Date(ticket.due_date).getTime() < now.getTime();
    }

    function getDaysLeft(ticket: Ticket): string {
        if (!ticket.due_date) return "No due date";
        const diff = Math.ceil(
            (new Date(ticket.due_date).getTime() - now.getTime()) / DAY_MS,
        );
        if (diff < 0) return `${Math.abs(diff)}d overdue`;
        if (diff === 0) return "Due today";
        if (diff === 1) return "Tomorrow";
        return `${diff}d left`;
    }

    // ── Flat row list for consistent rendering ─────────────────────────────
    type RowItem =
        | {
              kind: "group";
              status: TicketStatus;
              label: string;
              color: string;
              icon: any;
              count: number;
          }
        | { kind: "ticket"; ticket: Ticket; color: string };

    const flatRows = $derived.by(() => {
        const rows: RowItem[] = [];
        for (const g of groupedTickets) {
            rows.push({
                kind: "group",
                status: g.status,
                label: g.label,
                color: g.color,
                icon: g.icon,
                count: g.tickets.length,
            });
            for (const t of g.tickets) {
                rows.push({ kind: "ticket", ticket: t, color: g.color });
            }
        }
        return rows;
    });

    const contentHeight = $derived(
        flatRows.reduce(
            (h, r) => h + (r.kind === "group" ? GROUP_H : ROW_H),
            0,
        ),
    );

    const todayOffset = $derived(
        ((startOfDay(now).getTime() - timeRange.start.getTime()) / DAY_MS) *
            colWidth,
    );

    // ── Tooltip ────────────────────────────────────────────────────────────
    function handleBarHover(e: MouseEvent, ticketId: string) {
        hoveredTicketId = ticketId;
        tooltipX = e.clientX;
        tooltipY = e.clientY;
    }
    function handleBarLeave() {
        hoveredTicketId = null;
    }

    const hoveredTicket = $derived(
        hoveredTicketId
            ? (filteredTickets.find((t) => t.id === hoveredTicketId) ?? null)
            : null,
    );

    // ── Drag-to-resize due date ────────────────────────────────────────────
    let dragTicketId = $state<string | null>(null);
    let dragStartX = 0;
    let dragOriginalWidth = 0;
    let dragCurrentWidth = $state(0);
    let dragTicketLeft = 0;

    function getDragDueDate(): string | null {
        if (!dragTicketId) return null;
        const leftPx = dragTicketLeft;
        const rightPx = leftPx + dragCurrentWidth;
        const dayOffset = rightPx / colWidth;
        const newDue = new Date(timeRange.start.getTime() + dayOffset * DAY_MS);
        return newDue.toISOString().split("T")[0];
    }

    function onResizeStart(e: MouseEvent, ticket: Ticket) {
        e.preventDefault();
        e.stopPropagation();
        dragTicketId = ticket.id;
        dragStartX = e.clientX;
        dragOriginalWidth = getBarWidth(ticket);
        dragCurrentWidth = dragOriginalWidth;
        dragTicketLeft = getBarLeft(ticket);
        hoveredTicketId = null;

        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - dragStartX;
            dragCurrentWidth = Math.max(colWidth, dragOriginalWidth + dx);
        };

        const onUp = async () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);

            const newDue = getDragDueDate();
            const ticketId = dragTicketId;
            dragTicketId = null;

            if (ticketId && newDue) {
                try {
                    await ticketsHook.update(ticketId, { due_date: newDue });
                } catch (err) {
                    console.error("Failed to update due date:", err);
                }
            }
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    // ── Edit / Delete modals ─────────────────────────────────────────────
    let editModalOpen = $state(false);
    let editTicket = $state<Ticket | null>(null);
    let deleteModalOpen = $state(false);
    let deleteTarget = $state<Ticket | null>(null);

    function handleBarClick(ticket: Ticket) {
        if (dragTicketId) return; // don't open if dragging
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
    <!-- ── Toolbar ──────────────────────────────────────────────────── -->
    <div class="gantt-toolbar">
        <Toolbar>
            <ToolbarContent>
                <ToolbarSearch
                    persistent
                    bind:value={searchQuery}
                    placeholder="Search tickets..."
                />
            </ToolbarContent>
        </Toolbar>
        <div class="gantt-zoom">
            <Button
                kind={zoomLevel === "day" ? "primary" : "ghost"}
                size="small"
                on:click={() => (zoomLevel = "day")}>Day</Button
            >
            <Button
                kind={zoomLevel === "week" ? "primary" : "ghost"}
                size="small"
                on:click={() => (zoomLevel = "week")}>Week</Button
            >
            <Button
                kind={zoomLevel === "month" ? "primary" : "ghost"}
                size="small"
                on:click={() => (zoomLevel = "month")}>Month</Button
            >
        </div>
    </div>

    {#if filteredTickets.length === 0}
        <div class="gantt-empty">
            <InlineNotification
                kind="info"
                title="No tickets"
                subtitle={searchQuery
                    ? `No tickets match '${searchQuery}'.`
                    : "Create tickets to see the timeline."}
                hideCloseButton
            />
        </div>
    {:else}
        <!-- ── Chart area: CSS Grid with 4 quadrants ─────────────── -->
        <div class="gantt-grid">
            <!-- Q1: top-left corner -->
            <div class="gantt-corner">
                <span>Ticket</span>
            </div>

            <!-- Q2: top-right — column headers (scroll horizontally with body) -->
            <div class="gantt-col-headers" bind:this={rightPanelRef}>
                <div
                    class="gantt-col-headers-inner"
                    style="width:{timelineWidth}px"
                >
                    {#each columns as col}
                        <div
                            class="gantt-col-h"
                            style="width:{col.span * colWidth}px"
                        >
                            <span class="col-main">{col.label}</span>
                            <span class="col-sub">{col.subLabel}</span>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Q3: bottom-left — ticket labels (scroll vertically with body) -->
            <div class="gantt-labels" bind:this={leftPanelRef}>
                {#each flatRows as row}
                    {#if row.kind === "group"}
                        <div
                            class="label-group"
                            style="height:{GROUP_H}px;--accent:{row.color}"
                        >
                            <span class="label-accent"></span>
                            <row.icon size={14} />
                            <strong>{row.label}</strong>
                            <span class="label-count">{row.count}</span>
                        </div>
                    {:else}
                        <div
                            class="label-ticket"
                            style="height:{ROW_H}px"
                            class:label-overdue={isOverdue(row.ticket)}
                        >
                            <span class="label-title">{row.ticket.title}</span>
                            <span class="label-meta"
                                >{getDaysLeft(row.ticket)}</span
                            >
                        </div>
                    {/if}
                {/each}
            </div>

            <!-- Q4: bottom-right — the chart canvas (scrolls both ways) -->
            <div
                class="gantt-canvas"
                bind:this={canvasRef}
                onscroll={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    if (leftPanelRef) leftPanelRef.scrollTop = el.scrollTop;
                    if (rightPanelRef) rightPanelRef.scrollLeft = el.scrollLeft;
                }}
            >
                <div
                    class="gantt-canvas-inner"
                    style="width:{timelineWidth}px;height:{contentHeight}px"
                >
                    <!-- Grid columns -->
                    {#each { length: totalDays } as _, i}
                        {@const d = new Date(
                            timeRange.start.getTime() + i * DAY_MS,
                        )}
                        <div
                            class="grid-col"
                            class:grid-weekend={d.getDay() === 0 ||
                                d.getDay() === 6}
                            style="left:{i *
                                colWidth}px;width:{colWidth}px;height:{contentHeight}px"
                        ></div>
                    {/each}

                    <!-- Today marker -->
                    {#if todayOffset >= 0 && todayOffset <= timelineWidth}
                        <div
                            class="today-line"
                            style="left:{todayOffset}px;height:{contentHeight}px"
                        ></div>
                    {/if}

                    <!-- Rows and bars -->
                    {#each flatRows as row, idx}
                        {@const top = flatRows
                            .slice(0, idx)
                            .reduce(
                                (h, r) =>
                                    h + (r.kind === "group" ? GROUP_H : ROW_H),
                                0,
                            )}
                        {#if row.kind === "group"}
                            <div
                                class="canvas-group-row"
                                style="top:{top}px;height:{GROUP_H}px;width:{timelineWidth}px"
                            ></div>
                        {:else}
                            <div
                                class="canvas-row"
                                style="top:{top}px;height:{ROW_H}px;width:{timelineWidth}px"
                            >
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    class="bar"
                                    class:bar--overdue={isOverdue(row.ticket)}
                                    class:bar--done={row.ticket.status ===
                                        "done"}
                                    class:bar--no-due={!row.ticket.due_date}
                                    class:bar--dragging={dragTicketId ===
                                        row.ticket.id}
                                    style="left:{getBarLeft(
                                        row.ticket,
                                    )}px;width:{dragTicketId === row.ticket.id
                                        ? dragCurrentWidth
                                        : getBarWidth(
                                              row.ticket,
                                          )}px;--bar-c:{row.color}"
                                    onmouseenter={(e) =>
                                        handleBarHover(e, row.ticket.id)}
                                    onmouseleave={handleBarLeave}
                                    onclick={() => handleBarClick(row.ticket)}
                                    onkeydown={(e) => { if (e.key === "Enter") handleBarClick(row.ticket); }}
                                    role="button"
                                    tabindex="0"
                                >
                                    <div
                                        class="bar-fill"
                                        style="width:{getElapsedPercent(
                                            row.ticket,
                                        )}%"
                                    ></div>
                                    <span class="bar-label"
                                        >{row.ticket.title}</span
                                    >
                                    <!-- Resize handle -->
                                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                                    <div
                                        class="bar-resize-handle"
                                        onmousedown={(e) =>
                                            onResizeStart(e, row.ticket)}
                                    ></div>
                                </div>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
    {/if}

    <!-- ── Tooltip ──────────────────────────────────────────────────── -->
    {#if hoveredTicket}
        <div
            class="gantt-tip"
            style="left:{tooltipX + 14}px;top:{tooltipY - 8}px"
        >
            <strong>{hoveredTicket.title}</strong>
            <div class="tip-row">
                <span class="tip-label">Status</span>
                <Tag type="gray" size="sm"
                    >{TICKET_STATUS_CONFIG[hoveredTicket.status].label}</Tag
                >
            </div>
            <div class="tip-row">
                <span class="tip-label">Priority</span>
                <Tag
                    type={TICKET_PRIORITY_CONFIG[hoveredTicket.priority]
                        ?.tagColor || "blue"}
                    size="sm"
                >
                    {TICKET_PRIORITY_CONFIG[hoveredTicket.priority]?.label}
                </Tag>
            </div>
            <div class="tip-row">
                <span class="tip-label">Timeline</span>
                <span
                    class="tip-val"
                    class:tip-overdue={isOverdue(hoveredTicket)}
                    >{getDaysLeft(hoveredTicket)}</span
                >
            </div>
            {#if hoveredTicket.due_date}
                <div class="tip-row">
                    <Calendar size={12} />
                    <span class="tip-val"
                        >{new Date(hoveredTicket.due_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                        )}</span
                    >
                </div>
            {/if}
        </div>
    {/if}
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
    /* ── Shell ────────────────────────────────────────── */
    .gantt-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--cds-ui-background);
        overflow: hidden;
    }

    /* ── Toolbar ──────────────────────────────────────── */
    .gantt-toolbar {
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--cds-ui-03);
        flex-shrink: 0;
    }
    .gantt-toolbar :global(.bx--toolbar) {
        flex: 1;
    }
    .gantt-zoom {
        display: flex;
        gap: 2px;
        padding: 0 0.75rem;
        flex-shrink: 0;
    }
    .gantt-empty {
        padding: 1rem;
    }

    /* ── 4-quadrant CSS Grid ──────────────────────────── */
    .gantt-grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 220px 1fr;
        grid-template-rows: 48px 1fr;
    }

    /* Q1: corner */
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

    /* Q2: column headers */
    .gantt-col-headers {
        grid-row: 1;
        grid-column: 2;
        overflow-x: hidden;
        overflow-y: hidden;
        background: var(--cds-ui-01);
        border-bottom: 1px solid var(--cds-ui-03);
        z-index: 3;
    }
    .gantt-col-headers-inner {
        display: flex;
        height: 100%;
    }
    .gantt-col-h {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        padding-bottom: 0.25rem;
        border-right: 1px solid
            color-mix(in srgb, var(--cds-ui-03) 50%, transparent);
        flex-shrink: 0;
    }
    .col-main {
        font-size: 0.625rem;
        font-weight: 600;
        color: var(--cds-text-01);
        text-transform: uppercase;
        letter-spacing: 0.03em;
    }
    .col-sub {
        font-size: 0.5625rem;
        color: var(--cds-text-02);
    }

    /* Q3: left labels */
    .gantt-labels {
        grid-row: 2;
        grid-column: 1;
        overflow-y: hidden;
        overflow-x: hidden;
        border-right: 1px solid var(--cds-ui-03);
        z-index: 2;
        scrollbar-width: none;
    }
    .gantt-labels::-webkit-scrollbar {
        display: none;
    }

    .label-group {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0 0.75rem;
        font-size: 0.75rem;
        color: var(--cds-text-01);
        background: var(--cds-ui-01);
        border-bottom: 1px solid var(--cds-ui-03);
    }
    .label-group :global(svg) {
        color: var(--accent);
        flex-shrink: 0;
    }
    .label-accent {
        width: 3px;
        height: 14px;
        border-radius: 2px;
        background: var(--accent);
        flex-shrink: 0;
    }
    .label-count {
        font-size: 0.625rem;
        font-weight: 600;
        color: var(--cds-text-02);
        background: var(--cds-ui-03);
        padding: 0 0.3rem;
        border-radius: 6px;
        min-width: 1rem;
        text-align: center;
        line-height: 1.125rem;
    }

    .label-ticket {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 0.75rem;
        border-bottom: 1px solid
            color-mix(in srgb, var(--cds-ui-03) 40%, transparent);
    }
    .label-title {
        font-size: 0.75rem;
        color: var(--cds-text-01);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.2;
    }
    .label-meta {
        font-size: 0.625rem;
        color: var(--cds-text-02);
    }
    .label-overdue .label-meta {
        color: var(--cds-support-01);
        font-weight: 600;
    }

    /* Q4: canvas */
    .gantt-canvas {
        grid-row: 2;
        grid-column: 2;
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) transparent;
    }
    .gantt-canvas::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    .gantt-canvas::-webkit-scrollbar-track {
        background: transparent;
    }
    .gantt-canvas::-webkit-scrollbar-thumb {
        background: var(--cds-ui-04);
        border-radius: 3px;
    }

    .gantt-canvas-inner {
        position: relative;
    }

    /* ── Grid columns ────────────────────────────────── */
    .grid-col {
        position: absolute;
        top: 0;
        border-right: 1px solid
            color-mix(in srgb, var(--cds-ui-03) 30%, transparent);
    }
    .grid-weekend {
        background: color-mix(in srgb, var(--cds-ui-03) 10%, transparent);
    }

    /* ── Today ────────────────────────────────────────── */
    .today-line {
        position: absolute;
        top: 0;
        width: 2px;
        background: var(--cds-support-01);
        z-index: 5;
        pointer-events: none;
    }

    /* ── Rows ─────────────────────────────────────────── */
    .canvas-group-row {
        position: absolute;
        left: 0;
        background: var(--cds-ui-01);
        border-bottom: 1px solid var(--cds-ui-03);
    }
    .canvas-row {
        position: absolute;
        left: 0;
        border-bottom: 1px solid
            color-mix(in srgb, var(--cds-ui-03) 40%, transparent);
    }

    /* ── Bars ─────────────────────────────────────────── */
    .bar {
        position: absolute;
        top: 4px;
        height: 28px;
        border-radius: 6px;
        background: color-mix(in srgb, var(--bar-c) 15%, transparent);
        border: 1px solid color-mix(in srgb, var(--bar-c) 35%, transparent);
        overflow: hidden;
        cursor: pointer;
        transition:
            box-shadow 0.12s ease,
            transform 0.1s ease;
        z-index: 1;
    }
    .bar:hover {
        box-shadow: 0 2px 12px color-mix(in srgb, var(--bar-c) 25%, transparent);
        transform: translateY(-1px);
        z-index: 6;
    }
    .bar-fill {
        position: absolute;
        inset: 0;
        right: auto;
        background: color-mix(in srgb, var(--bar-c) 45%, transparent);
        border-radius: 5px 0 0 5px;
    }
    .bar--done .bar-fill {
        background: var(--bar-c);
        opacity: 0.6;
        border-radius: 5px;
    }
    .bar--overdue {
        border-color: var(--cds-support-01);
        background: repeating-linear-gradient(
            -45deg,
            color-mix(in srgb, var(--cds-support-01) 6%, transparent),
            color-mix(in srgb, var(--cds-support-01) 6%, transparent) 4px,
            color-mix(in srgb, var(--cds-support-01) 14%, transparent) 4px,
            color-mix(in srgb, var(--cds-support-01) 14%, transparent) 8px
        );
    }
    .bar--no-due {
        border-style: dashed;
        opacity: 0.6;
    }
    .bar-label {
        position: relative;
        z-index: 1;
        padding: 0 1rem 0 0.5rem;
        font-size: 0.6875rem;
        font-weight: 500;
        color: var(--cds-text-01);
        line-height: 28px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* ── Resize handle ────────────────────────────────── */
    .bar-resize-handle {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 8px;
        cursor: ew-resize;
        z-index: 2;
        border-radius: 0 5px 5px 0;
        transition: background 0.1s ease;
    }
    .bar-resize-handle::after {
        content: "";
        position: absolute;
        top: 50%;
        right: 2px;
        transform: translateY(-50%);
        width: 2px;
        height: 12px;
        border-radius: 1px;
        background: color-mix(in srgb, var(--bar-c) 40%, transparent);
        transition: background 0.1s ease;
    }
    .bar:hover .bar-resize-handle::after {
        background: var(--bar-c);
    }
    .bar-resize-handle:hover {
        background: color-mix(in srgb, var(--bar-c) 20%, transparent);
    }
    .bar--dragging {
        z-index: 10 !important;
        box-shadow: 0 2px 16px color-mix(in srgb, var(--bar-c) 35%, transparent);
        transform: none !important;
    }

    /* ── Tooltip ──────────────────────────────────────── */
    .gantt-tip {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        background: var(--cds-ui-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 6px;
        padding: 0.625rem 0.75rem;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        min-width: 180px;
        max-width: 280px;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }
    .gantt-tip strong {
        font-size: 0.8125rem;
        color: var(--cds-text-01);
    }
    .tip-row {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }
    .tip-label {
        font-size: 0.6875rem;
        color: var(--cds-text-02);
        min-width: 48px;
    }
    .tip-val {
        font-size: 0.75rem;
        color: var(--cds-text-01);
    }
    .tip-overdue {
        color: var(--cds-support-01) !important;
        font-weight: 600;
    }
    .tip-row :global(svg) {
        color: var(--cds-text-02);
        flex-shrink: 0;
    }
</style>
