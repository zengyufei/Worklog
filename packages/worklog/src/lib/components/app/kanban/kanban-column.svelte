<!-- src/lib/components/app/kanban/kanban-column.svelte -->
<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { flip } from "svelte/animate";
    import { Button, Tag, InlineLoading } from "carbon-components-svelte";
    import {
        Add,
        Pending,
        TaskComplete,
        InProgress as InProgressIcon,
        CheckmarkFilled,
    } from "carbon-icons-svelte";
    import KanbanTicketCard from "./kanban-ticket-card.svelte";
    import type { Ticket, TicketStatus } from "$lib/components/app/types";
    import * as m from "$lib/paraglide/messages.js";

    let {
        label,
        status,
        tickets,
        totalCount = 0,
        accentColor = "blue",
        isLoading = false,
        onconsider,
        onfinalize,
        onloadMore,
        onAddTicket,
        onEditTicket,
        onDeleteTicket,
        onStatusChange,
        onPreviewTicket,
    }: {
        label: string;
        status: TicketStatus;
        tickets: Ticket[];
        totalCount?: number;
        accentColor?: string;
        isLoading?: boolean;
        onconsider: (e: CustomEvent) => void;
        onfinalize: (e: CustomEvent) => void;
        onloadMore?: (status: TicketStatus) => void;
        onAddTicket?: (status: TicketStatus) => void;
        onEditTicket?: (ticket: Ticket) => void;
        onDeleteTicket?: (id: string) => void;
        onStatusChange?: (id: string, status: TicketStatus) => void;
        onPreviewTicket?: (ticket: Ticket) => void;
    } = $props();

    let loadingMore = $state(false);
    const hasMore = $derived(tickets.length < totalCount);

    function setupObserver(node: HTMLElement) {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
                    void (async () => {
                        loadingMore = true;
                        await onloadMore?.(status);
                        loadingMore = false;
                    })();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(node);
        return {
            destroy() {
                observer.disconnect();
            },
        };
    }

    const flipDurationMs = 180;

    // Color map for the column header accent
    const colorVarMap: Record<string, string> = {
        blue: "var(--cds-interactive-01)",
        green: "var(--cds-support-02)",
        yellow: "var(--cds-support-03)",
        red: "var(--cds-support-01)",
        magenta: "#e5399e",
        teal: "var(--cds-support-04)",
    };

    // Status icon map
    const statusIconMap: Record<TicketStatus, any> = {
        backlog: Pending,
        todo: TaskComplete,
        in_progress: InProgressIcon,
        done: CheckmarkFilled,
    };

    const headerColor = $derived(
        colorVarMap[accentColor] ?? colorVarMap["blue"],
    );

    const StatusIcon = $derived(statusIconMap[status]);

    // dndzone expects the zone list to be updated from event payloads.
    let zoneItems = $state<Ticket[]>([]);

    $effect(() => {
        zoneItems = tickets;
    });

    function handleConsider(e: CustomEvent) {
        const detail = e.detail as { items?: Ticket[] };
        zoneItems = detail.items ?? zoneItems;
        onconsider(e);
    }

    function handleFinalize(e: CustomEvent) {
        const detail = e.detail as { items?: Ticket[] };
        zoneItems = detail.items ?? zoneItems;
        onfinalize(e);
    }
</script>

<section class="kanban-column" aria-label={m.kanban_column_aria_label({ label })}>
    <!-- Column header -->
    <header class="column-header" style="--accent: {headerColor}">
        <div class="column-title-row">
            <div class="column-title-group">
                <StatusIcon size={16} class="column-status-icon" />
                <h3 class="column-label">{label}</h3>
            </div>
            <Tag size="sm" type="outline">{zoneItems.length}</Tag>
        </div>
        <div class="column-accent-bar"></div>
    </header>

    <!-- Drop zone -->
    <div
        class="drop-zone"
        use:dndzone={{
            items: zoneItems,
            flipDurationMs,
            type: "kanban-ticket",
        }}
        onconsider={handleConsider}
        onfinalize={handleFinalize}
        role="list"
        aria-label={m.kanban_column_tickets_aria_label({ label })}
    >
        {#if isLoading}
            <div class="column-loading">
                <InlineLoading description={m.kanban_column_loading()} />
            </div>
        {:else}
            {#each zoneItems as ticket (ticket.id)}
                <div
                    animate:flip={{ duration: flipDurationMs }}
                    class="ticket-wrapper"
                    role="listitem"
                >
                    <KanbanTicketCard
                        {ticket}
                        onEdit={onEditTicket}
                        onDelete={onDeleteTicket}
                        {onStatusChange}
                        onPreview={onPreviewTicket}
                    />
                </div>
            {/each}

            <!-- Intersection sentinel -->
            <div use:setupObserver class="sentinel"></div>

            {#if loadingMore}
                <div class="column-loading-more">
                    <InlineLoading description={m.kanban_column_loading_more()} />
                </div>
            {/if}

            {#if zoneItems.length === 0}
                <div class="empty-state" aria-hidden="true">
                    <span class="empty-state-text">{m.kanban_column_empty()}</span>
                </div>
            {/if}
        {/if}
    </div>

    <!-- Add ticket button -->
    <div class="column-footer">
        <Button
            kind="ghost"
            size="small"
            icon={Add}
            on:click={() => onAddTicket?.(status)}
        >
            {m.kanban_column_add_ticket()}
        </Button>
    </div>
</section>

<style>
    .kanban-column {
        display: flex;
        flex-direction: column;
        background: var(--cds-ui-background);
        border: 1px solid var(--cds-ui-03);
        width: 340px;
        flex: 0 0 340px;
        border-radius: 2px;
        overflow: hidden;
        /* Fill parent height */
        align-self: stretch;
    }

    /* Header */
    .column-header {
        padding: 0.875rem 1rem 0;
        background: var(--cds-ui-01);
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .column-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
    }

    .column-title-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .column-title-group :global(svg) {
        color: var(--accent);
        flex-shrink: 0;
    }

    .column-label {
        font-size: 0.8125rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--cds-text-01);
        margin: 0;
    }

    .column-accent-bar {
        height: 3px;
        background: var(--accent);
        margin: 0 -1rem;
        border-radius: 0;
    }

    /* Drop zone — fills remaining height */
    .drop-zone {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        min-height: 120px;
        overflow-y: auto;
        /* Hide scrollbar */
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none;  /* IE and Edge */
    }

    .drop-zone::-webkit-scrollbar {
        display: none; /* Chrome, Safari and Opera */
    }

    .ticket-wrapper {
        outline: none;
    }

    /* Empty state */
    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 80px;
    }

    .empty-state-text {
        font-size: 0.75rem;
        color: var(--cds-text-placeholder);
        font-style: italic;
    }

    .column-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    /* Footer */
    .column-footer {
        padding: 0.5rem;
        border-top: 1px solid var(--cds-ui-03);
        background: var(--cds-ui-01);
    }

    .column-footer :global(.bx--btn--ghost) {
        width: 100%;
        max-width: 100%;
        justify-content: flex-start;
        color: var(--cds-text-02);
    }

    .column-footer :global(.bx--btn--ghost:hover) {
        color: var(--cds-text-01);
        background: var(--cds-hover-ui);
    }
    .sentinel {
        height: 1px;
        width: 100%;
        pointer-events: none;
    }

    .column-loading-more {
        padding: 0.5rem;
        display: flex;
        justify-content: center;
    }
</style>
