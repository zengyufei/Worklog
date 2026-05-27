<script lang="ts">
    import { goto } from "$app/navigation";
    import KanbanBoard from "$lib/components/app/kanban/kanban-board.svelte";
    import TableView from "$lib/components/app/table/table-board.svelte";
    import GanttView from "$lib/components/app/gantt/gantt-board.svelte";
    import CalendarView from "$lib/components/app/calendar/calendar-board.svelte";
    import {
        Loading,
        InlineNotification,
        Button,
        Dropdown,
    } from "carbon-components-svelte";
    import {
        Dashboard,
        Table,
        ChartBarFloating,
        Calendar,
        WarningHex,
        ArrowLeft,
        Search,
        SortAscending,
        SortDescending,
    } from "carbon-icons-svelte";
    import { useTicketSort } from "$lib/hooks/ticket-sort.svelte";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";
    import { useTickets } from "$lib/hooks/tickets.svelte";
    import * as m from "$lib/paraglide/messages.js";

    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    const shell = getWorkspaceShellContext();
    const { boardsApi } = shell;

    const board = $derived(
        boardsApi.boards.find((item) => item.id === data.boardId) ?? null,
    );

    const ticketsApi = useTickets(
        () => shell.workspace.path,
        () => board?.id ?? null,
    );

    function goToWorkspaceRoot() {
        void goto("/workspace");
    }

    let selectedTab = $state(0);
    let lastRestoredBoardId = $state<string | null>(null);

    // ── Search & Sort (shared across all views) ────────────────────────────────
    let searchQuery = $state("");
    const sortHook = useTicketSort();
    const sortItems = $derived([
        { id: "position", text: m.board_sort_manual() },
        { id: "priority", text: m.board_sort_priority() },
        { id: "due_date", text: m.board_sort_due_date() },
        { id: "created_at", text: m.board_sort_created() },
        { id: "title", text: m.board_sort_title() },
        { id: "ticket_type", text: m.board_sort_type() },
    ]);

    // ── Tab indicator ──────────────────────────────────────────────────────────────────────
    let tabBtn0 = $state<HTMLButtonElement | null>(null);
    let tabBtn1 = $state<HTMLButtonElement | null>(null);
    let tabBtn2 = $state<HTMLButtonElement | null>(null);
    let tabBtn3 = $state<HTMLButtonElement | null>(null);
    let indicatorEl = $state<HTMLElement | null>(null);

    $effect(() => {
        const btns = [tabBtn0, tabBtn1, tabBtn2, tabBtn3];
        const btn = btns[selectedTab];
        const el = indicatorEl;
        if (!btn || !el) return;
        el.style.setProperty("--tab-x", `${btn.offsetLeft}px`);
        el.style.setProperty("--tab-w", `${btn.offsetWidth}px`);
    });

    $effect(() => {
        if (!board) {
            return;
        }

        // Save last board ID globally
        localStorage.setItem("worklog:last_board_id", board.id);

        if (boardsApi.active?.id === board.id) {
            return;
        }

        boardsApi.setActive(board);
    });

    let loadError = $state<string | null>(null);

    // Load tickets when board changes
    $effect(() => {
        if (!board) return;
        void (async () => {
            try {
                loadError = null;
                await ticketsApi.load();
            } catch (e) {
                loadError = String(e);
            }
        })();
    });

    // Save/Restore tab index (Board-specific)
    $effect(() => {
        if (!board) return;

        if (lastRestoredBoardId !== board.id) {
            const saved = localStorage.getItem(
                `worklog:last_tab_index:${board.id}`,
            );
            if (saved !== null) {
                selectedTab = parseInt(saved, 10);
            } else {
                // Global fallback or default to Kanban (0)
                const globalSaved = localStorage.getItem(
                    "worklog:last_tab_index",
                );
                selectedTab =
                    globalSaved !== null ? parseInt(globalSaved, 10) : 0;
            }
            lastRestoredBoardId = board.id;
        } else {
            // Save both board-specific and global preference
            localStorage.setItem(
                `worklog:last_tab_index:${board.id}`,
                selectedTab.toString(),
            );
            localStorage.setItem(
                "worklog:last_tab_index",
                selectedTab.toString(),
            );
        }
    });
</script>

{#if boardsApi.loading}
    <main class="workspace-state">
        <article aria-busy="true">{m.board_loading()}</article>
    </main>
{:else if !board}
    <main class="workspace-state">
        <article class="workspace-missing-board">
            <div class="workspace-missing-board-icon">
                <WarningHex size={48} />
            </div>
            <h1>{m.board_not_found()}</h1>
            <p>
                {m.board_not_found_desc()}
            </p>
            <div class="workspace-missing-board-actions">
                <Button
                    kind="primary"
                    icon={ArrowLeft}
                    onclick={goToWorkspaceRoot}
                >
                    {m.board_back_to_workspace()}
                </Button>
            </div>
        </article>
    </main>
{:else}
    <main class="workspace-board-shell">
        <header class="workspace-board-header">
            <div class="board-title-group">
                <h1>{board.name}</h1>
                {#if board.description}
                    <p class="board-description">{board.description}</p>
                {/if}
            </div>
        </header>

        <section class="workspace-board-content" aria-label="Board content">
            {#if loadError}
                <div class="workspace-board-error">
                    <InlineNotification
                        kind="error"
                        title={m.board_load_error()}
                        subtitle={loadError}
                        hideCloseButton
                    />
                </div>
            {/if}

            {#if ticketsApi.loading}
                <div class="workspace-board-loading">
                    <Loading
                        withOverlay={false}
                        description={m.board_loading_data()}
                    />
                </div>
            {/if}
            <!-- ── Controls Bar: tabs left, search+sort right ─────────────────── -->
            <div class="board-controls-bar">
                <!-- Tab buttons -->
                <div class="board-tabs" role="tablist" aria-label="Board views">
                    <button
                        bind:this={tabBtn0}
                        role="tab"
                        aria-selected={selectedTab === 0}
                        class="view-tab"
                        class:view-tab--active={selectedTab === 0}
                        onclick={() => (selectedTab = 0)}
                    >
                        <Dashboard size={16} />
                        <span>{m.board_tab_board()}</span>
                    </button>
                    <button
                        bind:this={tabBtn1}
                        role="tab"
                        aria-selected={selectedTab === 1}
                        class="view-tab"
                        class:view-tab--active={selectedTab === 1}
                        onclick={() => (selectedTab = 1)}
                    >
                        <Table size={16} />
                        <span>{m.board_tab_table()}</span>
                    </button>
                    <button
                        bind:this={tabBtn2}
                        role="tab"
                        aria-selected={selectedTab === 2}
                        class="view-tab"
                        class:view-tab--active={selectedTab === 2}
                        onclick={() => (selectedTab = 2)}
                    >
                        <ChartBarFloating size={16} />
                        <span>{m.board_tab_timeline()}</span>
                    </button>
                    <button
                        bind:this={tabBtn3}
                        role="tab"
                        aria-selected={selectedTab === 3}
                        class="view-tab"
                        class:view-tab--active={selectedTab === 3}
                        onclick={() => (selectedTab = 3)}
                    >
                        <Calendar size={16} />
                        <span>{m.board_tab_calendar()}</span>
                    </button>
                    <span
                        bind:this={indicatorEl}
                        class="tab-indicator"
                        aria-hidden="true"
                    ></span>
                </div>

                <!-- Search + Sort controls -->
                <div class="board-controls-right">
                    <div class="search-wrap">
                        <Search size={14} class="search-icon" />
                        <input
                            type="search"
                            class="search-input"
                            placeholder={m.board_search_placeholder()}
                            bind:value={searchQuery}
                            aria-label={m.board_search_label()}
                        />
                    </div>
                    <div class="sort-wrap">
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
                                ? m.board_sort_asc()
                                : m.board_sort_desc()}
                            onclick={() => sortHook.toggleOrder()}
                        >
                            {#if sortHook.sortOrder === "asc"}
                                <SortAscending />
                            {:else}
                                <SortDescending />
                            {/if}
                        </Button>
                    </div>
                </div>
            </div>

            <!-- ── Tab Content ─────────────────────────────────────────────────── -->
            <div class="view-tab-content">
                {#if selectedTab === 0}
                    <KanbanBoard {searchQuery} />
                {:else if selectedTab === 1}
                    <TableView {searchQuery} />
                {:else if selectedTab === 2}
                    <GanttView {searchQuery} />
                {:else if selectedTab === 3}
                    <CalendarView {searchQuery} />
                {/if}
            </div>
        </section>
    </main>
{/if}

<style>
    .workspace-state {
        min-height: 100%;
        display: grid;
        place-items: center;
        padding: var(--cds-spacing-05, 1rem);
    }

    .workspace-missing-board {
        margin: 0;
        max-width: 30rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--cds-spacing-05, 1rem);
        padding: var(--cds-spacing-07, 2rem);
        background: var(--cds-ui-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .workspace-missing-board-icon {
        color: var(--cds-support-01, #fa4d56);
        margin-bottom: var(--cds-spacing-03, 0.5rem);
    }

    .workspace-missing-board h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--cds-text-01);
    }

    .workspace-missing-board p {
        margin: 0;
        color: var(--cds-text-02);
        line-height: 1.5;
    }

    .workspace-missing-board-actions {
        margin-top: var(--cds-spacing-05, 1rem);
    }

    .workspace-board-shell {
        height: 100%;
        padding: var(--cds-spacing-05, 1rem);
        display: flex;
        flex-direction: column;
        gap: var(--cds-spacing-04, 0.75rem);
    }

    .workspace-board-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .workspace-board-header h1 {
        margin: 0;
    }

    .workspace-board-content {
        flex: 1;
        /* height: 100vh; */
        min-height: 0;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .workspace-board-loading {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: grid;
        place-items: center;
        background: var(--cds-ui-background);
        z-index: 1000;
        animation: workspace-board-fade-in 0.2s ease-out;
    }

    @keyframes workspace-board-fade-in {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    /* ── Board Title Group ─────────────────────────────────────────────────────────── */
    .board-title-group {
        display: flex;
        flex-direction: column;
        gap: 0.1875rem;
        min-width: 0;
    }

    .board-description {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--cds-text-02);
        opacity: 0.85;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 72ch;
        line-height: 1.4;
    }

    /* ── Controls Bar (tabs left · search+sort right) ─────────────────────────────── */
    .board-controls-bar {
        display: flex;
        align-items: stretch;
        border-bottom: 1px solid var(--cds-ui-03);
        flex-shrink: 0;
        background: var(--cds-ui-background);
    }

    /* Left section: tab buttons + sliding indicator */
    .board-tabs {
        position: relative;
        display: flex;
        align-items: stretch;
    }

    .view-tab {
        all: unset;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.625rem 1rem;
        font-size: 0.875rem;
        color: var(--cds-text-02);
        cursor: pointer;
        transition:
            color 0.15s ease,
            background 0.15s ease;
        white-space: nowrap;
        box-sizing: border-box;
    }

    .view-tab:hover {
        color: var(--cds-text-01);
        background: var(--cds-hover-ui);
    }

    .view-tab--active {
        color: var(--cds-text-01);
        font-weight: 500;
    }

    .tab-indicator {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: var(--cds-interactive-01, #0f62fe);
        border-radius: 1px 1px 0 0;
        pointer-events: none;
        transform: translateX(var(--tab-x, 0px));
        width: var(--tab-w, 0px);
        transition:
            transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
            width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Right section: search + sort */
    .board-controls-right {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0 0.5rem;
        flex-shrink: 0;
    }

    .search-wrap {
        position: relative;
        display: flex;
        align-items: center;
    }

    .search-wrap :global(.search-icon) {
        position: absolute;
        left: 0.5rem;
        color: var(--cds-text-02);
        pointer-events: none;
        flex-shrink: 0;
    }

    .search-input {
        all: unset;
        height: 2rem;
        padding: 0 0.625rem 0 1.875rem;
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        background: var(--cds-field-01);
        border: 1px solid var(--cds-ui-03);
        border-radius: 4px;
        width: 13rem;
        box-sizing: border-box;
        transition:
            border-color 0.15s ease,
            width 0.2s ease;
    }

    .search-input::placeholder {
        color: var(--cds-text-03);
    }

    .search-input:focus {
        outline: 2px solid var(--cds-focus, #0f62fe);
        outline-offset: -2px;
        border-color: transparent;
        width: 18rem;
    }

    /* Hide the browser's native search cancel button */
    .search-input::-webkit-search-cancel-button {
        display: none;
    }

    .sort-wrap {
        display: flex;
        align-items: center;
        gap: 0;
    }

    :global(.sort-wrap .bx--dropdown) {
        width: auto;
        min-width: 130px;
        border-bottom: none;
        height: 2rem;
    }

    :global(.sort-wrap .bx--dropdown-text) {
        font-size: 0.8125rem;
    }

    :global(.sort-wrap .bx--list-box__menu-icon) {
        height: 2rem;
        width: 2rem;
    }

    :global(.sort-wrap .bx--btn--ghost.bx--btn--sm) {
        height: 2rem;
        padding: 0 0.5rem;
    }

    .view-tab-content {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .workspace-board-error {
        padding: var(--cds-spacing-05, 1rem);
    }
</style>
