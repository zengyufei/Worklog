<script lang="ts">
    import { Button } from "carbon-components-svelte";
    import { ZoomIn, ZoomOut } from "carbon-icons-svelte";
    import { useAppZoom } from "$lib/hooks/app-zoom.svelte";
    import * as m from "$lib/paraglide/messages.js";

    const appZoom = useAppZoom();
</script>

<div class="zoom-controls">
    <Button
        kind="ghost"
        iconDescription={m.zoom_out()}
        icon={ZoomOut}
        on:click={() => appZoom.zoomOut()}
        disabled={appZoom.zoom <= 0.5}
        size="small"
    />
    <div class="zoom-label" title={m.zoom_reset()}>
        <Button
            kind="ghost"
            on:click={() => appZoom.reset()}
            size="small"
            class="reset-btn"
        >
            {Math.round(appZoom.zoom * 100)}%
        </Button>
    </div>
    <Button
        kind="ghost"
        iconDescription={m.zoom_in()}
        icon={ZoomIn}
        on:click={() => appZoom.zoomIn()}
        disabled={appZoom.zoom >= 2.0}
        size="small"
    />
</div>

<style>
    .zoom-controls {
        display: flex;
        align-items: center;
        background: var(--cds-ui-background);
        border: 1px solid var(--cds-ui-03);
        border-radius: 4px;
        overflow: hidden;
    }

    .zoom-label {
        display: flex;
        align-items: center;
        justify-content: center;
        border-left: 1px solid var(--cds-ui-03);
        border-right: 1px solid var(--cds-ui-03);
    }

    :global(.zoom-label .reset-btn) {
        min-width: 4.5rem;
        padding-right: 1rem;
        padding-left: 1rem;
    }
</style>
