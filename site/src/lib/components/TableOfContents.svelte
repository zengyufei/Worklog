<script>
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import gsap from 'gsap';

    let { container } = $props();
    let headings = $state([]);
    let activeId = $state("");

    function updateHeadings() {
        if (!container) return;
        
        const headingElements = container.querySelectorAll('h2, h3');
        headings = Array.from(headingElements).map(el => {
            // Ensure every heading has an ID for linking
            if (!el.id) {
                el.id = el.innerText.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            }
            return {
                id: el.id,
                text: el.innerText,
                level: parseInt(el.tagName.replace('H', ''))
            };
        });
    }

    $effect(() => {
        // Run update whenever container or page changes
        if (container && page.url.pathname) {
            // Wait a tick for MDSvex content to render
            setTimeout(updateHeadings, 100);
        }
    });

    onMount(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    activeId = entry.target.id;
                }
            });
        }, { rootMargin: '0px 0px -80% 0px' });

        $effect(() => {
            if (container) {
                container.querySelectorAll('h2, h3').forEach(el => observer.observe(el));
            }
            return () => observer.disconnect();
        });
    });

    function scrollToHeading(id) {
        const el = document.getElementById(id);
        if (el) {
            window.scrollTo({
                top: el.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }
</script>

{#if headings.length > 0}
    <div class="hidden xl:block fixed top-32 right-[max(2rem,calc((100vw-1280px)/2))] w-64 h-[calc(100vh-160px)] overflow-y-auto pr-4 border-l border-white/5 pl-6">
        <h4 class="text-xs font-mono text-white/30 uppercase tracking-[0.2em] mb-6">On this page</h4>
        <ul class="space-y-4">
            {#each headings as heading}
                <li 
                    class="transition-all duration-300 {heading.level === 3 ? 'pl-4' : ''}"
                >
                    <button
                        onclick={() => scrollToHeading(heading.id)}
                        class="text-left text-sm transition-colors hover:text-white {activeId === heading.id ? 'text-[#3B82F6]' : 'text-white/40'}"
                    >
                        {heading.text}
                    </button>
                </li>
            {/each}
        </ul>

        <!-- Background subtle glow -->
        <div class="absolute top-0 right-0 w-full h-full bg-[#3B82F6] opacity-[0.01] blur-[50px] pointer-events-none"></div>
    </div>
{/if}

<style>
    div::-webkit-scrollbar {
        width: 2px;
    }
    div::-webkit-scrollbar-track {
        background: transparent;
    }
    div::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
</style>
