<script lang="ts">
    import {
        Modal,
        TextInput,
        TextArea,
        Dropdown,
        DatePicker,
        DatePickerInput,
    } from "carbon-components-svelte";
    import TagManager from "../common/tag-manager.svelte";
    import { untrack } from "svelte";
    import {
        type Ticket,
        type TicketStatus,
        type TicketPriority,
        type TicketType,
        TICKET_TYPE_CONFIG,
        TICKET_TYPE_OPTIONS,
    } from "$lib/components/app/types";

    import { getWorkspaceShellContext } from "$lib/hooks/workspace-shell-context";

    let {
        open = $bindable(false),
        ticket = null,
        defaultStatus = "todo" as TicketStatus,
        onSubmit,
    }: {
        open: boolean;
        ticket?: Ticket | null;
        defaultStatus?: TicketStatus;
        onSubmit: (data: {
            id?: string;
            title: string;
            description: string;
            priority: TicketPriority;
            ticketType: string;
            startDate: string;
            dueDate: string;
            tags: string[];
            status: TicketStatus;
        }) => Promise<void>;
    } = $props();

    const { ticketTypesApi } = getWorkspaceShellContext();

    const isEditing = $derived(!!ticket);

    let submitting = $state(false);
    let error = $state<string | null>(null);

    let form = $state<{
        id?: string;
        title: string;
        description: string;
        priority: TicketPriority;
        ticketType: string;
        startDate: string;
        dueDate: string;
        tags: string[];
    }>({
        title: "",
        description: "",
        priority: "p2",
        ticketType: "feature",
        startDate: "",
        dueDate: "",
        tags: [],
    });

    let initialForm = $state("");
    let showExitConfirm = $state(false);

    function getFormSnapshot() {
        return JSON.stringify(form);
    }

    function checkDirty() {
        return initialForm !== getFormSnapshot();
    }

    const TAG_OPTIONS = [
        "frontend",
        "backend",
        "design",
        "docs",
        "devops",
        "auth",
        "api",
        "native",
        "tauri",
        "svelte",
        "setup",
        "blocked",
    ];

    // Reset form when modal opens
    $effect(() => {
        if (open) {
            untrack(() => {
                error = null;
                if (ticket) {
                    form = {
                        id: ticket.id,
                        title: ticket.title,
                        description: ticket.description,
                        priority: ticket.priority,
                        ticketType: ticket.ticket_type,
                        startDate: ticket.start_date ?? "",
                        dueDate: ticket.due_date ?? "",
                        tags: ticket.labels ?? [],
                    };
                } else {
                    const defaultType = ticketTypesApi.types.find(t => t.is_default) || ticketTypesApi.types[0];
                    form = {
                        title: "",
                        description: "",
                        priority: "p2",
                        ticketType: defaultType?.id || "feature",
                        startDate: "",
                        dueDate: "",
                        tags: [],
                    };
                }
                // Capture the state AFTER the form has been populated
                initialForm = getFormSnapshot();
            });
        }
    });

    async function handleSubmit() {
        if (!form.title.trim()) return;
        try {
            submitting = true;
            error = null;
            await onSubmit({
                id: form.id,
                title: form.title,
                description: form.description || "",
                priority: form.priority,
                ticketType: form.ticketType,
                startDate: form.startDate,
                dueDate: form.dueDate,
                tags: form.tags,
                status: defaultStatus,
            });
            initialForm = getFormSnapshot(); // Update initial state after save
            open = false;
        } catch (e) {
            error = String(e);
        } finally {
            submitting = false;
        }
    }

    function handleRequestClose() {
        if (checkDirty()) {
            showExitConfirm = true;
        } else {
            open = false;
        }
    }

    function confirmExit() {
        showExitConfirm = false;
        open = false;
    }
</script>

<Modal
    bind:open
    modalHeading={isEditing ? "Edit Ticket" : "New Ticket"}
    primaryButtonText={isEditing ? "Save Changes" : "Create Ticket"}
    secondaryButtonText="Cancel"
    on:click:button--primary={handleSubmit}
    on:click:button--secondary={handleRequestClose}
    on:open
    on:close={(e) => {
        // Only show confirmation if we're actually closing and it's dirty
        // We use checkDirty() here to avoid constant reactive updates
        if (open && checkDirty()) {
            e.preventDefault();
            showExitConfirm = true;
        }
    }}
    primaryButtonDisabled={!form.title.trim() || submitting}
    preventCloseOnClickOutside
    size="lg"
>
    <div class="modal-form">
        {#if error}
            <p class="modal-error">{error}</p>
        {/if}

        <div class="form-main">
            <TextInput
                labelText="Title *"
                placeholder="e.g. Implement login screen"
                bind:value={form.title}
            />
            <TextArea
                labelText="Description"
                placeholder="Describe the ticket…"
                rows={6}
                bind:value={form.description}
            />
        </div>

        <div class="form-attributes">
            <div class="attribute-row">
                <Dropdown
                    labelText="Priority"
                    bind:selectedId={form.priority}
                    items={[
                        { id: "p3", text: "Low" },
                        { id: "p2", text: "Medium" },
                        { id: "p1", text: "High" },
                    ]}
                />
                <Dropdown
                    labelText="Type"
                    bind:selectedId={form.ticketType}
                    items={ticketTypesApi.types.map((t) => ({
                        id: t.id,
                        text: t.name,
                    }))}
                />
            </div>
            <div class="attribute-row">
                <DatePicker
                    bind:value={form.startDate}
                    datePickerType="single"
                    dateFormat="Y-m-d"
                >
                    <DatePickerInput
                        labelText="Start Date"
                        placeholder="yyyy-mm-dd"
                    />
                </DatePicker>
                <DatePicker
                    bind:value={form.dueDate}
                    datePickerType="single"
                    dateFormat="Y-m-d"
                >
                    <DatePickerInput
                        labelText="Due Date"
                        placeholder="yyyy-mm-dd"
                    />
                </DatePicker>
            </div>
            <div class="attribute-full">
                <TagManager
                    label="Tags"
                    availableTags={TAG_OPTIONS}
                    bind:selectedTags={form.tags}
                />
            </div>
        </div>
    </div>
</Modal>

<Modal
    danger
    bind:open={showExitConfirm}
    modalHeading="Unsaved Changes"
    primaryButtonText="Discard Changes"
    secondaryButtonText="Continue Editing"
    on:click:button--primary={confirmExit}
    on:click:button--secondary={() => (showExitConfirm = false)}
>
    <p>You have unsaved changes. Are you sure you want to discard them?</p>
</Modal>

<style>
    .modal-form {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding-block: 0.5rem;
    }

    .form-main {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-attributes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--cds-ui-03);
    }

    .attribute-row {
        display: contents;
    }

    .attribute-full {
        grid-column: 1 / -1;
    }

    .modal-error {
        color: var(--cds-support-01);
        font-size: 0.8125rem;
        margin: 0;
        padding: 0.75rem;
        background: color-mix(in srgb, var(--cds-support-01) 10%, transparent);
        border-radius: 4px;
    }
</style>
