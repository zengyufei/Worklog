import { browser } from "$app/environment";

const ZOOM_KEY = "worklog:app-zoom";
let globalZoom = $state(1);

if (browser) {
    const stored = localStorage.getItem(ZOOM_KEY);
    if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
            globalZoom = parsed;
        }
    }

    // Single reactive effect to handle both CSS variable and persistence
    $effect.root(() => {
        $effect(() => {
            document.documentElement.style.setProperty("--app-zoom", globalZoom.toString());
            localStorage.setItem(ZOOM_KEY, globalZoom.toString());
        });
    });
}

export function useAppZoom() {
    return {
        get zoom() {
            return globalZoom;
        },
        init() {
            // No longer needed, logic moved to module level
        },
        zoomIn() {
            if (globalZoom < 2.0) {
                globalZoom = Math.round((globalZoom + 0.1) * 10) / 10;
            }
        },
        zoomOut() {
            if (globalZoom > 0.5) {
                globalZoom = Math.round((globalZoom - 0.1) * 10) / 10;
            }
        },
        reset() {
            globalZoom = 1;
        },
        save() {
            // No longer needed, handled by $effect
        }
    };
}
