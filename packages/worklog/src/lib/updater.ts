export async function runUpdate(): Promise<void> {
    try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const { relaunch } = await import("@tauri-apps/plugin-process");

        const update = await check();

        if (!update) {
            console.info("No update available");
            return;
        }

        console.info(
            `Update available ${update.version} from ${update.date} with notes ${update.body}`
        );

        let downloaded = 0;
        let contentLength = 0;

        await update.downloadAndInstall((event) => {
            switch (event.event) {
                case "Started":
                    contentLength = event.data.contentLength ?? 0;
                    console.info(
                        `Started downloading ${contentLength} bytes`
                    );
                    break;
                case "Progress":
                    downloaded += event.data.chunkLength ?? 0;
                    console.info(
                        `Downloaded ${downloaded} from ${contentLength}`
                    );
                    break;
                case "Finished":
                    console.info("Download finished");
                    break;
            }
        });

        console.info("Update installed");
        await relaunch();
    } catch (error) {
        console.error("Update failed", error);
        throw error;
    }
}
