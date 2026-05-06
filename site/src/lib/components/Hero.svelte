<script>
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import gsap from "gsap";
    import pkg from "../../../../package.json";
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

    const platforms = [
        { 
            name: "Linux (.deb)", 
            file: `worklog_${version}_amd64.deb`,
            icon: Box 
        },
        { 
            name: "Linux (.AppImage)", 
            file: `worklog_${version}_amd64.AppImage`,
            icon: Box 
        },
        { 
            name: "Windows (.exe)", 
            file: `Worklog_${version}_x64-setup.exe`,
            icon: Monitor 
        },
        { 
            name: "macOS (Intel)", 
            file: `Worklog_${version}_x64.dmg`,
            icon: Laptop 
        },
        { 
            name: "macOS (Apple Silicon)", 
            file: `Worklog_${version}_aarch64.dmg`,
            icon: Laptop 
        }
    ];

    function toggleDropdown() {
        isDropdownOpen = !isDropdownOpen;
        if (isDropdownOpen) {
            gsap.fromTo(dropdownRef, 
                { autoAlpha: 0, y: 10, scale: 0.95 },
                { autoAlpha: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" }
            );
        }
    }

    onMount(() => {
        const tl = gsap.timeline({ delay: 0.2 });

        gsap.set(bgRef, { autoAlpha: 0, scale: 1.05 });
        gsap.set(words, { yPercent: 120, rotateZ: 2 });
        gsap.set([descRef, ctaContainer], { y: 20, autoAlpha: 0 });

        tl.to(bgRef, {
            autoAlpha: 0.6,
            scale: 1,
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
            );

        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            gsap.to(bgRef, {
                x: x * -1,
                y: y * -1,
                duration: 2,
                ease: "power2.out",
            });
            gsap.to(words, {
                x: x,
                y: y,
                duration: 1.5,
                ease: "power2.out",
                stagger: 0.01,
            });
        };

        const handleClickOutside = (e) => {
            if (isDropdownOpen && !e.target.closest('.download-dropdown')) {
                isDropdownOpen = false;
            }
        };

        // Disable parallax tracking on small touch devices
        if (window.innerWidth > 768) {
            window.addEventListener("mousemove", handleMouseMove);
        }
        window.addEventListener("click", handleClickOutside);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("click", handleClickOutside);
        };
    });
</script>

<section
    id="agency"
    class="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden text-center pt-24 pb-12"
>
    <!-- Cinematic Backing -->
    <div
        bind:this={bgRef}
        class="absolute inset-0 z-0 pointer-events-none will-change-transform"
    >
        <img
            src="{base}/ascii-art.gif"
            alt="Ascii art background"
            class="w-full h-screen object-cover mix-blend-screen opacity-[0.65] block"
        />
        <div
            class="absolute inset-0 bg-linear-to-b from-[#050505]/40 via-[#050505]/10 to-[#050505]"
        ></div>
        <div
            class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#050505_90%)]"
        ></div>
    </div>

    <div
        class="relative z-10 w-full flex flex-col items-center justify-center px-4 h-full"
    >
        <h1
            class="text-[15vw] md:text-[8vw] font-serif leading-[0.9] tracking-tight text-white max-w-[95vw] md:max-w-7xl mx-auto flex flex-col items-center mix-blend-difference mb-4"
        >
            <div class="overflow-hidden pb-6 -mb-6">
                <div
                    bind:this={words[0]}
                    class="flex items-center pt-4 will-change-transform"
                >
                    Your projects
                </div>
            </div>
            <div class="overflow-hidden pb-8 -mb-8">
                <div
                    bind:this={words[1]}
                    class="flex items-center md:gap-6 will-change-transform pt-4"
                >
                    <span class="italic text-white/50 mr-3 md:mr-6 font-serif"
                        >local-first</span
                    > workflows.
                </div>
            </div>
        </h1>

        <p
            bind:this={descRef}
            class="text-lg md:text-2xl text-white/50 max-w-3xl mt-12 md:mt-8 font-sans font-light leading-relaxed mix-blend-difference px-4"
        >
            A high-performance desktop project manager built for speed, privacy,
            and seamless Git integration. Offline-first, keyboard-driven, and
            entirely yours.
        </p>

        <div bind:this={ctaContainer} class="mt-8 flex gap-4 z-20">
            <a
                href="#work"
                class="px-8 py-4 bg-white text-black rounded-full font-sans font-medium hover:bg-[#3B82F6] hover:text-white transition-all duration-500 cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.15)] inline-block"
            >
                Explore Features
            </a>
            
            <div class="relative download-dropdown hidden md:block">
                <button
                    onclick={toggleDropdown}
                    class="px-8 py-4 bg-transparent text-white border border-white/20 rounded-full font-sans font-medium hover:bg-white/5 transition-all duration-300 cursor-pointer flex items-center gap-2"
                >
                    Download v{version}
                    <ChevronDown size={16} class="transition-transform duration-300 {isDropdownOpen ? 'rotate-180' : ''}" />
                </button>

                {#if isDropdownOpen}
                    <div 
                        bind:this={dropdownRef}
                        class="absolute top-full left-0 mt-4 w-64 bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 origin-top-left"
                    >
                        <div class="p-2 flex flex-col gap-1">
                            {#each platforms as platform}
                                <a 
                                    href="{baseUrl}/{platform.file}"
                                    class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#3B82F6] text-white/70 hover:text-white transition-all duration-200 group/item"
                                >
                                    <div class="text-white/20 group-hover/item:text-white transition-colors">
                                        <svelte:component this={platform.icon} size={18} />
                                    </div>
                                    <span class="text-sm font-medium">{platform.name}</span>
                                </a>
                            {/each}
                        </div>
                        <div class="bg-white/5 p-4 border-t border-white/5">
                            <a href="{base}/docs/download" class="text-xs text-white/40 hover:text-[#3B82F6] transition-colors flex items-center justify-center gap-2">
                                All download options &rarr;
                            </a>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</section>
