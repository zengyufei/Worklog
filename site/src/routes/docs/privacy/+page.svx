<svelte:head>
    <title>Privacy | Worklog Docs</title>
</svelte:head>

<h1>Privacy & Security</h1>

<p>
    Privacy is not an after-thought at Worklog; it's our foundational principle. 
    Because Worklog is local-first, we have no servers to store your data, which means there's nothing for us to leak or sell.
</p>

<h2>Data Ownership</h2>

<p>
    All your project data—tickets, kanban boards, workspace settings—are stored in a local SQLite database on your machine. 
    You are the sole owner of this data. We do not have access to your database unless you explicitly share it with us for support purposes.
</p>

<h2>Telemetry</h2>

<p>
    By default, Worklog sends minimal, anonymous telemetry to help us improve the app (e.g., crash reports, feature usage frequency). 
    You can disable this entirely in the app settings.
</p>

<ul>
    <li><strong>What we collect:</strong> App version, OS version, anonymous crash logs.</li>
    <li><strong>What we NEVER collect:</strong> Your ticket titles, descriptions, Git repository URLs, or Personal Access Tokens.</li>
</ul>

<h2>Third-Party Services</h2>

<p>
    When you enable <strong>Git Sync</strong>, Worklog communicates directly with your Git provider (GitHub, GitLab, etc.). 
    These interactions happen entirely within your local client using the credentials you provide. 
    We never act as a proxy for your Git traffic.
</p>

<div class="my-12 p-8 rounded-2xl bg-green-500/5 border border-green-500/10 backdrop-blur-sm">
    <h3 class="text-xl font-serif text-green-400 mb-4">Zero-Knowledge</h3>
    <p class="mb-0 text-green-100/60">
        Our business model is built on providing a great tool, not on monetizing your information. 
        As an open-source project, you can verify every line of code to ensure your data stays private.
    </p>
</div>
