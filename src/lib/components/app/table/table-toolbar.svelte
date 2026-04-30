<script lang="ts">
    import { Toolbar, ToolbarContent, ToolbarSearch } from "carbon-components-svelte";
    import { getTableState } from "./table-state.svelte";

    const state = getTableState();
</script>

<div class="table-toolbar">
    <Toolbar>
        <ToolbarContent>
            <ToolbarSearch
                bind:value={state.searchQuery}
                placeholder="Search tickets…"
                persistent
            />
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
</style>
