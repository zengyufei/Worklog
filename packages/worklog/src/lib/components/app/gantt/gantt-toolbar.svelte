<script lang="ts">
    import {
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
        Button,
        Dropdown,
    } from "carbon-components-svelte";
    import { getGanttState } from "./gantt-state.svelte";
    import { useTicketSort } from "$lib/hooks/ticket-sort.svelte";
    import { SortAscending, SortDescending } from "carbon-icons-svelte";

    const state = getGanttState();
    const sortHook = useTicketSort();

    const sortItems = [
        { id: "position", text: "Manual Order" },
        { id: "priority", text: "Priority" },
        { id: "due_date", text: "Due Date" },
        { id: "created_at", text: "Date Created" },
        { id: "title", text: "Title" },
        { id: "ticket_type", text: "Ticket Type" },
    ];
</script>

<div class="gantt-toolbar">
    <Toolbar>
        <ToolbarContent>
            <ToolbarSearch
                persistent
                bind:value={state.searchQuery}
                placeholder="Search tickets..."
            />
            <div class="toolbar-sort">
                <Dropdown
                    size="sm"
                    hideLabel
                    items={sortItems}
                    bind:selectedId={sortHook.sortBy}
                />
                <Button
                    kind="ghost"
                    size="small"
                    iconDescription={sortHook.sortOrder === "asc"
                        ? "Sort Ascending"
                        : "Sort Descending"}
                    onclick={() => sortHook.toggleOrder()}
                >
                    {#if sortHook.sortOrder === "asc"}
                        <SortAscending />
                    {:else}
                        <SortDescending />
                    {/if}
                </Button>
            </div>
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

    .toolbar-sort {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding-left: 0.5rem;
    }

    :global(.toolbar-sort .bx--dropdown) {
        width: auto;
        min-width: 140px;
        border-bottom: none;
    }

    :global(.toolbar-sort .bx--dropdown-text) {
        font-size: 0.875rem;
    }
</style>
