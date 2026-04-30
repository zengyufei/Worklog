<script lang="ts">
    import { getGanttState } from "./gantt-state.svelte";
    import type { Ticket } from "$lib/components/app/types";

    const s = getGanttState();

    let { onTicketClick }: { onTicketClick: (ticket: Ticket) => void } = $props();

    // ── Drag-resize state (local so Svelte reactivity is guaranteed) ──────
    let dragTicketId = $state<string | null>(null);
    let dragStartX = 0;
    let dragOriginalWidth = 0;
    let dragCurrentWidth = $state(0);
    let dragBarLeft = 0;
    let wasDragging = $state(false);

    function onResizeStart(e: MouseEvent, ticket: Ticket) {
        e.preventDefault();
        e.stopPropagation();

        dragTicketId = ticket.id;
        wasDragging = false;
        dragStartX = e.clientX;
        dragOriginalWidth = s.getBarWidth(ticket);
        dragCurrentWidth = dragOriginalWidth;
        dragBarLeft = s.getBarLeft(ticket);
        s.dragTicketId = ticket.id;
        s.hoveredTicketId = null;

        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - dragStartX;
            dragCurrentWidth = Math.max(s.colWidth, dragOriginalWidth + dx);
            if (Math.abs(dx) > 2) wasDragging = true;
        };

        const onUp = async () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);

            const ticketId = dragTicketId;
            const moved = wasDragging;
            dragTicketId = null;
            s.dragTicketId = null;

            if (ticketId && moved) {
                const newDue = s.getDragDueDate(dragBarLeft, dragCurrentWidth);
                try {
                    await s.updateDueDate(ticketId, newDue);
                } catch (err) {
                    console.error("Failed to update due date:", err);
                }
            }

            // Keep wasDragging true long enough to absorb the click that fires after mouseup
            setTimeout(() => {
                wasDragging = false;
            }, 150);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }
</script>

<div
    class="gantt-canvas"
    bind:this={s.canvasRef}
    onscroll={(e) => {
        const el = e.currentTarget as HTMLElement;
        if (s.leftPanelRef) s.leftPanelRef.scrollTop = el.scrollTop;
        if (s.rightPanelRef) s.rightPanelRef.scrollLeft = el.scrollLeft;
    }}
>
    <div
        class="gantt-canvas-inner"
        style="width:{s.timelineWidth}px;height:{s.contentHeight}px"
    >
        <!-- Grid columns -->
        {#each { length: s.totalDays } as _, i}
            {@const d = new Date(s.timeRange.start.getTime() + i * s.DAY_MS)}
            <div
                class="grid-col"
                class:grid-weekend={d.getDay() === 0 || d.getDay() === 6}
                style="left:{i * s.colWidth}px;width:{s.colWidth}px;height:{s.contentHeight}px"
            ></div>
        {/each}

        <!-- Today marker -->
        {#if s.todayOffset >= 0 && s.todayOffset <= s.timelineWidth}
            <div
                class="today-line"
                style="left:{s.todayOffset}px;height:{s.contentHeight}px"
            ></div>
        {/if}

        <!-- Rows and bars -->
        {#each s.flatRows as row, idx}
            {@const top = s.flatRows
                .slice(0, idx)
                .reduce((h, r) => h + (r.kind === "group" ? s.GROUP_H : s.ROW_H), 0)}

            {#if row.kind === "group"}
                <div
                    class="canvas-group-row"
                    style="top:{top}px;height:{s.GROUP_H}px;width:{s.timelineWidth}px"
                ></div>
            {:else}
                {@const isDragging = dragTicketId === row.ticket.id}
                {@const barLeft = s.getBarLeft(row.ticket)}
                {@const barWidth = isDragging ? dragCurrentWidth : s.getBarWidth(row.ticket)}
                <div
                    class="canvas-row"
                    style="top:{top}px;height:{s.ROW_H}px;width:{s.timelineWidth}px"
                >
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        class="bar"
                        class:bar--overdue={s.isOverdue(row.ticket)}
                        class:bar--done={row.ticket.status === "done"}
                        class:bar--no-due={!row.ticket.due_date}
                        class:bar--dragging={isDragging}
                        style="left:{barLeft}px;width:{barWidth}px;--bar-c:{row.color}"
                        onmouseenter={(e) => s.handleBarHover(e, row.ticket.id)}
                        onmouseleave={() => s.handleBarLeave()}
                        onclick={() => { if (!wasDragging) onTicketClick(row.ticket); }}
                        onkeydown={(e) => { if (e.key === "Enter" && !wasDragging) onTicketClick(row.ticket); }}
                        role="button"
                        tabindex="0"
                    >
                        <div
                            class="bar-fill"
                            style="width:{s.getElapsedPercent(row.ticket)}%"
                        ></div>
                        <span class="bar-label">{row.ticket.title}</span>
                    </div>

                    <!-- Resize handle — outside bar so overflow:hidden doesn't interfere -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <div
                        class="bar-resize-handle"
                        class:handle--dragging={isDragging}
                        style="left:{barLeft + barWidth - 6}px"
                        onmousedown={(e) => onResizeStart(e, row.ticket)}
                        onclick={(e) => e.stopPropagation()}
                    ></div>
                </div>
            {/if}
        {/each}
    </div>
</div>

<style>
    .gantt-canvas {
        grid-row: 2;
        grid-column: 2;
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) var(--cds-ui-01);
    }
    .gantt-canvas::-webkit-scrollbar { width: 8px; height: 8px; }
    .gantt-canvas::-webkit-scrollbar-track { background: var(--cds-ui-01); }
    .gantt-canvas::-webkit-scrollbar-thumb { background: var(--cds-ui-04); }

    .gantt-canvas-inner { position: relative; }

    /* ── Grid ─────────────────────────────────────────── */
    .grid-col {
        position: absolute; top: 0;
        border-right: 1px solid var(--cds-ui-03);
    }
    .grid-weekend {
        background: var(--cds-ui-01);
    }

    /* ── Today marker ─────────────────────────────────── */
    .today-line {
        position: absolute; top: 0; width: 1px;
        background: var(--cds-interactive-01);
        z-index: 5; pointer-events: none;
    }

    /* ── Rows ─────────────────────────────────────────── */
    .canvas-group-row {
        position: absolute; left: 0;
        background: var(--cds-ui-01);
        border-bottom: 1px solid var(--cds-ui-03);
    }
    .canvas-row {
        position: absolute; left: 0;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    /* ── Bars ─────────────────────────────────────────── */
    .bar {
        position: absolute; top: 5px; height: 26px; border-radius: 2px;
        background: var(--cds-ui-03);
        border-left: 3px solid var(--bar-c);
        cursor: pointer;
        z-index: 1;
        user-select: none;
    }
    .bar:hover {
        background: var(--cds-ui-04);
    }
    .bar-fill {
        position: absolute; top: 0; left: 0; bottom: 0;
        background: var(--bar-c);
        opacity: 0.2;
        overflow: hidden;
    }
    .bar--done { opacity: 0.5; }
    .bar--done .bar-fill { opacity: 0.35; }
    .bar--overdue {
        border-left-color: var(--cds-support-01);
        background: var(--cds-support-04);
    }
    .bar--overdue .bar-fill {
        background: var(--cds-support-01);
        opacity: 0.15;
    }
    .bar--no-due { border-left-style: dashed; }
    .bar-label {
        position: absolute; inset: 0;
        padding: 0 0.5rem;
        font-size: 0.6875rem; font-weight: 400; color: var(--cds-text-01);
        line-height: 26px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .bar--dragging { z-index: 10; outline: 1px solid var(--cds-interactive-01); }

    /* ── Resize handle ─────────────────────────────────── */
    .bar-resize-handle {
        position: absolute;
        top: 5px; height: 26px; width: 10px;
        cursor: ew-resize; z-index: 7;
    }
    .bar-resize-handle::after {
        content: '';
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 1px; height: 14px;
        background: var(--cds-ui-04);
    }
    .bar-resize-handle:hover::after,
    .handle--dragging::after {
        background: var(--cds-interactive-01);
    }
</style>
