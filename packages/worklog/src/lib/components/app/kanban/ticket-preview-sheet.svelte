<!-- src/lib/components/app/kanban/ticket-preview-sheet.svelte -->
<script lang="ts">
    import { Tag, Button } from "carbon-components-svelte";
    import {
        Close,
        Edit,
        TrashCan,
        Calendar,
        ChatBot,
        ArrowUp,
        ArrowRight,
        ArrowDown,
        StarFilled,
        Debug,
        SettingsAdjust,
        ChartLineSmooth,
        Lightning,
        Explore,
        Bookmark,
        Checkbox,
        List,
        Warning,
        ColorPalette,
        Document,
        Pending,
        TaskComplete,
        InProgress as InProgressIcon,
        CheckmarkFilled,
        Time,
        Send,
    } from "carbon-icons-svelte";
    import {
        type Ticket,
        type TicketStatus,
        type TicketPriority,
        TICKET_PRIORITY_CONFIG,
        TICKET_STATUS_CONFIG,
    } from "$lib/components/app/types";
    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";

    let {
        ticket,
        open = $bindable(false),
        onEdit,
        onDelete,
        onStatusChange,
        onAddComment,
    }: {
        ticket: Ticket | null;
        open: boolean;
        onEdit?: (ticket: Ticket) => void;
        onDelete?: (id: string) => void;
        onStatusChange?: (id: string, status: TicketStatus) => void;
        onAddComment?: (ticketId: string, body: string) => Promise<void>;
    } = $props();

    const context = getWorkspaceShellContext();
    const ticketTypesApi = context?.ticketTypesApi;

    // ── Icon maps ────────────────────────────────────────────────────────────────
    const typeIconMap: Record<string, any> = {
        feature: StarFilled,
        bug: Debug,
        chore: SettingsAdjust,
        improvement: ChartLineSmooth,
        epic: Lightning,
        spike: Explore,
        story: Bookmark,
        task: Checkbox,
        subtask: List,
        incident: Warning,
        design: ColorPalette,
        documentation: Document,
    };

    const priorityIconMap: Record<TicketPriority, any> = {
        p1: ArrowUp,
        p2: ArrowRight,
        p3: ArrowDown,
    };

    const statusIconMap: Record<TicketStatus, any> = {
        backlog: Pending,
        todo: TaskComplete,
        in_progress: InProgressIcon,
        done: CheckmarkFilled,
    };

    // ── Derived values ───────────────────────────────────────────────────────────
    const customType = $derived(
        ticket
            ? ticketTypesApi?.types?.find((t) => t.id === ticket.ticket_type)
            : null,
    );

    const typeConfig = $derived(
        ticket
            ? {
                  label: customType?.name ?? ticket.ticket_type,
                  color: customType?.color ?? "#525252",
              }
            : null,
    );

    const TypeIcon = $derived(
        ticket
            ? (customType?.icon && typeIconMap[customType.icon]) ||
                  typeIconMap[ticket.ticket_type] ||
                  Bookmark
            : Bookmark,
    );

    const priorityConfig = $derived(
        ticket ? TICKET_PRIORITY_CONFIG[ticket.priority] : null,
    );
    const PriorityIcon = $derived(
        ticket ? priorityIconMap[ticket.priority] : ArrowRight,
    );

    const statusConfig = $derived(
        ticket ? TICKET_STATUS_CONFIG[ticket.status] : null,
    );
    const StatusIcon = $derived(
        ticket ? statusIconMap[ticket.status] : Pending,
    );

    const isOverdue = $derived.by(() => {
        if (!ticket?.due_date || ticket.status === "done") return false;
        const due = new Date(ticket.due_date);
        due.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return due < now;
    });

    function formatDate(dateStr: string | null | undefined): string {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    function close() {
        open = false;
    }

    function handleEdit() {
        if (ticket) onEdit?.(ticket);
    }

    function handleDelete() {
        if (ticket) {
            onDelete?.(ticket.id);
            close();
        }
    }

    // Close on Escape key
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && open) close();
    }

    // ── Comment input state ─────────────────────────────────────────────────────
    let commentDraft = $state("");
    let submittingComment = $state(false);
    let commentError = $state<string | null>(null);

    async function submitComment() {
        if (!ticket || !commentDraft.trim() || submittingComment) return;

        submittingComment = true;
        commentError = null;
        const body = commentDraft.trim();

        try {
            await onAddComment?.(ticket.id, body);
            commentDraft = "";
        } catch (e) {
            commentError = String(e);
        } finally {
            submittingComment = false;
        }
    }

    function handleCommentKeydown(e: KeyboardEvent) {
        // Ctrl+Enter or Cmd+Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            void submitComment();
        }
    }

    function formatCommentTimestamp(dateStr: string): string {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }

    // Clear comment input when sheet closes
    $effect(() => {
        if (!open) {
            commentDraft = "";
            commentError = null;
        }
    });

    // Stamp a class on <html> so a global CSS rule can hide all document
    // scrollbars — WebKitGTK composites them above position:fixed overlays.
    $effect(() => {
        const active = open && ticket !== null;
        document.documentElement.classList.toggle("preview-open", active);
        return () => document.documentElement.classList.remove("preview-open");
    });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
{#if open && ticket}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="sheet-backdrop"
        class:sheet-backdrop--visible={open}
        onclick={close}
        aria-hidden="true"
    ></div>
{/if}

<!-- Sheet panel -->
<aside
    class="ticket-sheet"
    class:ticket-sheet--open={open && ticket !== null}
    aria-label="Ticket details"
    aria-hidden={!open || !ticket}
>
    {#if ticket}
        <!-- ── Header ──────────────────────────────────────────────────────── -->
        <header class="sheet-header">
            <div class="sheet-header-left">
                <span class="sheet-ticket-id">#{ticket.id}</span>
                {#if statusConfig}
                    <span
                        class="sheet-status-badge sheet-status-badge--{ticket.status}"
                    >
                        <StatusIcon size={13} />
                        {statusConfig.label}
                    </span>
                {/if}
            </div>
            <div class="sheet-header-actions">
                <Button
                    kind="ghost"
                    size="small"
                    icon={Edit}
                    iconDescription="Edit ticket"
                    tooltipPosition="left"
                    onclick={handleEdit}
                />
                <Button
                    kind="danger-ghost"
                    size="small"
                    icon={TrashCan}
                    iconDescription="Delete ticket"
                    tooltipPosition="left"
                    onclick={handleDelete}
                />
                <Button
                    kind="ghost"
                    size="small"
                    icon={Close}
                    iconDescription="Close panel"
                    tooltipPosition="left"
                    onclick={close}
                />
            </div>
        </header>

        <!-- ── Priority stripe ─────────────────────────────────────────────── -->
        <div
            class="sheet-priority-bar sheet-priority-bar--{ticket.priority}"
        ></div>

        <!-- ── Scrollable body ─────────────────────────────────────────────── -->
        <div class="sheet-body">
            <!-- Title -->
            <h2 class="sheet-title">{ticket.title}</h2>

            <!-- Meta chips row -->
            <div class="sheet-chips">
                {#if priorityConfig && PriorityIcon}
                    <Tag size="sm" type={priorityConfig.tagColor}>
                        <span class="chip-inner">
                            <PriorityIcon size={12} />
                            {priorityConfig.label}
                        </span>
                    </Tag>
                {/if}
                {#if typeConfig}
                    <Tag
                        size="sm"
                        style="background-color: {typeConfig.color}; color: #fff;"
                    >
                        <span class="chip-inner">
                            <TypeIcon size={12} />
                            {typeConfig.label}
                        </span>
                    </Tag>
                {/if}
            </div>

            <!-- ── Details grid ───────────────────────────────────────────── -->
            <section class="sheet-section">
                <h3 class="sheet-section-title">Details</h3>
                <dl class="sheet-details">
                    <!-- Status -->
                    <dt>Status</dt>
                    <dd>
                        {#if statusConfig}
                            <div class="detail-status-row">
                                <StatusIcon size={14} />
                                <span>{statusConfig.label}</span>
                            </div>
                        {/if}
                    </dd>

                    <!-- Start date -->
                    <dt>Start date</dt>
                    <dd>
                        <span class="detail-date">
                            <Time size={14} />
                            {formatDate(ticket.start_date)}
                        </span>
                    </dd>

                    <!-- Due date -->
                    <dt>Due date</dt>
                    <dd>
                        <span
                            class="detail-date"
                            class:detail-date--overdue={isOverdue}
                        >
                            <Calendar size={14} />
                            {formatDate(ticket.due_date)}
                        </span>
                    </dd>

                    <!-- Created -->
                    <dt>Created</dt>
                    <dd>
                        <span class="detail-date">
                            <Calendar size={14} />
                            {formatDate(ticket.created_at)}
                        </span>
                    </dd>

                    <!-- Updated -->
                    <dt>Updated</dt>
                    <dd>
                        <span class="detail-date">
                            <Calendar size={14} />
                            {formatDate(ticket.updated_at)}
                        </span>
                    </dd>
                </dl>
            </section>

            <!-- ── Description ────────────────────────────────────────────── -->
            {#if ticket.description}
                <section class="sheet-section">
                    <h3 class="sheet-section-title">Description</h3>
                    <p class="sheet-description">{ticket.description}</p>
                </section>
            {/if}

            <!-- ── Labels ─────────────────────────────────────────────────── -->
            {#if ticket.labels?.length}
                <section class="sheet-section">
                    <h3 class="sheet-section-title">Labels</h3>
                    <div class="sheet-labels">
                        {#each ticket.labels as label}
                            <Tag size="sm" type="cool-gray">{label}</Tag>
                        {/each}
                    </div>
                </section>
            {/if}

            <!-- ── Quick status change ────────────────────────────────────── -->
            <section class="sheet-section">
                <h3 class="sheet-section-title">Move to</h3>
                <div class="sheet-status-actions">
                    {#each ["backlog", "todo", "in_progress", "done"] as TicketStatus[] as s}
                        {@const cfg = TICKET_STATUS_CONFIG[s]}
                        {@const SIcon = statusIconMap[s]}
                        <button
                            class="status-pill"
                            class:status-pill--active={ticket.status === s}
                            onclick={() => onStatusChange?.(ticket.id, s)}
                            disabled={ticket.status === s}
                            title="Move to {cfg.label}"
                        >
                            <SIcon size={14} />
                            <span>{cfg.label}</span>
                        </button>
                    {/each}
                </div>
            </section>

            <!-- ── Comments ────────────────────────────────────────────── -->
            <section class="sheet-section sheet-section--comments">
                <h3 class="sheet-section-title">
                    <ChatBot size={15} />
                    Comments
                    {#if ticket.comments?.length}
                        <span class="comment-count">{ticket.comments.length}</span>
                    {/if}
                </h3>

                <!-- Comment list -->
                {#if ticket.comments?.length}
                    <ul class="sheet-comments">
                        {#each ticket.comments as comment, i (i)}
                            <li class="comment-item">
                                <div class="comment-avatar">
                                    {comment.author.charAt(0).toUpperCase()}
                                </div>
                                <div class="comment-content">
                                    <div class="comment-meta">
                                        <span class="comment-author">{comment.author}</span>
                                        <span
                                            class="comment-time"
                                            title={new Date(comment.timestamp).toLocaleString()}
                                        >
                                            {formatCommentTimestamp(comment.timestamp)}
                                        </span>
                                    </div>
                                    <p class="comment-body">{comment.body}</p>
                                </div>
                            </li>
                        {/each}
                    </ul>
                {:else}
                    <p class="comment-empty">No comments yet. Be the first to comment!</p>
                {/if}

                <!-- Add comment input -->
                <div class="comment-input-area">
                    <textarea
                        class="comment-textarea"
                        placeholder="Add a comment… (Ctrl+Enter to send)"
                        bind:value={commentDraft}
                        onkeydown={handleCommentKeydown}
                        rows={3}
                        disabled={submittingComment}
                    ></textarea>
                    {#if commentError}
                        <p class="comment-input-error">{commentError}</p>
                    {/if}
                    <div class="comment-input-footer">
                        <span class="comment-hint">Ctrl+Enter to send</span>
                        <Button
                            size="small"
                            onclick={submitComment}
                            disabled={!commentDraft.trim() || submittingComment}
                        >
                            {#if submittingComment}
                                <span class="comment-send-spinner"></span>
                            {:else}
                                <Send size={14} />
                            {/if}
                            {submittingComment ? "Sending…" : "Send"}
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    {/if}
</aside>

<style>
    /* ── Backdrop ────────────────────────────────────────────────────────────── */
    .sheet-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0);
        z-index: 699;
        transition: background 0.25s ease;
        pointer-events: none;
    }
    .sheet-backdrop--visible {
        background: rgba(0, 0, 0, 0.35);
        pointer-events: all;
    }

    /* ── Sheet panel ─────────────────────────────────────────────────────────── */
    .ticket-sheet {
        position: fixed;
        top: 0;
        right: 0;
        height: 100dvh;
        width: min(480px, 100vw);
        background: var(--cds-ui-01);
        border-left: 1px solid var(--cds-ui-03);
        display: flex;
        flex-direction: column;
        z-index: 9999;
        overflow: hidden;

        /* Slide-in transition */
        transform: translateX(100%);
        transition:
            transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
            box-shadow 0.28s ease;
        box-shadow: none;
    }

    .ticket-sheet--open {
        transform: translateX(0);
        box-shadow: -8px 0 32px rgba(0, 0, 0, 0.28);
    }

    /* ── Header ──────────────────────────────────────────────────────────────── */
    .sheet-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 0.5rem 0.75rem 1rem;
        border-bottom: 1px solid var(--cds-ui-03);
        background: var(--cds-ui-01);
        flex-shrink: 0;
        gap: 0.5rem;
    }

    .sheet-header-left {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        min-width: 0;
    }

    .sheet-ticket-id {
        font-family: var(--cds-code-01-font-family, "IBM Plex Mono", monospace);
        font-size: 0.6875rem;
        color: var(--cds-text-helper);
        letter-spacing: 0.02em;
        white-space: nowrap;
    }

    .sheet-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.6875rem;
        font-weight: 600;
        padding: 0.1875rem 0.5rem;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
    }

    .sheet-status-badge--backlog {
        background: color-mix(in srgb, #e5399e 12%, transparent);
        color: #e5399e;
    }
    .sheet-status-badge--todo {
        background: color-mix(in srgb, var(--cds-support-04) 15%, transparent);
        color: var(--cds-support-04);
    }
    .sheet-status-badge--in_progress {
        background: color-mix(
            in srgb,
            var(--cds-interactive-01) 15%,
            transparent
        );
        color: var(--cds-interactive-01);
    }
    .sheet-status-badge--done {
        background: color-mix(in srgb, var(--cds-support-02) 15%, transparent);
        color: var(--cds-support-02);
    }

    .sheet-header-actions {
        display: flex;
        align-items: center;
        flex-shrink: 0;
    }

    /* ── Priority top bar ────────────────────────────────────────────────────── */
    .sheet-priority-bar {
        height: 3px;
        flex-shrink: 0;
    }
    .sheet-priority-bar--p3 {
        background: var(--cds-support-02);
    }
    .sheet-priority-bar--p2 {
        background: var(--cds-support-04);
    }
    .sheet-priority-bar--p1 {
        background: var(--cds-support-01);
    }

    /* ── Scrollable body ─────────────────────────────────────────────────────── */
    .sheet-body {
        flex: 1;
        overflow-y: auto;
        padding: 1.25rem 1.25rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        scrollbar-width: thin;
        scrollbar-color: var(--cds-ui-04) transparent;
    }
    .sheet-body::-webkit-scrollbar {
        width: 5px;
    }
    .sheet-body::-webkit-scrollbar-track {
        background: transparent;
    }
    .sheet-body::-webkit-scrollbar-thumb {
        background: var(--cds-ui-04);
        border-radius: 3px;
    }

    /* ── Title ───────────────────────────────────────────────────────────────── */
    .sheet-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--cds-text-01);
        line-height: 1.35;
        margin: 0;
        word-break: break-word;
    }

    /* ── Chips row ───────────────────────────────────────────────────────────── */
    .sheet-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
    }

    .chip-inner {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    /* ── Sections ────────────────────────────────────────────────────────────── */
    .sheet-section {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
    }

    .sheet-section-title {
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--cds-text-helper);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }

    /* ── Details grid ────────────────────────────────────────────────────────── */
    .sheet-details {
        display: grid;
        grid-template-columns: 6.5rem 1fr;
        gap: 0.5rem 0.75rem;
        margin: 0;
    }

    .sheet-details dt {
        font-size: 0.75rem;
        color: var(--cds-text-helper);
        align-self: center;
    }

    .sheet-details dd {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--cds-text-01);
    }

    .detail-status-row {
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }

    .detail-date {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--cds-text-02);
    }

    .detail-date--overdue {
        color: var(--cds-support-01);
        font-weight: 500;
    }

    /* ── Description ─────────────────────────────────────────────────────────── */
    .sheet-description {
        font-size: 0.875rem;
        line-height: 1.65;
        color: var(--cds-text-02);
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
    }

    /* ── Labels ──────────────────────────────────────────────────────────────── */
    .sheet-labels {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
    }

    /* ── Status action pills ─────────────────────────────────────────────────── */
    .sheet-status-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
    }

    .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.3125rem 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--cds-ui-04);
        background: transparent;
        color: var(--cds-text-02);
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition:
            background 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease;
    }

    .status-pill:hover:not(:disabled) {
        background: var(--cds-hover-ui);
        border-color: var(--cds-interactive-03);
        color: var(--cds-text-01);
    }

    .status-pill--active {
        background: var(--cds-interactive-01);
        border-color: var(--cds-interactive-01);
        color: #fff;
        cursor: default;
    }

    .status-pill:disabled {
        opacity: 1;
    }

    /* ── Comments ────────────────────────────────────────────────────────────── */
    .sheet-comments {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .comment-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--cds-ui-04);
        color: var(--cds-text-01);
        font-size: 0.625rem;
        font-weight: 700;
        border-radius: 999px;
        min-width: 1.125rem;
        height: 1.125rem;
        padding: 0 0.25rem;
    }

    .comment-item {
        display: flex;
        gap: 0.625rem;
        align-items: flex-start;
    }

    .comment-avatar {
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 50%;
        background: var(--cds-interactive-01);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        flex-shrink: 0;
    }

    .comment-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .comment-meta {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .comment-author {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--cds-text-01);
    }

    .comment-time {
        font-size: 0.6875rem;
        color: var(--cds-text-helper);
    }

    .comment-body {
        font-size: 0.8125rem;
        color: var(--cds-text-02);
        margin: 0;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .comment-empty {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--cds-text-helper);
        font-style: italic;
    }

    /* ── Comment input ───────────────────────────────────────────────────────── */
    .sheet-section--comments {
        gap: 0.875rem;
    }

    .comment-input-area {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
        border: 1px solid var(--cds-ui-04);
        border-radius: 4px;
        background: var(--cds-ui-background);
        transition: border-color 0.15s ease;
    }

    .comment-input-area:focus-within {
        border-color: var(--cds-interactive-01);
        box-shadow: 0 0 0 1px var(--cds-interactive-01);
    }

    .comment-textarea {
        width: 100%;
        padding: 0.625rem 0.75rem;
        background: transparent;
        border: none;
        outline: none;
        resize: none;
        font-size: 0.8125rem;
        font-family: var(--font-body);
        color: var(--cds-text-01);
        line-height: 1.5;
        box-sizing: border-box;
    }

    .comment-textarea::placeholder {
        color: var(--cds-text-placeholder);
    }

    .comment-textarea:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .comment-input-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.375rem 0.5rem 0.5rem;
        border-top: 1px solid var(--cds-ui-03);
    }

    .comment-hint {
        font-size: 0.6875rem;
        color: var(--cds-text-helper);
    }

    .comment-send-spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .comment-input-error {
        margin: 0 0.75rem 0.25rem;
        font-size: 0.75rem;
        color: var(--cds-support-01);
    }
</style>
