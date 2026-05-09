<script>
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import gsap from "gsap";
    import pkg from "../../../../worklog/package.json";
    import ChevronDown from "@lucide/svelte/icons/chevron-down";
    import Monitor from "@lucide/svelte/icons/monitor";
    import Box from "@lucide/svelte/icons/box";
    import Laptop from "@lucide/svelte/icons/laptop";

    const version = pkg.version;
    const tag = `app-v${version}`;
    const baseUrl = `https://github.com/regisx001/Worklog/releases/download/${tag}`;

    let words = $state([]);
    let descRef = $state();
    let ctaContainer = $state();
    let bgRef = $state();
    let isDropdownOpen = $state(false);
    let dropdownRef = $state();
    let appWindowRef = $state();
    let snippetRef = $state();
    let isCopied = $state(false);

    const platforms = [
        {
            name: "Linux (.deb)",
            file: `worklog_${version}_amd64.deb`,
            icon: Box,
        },
        {
            name: "Linux (.AppImage)",
            file: `worklog_${version}_amd64.AppImage`,
            icon: Box,
        },
        {
            name: "Windows (.exe)",
            file: `Worklog_${version}_x64-setup.exe`,
            icon: Monitor,
        },
        {
            name: "macOS (Intel)",
            file: `Worklog_${version}_x64.dmg`,
            icon: Laptop,
        },
        {
            name: "macOS (Apple Silicon)",
            file: `Worklog_${version}_aarch64.dmg`,
            icon: Laptop,
        },
    ];

    function handleCopy() {
        navigator.clipboard.writeText('curl -sSL https://regisx001.github.io/Worklog/install.sh | bash');
        isCopied = true;
        setTimeout(() => {
            isCopied = false;
        }, 2000);
    }

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
        if (isDropdownOpen) {
            gsap.fromTo(
                dropdownRef,
                { autoAlpha: 0, y: 10, scale: 0.95 },
                {
                    autoAlpha: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.4,
                    ease: "power2.out",
                },
            );
        }
    }

    onMount(() => {
        const tl = gsap.timeline({ delay: 0.2 });

        gsap.set(bgRef, { autoAlpha: 0 });
        gsap.set(words, { yPercent: 120, rotateZ: 2 });
        gsap.set([descRef, ctaContainer, snippetRef], { y: 20, autoAlpha: 0 });
        gsap.set(appWindowRef, { y: 40, autoAlpha: 0, scale: 0.98 });

        tl.to(bgRef, {
            autoAlpha: 0.4,
            duration: 2.5,
            ease: "power2.out",
        })
            .to(
                words,
                {
                    yPercent: 0,
                    rotateZ: 0,
                    duration: 1.4,
                    stagger: 0.1,
                    ease: "expo.out",
                },
                "-=1.5",
            )
            .to(
                descRef,
                {
                    y: 0,
                    autoAlpha: 1,
                    duration: 1.2,
                    ease: "power3.out",
                },
                "-=1.0",
            )
            .to(
                ctaContainer,
                {
                    y: 0,
                    autoAlpha: 1,
                    duration: 1.2,
                    ease: "power3.out",
                },
                "-=1.0",
            )
            .to(
                snippetRef,
                {
                    y: 0,
                    autoAlpha: 1,
                    duration: 1.2,
                    ease: "power3.out",
                },
                "-=1.0",
            )
            .to(
                appWindowRef,
                {
                    y: 0,
                    autoAlpha: 1,
                    scale: 1,
                    duration: 1.5,
                    ease: "expo.out",
                },
                "-=0.8",
            );

        const handleClickOutside = (e) => {
            if (isDropdownOpen && !e.target.closest(".download-dropdown")) {
                isDropdownOpen = false;
            }
        };

        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    });
</script>

<section
    id="agency"
    class="w-full min-h-screen flex flex-col items-center justify-start relative overflow-hidden text-center pt-48 pb-24 px-6 bg-[#050505]"
>
    <!-- Cinematic Backing -->
    <div
        bind:this={bgRef}
        class="absolute inset-0 z-0 pointer-events-none opacity-40"
    >
        <img
            src="{base}/ascii-art.gif"
            alt=""
            class="w-full h-full object-cover mix-blend-screen block"
        />
        <div
            class="absolute inset-0 bg-linear-to-b from-[#050505] via-transparent to-[#050505]"
        ></div>
        <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)]"
        ></div>
    </div>

    <div
        class="relative z-10 w-full max-w-5xl flex flex-col items-center justify-center"
    >
        <h1
            class="text-[12vw] md:text-[7vw] font-serif leading-[1] tracking-tighter text-white flex flex-col items-center mb-6"
        >
            <div class="overflow-hidden pb-2 -mb-2">
                <div bind:this={words[0]} class="will-change-transform">
                    Your projects,
                </div>
            </div>
            <div class="overflow-hidden pb-4 -mb-4">
                <div
                    bind:this={words[1]}
                    class="will-change-transform italic text-white/40"
                >
                    local-first.
                </div>
            </div>
        </h1>

        <p
            bind:this={descRef}
            class="text-lg md:text-xl text-white/50 max-w-2xl mt-4 font-sans font-light leading-relaxed"
        >
            A high-performance desktop manager for developers who value speed,
            privacy, and Git-native workflows. Entirely yours, forever.
        </p>

        <div
            bind:this={ctaContainer}
            class="mt-10 flex flex-wrap justify-center gap-4 z-20"
        >
            <a
                href="#work"
                class="px-8 py-4 bg-[#3B82F6] text-white rounded-full font-sans font-medium hover:bg-[#3B82F6]/90 transition-all duration-300 shadow-[0_10px_30px_rgba(59,130,246,0.3)]"
            >
                Explore Features
            </a>

            <div class="relative download-dropdown">
                <button
                    onclick={toggleDropdown}
                    class="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-sans font-medium hover:bg-white/10 transition-all duration-300 flex items-center gap-2 backdrop-blur-sm"
                >
                    Download v{version}
                    <ChevronDown
                        size={16}
                        class="transition-transform duration-300 {isDropdownOpen
                            ? 'rotate-180'
                            : ''}"
                    />
                </button>

                {#if isDropdownOpen}
                    <div
                        bind:this={dropdownRef}
                        class="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50"
                    >
                        <div class="p-2 flex flex-col gap-1">
                            {#each platforms as platform}
                                <a
                                    href="{baseUrl}/{platform.file}"
                                    class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#3B82F6] text-white/70 hover:text-white transition-all duration-200 group/item"
                                >
                                    <div
                                        class="text-white/20 group-hover/item:text-white transition-colors"
                                    >
                                        <svelte:component
                                            this={platform.icon}
                                            size={18}
                                        />
                                    </div>
                                    <span class="text-sm font-medium"
                                        >{platform.name}</span
                                    >
                                </a>
                            {/each}
                        </div>
                        <div class="bg-white/5 p-4 border-t border-white/5">
                            <a
                                href="{base}/docs/download"
                                class="text-xs text-white/40 hover:text-[#3B82F6] transition-colors flex items-center justify-center gap-2"
                            >
                                All download options &rarr;
                            </a>
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Linux Install Snippet -->
        <div bind:this={snippetRef} class="mt-8 flex flex-col items-center z-20 w-full max-w-lg mx-auto opacity-0 translate-y-4">
            <p class="text-[10px] text-white/30 mb-2 font-mono uppercase tracking-widest">Linux Install Script</p>
            <div class="flex items-center w-full bg-[#0A0A0A]/80 border border-white/10 rounded-xl p-1 backdrop-blur-md shadow-lg group">
                <code class="flex-1 px-4 py-3 text-sm text-[#3B82F6] font-mono text-left overflow-x-auto whitespace-nowrap scrollbar-hide">curl -sSL https://regisx001.github.io/Worklog/install.sh | bash</code>
                <button 
                    onclick={handleCopy}
                    class="p-2.5 mr-1 rounded-lg transition-colors flex items-center justify-center min-w-[36px] {isCopied ? 'text-green-400 bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/10 group-hover:text-white/60'}"
                    title={isCopied ? "Copied!" : "Copy to clipboard"}
                >
                    {#if isCopied}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-in zoom-in duration-200"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-in zoom-in duration-200"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    {/if}
                </button>
            </div>
        </div>

        <!-- Simple Large App Showcase -->
        <div
            bind:this={appWindowRef}
            class="mt-20 w-full max-w-7xl relative group px-4 md:px-0"
        >
            <!-- Glow background -->
            <div
                class="absolute -inset-4 bg-[#3B82F6] opacity-[0.05] blur-[100px] rounded-[3rem] pointer-events-none"
            ></div>

            <div
                class="relative p-1 rounded-3xl bg-linear-to-b from-white/10 to-transparent border border-white/10 shadow-2xl overflow-hidden"
            >
                <!-- App Header Chrome -->
                <div
                    class="absolute top-0 left-0 right-0 h-10 bg-white/5 border-b border-white/5 flex items-center px-6 gap-2 z-20"
                >
                    <div class="w-3 h-3 rounded-full bg-white/10"></div>
                    <div class="w-3 h-3 rounded-full bg-white/10"></div>
                    <div class="w-3 h-3 rounded-full bg-white/10"></div>
                    <div
                        class="ml-4 text-[10px] font-mono text-white/20 uppercase tracking-widest"
                    >
                        Worklog — Kanban View
                    </div>
                </div>

                <!-- Main Image -->
                <div class="relative pt-10 overflow-hidden bg-[#0A0A0A]">
                    <img
                        src="{base}/screenshots/01_main_kanban_view.png"
                        alt="Worklog App Interface"
                        class="w-full h-auto rounded-b-2xl group-hover:scale-[1.01] transition-transform duration-1000 ease-out"
                    />
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    .perspective-1000 {
        perspective: 1500px;
    }
    .preserve-3d {
        transform-style: preserve-3d;
    }
</style>
