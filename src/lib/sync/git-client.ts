import { Command } from '@tauri-apps/plugin-shell';

/**
 * Thin wrapper around the system `git` CLI, executed via tauri-plugin-shell.
 * All operations run in the specified working directory.
 *
 * NOTE: The first argument to Command.create() must match the "name" field
 * in the shell scope configuration (src-tauri/capabilities/default.json).
 * We use "git" which maps to the "git" binary via the scope's "cmd" field.
 */
export class GitClient {
    private workDir: string;

    constructor(workDir: string) {
        this.workDir = workDir;
    }

    /**
     * Executes a git command and returns stdout.
     * Throws on non-zero exit code.
     */
    private async exec(...args: string[]): Promise<string> {
        const cmd = Command.create('git', args, { cwd: this.workDir });
        const output = await cmd.execute();

        if (output.code !== 0) {
            const errorMsg = output.stderr || output.stdout || `git ${args.join(' ')} failed with code ${output.code}`;
            throw new Error(errorMsg);
        }

        return output.stdout.trim();
    }

    /**
     * Check if git is available on the system.
     * Uses a temporary directory-independent check.
     */
    async isGitAvailable(): Promise<boolean> {
        try {
            // Run git --version without depending on workDir existing
            const cmd = Command.create('git', ['--version']);
            const output = await cmd.execute();
            return output.code === 0;
        } catch {
            return false;
        }
    }

    /**
     * Check if the working directory is already a git repository.
     */
    async isRepo(): Promise<boolean> {
        try {
            await this.exec('rev-parse', '--is-inside-work-tree');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Initialize a new git repository.
     */
    async init(): Promise<void> {
        await this.exec('init');
    }

    /**
     * Set or update the remote URL.
     * Injects the access token into the HTTPS URL for authentication.
     */
    async setRemote(url: string, token: string): Promise<void> {
        // Inject token: https://github.com/... → https://<token>@github.com/...
        const authedUrl = url.replace('https://', `https://${token}@`);

        try {
            // Try to add the remote first
            await this.exec('remote', 'add', 'origin', authedUrl);
        } catch {
            // If it already exists, update it
            await this.exec('remote', 'set-url', 'origin', authedUrl);
        }
    }

    /**
     * Configure git user for commits in this repo.
     */
    async setUser(name: string, email: string): Promise<void> {
        await this.exec('config', 'user.name', name || 'Worklog');
        await this.exec('config', 'user.email', email || 'worklog@local');
    }

    /**
     * Stage all changes.
     */
    async addAll(): Promise<void> {
        await this.exec('add', '-A');
    }

    /**
     * Create a commit with the given message.
     * Returns false if there's nothing to commit.
     */
    async commit(message: string): Promise<boolean> {
        try {
            await this.exec('commit', '-m', message);
            return true;
        } catch (error) {
            // "nothing to commit" is not a real error
            if (String(error).includes('nothing to commit')) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Push to the remote.
     */
    async push(branch: string): Promise<void> {
        await this.exec('push', '-u', 'origin', branch);
    }

    /**
     * Pull from the remote (fast-forward preferred).
     */
    async pull(branch: string): Promise<void> {
        try {
            await this.exec('pull', 'origin', branch, '--ff-only');
        } catch (error) {
            // If fast-forward fails, try a regular pull
            if (String(error).includes('fatal: Not possible to fast-forward')) {
                await this.exec('pull', 'origin', branch, '--no-rebase');
            } else {
                throw error;
            }
        }
    }

    /**
     * Fetch from remote without merging.
     */
    async fetch(): Promise<void> {
        await this.exec('fetch', 'origin');
    }

    /**
     * Get the current git status (short form).
     */
    async status(): Promise<string> {
        return this.exec('status', '--short');
    }

    /**
     * Check if there are uncommitted changes.
     */
    async hasChanges(): Promise<boolean> {
        const status = await this.status();
        return status.length > 0;
    }

    /**
     * Force push (overwrite remote).
     */
    async forcePush(branch: string): Promise<void> {
        await this.exec('push', '--force', 'origin', branch);
    }

    /**
     * Hard reset to remote branch (overwrite local).
     */
    async hardReset(branch: string): Promise<void> {
        await this.exec('reset', '--hard', `origin/${branch}`);
    }
}
