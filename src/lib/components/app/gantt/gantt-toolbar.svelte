<script lang="ts">
    import { Toolbar, ToolbarContent, ToolbarSearch, Button } from "carbon-components-svelte";
    import { getGanttState } from "./gantt-state.svelte";

    const state = getGanttState();
</script>

<div class="gantt-toolbar">
    <Toolbar>
        <ToolbarContent>
            <ToolbarSearch
                persistent
                bind:value={state.searchQuery}
                placeholder="Search tickets..."
            />
        </ToolbarContent>
    </Toolbar>
    <div class="gantt-zoom">
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
</div>

<style>
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
</style>
