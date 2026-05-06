<svelte:head>
    <title>Git Sync | Worklog Docs</title>
</svelte:head>

<h1>Git-Native Sync</h1>

<p>
    Worklog leverages the ubiquity and reliability of Git to provide synchronization across multiple devices without needing a custom cloud backend.
</p>

<h2>How it works</h2>

<p>
    Worklog periodically commits your SQLite database changes and pushes them to a remote repository. When you open the app on another device, it performs a <code>pull --rebase</code> to merge changes.
</p>

<h2>Setup</h2>

<ol class="list-decimal pl-6 space-y-4">
    <li>Create a <strong>private</strong> repository on GitHub or GitLab.</li>
    <li>Go to <code>Settings > Git Sync</code> in the Worklog app.</li>
    <li>Paste your Repository URL and provide a Personal Access Token (PAT) with <code>repo</code> scope.</li>
    <li>Click "Enable Sync".</li>
</ol>

<h2>Sync Conflicts</h2>

<p>
    Since Worklog commits the entire SQLite binary, concurrent edits from different machines can lead to conflicts. 
    To minimize this, Worklog uses a "Last Write Wins" strategy on the binary, but also keeps a history of <code>.sql</code> dumps for manual recovery if necessary.
</p>

<div class="my-8 p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200">
    <strong>Security:</strong> Your Personal Access Token is stored in your system's secure keychain (Secret Service on Linux / Keychain on macOS / Credential Manager on Windows) and never sent to our servers.
</div>

<div class="flex justify-between mt-12 pt-8 border-t border-white/10">
    <a href="installation" class="text-white/40 hover:text-white transition-colors">&larr; Installation</a>
    <span class="text-white/20 italic">More pages coming soon...</span>
</div>
