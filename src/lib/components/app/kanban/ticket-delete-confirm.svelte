<script lang="ts">
    import { Modal } from "carbon-components-svelte";

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
    modalHeading="Delete Ticket"
    primaryButtonText="Delete"
    secondaryButtonText="Cancel"
    size="xs"
    primaryButtonDisabled={deleting}
    on:click:button--secondary={() => (open = false)}
    on:click:button--primary={handleDelete}
>
    <p class="delete-msg">
        {#if ticketTitle}
            Are you sure you want to delete <strong>"{ticketTitle}"</strong>?
        {:else}
            Are you sure you want to delete this ticket?
        {/if}
        This action cannot be undone.
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
