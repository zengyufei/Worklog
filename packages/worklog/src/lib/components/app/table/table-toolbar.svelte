<script lang="ts">
    import {
        Toolbar,
        ToolbarContent,
        ToolbarSearch,
        Dropdown,
        Button,
    } from "carbon-components-svelte";
    import { getTableState } from "./table-state.svelte";
    import { useTicketSort } from "$lib/hooks/ticket-sort.svelte";
    import { SortAscending, SortDescending } from "carbon-icons-svelte";

    const state = getTableState();
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

<div class="table-toolbar">
    <Toolbar>
        <ToolbarContent>
            <ToolbarSearch
                bind:value={state.searchQuery}
                placeholder="Search tickets…"
                persistent
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
    <div class="table-stats">
        <span class="stats-pill"
            >{state.totalCount} ticket{state.totalCount !== 1 ? "s" : ""}</span
        >
    </div>
</div>

<style>
    .table-toolbar {
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .table-toolbar :global(.bx--toolbar) {
        flex: 1;
    }

    .table-stats {
        padding: 0 1rem;
        flex-shrink: 0;
    }

    .stats-pill {
        font-size: 0.75rem;
        color: var(--cds-text-02);
        background: var(--cds-ui-01);
        padding: 0.125rem 0.625rem;
        border-radius: 10px;
        white-space: nowrap;
        border: 1px solid var(--cds-ui-03);
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
