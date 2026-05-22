<script lang="ts">
    import type { Ticket } from "$lib/components/app/types";
    import { getCalendarState } from "./calendar-state.svelte";
    import CalendarDayCell from "./calendar-day-cell.svelte";

    let {
        onTicketClick,
        onDateClick,
    }: {
        onTicketClick: (ticket: Ticket) => void;
        onDateClick: (date: Date) => void;
    } = $props();

    const state = getCalendarState();

    const isWeekView = $derived(state.viewMode === "week");
    const days = $derived(state.activeDays);
    const headers = $derived(state.weekdayHeaders);
</script>

<div class="cal-grid-wrap">
    <!-- Weekday headers -->
    <div class="weekday-headers">
        {#each headers as h}
            <div class="weekday-label">{h}</div>
        {/each}
    </div>

    <!-- Day cells -->
    <div class="cal-grid" class:week-view={isWeekView}>
        {#each days as day (day.dateKey)}
            <CalendarDayCell
                {day}
                {isWeekView}
                {onTicketClick}
                {onDateClick}
            />
        {/each}
    </div>
</div>

<style>
    .cal-grid-wrap {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .weekday-headers {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        border-bottom: 1px solid var(--cds-ui-03);
        flex-shrink: 0;
    }

    .weekday-label {
        padding: 0.375rem 0.5rem;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--cds-text-02);
        text-align: center;
        border-right: 1px solid var(--cds-ui-03);
    }

    .weekday-label:last-child {
        border-right: none;
    }

    .cal-grid {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-auto-rows: 1fr;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) transparent;
    }

    .cal-grid.week-view {
        grid-auto-rows: minmax(14rem, 1fr);
        overflow-y: auto;
    }

    .cal-grid::-webkit-scrollbar {
        width: 4px;
    }
    .cal-grid::-webkit-scrollbar-thumb {
        background: var(--cds-ui-04);
        border-radius: 2px;
    }
    .cal-grid::-webkit-scrollbar-track {
        background: transparent;
    }
</style>
