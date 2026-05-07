<script lang="ts">
    import { getGanttState } from "./gantt-state.svelte";

    const state = getGanttState();
</script>

<div class="gantt-labels" bind:this={state.leftPanelRef}>
    {#each state.flatRows as row}
        {#if row.kind === "group"}
            <div
                class="label-group"
                style="height:{state.GROUP_H}px;--accent:{row.color}"
            >
                <span class="label-accent"></span>
                <row.icon size={14} />
                <strong>{row.label}</strong>
                <span class="label-count">{row.count}</span>
            </div>
        {:else}
            <div
                class="label-ticket"
                style="height:{state.ROW_H}px"
                class:label-overdue={state.isOverdue(row.ticket)}
            >
                <span class="label-title">{row.ticket.title}</span>
                <span class="label-meta">{state.getDaysLeft(row.ticket)}</span>
            </div>
        {/if}
    {/each}
</div>

<style>
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
        border-bottom: 1px solid var(--cds-ui-03);
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
</style>
