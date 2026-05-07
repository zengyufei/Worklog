<script>
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import gsap from "gsap";
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import Maximize2 from "@lucide/svelte/icons/maximize-2";
    import X from "@lucide/svelte/icons/x";

    const screenshots = [
        {
            src: `${base}/screenshots/01_main_kanban_view.png`,
            title: "Kanban Board",
            desc: "Intuitive drag-and-drop workflow management.",
        },
        {
            src: `${base}/screenshots/02_table_view.png`,
            title: "Table View",
            desc: "Powerful data filtering and bulk editing.",
        },
        {
            src: `${base}/screenshots/03_gantt_timeline_view.png`,
            title: "Gantt Chart",
            desc: "Visualize project timelines and dependencies.",
        },
        {
            src: `${base}/screenshots/04_main_kanban_view_light.png`,
            title: "Light Mode",
            desc: "Beautiful light theme for day-time productivity.",
        },
        {
            src: `${base}/screenshots/05_setting.png`,
            title: "Global Settings",
            desc: "Centralized configuration for your workspace.",
        },
        {
            src: `${base}/screenshots/06_setting_customization.png`,
            title: "Customization",
            desc: "Tailor the UI to match your personal style.",
        },
        {
            src: `${base}/screenshots/07_setting_git_sync.png`,
            title: "Git Sync",
            desc: "Secure, local-first synchronization via Git.",
        },
        {
            src: `${base}/screenshots/08_command_palette.png`,
            title: "Command Palette",
            desc: "Easy navigation and actions using command palette.",
        },
    ];

    let scrollContainer = $state();
    let selectedIndex = $state(null);

    const selectedImage = $derived(
        selectedIndex !== null ? screenshots[selectedIndex] : null,
    );

    function scroll(direction) {
        const amount = scrollContainer.clientWidth * 0.8;
        scrollContainer.scrollBy({
            left: direction === "left" ? -amount : amount,
            behavior: "smooth",
        });
    }

    function openLightbox(index) {
        selectedIndex = index;
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        selectedIndex = null;
        document.body.style.overflow = "auto";
    }

    function handleKeydown(e) {
        if (selectedIndex === null) return;

        if (e.key === "Escape") {
            closeLightbox();
        } else if (e.key === "ArrowRight") {
            selectedIndex = (selectedIndex + 1) % screenshots.length;
        } else if (e.key === "ArrowLeft") {
            selectedIndex =
                (selectedIndex - 1 + screenshots.length) % screenshots.length;
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);

        // Initial animation
        gsap.from(".gallery-item", {
            x: 100,
            opacity: 0,
            duration: 1,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: "#gallery",
                start: "top 80%",
            },
        });

        return () => {
            window.removeEventListener("keydown", handleKeydown);
        };
    });
</script>

<section
    id="gallery"
    class="w-full bg-[#050505] py-32 border-t border-white/5 relative z-10"
>
    <div
        class="max-w-[1400px] mx-auto px-6 mb-12 flex items-end justify-between"
    >
        <div class="flex flex-col gap-4">
            <span
                class="text-xs font-mono text-[#3B82F6] uppercase tracking-[0.3em]"
                >Visual Interface</span
            >
            <h2
                class="text-4xl md:text-5xl font-serif text-white tracking-tight"
            >
                Experience Worklog.
            </h2>
        </div>
        <div class="flex gap-4">
            <button
                onclick={() => scroll("left")}
                class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/5 hover:border-[#3B82F6]/50 transition-all duration-300"
                aria-label="Previous image"
            >
                <ChevronLeft size={20} />
            </button>
            <button
                onclick={() => scroll("right")}
                class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/5 hover:border-[#3B82F6]/50 transition-all duration-300"
                aria-label="Next image"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    </div>

    <div
        bind:this={scrollContainer}
        class="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 md:px-12 pb-12"
    >
        {#each screenshots as shot, i}
            <div
                class="gallery-item flex-shrink-0 w-[85vw] md:w-[60vw] lg:w-[45vw] snap-center group relative cursor-pointer"
                onclick={() => openLightbox(i)}
                onkeydown={(e) => e.key === "Enter" && openLightbox(i)}
                role="button"
                tabindex="0"
            >
                <div
                    class="relative aspect-video rounded-3xl overflow-hidden bg-[#0A0A0A] border border-white/10 shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]"
                >
                    <img
                        src={shot.src}
                        alt={shot.title}
                        class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                    />

                    <!-- Overlay -->
                    <div
                        class="absolute inset-0 bg-linear-to-t from-[#050505] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
                    ></div>

                    <!-- Content -->
                    <div
                        class="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20"
                    >
                        <h4 class="text-2xl font-serif text-white mb-2">
                            {shot.title}
                        </h4>
                        <p class="text-sm text-white/50 max-w-sm mb-6">
                            {shot.desc}
                        </p>
                        <div
                            class="flex items-center gap-2 text-xs font-mono text-[#3B82F6] uppercase tracking-widest hover:text-white transition-colors"
                        >
                            <Maximize2 size={14} /> Full View
                        </div>
                    </div>
                </div>
            </div>
        {/each}
    </div>
</section>

<!-- Lightbox Modal -->
{#if selectedImage}
    <div
        class="fixed inset-0 z-100 bg-[#050505]/95 backdrop-blur-2xl flex items-center justify-center p-6 md:p-20 transition-all duration-500"
        onclick={closeLightbox}
    >
        <button
            class="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-colors z-10"
            onclick={closeLightbox}
        >
            <X size={24} />
        </button>

        <div
            class="relative w-full max-w-7xl h-full flex items-center justify-center"
            onclick={(e) => e.stopPropagation()}
        >
            <img
                src={selectedImage.src}
                alt={selectedImage.title}
                class="w-full h-auto max-h-full rounded-3xl shadow-2xl border border-white/10"
            />
            <div
                class="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-[-120%] text-center whitespace-nowrap"
            >
                <h3 class="text-2xl font-serif text-white">
                    {selectedImage.title}
                </h3>
                <p class="text-white/40">{selectedImage.desc}</p>
            </div>
        </div>
    </div>
{/if}

<style>
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
