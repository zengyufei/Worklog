<script lang="ts">
    import {
        Document,
        DocumentAdd,
        Edit,
        Folder,
        ChevronRight,
        ChevronDown,
        Notebook,
    } from "carbon-icons-svelte";
    import { Button } from "carbon-components-svelte";
    import {
        listDocFiles,
        readDocFile,
        writeDocFile,
        createDocFile,
        docsDirectoryExists,
        type DocFileEntry,
    } from "$lib/hooks/board-docs.svelte";

    interface Props {
        workspacePath: string;
        boardId: string;
    }

    let { workspacePath, boardId }: Props = $props();

    // ── State ──────────────────────────────────────────────────────────────
    let files = $state<DocFileEntry[]>([]);
    let selectedPath = $state<string | null>(null);
    let fileContent = $state<string | null>(null);
    let loading = $state(true);
    let hasDocsDir = $state(false);
    let expandedFolders = $state<Set<string>>(new Set());
    let error = $state<string | null>(null);

    // ── Editor state ───────────────────────────────────────────────────────
    let editing = $state(false);
    let draftContent = $state("");
    let pendingSave = $state(false);
    let editDraftEl = $state<HTMLTextAreaElement | null>(null);
    let saving = $state(false);

    // ── Load file tree ─────────────────────────────────────────────────────
    async function loadFiles() {
        loading = true;
        error = null;
        try {
            const exists = await docsDirectoryExists(workspacePath, boardId);
            hasDocsDir = exists;

            if (exists) {
                const entries = await listDocFiles(workspacePath, boardId);
                files = entries;
                // Auto-expand all top-level directories
                for (const entry of entries) {
                    if (entry.isDir) {
                        expandedFolders.add(entry.relativePath);
                    }
                }
            }
        } catch (e) {
            error = String(e);
            files = [];
        } finally {
            loading = false;
        }
    }

    // Reload when board changes
    $effect(() => {
        // Read reactive deps
        const _workspacePath = workspacePath;
        const _boardId = boardId;
        if (!_workspacePath || !_boardId) return;
        void loadFiles();
    });

    // ── File selection ─────────────────────────────────────────────────────
    let prevSelectedPath = $state<string | null>(null);

    async function selectFile(entry: DocFileEntry) {
        if (entry.isDir) return;
        selectedPath = entry.relativePath;
    }

    $effect(() => {
        if (!selectedPath || selectedPath === prevSelectedPath) return;
        prevSelectedPath = selectedPath;
        fileContent = null;

        void (async () => {
            try {
                const content = await readDocFile(
                    workspacePath,
                    boardId,
                    selectedPath!,
                );
                fileContent = content;
            } catch (e) {
                fileContent = `*Error reading file: ${e}*`;
            }
        })();
    });

    // ── Create new note ────────────────────────────────────────────────────
    let creating = $state(false);

    async function handleCreateNote() {
        creating = true;
        try {
            const result = await createDocFile(
                workspacePath,
                boardId,
                "README.md",
                `# ${boardId}\n\nNotes for this board.\n`,
            );
            if (result) {
                await loadFiles();
                // Auto-select the new file
                const newEntry = findEntry(files, result);
                if (newEntry) {
                    selectedPath = newEntry.relativePath;
                }
            }
        } finally {
            creating = false;
        }
    }

    function findEntry(
        entries: DocFileEntry[],
        relativePath: string,
    ): DocFileEntry | null {
        for (const entry of entries) {
            if (entry.relativePath === relativePath) return entry;
            if (entry.isDir) {
                const found = findEntry(entry.children, relativePath);
                if (found) return found;
            }
        }
        return null;
    }

    // ── Editor mode ────────────────────────────────────────────────────────
    function enterEditMode() {
        if (!fileContent) return;
        draftContent = fileContent;
        editing = true;

        // Focus textarea on next tick after render
        requestAnimationFrame(() => {
            editDraftEl?.focus();
        });
    }

    async function handleSave() {
        if (!selectedPath || saving) return;
        saving = true;
        try {
            const saved = await writeDocFile(
                workspacePath,
                boardId,
                selectedPath,
                draftContent,
            );
            if (saved) {
                fileContent = draftContent;
            }
        } finally {
            saving = false;
        }
    }

    function exitEditMode() {
        void handleSave().then(() => {
            editing = false;
        });
    }

    function handleEditorKeydown(e: KeyboardEvent) {
        // Ctrl+S → save
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            void handleSave();
            return;
        }
        // Esc → save & exit
        if (e.key === "Escape") {
            e.preventDefault();
            void exitEditMode();
            return;
        }
    }

    // When switching files while editing, save first
    $effect(() => {
        if (!editing || !selectedPath) return;
        if (selectedPath !== prevSelectedPath) {
            // User clicked a different file — save draft first
            void handleSave().then(() => {
                editing = false;
            });
        }
    });

    // ── Folder toggle ──────────────────────────────────────────────────────
    function toggleFolder(relativePath: string) {
        if (expandedFolders.has(relativePath)) {
            expandedFolders.delete(relativePath);
        } else {
            expandedFolders.add(relativePath);
        }
        // Trigger reactivity by creating a new Set
        expandedFolders = new Set(expandedFolders);
    }

    // ── Inline markdown renderer ───────────────────────────────────────────
    function renderMarkdown(md: string): string {
        const lines = md.split("\n");
        const htmlParts: string[] = [];
        let inParagraph = false;

        function closeParagraph() {
            if (inParagraph) {
                htmlParts.push("</p>");
                inParagraph = false;
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Blank line → paragraph break
            if (trimmed === "") {
                closeParagraph();
                continue;
            }

            // Headings
            const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch) {
                closeParagraph();
                const level = headingMatch[1].length;
                const text = escapeHtml(inlineMarkdown(headingMatch[2]));
                htmlParts.push(`<h${level}>${text}</h${level}>`);
                continue;
            }

            // Unordered list items
            const listMatch = trimmed.match(/^[-*+]\s+(.+)$/);
            if (listMatch) {
                closeParagraph();
                const text = escapeHtml(inlineMarkdown(listMatch[1]));
                htmlParts.push(`<li>${text}</li>`);
                continue;
            }

            // Horizontal rule
            if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
                closeParagraph();
                htmlParts.push("<hr>");
                continue;
            }

            // Regular paragraph line
            if (!inParagraph) {
                htmlParts.push("<p>");
                inParagraph = true;
            } else {
                htmlParts.push("<br>");
            }
            htmlParts.push(escapeHtml(inlineMarkdown(trimmed)));
        }

        closeParagraph();
        return htmlParts.join("\n");
    }

    /** Process inline markdown within a line of text (bold, code, links). */
    function inlineMarkdown(text: string): string {
        // Bold: **text** or __text__
        text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
        // Italic: *text* or _text_
        text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
        text = text.replace(/_(.+?)_/g, "<em>$1</em>");
        // Inline code: `code`
        text = text.replace(/`(.+?)`/g, "<code>$1</code>");
        // Links: [text](url)
        text = text.replace(
            /\[(.+?)\]\((.+?)\)/g,
            '<a href="$2" target="_blank" rel="noopener">$1</a>',
        );
        return text;
    }

    function escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // ── File tree rendering helpers ────────────────────────────────────────
    function isSelected(entry: DocFileEntry): boolean {
        return entry.relativePath === selectedPath;
    }

    function isExpanded(entry: DocFileEntry): boolean {
        return expandedFolders.has(entry.relativePath);
    }

    function fileIcon(_entry: DocFileEntry): any {
        return Document;
    }
</script>

<div class="board-docs">
    {#if loading}
        <div class="board-docs-loading">
            <span>Loading docs...</span>
        </div>
    {:else if !hasDocsDir && files.length === 0}
        <div class="board-docs-empty">
            <Notebook size={48} />
            <h2>No docs yet</h2>
            <p>Create your first markdown note for this board.</p>
            <Button
                kind="primary"
                icon={DocumentAdd}
                onclick={handleCreateNote}
                disabled={creating}
            >
                {creating ? "Creating..." : "New Note"}
            </Button>
        </div>
    {:else}
        <div class="board-docs-layout">
            <!-- ── File Tree Sidebar ─────────────────────────────────────── -->
            <aside class="board-docs-tree">
                <div class="board-docs-tree-header">
                    <span class="board-docs-tree-title">Docs</span>
                    <button
                        class="board-docs-new-btn"
                        onclick={handleCreateNote}
                        disabled={creating}
                        aria-label="Create new note"
                        title="New note"
                    >
                        <DocumentAdd size={16} />
                    </button>
                </div>
                <nav class="board-docs-tree-list" aria-label="Document files">
                    {#each files as entry (entry.relativePath)}
                        {#if entry.isDir}
                            <div class="tree-folder">
                                <button
                                    class="tree-folder-toggle"
                                    onclick={() =>
                                        toggleFolder(entry.relativePath)}
                                    aria-expanded={isExpanded(entry)}
                                >
                                    {#if isExpanded(entry)}
                                        <ChevronDown size={14} />
                                    {:else}
                                        <ChevronRight size={14} />
                                    {/if}
                                    <Folder size={14} />
                                    <span>{entry.name}</span>
                                </button>
                                {#if isExpanded(entry)}
                                    <div class="tree-folder-children">
                                        {#each entry.children as child (child.relativePath)}
                                            <button
                                                class="tree-file"
                                                class:tree-file--selected={isSelected(
                                                    child,
                                                )}
                                                onclick={() =>
                                                    selectFile(child)}
                                            >
                                                <Document size={14} />
                                                <span>{child.name}</span>
                                            </button>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {:else}
                            <button
                                class="tree-file"
                                class:tree-file--selected={isSelected(entry)}
                                onclick={() => selectFile(entry)}
                            >
                                <Document size={14} />
                                <span>{entry.name}</span>
                            </button>
                        {/if}
                    {/each}
                </nav>
            </aside>

            <!-- ── Content Area ──────────────────────────────────────────── -->
            <main class="board-docs-content">
                {#if !selectedPath}
                    <div class="board-docs-content-empty">
                        <Notebook size={40} />
                        <p>Select a file from the tree to preview it</p>
                    </div>
                {:else if fileContent === null}
                    <div class="board-docs-content-loading">
                        <span>Loading...</span>
                    </div>
                {:else if !editing}
                    <!-- ── Read-Only Preview ────────────────────────────── -->
                    <article class="board-docs-preview">
                        <div class="board-docs-preview-header">
                            <span class="board-docs-preview-filename"
                                >{selectedPath}</span
                            >
                            <button
                                class="board-docs-edit-btn"
                                onclick={enterEditMode}
                                aria-label="Edit file"
                                title="Edit (E)"
                            >
                                <Edit size={14} />
                                <span>Edit</span>
                            </button>
                        </div>
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="markdown-body"
                            onclick={(e) => {
                                // Open external links in new window
                                const target = e.target as HTMLElement;
                                if (
                                    target.tagName === "A" &&
                                    target.getAttribute("target") === "_blank"
                                ) {
                                    e.preventDefault();
                                    const href = target.getAttribute("href");
                                    if (href) {
                                        window.open(href, "_blank", "noopener");
                                    }
                                }
                            }}
                        >
                            {@html renderMarkdown(fileContent)}
                        </div>
                    </article>
                {:else}
                    <!-- ── Split-Pane Editor ────────────────────────────── -->
                    <article class="board-docs-editor">
                        <div class="board-docs-editor-header">
                            <span class="board-docs-editor-filename"
                                >{selectedPath}</span
                            >
                            <div class="board-docs-editor-actions">
                                {#if saving}
                                    <span class="board-docs-editor-saving"
                                        >Saving...</span
                                    >
                                {/if}
                                <button
                                    class="board-docs-done-btn"
                                    onclick={exitEditMode}
                                    disabled={saving}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                        <div class="board-docs-editor-panes">
                            <textarea
                                bind:this={editDraftEl}
                                class="board-docs-editor-textarea"
                                bind:value={draftContent}
                                onkeydown={handleEditorKeydown}
                                onblur={() => {
                                    if (editing) {
                                        void handleSave();
                                    }
                                }}
                                spellcheck="false"
                                aria-label="Markdown editor"
                            ></textarea>
                            <div class="board-docs-editor-preview">
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    class="markdown-body"
                                    onclick={(e) => {
                                        const target = e.target as HTMLElement;
                                        if (
                                            target.tagName === "A" &&
                                            target.getAttribute("target") ===
                                                "_blank"
                                        ) {
                                            e.preventDefault();
                                            const href =
                                                target.getAttribute("href");
                                            if (href) {
                                                window.open(
                                                    href,
                                                    "_blank",
                                                    "noopener",
                                                );
                                            }
                                        }
                                    }}
                                >
                                    {@html renderMarkdown(draftContent)}
                                </div>
                            </div>
                        </div>
                    </article>
                {/if}
            </main>
        </div>
    {/if}
</div>

<style>
    .board-docs {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    /* ── Loading / Empty states ──────────────────────────────────────────── */
    .board-docs-loading,
    .board-docs-empty {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--cds-spacing-04, 0.75rem);
        color: var(--cds-text-02);
        text-align: center;
        padding: var(--cds-spacing-07, 2rem);
    }

    .board-docs-empty h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--cds-text-01);
    }

    .board-docs-empty p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--cds-text-02);
        max-width: 24rem;
        line-height: 1.5;
    }

    /* ── Layout: tree sidebar + content ──────────────────────────────────── */
    .board-docs-layout {
        display: flex;
        flex: 1;
        min-height: 0;
    }

    /* ── File Tree Sidebar ───────────────────────────────────────────────── */
    .board-docs-tree {
        width: 220px;
        flex-shrink: 0;
        border-right: 1px solid var(--cds-ui-03);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--cds-ui-01, #f4f4f4);
    }

    :global(.t--dark) .board-docs-tree {
        background: var(--cds-ui-01, #2c2c2c);
    }

    .board-docs-tree-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.625rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .board-docs-tree-title {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--cds-text-02);
    }

    .board-docs-new-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        cursor: pointer;
        color: var(--cds-text-02);
        transition: background 0.12s ease;
    }

    .board-docs-new-btn:hover {
        background: var(--cds-hover-ui, #e8e8e8);
    }

    .board-docs-new-btn:disabled {
        opacity: 0.4;
        cursor: default;
    }

    .board-docs-tree-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.25rem 0;
    }

    /* ── Tree nodes ──────────────────────────────────────────────────────── */
    .tree-file,
    .tree-folder-toggle {
        all: unset;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        width: 100%;
        padding: 0.3125rem 0.625rem;
        font-size: 0.8125rem;
        color: var(--cds-text-01);
        cursor: pointer;
        box-sizing: border-box;
        transition: background 0.1s ease;
        line-height: 1.3;
    }

    .tree-file:hover,
    .tree-folder-toggle:hover {
        background: var(--cds-hover-ui, #e8e8e8);
    }

    .tree-file--selected {
        background: var(--cds-selected-ui, #e0e0e0);
        color: var(--cds-text-01);
        font-weight: 500;
    }

    .tree-folder-toggle {
        font-weight: 500;
    }

    .tree-folder-children {
        padding-left: 1.25rem;
    }

    .tree-file span,
    .tree-folder-toggle span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* ── Content Area ────────────────────────────────────────────────────── */
    .board-docs-content {
        flex: 1;
        min-width: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }

    .board-docs-content-empty,
    .board-docs-content-loading {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--cds-spacing-03, 0.5rem);
        color: var(--cds-text-02);
        font-size: 0.875rem;
        padding: var(--cds-spacing-07, 2rem);
    }

    .board-docs-preview,
    .board-docs-editor {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .board-docs-preview {
        padding: 0;
        max-width: 48rem;
    }

    /* ── Preview header ──────────────────────────────────────────────────── */
    .board-docs-preview-header,
    .board-docs-editor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.4375rem 1.25rem;
        border-bottom: 1px solid var(--cds-ui-03);
        flex-shrink: 0;
    }

    .board-docs-preview-filename,
    .board-docs-editor-filename {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--cds-text-02);
        font-family: "IBM Plex Mono", "SF Mono", "Fira Code", monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .board-docs-edit-btn {
        all: unset;
        display: inline-flex;
        align-items: center;
        gap: 0.3125rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.8125rem;
        color: var(--cds-text-02);
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.12s ease;
    }

    .board-docs-edit-btn:hover {
        background: var(--cds-hover-ui, #e8e8e8);
    }

    /* ── Editor split pane ───────────────────────────────────────────────── */
    .board-docs-editor-panes {
        flex: 1;
        display: flex;
        min-height: 0;
    }

    .board-docs-editor-textarea {
        flex: 1;
        min-width: 0;
        resize: none;
        border: none;
        outline: none;
        padding: 1rem;
        font-family: "IBM Plex Mono", "SF Mono", "Fira Code", monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        color: var(--cds-text-01);
        background: var(--cds-ui-background, #ffffff);
        border-right: 1px solid var(--cds-ui-03);
        tab-size: 2;
    }

    :global(.t--dark) .board-docs-editor-textarea {
        background: var(--cds-ui-background, #1a1a1a);
    }

    .board-docs-editor-textarea::placeholder {
        color: var(--cds-text-03);
    }

    .board-docs-editor-preview {
        flex: 1;
        min-width: 0;
        overflow-y: auto;
        padding: 1rem 1.25rem;
    }

    .board-docs-editor-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .board-docs-editor-saving {
        font-size: 0.75rem;
        color: var(--cds-text-03);
        animation: docs-saving-pulse 1s ease-in-out infinite;
    }

    @keyframes docs-saving-pulse {
        0%,
        100% {
            opacity: 0.5;
        }
        50% {
            opacity: 1;
        }
    }

    .board-docs-done-btn {
        all: unset;
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--cds-text-04, #ffffff);
        background: var(--cds-interactive-01, #0f62fe);
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.12s ease;
    }

    .board-docs-done-btn:hover {
        background: var(--cds-hover-primary, #0353e9);
    }

    .board-docs-done-btn:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .board-docs-preview .markdown-body {
        padding: 1.25rem 1.5rem;
    }

    /* ── Markdown rendered body ──────────────────────────────────────────── */
    .markdown-body {
        font-size: 0.9375rem;
        line-height: 1.65;
        color: var(--cds-text-01);
        word-wrap: break-word;
    }

    .markdown-body :global(h1) {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.75rem 0;
        padding-bottom: 0.375rem;
        border-bottom: 1px solid var(--cds-ui-03);
    }

    .markdown-body :global(h2) {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 1.25rem 0 0.5rem 0;
    }

    .markdown-body :global(h3) {
        font-size: 1.0625rem;
        font-weight: 600;
        margin: 1rem 0 0.375rem 0;
    }

    .markdown-body :global(p) {
        margin: 0 0 0.625rem 0;
    }

    .markdown-body :global(li) {
        margin: 0.1875rem 0;
        padding-left: 0.375rem;
        list-style: disc;
        margin-left: 1.25rem;
        font-size: 0.9375rem;
    }

    .markdown-body :global(code) {
        font-family: "IBM Plex Mono", "SF Mono", "Fira Code", monospace;
        font-size: 0.8125rem;
        background: var(--cds-ui-02, #f4f4f4);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
    }

    :global(.t--dark) .markdown-body :global(code) {
        background: var(--cds-ui-02, #393939);
    }

    .markdown-body :global(a) {
        color: var(--cds-link-01, #0f62fe);
        text-decoration: underline;
    }

    .markdown-body :global(hr) {
        border: none;
        border-top: 1px solid var(--cds-ui-03);
        margin: 1rem 0;
    }

    .markdown-body :global(strong) {
        font-weight: 600;
    }
</style>
