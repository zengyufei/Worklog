/**
 * Updater module — exposes a reactive state-driven API for the UI
 * to show rich feedback during the check → download → install → relaunch cycle.
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
 * Check for updates, download, install, and relaunch — calling `onState`
 * with every status transition so the UI can render rich feedback.
 *
 * Set `autoInstall` to false to stop after finding an update and let the
 * user decide when to proceed (call `installUpdate()` later).
 */
export async function checkForUpdate(
    onState: UpdateCallback,
    autoInstall = false,
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

        if (!autoInstall) return; // let UI call installUpdate()

        // ── Download & install ────────────────────────────────────────
        await downloadAndInstall(update, state, emit);
    } catch (error) {
        const classified = classifyError(error);
        state.status = classified.isInstallFailure ? "install-failed" : "error";
        state.errorMessage = classified.message;
        emit();
    }
}

/**
 * Download and install a previously found update, with full progress
 * tracking and state callbacks.
 */
export async function installUpdate(
    onState: UpdateCallback,
    existingState?: UpdateState,
): Promise<void> {
    const state: UpdateState = existingState
        ? { ...existingState, progress: { ...existingState.progress } }
        : makeInitialState();

    const emit = () => onState({ ...state, progress: { ...state.progress } });

    try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();

        if (!update) {
            state.status = "no-update";
            emit();
            return;
        }

        await downloadAndInstall(update, state, emit);
    } catch (error) {
        const classified = classifyError(error);
        state.status = classified.isInstallFailure ? "install-failed" : "error";
        state.errorMessage = classified.message;
        emit();
    }
}

/**
 * Relaunch the application (called after install completes).
 */
export async function relaunchApp(): Promise<void> {
    const { relaunch } = await import("@tauri-apps/plugin-process");
    await relaunch();
}

// ── Internal ──────────────────────────────────────────────────────────────

async function downloadAndInstall(
    update: Awaited<ReturnType<typeof import("@tauri-apps/plugin-updater")["check"]>> & {},
    state: UpdateState,
    emit: () => void,
): Promise<void> {
    state.status = "downloading";
    state.progress = { downloaded: 0, contentLength: 0, percent: 0 };
    emit();

    await update.downloadAndInstall((event) => {
        switch (event.event) {
            case "Started":
                state.progress.contentLength = event.data.contentLength ?? 0;
                emit();
                break;
            case "Progress":
                state.progress.downloaded += event.data.chunkLength ?? 0;
                if (state.progress.contentLength > 0) {
                    state.progress.percent = Math.min(
                        100,
                        Math.round(
                            (state.progress.downloaded /
                                state.progress.contentLength) *
                                100,
                        ),
                    );
                }
                emit();
                break;
            case "Finished":
                state.progress.percent = 100;
                state.status = "installing";
                emit();
                break;
        }
    });

    state.status = "ready-to-relaunch";
    emit();
}
