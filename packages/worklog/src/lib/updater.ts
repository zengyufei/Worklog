export async function runUpdate(): Promise<void> {
    try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const { relaunch } = await import("@tauri-apps/plugin-process");

        const update = await check();

        if (!update?.available) {
            console.info("No update available");
            return;
        }

        console.info("Update available", update.version, update.body);

        await update.downloadAndInstall();
        await relaunch();
    } catch (error) {
        console.error("Update failed", error);
        throw error;
    }
}
