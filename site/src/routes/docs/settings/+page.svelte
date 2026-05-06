<svelte:head>
    <title>Settings | Worklog Docs</title>
</svelte:head>

<h1>Settings & Customization</h1>

<p>
    Worklog is designed to be highly configurable to match your personal
    workflow and aesthetic preferences.
</p>

<h2>Appearance</h2>

<p>
    You can toggle between <strong>Light</strong>, <strong>Dark</strong>, and
    <strong>System</strong> themes. On Windows and macOS, Worklog supports mica/acrylic
    background effects for a more native feel.
</p>

<h2>Keyboard Shortcuts</h2>

<p>
    The core of the Worklog experience is the Command Palette (<code
        >Ctrl+K</code
    >
    or <code>Cmd+K</code>). From here, you can access all settings and perform
    actions rapidly.
</p>

<ul>
    <li><code>Ctrl+N</code>: New Ticket</li>
    <li><code>Ctrl+F</code>: Search Workspace</li>
    <li><code>Ctrl+,</code>: Open Settings</li>
</ul>

<h2>Advanced Settings</h2>

<p>
    For power users, you can edit the <code>config.json</code> file directly in
    your <code>.worklog</code> directory. This allows for custom CSS injection and
    advanced Git hook configurations.
</p>

<pre><code>
  "theme": "dark",
  "gitSync": 
    "interval": 300,
    "autoCommit": true
  ,
  "customCss": "./styles/user.css"
</code></pre>

<div class="flex justify-between mt-12 pt-8 border-t border-white/10">
    <a href="git-sync" class="text-white/40 hover:text-white transition-colors"
        >&larr; Git Sync</a
    >
    <a href="../" class="text-white/80 hover:text-white transition-colors"
        >Home</a
    >
</div>
