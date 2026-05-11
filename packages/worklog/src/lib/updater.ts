/**
 * Updater module — exposes a reactive state-driven API for the UI
 * to show update availability.
 *
 * NOTE: Automatic download and installation is disabled (LEGACY) due to
 * implementation complexities with AppImage/Linux environments.
 */

export type UpdateStatus =
    | "idle"
    | "checking"
    | "no-update"
    | "update-available"
    | "downloading"
    | "installing"
    | "ready-to-relaunch"
    | "install-failed"
    | "error";

export interface UpdateInfo {
    version: string;
    date: string | null;
    body: string | null;
}

export interface UpdateProgress {
    downloaded: number;
    contentLength: number;
    /** 0–100 */
    percent: number;
}

export interface UpdateState {
    status: UpdateStatus;
    info: UpdateInfo | null;
    progress: UpdateProgress;
    errorMessage: string | null;
}

export type UpdateCallback = (state: UpdateState) => void;

function makeInitialState(): UpdateState {
    return {
        status: "idle",
        info: null,
        progress: { downloaded: 0, contentLength: 0, percent: 0 },
        errorMessage: null,
    };
}

/** Classifies an error into a user-friendly message and an error type. */
function classifyError(error: unknown): {
    message: string;
    isInstallFailure: boolean;
} {
    const raw =
        error instanceof Error ? error.message : String(error);

    // Package install failure — happens on Linux deb/rpm installs (needs root)
    // and also in `tauri dev` where there's no installed binary at all.
    if (
        raw.includes("Failed to install") ||
        raw.includes("install package") ||
        raw.includes("failed to install")
    ) {
        const hint = import.meta.env.DEV
            ? "The updater cannot work in development mode."
            : "Auto-update is not supported for this installation type (e.g. .deb / .rpm on Linux).";

        return {
            message: `${hint} Download the latest version manually from the releases page.`,
            isInstallFailure: true,
        };
    }

    // Network / endpoint errors
    if (
        raw.includes("network") ||
        raw.includes("dns") ||
        raw.includes("connect") ||
        raw.includes("timed out") ||
        raw.includes("Could not fetch")
    ) {
        return {
            message:
                "Could not reach the update server. Check your internet connection and try again.",
            isInstallFailure: false,
        };
    }

    // Signature verification
    if (raw.includes("signature")) {
        return {
            message:
                "The update signature could not be verified. The update file may be corrupted.",
            isInstallFailure: false,
        };
    }

    return { message: raw, isInstallFailure: false };
}

/** The GitHub releases URL for manual downloads. */
export const RELEASES_URL =
    "https://github.com/regisx001/Worklog/releases/latest";

/**
 * Check for updates and notify the UI of the result.
 */
export async function checkForUpdate(
    onState: UpdateCallback,
): Promise<void> {
    const state: UpdateState = makeInitialState();

    const emit = () => onState({ ...state, progress: { ...state.progress } });

    try {
        // ── Checking ──────────────────────────────────────────────────
        state.status = "checking";
        emit();

        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();

        if (!update) {
            state.status = "no-update";
            emit();
            return;
        }

        // ── Update available ──────────────────────────────────────────
        state.status = "update-available";
        state.info = {
            version: update.version,
            date: update.date ?? null,
            body: update.body ?? null,
        };
        emit();
    } catch (error) {
        const classified = classifyError(error);
        state.status = "error";
        state.errorMessage = classified.message;
        emit();
    }
}

/**
 * @deprecated LEGACY — Automatic installation is not planned.
 * Use checkForUpdate and redirect users to the manual download page.
 */
export async function installUpdate(
    _onState: UpdateCallback,
    _existingState?: UpdateState,
): Promise<void> {
    console.warn("installUpdate is LEGACY and no longer functional.");
    return Promise.resolve();
}

/**
 * Relaunch the application (called after install completes).
 */
export async function relaunchApp(): Promise<void> {
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
}

// ── Internal ──────────────────────────────────────────────────────────────

/**
 * @deprecated LEGACY — Automatic download is not planned.
 */
async function downloadAndInstall(
    _update: unknown,
    _state: UpdateState,
    _emit: () => void,
): Promise<void> {
    console.warn("downloadAndInstall is LEGACY and no longer functional.");
    return Promise.resolve();
}
