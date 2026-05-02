<script lang="ts">
    import {
        Modal,
        TextInput,
        TextArea,
        Dropdown,
        MultiSelect,
        DatePicker,
        DatePickerInput,
    } from "carbon-components-svelte";
    import {
        type Ticket,
        type TicketStatus,
        type TicketPriority,
        type TicketType,
        TICKET_TYPE_CONFIG,
        TICKET_TYPE_OPTIONS,
    } from "$lib/components/app/types";

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
            ticketType: TicketType;
            startDate: string;
            dueDate: string;
            tags: string[];
            status: TicketStatus;
        }) => Promise<void>;
    } = $props();

    const isEditing = $derived(!!ticket);

    let submitting = $state(false);
    let error = $state<string | null>(null);

    let form = $state<{
        id?: string;
        title: string;
        description: string;
        priority: TicketPriority;
        ticketType: TicketType;
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
                form = {
                    title: "",
                    description: "",
                    priority: "p2",
                    ticketType: "feature",
                    startDate: "",
                    dueDate: "",
                    tags: [],
                };
            }
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
            open = false;
        } catch (e) {
            error = String(e);
        } finally {
            submitting = false;
        }
    }
</script>

<Modal
    bind:open
    modalHeading={isEditing ? "Edit Ticket" : "New Ticket"}
    primaryButtonText={isEditing ? "Save Changes" : "Create Ticket"}
    secondaryButtonText="Cancel"
    on:click:button--primary={handleSubmit}
    on:click:button--secondary={() => (open = false)}
    primaryButtonDisabled={!form.title.trim() || submitting}
    size="sm"
>
    <div class="modal-form">
        {#if error}
            <p class="modal-error">{error}</p>
        {/if}
        <TextInput
            labelText="Title *"
            placeholder="e.g. Implement login screen"
            bind:value={form.title}
        />
        <TextArea
            labelText="Description"
            placeholder="Describe the ticket…"
            rows={3}
            bind:value={form.description}
        />
        <div class="form-row">
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
                items={TICKET_TYPE_OPTIONS.map((typeKey) => ({
                    id: typeKey,
                    text: TICKET_TYPE_CONFIG[typeKey].label,
                }))}
            />
        </div>
        <div class="form-row">
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
        <MultiSelect
            label="Select tags…"
            items={TAG_OPTIONS.map((t) => ({ id: t, text: t }))}
            bind:selectedIds={form.tags}
        />
    </div>
</Modal>

<style>
    .modal-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-block: 0.5rem;
    }
    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    .modal-error {
        color: var(--cds-support-01);
        font-size: 0.8125rem;
        margin: 0;
    }
</style>
