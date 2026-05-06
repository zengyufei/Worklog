<script>
    import { base } from '$app/paths';
    import { page } from '$app/state';
    import { onMount } from "svelte";
    import gsap from "gsap";
    import BookOpen from "@lucide/svelte/icons/book-open";
    import Download from "@lucide/svelte/icons/download";
    import GitBranch from "@lucide/svelte/icons/git-branch";
    import Settings from "@lucide/svelte/icons/settings";
    import Shield from "@lucide/svelte/icons/shield";
    import LayoutGrid from "@lucide/svelte/icons/layout-grid";
    import Cpu from "@lucide/svelte/icons/cpu";
    import Terminal from "@lucide/svelte/icons/terminal";

    let sidebarRef = $state();
    let navItems = $state([]);

    const menu = [
        { title: "Getting Started", items: [
            { name: "Introduction", href: "/docs", icon: BookOpen },
            { name: "Installation", href: "/docs/installation", icon: Download }
        ]},
        { title: "Product Guide", items: [
            { name: "Features", href: "/docs/features", icon: LayoutGrid },
            { name: "Git Sync", href: "/docs/git-sync", icon: GitBranch },
            { name: "Privacy", href: "/docs/privacy", icon: Shield }
        ]},
        { title: "Technical", items: [
            { name: "Architecture", href: "/docs/architecture", icon: Cpu },
            { name: "Development", href: "/docs/development", icon: Terminal }
        ]},
        { title: "Configuration", items: [
            { name: "Settings", href: "/docs/settings", icon: Settings }
        ]}
    ];

    onMount(() => {
        gsap.fromTo(navItems, 
            { x: -20, opacity: 0 }, 
            { x: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power2.out", delay: 0.5 }
        );
    });

    function isActive(href) {
        const fullHref = `${base}${href}`;
        return page.url.pathname === fullHref || (href === "/docs" && page.url.pathname === `${base}/docs/`);
    }
</script>

<aside 
    bind:this={sidebarRef}
    class="w-full md:w-64 h-auto md:h-screen md:fixed md:top-0 md:left-0 pt-32 pb-12 px-6 border-r border-white/10 bg-[#050505]/50 backdrop-blur-xl z-20"
>
    <div class="flex flex-col space-y-8">
        {#each menu as section}
            <div class="space-y-4">
                <h4 class="text-xs font-mono text-white/30 uppercase tracking-[0.2em] px-2">
                    {section.title}
                </h4>
                <ul class="space-y-1">
                    {#each section.items as item, i}
                        <li bind:this={navItems[i]}>
                            <a 
                                href="{base}{item.href}"
                                class="group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 {isActive(item.href) ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'text-white/50 hover:text-white hover:bg-white/5'}"
                            >
                                <svelte:component this={item.icon} size={18} class="transition-transform group-hover:scale-110" />
                                <span class="text-sm font-medium">{item.name}</span>
                                {#if isActive(item.href)}
                                    <div class="ml-auto w-1 h-1 rounded-full bg-[#3B82F6]"></div>
                                {/if}
                            </a>
                        </li>
                    {/each}
                </ul>
            </div>
        {/each}
    </div>
</aside>

<style>
    /* Custom scrollbar for sidebar if needed */
    aside::-webkit-scrollbar {
        width: 4px;
    }
    aside::-webkit-scrollbar-track {
        background: transparent;
    }
    aside::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
</style>
