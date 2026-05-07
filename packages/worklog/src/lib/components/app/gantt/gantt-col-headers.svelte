<script lang="ts">
    import { getGanttState } from "./gantt-state.svelte";

    const state = getGanttState();
</script>

<div class="gantt-col-headers" bind:this={state.rightPanelRef}>
    <div
        class="gantt-col-headers-inner"
        style="width:{state.timelineWidth}px"
    >
        {#each state.columns as col}
            <div
                class="gantt-col-h"
                style="width:{col.span * state.colWidth}px"
            >
                <span class="col-main">{col.label}</span>
                <span class="col-sub">{col.subLabel}</span>
            </div>
        {/each}
    </div>
</div>

<style>
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
        border-right: 1px solid var(--cds-ui-03);
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
</style>
