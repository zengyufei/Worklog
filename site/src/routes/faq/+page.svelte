<script>
    import Plus from "@lucide/svelte/icons/plus";
    import Minus from "@lucide/svelte/icons/minus";
    import { slide } from "svelte/transition";
    import { base } from "$app/paths";

    const categories = [
        {
            name: "Data & Privacy",
            items: [
                {
                    q: "Where is my data actually stored?",
                    a: "Your data is stored locally on your machine in a SQLite database located at `.worklog/worklog.db` within your workspace directory. We never upload your project data to our servers."
                },
                {
                    q: "Is my personal access token safe?",
                    a: "Yes. Your Git Personal Access Token is stored in your OS's secure keychain (via Tauri's secure store). It is only used to authenticate directly with your Git provider."
                }
            ]
        },
        {
            name: "Synchronization",
            items: [
                {
                    q: "How does the Git sync work?",
                    a: "Worklog uses a background scheduler to keep your local workspace in parity with a private Git repository. It uses a pull-before-push strategy to ensure your history remains clean."
                },
                {
                    q: "Can I sync with GitLab or Bitbucket?",
                    a: "Currently, we offer optimized support for GitHub, but any private Git repository accessible via HTTPS and Personal Access Tokens will work."
                }
            ]
        },
        {
            name: "Usage",
            items: [
                {
                    q: "Can I use it completely offline?",
                    a: "Yes. Worklog is designed to be offline-first. All core features—board management, ticket editing, and command execution—work perfectly without an internet connection."
                },
                {
                    q: "Are there any size limits?",
                    a: "Since Worklog uses SQLite, it can handle thousands of tickets and hundreds of boards with negligible performance impact."
                }
            ]
        }
    ];

    let activeCategory = $state(0);
    let activeFaq = $state(null);

    function toggle(index) {
        activeFaq = activeFaq === index ? null : index;
    }
</script>

<svelte:head>
    <title>FAQ | Worklog</title>
</svelte:head>

<div class="min-h-screen bg-[#050505] text-white pt-40 pb-24">
    <!-- Background Glow -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-1/4 right-[-10%] w-[600px] h-[600px] bg-[#3B82F6] opacity-[0.03] blur-[150px] rounded-full"></div>
        <div class="absolute bottom-1/4 left-[-10%] w-[600px] h-[600px] bg-[#3B82F6] opacity-[0.02] blur-[150px] rounded-full"></div>
    </div>

    <div class="max-w-7xl mx-auto px-6 relative z-10">
        <div class="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
            <div class="max-w-2xl">
                <span class="text-xs font-mono text-[#3B82F6] uppercase tracking-[0.3em] mb-4 block">Information Center</span>
                <h1 class="text-6xl md:text-8xl font-serif tracking-tight mb-8">FAQ<span class="text-white/20">.</span></h1>
                <p class="text-xl text-white/50 font-light leading-relaxed">
                    Everything you need to know about Worklog's architecture, 
                    security, and usage.
                </p>
            </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-16">
            <!-- Sidebar Navigation -->
            <aside class="w-full lg:w-64 flex flex-col gap-2">
                {#each categories as cat, i}
                    <button 
                        onclick={() => { activeCategory = i; activeFaq = null; }}
                        class="px-6 py-4 rounded-xl text-left transition-all duration-300 {activeCategory === i ? 'bg-white/5 text-white border border-white/10 shadow-2xl' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'}"
                    >
                        <span class="text-sm font-medium">{cat.name}</span>
                    </button>
                {/each}
            </aside>

            <!-- FAQ Content -->
            <div class="flex-1 max-w-3xl">
                <div class="space-y-4">
                    {#each categories[activeCategory].items as item, i}
                        <button 
                            class="w-full text-left p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300 group"
                            onclick={() => toggle(i)}
                        >
                            <div class="flex justify-between items-center gap-6">
                                <h3 class="text-xl md:text-2xl font-serif text-white/80 group-hover:text-white transition-colors">
                                    {item.q}
                                </h3>
                                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-all">
                                    {#if activeFaq === i}
                                        <Minus size={18} />
                                    {:else}
                                        <Plus size={18} />
                                    {/if}
                                </div>
                            </div>

                            {#if activeFaq === i}
                                <div transition:slide={{ duration: 400 }} class="overflow-hidden">
                                    <p class="pt-6 text-lg text-white/50 font-sans font-light leading-relaxed">
                                        {item.a}
                                    </p>
                                </div>
                            {/if}
                        </button>
                    {/each}
                </div>

                <div class="mt-16 p-12 rounded-[2.5rem] bg-linear-to-br from-[#3B82F6]/10 to-transparent border border-[#3B82F6]/20 relative overflow-hidden group">
                    <div class="relative z-10">
                        <h4 class="text-2xl font-serif text-white mb-4">Still have questions?</h4>
                        <p class="text-white/60 mb-8 max-w-md font-light">
                            We're here to help you get the most out of Worklog. 
                            Connect with us on GitHub or join our community.
                        </p>
                        <a 
                            href="https://github.com/regisx001/Worklog/issues" 
                            target="_blank"
                            class="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-[#3B82F6] hover:text-white transition-all duration-300 shadow-2xl"
                        >
                            Open an Issue
                        </a>
                    </div>
                    <!-- Decorative element -->
                    <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-[#3B82F6] opacity-[0.05] blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                </div>
            </div>
        </div>
    </div>
</div>
