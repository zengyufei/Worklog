import { browser } from "$app/environment";

const ZOOM_KEY = "worklog:app-zoom";
let globalZoom = $state(1);

export function useAppZoom() {
    return {
        get zoom() {
            return globalZoom;
        },
        init() {
            if (browser) {
                const stored = localStorage.getItem(ZOOM_KEY);
                if (stored) {
                    const parsed = parseFloat(stored);
                    if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
                        globalZoom = parsed;
                    }
                }
            }
        },
        zoomIn() {
            if (globalZoom < 2.0) {
                globalZoom = Math.round((globalZoom + 0.1) * 10) / 10;
                this.save();
            }
        },
        zoomOut() {
            if (globalZoom > 0.5) {
                globalZoom = Math.round((globalZoom - 0.1) * 10) / 10;
                this.save();
            }
        },
        reset() {
            globalZoom = 1;
            this.save();
        },
        save() {
            if (browser) {
                localStorage.setItem(ZOOM_KEY, globalZoom.toString());
            }
        }
    };
}
