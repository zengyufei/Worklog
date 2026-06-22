<script lang="ts">
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { getWorkspaceOverview } from "$lib/hooks/workspace-overview.svelte";
    import * as m from "$lib/paraglide/messages.js";

    const shell = getWorkspaceShellContext();
    const overview = getWorkspaceOverview(() => shell.workspace.path);

    $effect(() => {
        void overview.load();
    });

    // ── Chart tooltip state ────────────────────────────────────────────────
    let chartTooltip = $state<{
        visible: boolean;
        x: number;
        y: number;
        date: string;
        created: number;
        completed: number;
    }>({ visible: false, x: 0, y: 0, date: "", created: 0, completed: 0 });

    function showTooltip(
        e: MouseEvent,
        date: string,
        created: number,
        completed: number,
    ) {
        const rect = (e.currentTarget as HTMLElement)
            .closest(".chart-container")
            ?.getBoundingClientRect();
        if (!rect) return;
        chartTooltip = {
            visible: true,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            date,
            created,
            completed,
        };
    }

    function moveTooltip(e: MouseEvent) {
        const rect = (e.currentTarget as HTMLElement)
            .closest(".chart-container")
            ?.getBoundingClientRect();
        if (!rect) return;
        chartTooltip.x = e.clientX - rect.left;
        chartTooltip.y = e.clientY - rect.top;
    }

    function hideTooltip() {
        chartTooltip.visible = false;
    }

    // ── Date range ──────────────────────────────────────────────────────────
    const dateRange = $derived(() => {
        const now = new Date();
        const past = new Date(now);
        past.setDate(past.getDate() - 30);
        const fmt = (d: Date) =>
            d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        return `${fmt(past)} - ${fmt(now)}`;
    });

    const currentDateRange = $derived(dateRange());

    // ── Status accent colors ────────────────────────────────────────────────
    const STATUS_ACCENTS: Record<string, string> = {
        backlog: "var(--cds-support-04, #8a3ffc)",
        todo: "var(--cds-support-03, #009d9a)",
        in_progress: "var(--cds-support-01, #0f62fe)",
        done: "var(--cds-support-02, #24a148)",
    };

    const PRIORITY_BADGE: Record<string, string> = {
        p1: "#da1e28",
        p2: "#f1c21b",
        p3: "#24a148",
    };

    const PRIORITY_COLORS: Record<string, string> = {
        High: "var(--cds-support-01, #da1e28)",
        Medium: "var(--cds-support-03, #f1c21b)",
        Low: "var(--cds-support-02, #24a148)",
    };
</script>

<div class="overview-layout">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="overview-header">
        <div class="overview-header-left">
            <h1>{m.overview_title()}</h1>
            <span class="overview-date-range">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 32 32"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <rect x="4" y="6" width="24" height="24" rx="2" />
                    <path d="M4 12h24" stroke-width="2" />
                    <path d="M12 2v8" stroke-linecap="round" />
                    <path d="M20 2v8" stroke-linecap="round" />
                </svg>
                {currentDateRange}
            </span>
        </div>
        <div class="overview-header-right">
            <div class="board-selector">
                <span>All boards</span>
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 32 32"
                    fill="currentColor"><path d="M8 12l8 8 8-8z" /></svg
                >
            </div>
        </div>
    </header>

    {#if overview.loading && !overview.data}
        <div class="loading-state">Loading workspace data...</div>
    {:else if overview.error}
        <div class="error-state">Failed to load: {overview.error}</div>
    {:else if overview.data}
        {@const d = overview.data}

        <div class="dashboard-grid">
            <!-- ═══ Metrics Row ═══ -->
            <div class="widget metrics-widget">
                <div class="metrics-row">
                    <div class="metric-card">
                        <span class="metric-val">{d.metrics.activeBoards}</span>
                        <span class="metric-label"
                            >{m.overview_active_boards()}</span
                        >
                    </div>
                    <div class="metric-card">
                        <span class="metric-val">{d.metrics.totalTickets}</span>
                        <span class="metric-label"
                            >{m.overview_total_tickets()}</span
                        >
                    </div>
                    <div class="metric-card">
                        <span class="metric-val"
                            >{d.metrics.completionRate}%</span
                        >
                        <span class="metric-label"
                            >{m.overview_completion()}</span
                        >
                        <span class="metric-trend metric-trend--up">↑ 5%</span>
                    </div>
                    <div class="metric-card">
                        <span class="metric-val metric-val--overdue"
                            >{d.metrics.overdueCount}</span
                        >
                        <span class="metric-label">Overdue Tickets</span>
                        <span class="metric-trend metric-trend--down"
                            >⚠ {d.metrics.overdueCount} overdue</span
                        >
                    </div>
                </div>
            </div>

            <!-- ═══ Status Breakdown ═══ -->
            <div class="widget status-widget">
                <h3>{m.overview_status_breakdown()}</h3>
                <div class="status-bars">
                    {#each d.statusBreakdown as item}
                        <div class="status-row">
                            <span
                                class="status-dot"
                                style="background:{STATUS_ACCENTS[item.status]}"
                            ></span>
                            <span class="status-label">{item.label}</span>
                            <div class="status-track">
                                <div
                                    class="status-fill"
                                    style="width:{item.percentage}%;background:{STATUS_ACCENTS[
                                        item.status
                                    ]}"
                                ></div>
                            </div>
                            <span class="status-count">{item.count}</span>
                            <span class="status-pct">{item.percentage}%</span>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- ═══ Busiest Boards ═══ -->
            <div class="widget boards-widget">
                <h3>{m.overview_busiest_boards()}</h3>
                {#if d.busiestBoards.length > 0}
                    <div class="boards-list">
                        {#each d.busiestBoards as item}
                            <div class="board-item">
                                <div class="board-item-left">
                                    <div class="board-item-avatar">
                                        {(
                                            item.boardName[0] ?? "?"
                                        ).toUpperCase()}
                                    </div>
                                    <span class="board-name"
                                        >{item.boardName}</span
                                    >
                                </div>
                                <span class="board-count"
                                    >{item.openCount} open</span
                                >
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="empty-text">{m.overview_no_active_tickets()}</p>
                {/if}
            </div>

            <!-- ═══ Progress Over Time ═══ -->
            <div class="widget chart-widget">
                <h3>Progress Over Time</h3>
                {#if d.progressTimeline.length > 0}
                    {@const chartMax = Math.max(
                        1,
                        ...d.progressTimeline.map(
                            (p) => p.created + p.completed,
                        ),
                    )}
                    {@const barH = 80}
                    <div class="chart-container">
                        <svg
                            viewBox="0 0 340 {barH + 16}"
                            class="mini-chart"
                            preserveAspectRatio="none"
                        >
                            <!-- Y-axis grid -->
                            <line
                                x1="0"
                                y1="4"
                                x2="340"
                                y2="4"
                                stroke="var(--cds-ui-03)"
                                stroke-width="0.5"
                                opacity="0.4"
                            />
                            <line
                                x1="0"
                                y1={barH / 2 + 4}
                                x2="340"
                                y2={barH / 2 + 4}
                                stroke="var(--cds-ui-03)"
                                stroke-width="0.5"
                                opacity="0.4"
                            />
                            <line
                                x1="0"
                                y1={barH + 4}
                                x2="340"
                                y2={barH + 4}
                                stroke="var(--cds-ui-03)"
                                stroke-width="0.5"
                                opacity="0.4"
                            />
                            {#each d.progressTimeline.slice(-30) as point, i}
                                {@const x =
                                    4 +
                                    i *
                                        (336 /
                                            Math.min(
                                                d.progressTimeline.length,
                                                30,
                                            ))}
                                {@const bw = Math.max(
                                    2,
                                    336 /
                                        Math.min(
                                            d.progressTimeline.length,
                                            30,
                                        ) -
                                        2,
                                )}
                                {@const total = point.created + point.completed}
                                {@const barHeight =
                                    total > 0 ? (total / chartMax) * barH : 1}
                                {@const createdH =
                                    total > 0
                                        ? (point.created / total) * barHeight
                                        : 0}
                                {@const completedH =
                                    total > 0
                                        ? (point.completed / total) * barHeight
                                        : 0}
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <g
                                    onmouseenter={(e) =>
                                        showTooltip(
                                            e,
                                            point.date,
                                            point.created,
                                            point.completed,
                                        )}
                                    onmousemove={moveTooltip}
                                    onmouseleave={hideTooltip}
                                    style="cursor:pointer"
                                >
                                    <!-- Completed bar (top segment — stacked above created) -->
                                    <rect
                                        {x}
                                        y={barH + 4 - barHeight}
                                        width={bw}
                                        height={completedH}
                                        fill="var(--cds-support-02)"
                                        opacity="0.85"
                                        rx="1"
                                    />
                                    <!-- Created bar (bottom segment — sits below completed) -->
                                    <rect
                                        {x}
                                        y={barH + 4 - barHeight + completedH}
                                        width={bw}
                                        height={createdH}
                                        fill="var(--cds-support-01)"
                                        opacity="0.6"
                                        rx="1"
                                    />
                                </g>
                            {/each}
                        </svg>

                        {#if chartTooltip.visible}
                            <div
                                class="chart-tooltip"
                                style="left:{chartTooltip.x}px; top:{chartTooltip.y}px"
                            >
                                <div class="chart-tooltip-date">
                                    {chartTooltip.date}
                                </div>
                                <div class="chart-tooltip-row">
                                    <span
                                        class="chart-tooltip-dot"
                                        style="background:var(--cds-support-02)"
                                    ></span>
                                    Completed: {chartTooltip.completed}
                                </div>
                                <div class="chart-tooltip-row">
                                    <span
                                        class="chart-tooltip-dot"
                                        style="background:var(--cds-support-01)"
                                    ></span>
                                    Created: {chartTooltip.created}
                                </div>
                                {#if chartTooltip.created + chartTooltip.completed > 0}
                                    <div class="chart-tooltip-total">
                                        Total: {chartTooltip.created +
                                            chartTooltip.completed}
                                    </div>
                                {/if}
                            </div>
                        {/if}
                        <div class="chart-legend">
                            <span class="legend-item"
                                ><span
                                    class="legend-dot"
                                    style="background:var(--cds-support-01)"
                                ></span> Created</span
                            >
                            <span class="legend-item"
                                ><span
                                    class="legend-dot"
                                    style="background:var(--cds-support-02)"
                                ></span> Completed</span
                            >
                        </div>
                    </div>
                {:else}
                    <p class="empty-text">No timeline data yet.</p>
                {/if}
            </div>

            <!-- ═══ Overdue Tickets ═══ -->
            <div class="widget overdue-widget">
                <h3>Overdue Tickets</h3>
                <div class="overdue-total">
                    <span class="overdue-total-val"
                        >{d.metrics.overdueCount}</span
                    >
                    <span class="overdue-total-label">Total overdue</span>
                </div>
                <div class="overdue-bars">
                    {#each d.overdueBreakdown as item}
                        <div class="overdue-row">
                            <span class="overdue-label">{item.priority}</span>
                            <div class="overdue-track">
                                <div
                                    class="overdue-fill"
                                    style="width:{d.metrics.overdueCount > 0
                                        ? (item.count /
                                              d.metrics.overdueCount) *
                                          100
                                        : 0}%;background:{PRIORITY_COLORS[
                                        item.priority
                                    ] || '#888'}"
                                ></div>
                            </div>
                            <span class="overdue-count">{item.count}</span>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- ═══ Top Labels ═══ -->
            <div class="widget labels-widget">
                <h3>Top Labels</h3>
                {#if d.topLabels.length > 0}
                    <div class="labels-list">
                        {#each d.topLabels as item}
                            {@const pct =
                                d.topLabels[0].count > 0
                                    ? Math.round(
                                          (item.count / d.topLabels[0].count) *
                                              100,
                                      )
                                    : 0}
                            <div class="label-row">
                                <span class="label-name">{item.label}</span>
                                <div class="label-track">
                                    <div
                                        class="label-fill"
                                        style="width:{pct}%"
                                    ></div>
                                </div>
                                <span class="label-count">{item.count}</span>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="empty-text">No labels used yet.</p>
                {/if}
            </div>

            <!-- ═══ Upcoming Deadlines ═══ -->
            <div class="widget deadlines-widget">
                <h3>Upcoming Deadlines</h3>
                {#if d.upcomingDeadlines.length > 0}
                    <div class="deadlines-list">
                        {#each d.upcomingDeadlines.slice(0, 5) as item}
                            <div class="deadline-item">
                                <div
                                    class="deadline-priority"
                                    style="background:{PRIORITY_BADGE[
                                        item.priority
                                    ] || '#888'}"
                                ></div>
                                <div class="deadline-info">
                                    <span class="deadline-title"
                                        >{item.title}</span
                                    >
                                    <span class="deadline-meta">
                                        {#if item.priority === "p1"}High{:else if item.priority === "p2"}Medium{:else if item.priority === "p3"}Low{/if}
                                        · {item.dueDate.slice(0, 10)}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <p class="empty-text">No upcoming deadlines.</p>
                {/if}
            </div>

            <!-- ═══ Recent Activity ═══ -->
            <div class="widget activity-widget">
                <h3>Recent Activity</h3>
                <div class="activity-feed">
                    {#each d.recentActivity.slice(0, 8) as item}
                        <div class="activity-item">
                            <div class="activity-dot"></div>
                            <div class="activity-body">
                                <span class="activity-desc"
                                    >{item.description}</span
                                >
                                <span class="activity-time"
                                    >{item.relativeTime}</span
                                >
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* ── Layout ─────────────────────────────────────────────────────────────── */
    .overview-layout {
        padding: 1.5rem 2rem;
        height: 100%;
        overflow-y: auto;
        background: var(--cds-ui-background);
        box-sizing: border-box;
    }

    /* ── Header ─────────────────────────────────────────────────────────────── */
    .overview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
    }

    .overview-header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .overview-header h1 {
        font-size: 1.5rem;
        font-weight: 500;
        margin: 0;
    }

    .overview-date-range {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: var(--cds-text-02);
        background: var(--cds-ui-01);
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        white-space: nowrap;
    }

    .overview-date-range svg {
        flex-shrink: 0;
    }

    .overview-header-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .board-selector {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        background: var(--cds-ui-01);
        padding: 0.25rem 0.625rem;
        border-radius: 4px;
        cursor: pointer;
        border: 1px solid var(--cds-ui-03);
        user-select: none;
    }

    .board-selector:hover {
        background: var(--cds-hover-ui);
    }

    /* ── Dashboard Grid ─────────────────────────────────────────────────────── */
    .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    /* ── Widget base ────────────────────────────────────────────────────────── */
    .widget {
        background: var(--cds-ui-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 8px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .widget h3 {
        font-size: 0.8125rem;
        font-weight: 600;
        margin: 0;
        color: var(--cds-text-02);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        flex-shrink: 0;
    }

    /* Full-width widgets */
    .metrics-widget {
        grid-column: 1 / -1;
        padding: 1rem 1.5rem;
    }

    .chart-widget {
        grid-column: span 2;
        overflow: visible;
    }

    /* ── Metrics ────────────────────────────────────────────────────────────── */
    .metrics-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0;
    }

    .metric-card {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        padding: 0 1rem;
        border-right: 1px solid var(--cds-ui-03);
    }

    .metric-card:last-child {
        border-right: none;
    }

    .metric-val {
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--cds-text-01);
        line-height: 1.2;
    }

    .metric-val--overdue {
        color: var(--cds-support-01, #da1e28);
    }

    .metric-label {
        font-size: 0.75rem;
        color: var(--cds-text-02);
    }

    .metric-trend {
        font-size: 0.6875rem;
        margin-top: 0.125rem;
    }

    .metric-trend--up {
        color: var(--cds-support-02, #24a148);
    }

    .metric-trend--down {
        color: var(--cds-support-01, #da1e28);
    }

    /* ── Status Breakdown ──────────────────────────────────────────────────── */
    .status-bars {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }

    .status-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .status-label {
        width: 72px;
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        flex-shrink: 0;
    }

    .status-track {
        flex: 1;
        height: 6px;
        background: var(--cds-ui-03);
        border-radius: 3px;
        overflow: hidden;
    }

    .status-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.4s ease;
    }

    .status-count {
        width: 24px;
        text-align: right;
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        font-weight: 500;
        flex-shrink: 0;
    }

    .status-pct {
        width: 32px;
        text-align: right;
        font-size: 0.75rem;
        color: var(--cds-text-03);
        flex-shrink: 0;
    }

    /* ── Busiest Boards ────────────────────────────────────────────────────── */
    .boards-list {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .board-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.375rem 0;
    }

    .board-item + .board-item {
        border-top: 1px solid var(--cds-ui-03);
    }

    .board-item-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .board-item-avatar {
        width: 26px;
        height: 26px;
        border-radius: 6px;
        background: linear-gradient(135deg, var(--cds-interactive-01), #8a3ffc);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.6875rem;
        font-weight: 600;
        color: #fff;
        flex-shrink: 0;
    }

    .board-name {
        font-size: 0.875rem;
        color: var(--cds-text-01);
    }

    .board-count {
        font-size: 0.75rem;
        color: var(--cds-text-02);
        background: var(--cds-ui-02);
        padding: 0.125rem 0.5rem;
        border-radius: 10px;
    }

    /* ── Mini Chart ────────────────────────────────────────────────────────── */
    .chart-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        position: relative;
    }

    .mini-chart {
        width: 100%;
        height: auto;
        min-height: 80px;
    }

    .chart-legend {
        display: flex;
        gap: 1rem;
        font-size: 0.75rem;
        color: var(--cds-text-02);
        flex-shrink: 0;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    /* ── Chart Tooltip ─────────────────────────────────────────────────────── */
    .chart-tooltip {
        position: absolute;
        transform: translate(-50%, -110%);
        background: var(--cds-ui-02, #262626);
        border: 1px solid var(--cds-ui-03, #393939);
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
        pointer-events: none;
        z-index: 50;
        white-space: nowrap;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .chart-tooltip-date {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--cds-text-01);
        margin-bottom: 0.125rem;
    }

    .chart-tooltip-row {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.6875rem;
        color: var(--cds-text-02);
    }

    .chart-tooltip-total {
        font-size: 0.6875rem;
        color: var(--cds-text-03);
        margin-top: 0.125rem;
        padding-top: 0.125rem;
        border-top: 1px solid var(--cds-ui-03);
    }

    .chart-tooltip-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    /* ── Upcoming Deadlines ────────────────────────────────────────────────── */
    .deadlines-list {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .deadline-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.5rem 0;
    }

    .deadline-item + .deadline-item {
        border-top: 1px solid var(--cds-ui-03);
    }

    .deadline-priority {
        width: 3px;
        height: 2rem;
        border-radius: 2px;
        flex-shrink: 0;
    }

    .deadline-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
        flex: 1;
    }

    .deadline-title {
        font-size: 0.875rem;
        color: var(--cds-text-01);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .deadline-meta {
        font-size: 0.6875rem;
        color: var(--cds-text-03);
    }

    /* ── Recent Activity ───────────────────────────────────────────────────── */
    .activity-feed {
        display: flex;
        flex-direction: column;
        gap: 0;
    }

    .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 0.625rem;
        padding: 0.4375rem 0;
        position: relative;
    }

    .activity-item + .activity-item::before {
        content: "";
        position: absolute;
        left: 3.5px;
        top: 0;
        width: 1px;
        height: 100%;
        background: var(--cds-ui-03);
    }

    .activity-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--cds-interactive-01);
        flex-shrink: 0;
        margin-top: 4px;
        position: relative;
        z-index: 1;
    }

    .activity-body {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        min-width: 0;
    }

    .activity-desc {
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .activity-time {
        font-size: 0.6875rem;
        color: var(--cds-text-03);
    }

    /* ── Overdue Tickets ───────────────────────────────────────────────────── */
    .overdue-total {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
    }

    .overdue-total-val {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--cds-support-01, #da1e28);
        line-height: 1;
    }

    .overdue-total-label {
        font-size: 0.75rem;
        color: var(--cds-text-02);
    }

    .overdue-bars {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .overdue-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .overdue-label {
        width: 52px;
        font-size: 0.75rem;
        color: var(--cds-text-02);
        flex-shrink: 0;
    }

    .overdue-track {
        flex: 1;
        height: 6px;
        background: var(--cds-ui-03);
        border-radius: 3px;
        overflow: hidden;
    }

    .overdue-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.4s ease;
    }

    .overdue-count {
        width: 20px;
        text-align: right;
        font-size: 0.75rem;
        color: var(--cds-text-01);
        font-weight: 500;
        flex-shrink: 0;
    }

    /* ── Top Labels ────────────────────────────────────────────────────────── */
    .labels-list {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    .label-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .label-name {
        width: 88px;
        font-size: 0.75rem;
        color: var(--cds-text-01);
        flex-shrink: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .label-track {
        flex: 1;
        height: 6px;
        background: var(--cds-ui-03);
        border-radius: 3px;
        overflow: hidden;
    }

    .label-fill {
        height: 100%;
        border-radius: 3px;
        background: linear-gradient(90deg, var(--cds-interactive-01), #8a3ffc);
        transition: width 0.4s ease;
    }

    .label-count {
        width: 24px;
        text-align: right;
        font-size: 0.75rem;
        color: var(--cds-text-01);
        font-weight: 500;
        flex-shrink: 0;
    }

    /* ── States ─────────────────────────────────────────────────────────────── */
    .empty-text {
        color: var(--cds-text-03);
        font-size: 0.8125rem;
        font-style: italic;
    }

    .loading-state {
        display: grid;
        place-items: center;
        height: 200px;
        color: var(--cds-text-02);
    }

    .error-state {
        padding: 1rem;
        color: var(--cds-support-01, #da1e28);
        font-size: 0.875rem;
    }
</style>
