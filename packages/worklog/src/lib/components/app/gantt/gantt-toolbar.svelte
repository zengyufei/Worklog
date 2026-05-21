<script lang="ts">
    import { Button } from "carbon-components-svelte";
    import { getGanttState } from "./gantt-state.svelte";

    const state = getGanttState();
</script>

<!-- Gantt-specific zoom controls only — search/sort live in the parent bar -->
<div class="gantt-zoom-bar">
    <Button
        kind={state.zoomLevel === "day" ? "primary" : "ghost"}
        size="small"
        on:click={() => (state.zoomLevel = "day")}>Day</Button
    >
    <Button
        kind={state.zoomLevel === "week" ? "primary" : "ghost"}
        size="small"
        on:click={() => (state.zoomLevel = "week")}>Week</Button
    >
    <Button
        kind={state.zoomLevel === "month" ? "primary" : "ghost"}
        size="small"
        on:click={() => (state.zoomLevel = "month")}>Month</Button
    >
</div>

<style>
    .gantt-zoom-bar {
        display: flex;
        gap: 2px;
        padding: 0 0.75rem;
        align-items: center;
        flex-shrink: 0;
        border-bottom: 1px solid var(--cds-ui-03);
    }
</style>
