<script lang="ts">
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { useAllTickets } from "$lib/hooks/all-tickets.svelte";
    import { ProgressBar, Tile } from "carbon-components-svelte";
    import { TICKET_STATUS_CONFIG } from "$lib/components/app/types";

    const shell = getWorkspaceShellContext();
    const getWorkspacePath = () => shell.workspace.path;
    const ticketsHook = useAllTickets(getWorkspacePath);

    $effect(() => {
        void ticketsHook.load();
    });

    const allTickets = $derived(ticketsHook.tickets);
    const activeBoards = $derived(shell.boardsApi.boards);

    const totalBoards = $derived(activeBoards.length);
    const totalTickets = $derived(allTickets.length);
    const doneTickets = $derived(
        allTickets.filter((t) => t.status === "done").length,
    );
    const completionRate = $derived(
        totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0,
    );

    const statusCounts = $derived({
        backlog: allTickets.filter((t) => t.status === "backlog").length,
        todo: allTickets.filter((t) => t.status === "todo").length,
        in_progress: allTickets.filter((t) => t.status === "in_progress")
            .length,
        done: doneTickets,
    });

    const busiestBoards = $derived(() => {
        const counts = new Map<string, number>();
        for (const t of allTickets) {
            if (t.status !== "done") {
                counts.set(t.board_id, (counts.get(t.board_id) ?? 0) + 1);
            }
        }
        return [...counts.entries()]
            .map(([board_id, count]) => ({
                board: activeBoards.find((b) => b.id === board_id),
                count,
            }))
            .filter((b) => b.board)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // show up to 5 busiest boards now
    });
</script>

<div class="overview-layout">
    <header class="overview-header">
        <h1>Workspace Overview</h1>
        <p>A high-level view of your active boards and tickets.</p>
    </header>

    {#if ticketsHook.loading && totalTickets === 0}
        <div class="loading-state">Loading workspace data...</div>
    {:else}
        <div class="dashboard-grid">
            <!-- Metrics Widget -->
            <Tile class="widget metrics-widget">
                <h3>Metrics</h3>
                <div class="metrics-grid">
                    <div class="metric">
                        <span class="metric-val">{totalBoards}</span>
                        <span class="metric-label">Active Boards</span>
                    </div>
                    <div class="metric">
                        <span class="metric-val">{totalTickets}</span>
                        <span class="metric-label">Total Tickets</span>
                    </div>
                    <div class="metric">
                        <span class="metric-val">{completionRate}%</span>
                        <span class="metric-label">Completion</span>
                    </div>
                </div>
                <div class="progress-wrap">
                    <ProgressBar
                        value={completionRate}
                        max={100}
                        aria-label="Overall Progress"
                    />
                </div>
            </Tile>

            <!-- Status Breakdown -->
            <Tile class="widget status-widget">
                <h3>Status Breakdown</h3>
                <div class="status-bars">
                    {#each Object.entries(TICKET_STATUS_CONFIG) as [statusKey, config]}
                        <div class="status-row">
                            <span class="status-label">{config.label}</span>
                            <div class="status-track">
                                <div
                                    class="status-fill"
                                    style="width: {totalTickets > 0
                                        ? ((
                                              statusCounts as Record<
                                                  string,
                                                  number
                                              >
                                          )[statusKey] /
                                              totalTickets) *
                                          100
                                        : 0}%; background-color: var(--cds-support-{config.accentColor ===
                                    'magenta'
                                        ? '04'
                                        : config.accentColor === 'teal'
                                          ? '03'
                                          : config.accentColor === 'blue'
                                            ? '01'
                                            : '02'})"
                                ></div>
                            </div>
                            <span class="status-count"
                                >{(statusCounts as Record<string, number>)[
                                    statusKey
                                ]}</span
                            >
                        </div>
                    {/each}
                </div>
            </Tile>

            <!-- Busiest Boards -->
            <Tile class="widget boards-widget">
                <h3>Busiest Boards</h3>
                {#if busiestBoards().length > 0}
                    <div class="boards-list">
                        {#each busiestBoards() as { board, count }}
                            <div class="board-item">
                                <span class="board-name">{board?.name}</span>
                                <span class="board-count"
                                    >{count} open tickets</span
                                >
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="empty-text">No active tickets.</p>
                {/if}
            </Tile>
        </div>
    {/if}
</div>

<style>
    .overview-layout {
        padding: 2rem;
        height: 100%;
        overflow-y: auto;
        background: var(--cds-ui-background);
        box-sizing: border-box;
    }

    .overview-header {
        margin-bottom: 2rem;
    }

    .overview-header h1 {
        font-size: 2rem;
        font-weight: 400;
        margin-bottom: 0.5rem;
    }

    .overview-header p {
        color: var(--cds-text-02);
    }

    .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1rem;
    }

    :global(.widget.bx--tile) {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        min-height: 200px;
    }

    .widget h3 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
    }

    .metric {
        display: flex;
        flex-direction: column;
        text-align: left;
    }

    .metric-val {
        font-size: 2.5rem;
        font-weight: 300;
        color: var(--cds-text-01);
        line-height: 1.2;
    }

    .metric-label {
        font-size: 0.75rem;
        color: var(--cds-text-02);
        margin-top: 0.25rem;
    }

    .progress-wrap {
        margin-top: auto;
    }

    .status-bars {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .status-row {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .status-label {
        width: 80px;
        font-size: 0.875rem;
        color: var(--cds-text-02);
    }

    .status-track {
        flex: 1;
        height: 8px;
        background: var(--cds-ui-03);
    }

    .status-fill {
        height: 100%;
    }

    .status-count {
        width: 20px;
        text-align: right;
        font-size: 0.875rem;
        color: var(--cds-text-01);
    }

    .boards-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .board-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: var(--cds-ui-01);
        border-left: 4px solid var(--cds-interactive-01);
    }

    .board-name {
        font-size: 0.875rem;
        color: var(--cds-text-01);
    }

    .board-count {
        font-size: 0.75rem;
        color: var(--cds-text-02);
    }

    .empty-text {
        color: var(--cds-text-03);
        font-size: 0.875rem;
    }

    .loading-state {
        display: grid;
        place-items: center;
        height: 200px;
        color: var(--cds-text-02);
    }
</style>
