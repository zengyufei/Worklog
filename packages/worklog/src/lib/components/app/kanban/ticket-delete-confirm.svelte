<script lang="ts">
    import { Modal } from "carbon-components-svelte";
    import * as m from "$lib/paraglide/messages.js";

    let {
        open = $bindable(false),
        ticketTitle = "",
        onConfirm,
    }: {
        open: boolean;
        ticketTitle?: string;
        onConfirm: () => Promise<void>;
    } = $props();

    let deleting = $state(false);

    async function handleDelete() {
        try {
            deleting = true;
            await onConfirm();
            open = false;
        } catch (e) {
            console.error("Delete failed:", e);
        } finally {
            deleting = false;
        }
    }
</script>

<Modal
    danger
    bind:open
    modalHeading={m.delete_ticket_heading()}
    primaryButtonText={m.delete_ticket_btn()}
    secondaryButtonText={m.delete_ticket_cancel()}
    size="xs"
    primaryButtonDisabled={deleting}
    on:click:button--secondary={() => (open = false)}
    on:click:button--primary={handleDelete}
>
    <p class="delete-msg">
        {#if ticketTitle}
            {@html m.delete_ticket_msg_title({ title: `<strong>${ticketTitle}</strong>` })}
        {:else}
            {m.delete_ticket_msg()}
        {/if}
        {m.delete_ticket_warning()}
    </p>
</Modal>

<style>
    .delete-msg {
        margin: 0;
        font-size: 0.875rem;
        color: var(--cds-text-01);
        line-height: 1.5;
    }
</style>
