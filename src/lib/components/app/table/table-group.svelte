<script lang="ts">
    import { DataTable, Tag, OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
    import { Calendar } from "carbon-icons-svelte";
    import { getTableState, priorityIconMap, typeIconMap } from "./table-state.svelte";
    import {
        TICKET_PRIORITY_CONFIG,
        TICKET_TYPE_CONFIG,
        type TicketPriority,
        type TicketType,
    } from "$lib/components/app/types";

    const state = getTableState();

    export let group: any;
    export let onEdit: (id: string) => void;
    export let onDelete: (id: string) => void;

    const headers: any = [
        { key: "title", value: "Title" },
        { key: "priority", value: "Priority" },
        { key: "type", value: "Type" },
        { key: "labels", value: "Labels" },
        { key: "dueDate", value: "Due Date" },
        { key: "created", value: "Created" },
        { key: "actions", empty: true },
    ];

    function copyId(ticketId: string) {
        if (navigator.clipboard) {
            void navigator.clipboard.writeText(ticketId);
        }
    }
</script>

<div class="status-group" style="--accent: {group.accentColor}">
    <details class="group-details" open>
        <summary class="group-header">
            <div class="group-header-left">
                <span class="group-accent-bar"></span>
                <svelte:component this={group.icon} size={16} />
                <strong class="group-label">{group.label}</strong>
                <span class="group-count">{group.tickets.length}</span>
            </div>
            <span class="group-chevron"></span>
        </summary>

        {#if group.tickets.length > 0}
            <div class="group-table-wrapper">
                <DataTable
                    sortable
                    size="short"
                    {headers}
                    rows={group.tickets.map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        priority: t.priority,
                        type: t.ticket_type,
                        labels: t.labels,
                        dueDate: t.due_date,
                        created: t.created_at,
                        status: t.status,
                    }))}
                    sort={state.customSort}
                >
                    <svelte:fragment slot="cell" let:row let:cell>
                        {#if cell.key === "title"}
                            <div class="cell-title">
                                <span class="cell-title-text">{cell.value}</span>
                                <span class="cell-title-id">{row.id}</span>
                            </div>
                        {:else if cell.key === "priority"}
                            {@const PriorityIcon = priorityIconMap[cell.value as TicketPriority]}
                            <div class="cell-priority">
                                {#if PriorityIcon}
                                    <PriorityIcon size={14} />
                                {/if}
                                <Tag
                                    type={TICKET_PRIORITY_CONFIG[cell.value as TicketPriority]?.tagColor || "blue"}
                                    size="sm"
                                >
                                    {TICKET_PRIORITY_CONFIG[cell.value as TicketPriority]?.label || cell.value}
                                </Tag>
                            </div>
                        {:else if cell.key === "type"}
                            {@const TypeIcon = typeIconMap[cell.value as TicketType]}
                            <div class="cell-type">
                                {#if TypeIcon}
                                    <TypeIcon size={14} />
                                {/if}
                                <Tag
                                    type={TICKET_TYPE_CONFIG[cell.value as TicketType]?.tagColor || "blue"}
                                    size="sm"
                                >
                                    {TICKET_TYPE_CONFIG[cell.value as TicketType]?.label || cell.value}
                                </Tag>
                            </div>
                        {:else if cell.key === "labels"}
                            <div class="cell-labels">
                                {#if Array.isArray(cell.value) && cell.value.length > 0}
                                    {#each cell.value.slice(0, 3) as label}
                                        <Tag type="outline" size="sm">{label}</Tag>
                                    {/each}
                                    {#if cell.value.length > 3}
                                        <span class="labels-more">+{cell.value.length - 3}</span>
                                    {/if}
                                {:else}
                                    <span class="cell-muted">—</span>
                                {/if}
                            </div>
                        {:else if cell.key === "dueDate"}
                            {@const due = state.formatDueDate(cell.value, row.status === "done")}
                            <div class="cell-due" class:overdue={due.overdue}>
                                <Calendar size={14} />
                                <span>{due.text}</span>
                            </div>
                        {:else if cell.key === "created"}
                            <span class="cell-date">{state.formatRelativeDate(cell.value)}</span>
                        {:else if cell.key === "actions"}
                            <div class="cell-actions">
                                <OverflowMenu flipped size="sm">
                                    <OverflowMenuItem text="Copy ID" on:click={() => copyId(row.id)} />
                                    <OverflowMenuItem text="Edit ticket" on:click={() => onEdit(row.id)} />
                                    <OverflowMenuItem danger text="Delete" on:click={() => onDelete(row.id)} />
                                </OverflowMenu>
                            </div>
                        {:else}
                            {cell.value}
                        {/if}
                    </svelte:fragment>
                </DataTable>
            </div>
        {:else}
            <div class="group-empty">
                <span>No tickets</span>
            </div>
        {/if}
    </details>
</div>

<style>
    .status-group {
        margin-bottom: 0.25rem;
    }

    .group-details {
        border: none;
    }

    .group-details > summary {
        list-style: none;
    }
    .group-details > summary::-webkit-details-marker {
        display: none;
    }

    .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        cursor: pointer;
        user-select: none;
        transition: background 0.12s ease;
        border-bottom: 1px solid transparent;
    }

    .group-header:hover {
        background: var(--cds-hover-ui);
    }

    .group-header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .group-accent-bar {
        width: 3px;
        height: 16px;
        border-radius: 2px;
        background: var(--accent);
        flex-shrink: 0;
    }

    .group-header-left :global(svg) {
        color: var(--accent);
        flex-shrink: 0;
    }

    .group-label {
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        letter-spacing: 0.01em;
    }

    .group-count {
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--cds-text-02);
        background: var(--cds-ui-03);
        padding: 0 0.375rem;
        border-radius: 8px;
        min-width: 1.25rem;
        text-align: center;
        line-height: 1.25rem;
    }

    .group-chevron {
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 5px solid var(--cds-text-02);
        transition: transform 0.15s ease;
    }

    .group-details:not([open]) .group-chevron {
        transform: rotate(-90deg);
    }

    .group-table-wrapper {
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .group-table-wrapper :global(.bx--data-table) {
        border: none;
    }

    .group-table-wrapper :global(.bx--data-table thead) {
        background: var(--cds-ui-01);
    }

    .group-table-wrapper :global(.bx--data-table thead th) {
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--cds-text-02);
        padding-top: 0.375rem;
        padding-bottom: 0.375rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .group-table-wrapper :global(.bx--data-table tbody tr) {
        transition: background 0.1s ease;
    }

    .group-table-wrapper :global(.bx--data-table tbody tr:hover) {
        background: var(--cds-hover-ui);
    }

    .group-table-wrapper :global(.bx--data-table td) {
        border-bottom: 1px solid color-mix(in srgb, var(--cds-ui-03) 50%, transparent);
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        vertical-align: middle;
    }

    .cell-title {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }

    .cell-title-text {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--cds-text-01);
        line-height: 1.3;
    }

    .cell-title-id {
        font-size: 0.6875rem;
        color: var(--cds-text-placeholder);
        font-family: var(--cds-code-01-font-family, "IBM Plex Mono", monospace);
    }

    .cell-priority {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .cell-priority :global(svg) {
        flex-shrink: 0;
        color: var(--cds-text-02);
    }

    .cell-type {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .cell-type :global(svg) {
        flex-shrink: 0;
        color: var(--cds-text-02);
    }

    .cell-labels {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex-wrap: wrap;
    }

    .labels-more {
        font-size: 0.6875rem;
        color: var(--cds-text-02);
        font-weight: 500;
    }

    .cell-due {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: var(--cds-text-02);
    }

    .cell-due :global(svg) {
        flex-shrink: 0;
        color: var(--cds-text-02);
    }

    .cell-due.overdue {
        color: var(--cds-support-01);
        font-weight: 500;
    }

    .cell-due.overdue :global(svg) {
        color: var(--cds-support-01);
    }

    .cell-date {
        font-size: 0.8125rem;
        color: var(--cds-text-02);
    }

    .cell-muted {
        color: var(--cds-text-placeholder);
    }

    .cell-actions {
        display: flex;
        justify-content: flex-end;
    }

    .group-empty {
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        font-size: 0.75rem;
        color: var(--cds-text-placeholder);
        font-style: italic;
        border-bottom: 1px solid var(--cds-ui-03);
    }
</style>
