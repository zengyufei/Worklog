<svelte:head>
    <title>Installation | Worklog Docs</title>
</svelte:head>

<h1>Installation</h1>

<p>
    Worklog is currently available for Linux and Windows. macOS support is in the roadmap.
</p>

<h2>Download</h2>

<p>
    Get the latest binaries from our <a href="https://github.com/regisx001/Worklog/releases" class="text-[#3B82F6] hover:underline">GitHub Releases</a> page.
</p>

<h3>Linux (AppImage / Deb)</h3>

<p>
    Download the <code>.AppImage</code> or <code>.deb</code> file. For AppImage, make it executable:
</p>

<pre><code>chmod +x Worklog-x86_64.AppImage
./Worklog-x86_64.AppImage</code></pre>

<h3>Windows (MSI / Exe)</h3>

<p>
    Run the <code>Worklog-Setup.exe</code> and follow the installation wizard.
</p>

<h2>Initializing Workspace</h2>

<p>
    Once installed, open Worklog and select a directory to act as your workspace. Worklog will create a hidden <code>.worklog</code> folder to store your local database and configuration.
</p>

<div class="my-8 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200">
    <strong>Note:</strong> We recommend choosing a directory that is NOT already managed by another cloud sync service (like Dropbox) to avoid database lock conflicts.
</div>

<div class="flex justify-between mt-12 pt-8 border-t border-white/10">
    <a href="./" class="text-white/40 hover:text-white transition-colors">&larr; Introduction</a>
    <a href="git-sync" class="text-white/80 hover:text-white transition-colors">Git Sync &rarr;</a>
</div>
