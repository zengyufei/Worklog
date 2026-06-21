/**
 * Hook for browsing and reading board documentation markdown files.
 *
 * Files live on the filesystem at `.worklog/boards/<board_id>/docs/`.
 */

import { exists, mkdir, readDir, readTextFile, remove, rename, writeTextFile } from '@tauri-apps/plugin-fs';

export interface DocFileEntry {
    /** Display name (e.g. "README.md", "meeting-notes/2026-06-17.md") */
    name: string;
    /** Relative path from the docs root (e.g. "README.md", "meeting-notes/2026-06-17.md") */
    relativePath: string;
    /** Full absolute path on disk */
    fullPath: string;
    /** Whether this entry is a directory */
    isDir: boolean;
    /** Child entries (populated for directories) */
    children: DocFileEntry[];
}

export function docsDir(workspacePath: string, boardId: string): string {
    return `${workspacePath}/.worklog/boards/${boardId}/docs`;
}

/**
 * Recursively list all `.md` files in a board's docs directory.
 * Returns empty array if the directory doesn't exist yet.
 */
export async function listDocFiles(
    workspacePath: string,
    boardId: string,
): Promise<DocFileEntry[]> {
    try {
        const dir = docsDir(workspacePath, boardId);
        const dirExists = await exists(dir);
        if (!dirExists) return [];

        return await listDirRecursive(dir, dir);
    } catch (e) {
        console.error('[board-docs] Failed to list doc files:', e);
        return [];
    }
}

async function listDirRecursive(
    absoluteDir: string,
    rootDir: string,
): Promise<DocFileEntry[]> {
    const entries = await readDir(absoluteDir);
    const results: DocFileEntry[] = [];

    for (const entry of entries) {
        // Skip hidden files
        if (entry.name?.startsWith('.')) continue;

        if (entry.isDirectory) {
            const children = await listDirRecursive(
                `${absoluteDir}/${entry.name}`,
                rootDir,
            );
            // Only include directories that have .md files inside
            if (children.length > 0) {
                results.push({
                    name: entry.name!,
                    relativePath: absoluteDir === rootDir
                        ? entry.name!
                        : `${absoluteDir.replace(rootDir + '/', '')}/${entry.name!}`,
                    fullPath: `${absoluteDir}/${entry.name!}`,
                    isDir: true,
                    children,
                });
            }
        } else if (entry.name?.endsWith('.md')) {
            const relative = absoluteDir === rootDir
                ? entry.name
                : `${absoluteDir.replace(rootDir + '/', '')}/${entry.name}`;
            results.push({
                name: entry.name,
                relativePath: relative,
                fullPath: `${absoluteDir}/${entry.name}`,
                isDir: false,
                children: [],
            });
        }
    }

    // Sort: directories first, then alphabetical
    results.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
    });

    return results;
}

/**
 * Read the content of a markdown doc file.
 * Returns null if the file doesn't exist or can't be read.
 */
export async function readDocFile(
    workspacePath: string,
    boardId: string,
    relativePath: string,
): Promise<string | null> {
    try {
        const fullPath = `${docsDir(workspacePath, boardId)}/${relativePath}`;
        return await readTextFile(fullPath);
    } catch (e) {
        console.error(`[board-docs] Failed to read file ${relativePath}:`, e);
        return null;
    }
}

/**
 * Create a new markdown file in the board's docs directory.
 * Creates parent directories if they don't exist.
 * Returns the relative path of the created file, or null on failure.
 */
export async function createDocFile(
    workspacePath: string,
    boardId: string,
    fileName: string,
    content = '',
): Promise<string | null> {
    try {
        const dir = docsDir(workspacePath, boardId);

        // Ensure docs directory exists
        const dirExists = await exists(dir);
        if (!dirExists) {
            await mkdir(dir, { recursive: true });
        }

        const fullPath = `${dir}/${fileName}`;

        // Ensure parent subdirectory exists if fileName contains slashes
        if (fileName.includes('/')) {
            const parentDir = fullPath.substring(0, fullPath.lastIndexOf('/'));
            const parentExists = await exists(parentDir);
            if (!parentExists) {
                await mkdir(parentDir, { recursive: true });
            }
        }

        await writeTextFile(fullPath, content);
        console.log(`[board-docs] Created: ${fullPath}`);
        return fileName;
    } catch (e) {
        console.error(`[board-docs] Failed to create file ${fileName}:`, e);
        return null;
    }
}

/**
 * Write content to a markdown doc file.
 * Creates parent directories if they don't exist.
 * Returns true on success, false on failure.
 */
export async function writeDocFile(
    workspacePath: string,
    boardId: string,
    relativePath: string,
    content: string,
): Promise<boolean> {
    try {
        const fullPath = `${docsDir(workspacePath, boardId)}/${relativePath}`;

        // Ensure parent directory exists
        const parentDir = fullPath.substring(0, fullPath.lastIndexOf('/'));
        const parentExists = await exists(parentDir);
        if (!parentExists) {
            await mkdir(parentDir, { recursive: true });
        }

        await writeTextFile(fullPath, content);
        return true;
    } catch (e) {
        console.error(`[board-docs] Failed to write file ${relativePath}:`, e);
        return false;
    }
}

/**
 * Delete a markdown file from the board's docs directory.
 * Returns true on success, false on failure.
 */
export async function deleteDocFile(
    workspacePath: string,
    boardId: string,
    relativePath: string,
): Promise<boolean> {
    try {
        const fullPath = `${docsDir(workspacePath, boardId)}/${relativePath}`;
        await remove(fullPath);
        return true;
    } catch (e) {
                console.error(`[board-docs] Failed to delete file ${relativePath}:`, e);
        return false;
    }
}

/**
 * Rename a file or directory inside the board's docs directory.
 * Returns the new relative path on success, null on failure.
 */
export async function renameDocFile(
    workspacePath: string,
    boardId: string,
    oldRelativePath: string,
    newName: string,
): Promise<string | null> {
    try {
        const dir = docsDir(workspacePath, boardId);
        const oldFullPath = `${dir}/${oldRelativePath}`;

        // Compute new relative path by replacing the last segment
        const parts = oldRelativePath.split('/');
        parts[parts.length - 1] = newName;
        const newRelativePath = parts.join('/');
        const newFullPath = `${dir}/${newRelativePath}`;

        await rename(oldFullPath, newFullPath);
        return newRelativePath;
    } catch (e) {
                console.error(`[board-docs] Failed to rename ${oldRelativePath}:`, e);
        return null;
    }
}

/**
 * Create a new subdirectory inside the board's docs directory.
 * Returns the relative path on success, null on failure.
 */
export async function createDocFolder(
    workspacePath: string,
    boardId: string,
    folderName: string,
): Promise<string | null> {
    try {
        const dir = docsDir(workspacePath, boardId);
        const fullPath = `${dir}/${folderName}`;
        await mkdir(fullPath, { recursive: true });
        return folderName;
    } catch (e) {
                console.error(`[board-docs] Failed to create folder ${folderName}:`, e);
        return null;
    }
}

/**
 * Check if the docs directory exists for a board.
 */
export async function docsDirectoryExists(
    workspacePath: string,
    boardId: string,
): Promise<boolean> {
    try {
        return await exists(docsDir(workspacePath, boardId));
    } catch {
        return false;
    }
}
