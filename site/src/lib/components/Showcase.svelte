<script>
	import { onMount } from "svelte";
	import gsap from "gsap";
	import ScrollTrigger from "gsap/ScrollTrigger";
	import Database from "@lucide/svelte/icons/database";
	import GitBranch from "@lucide/svelte/icons/git-branch";
	import Command from "@lucide/svelte/icons/command";
	import ShieldCheck from "@lucide/svelte/icons/shield-check";
	import Zap from "@lucide/svelte/icons/zap";
	import LayoutPanelLeft from "@lucide/svelte/icons/layout-panel-left";

	const features = [
		{
			title: "Local-First Persistence",
			desc: "Your data stays on your machine. Worklog uses SQLite for transparent, portable, and offline-ready project storage with zero cloud dependency.",
			icon: Database,
			class: "lg:col-span-8"
		},
		{
			title: "Git-Native Sync",
			desc: "Seamless background synchronization using standard Git protocols. Keep your team in parity without sacrificing control.",
			icon: GitBranch,
			class: "lg:col-span-4"
		},
		{
			title: "Keyboard Mastery",
			desc: "Designed for power users. Navigate, create tickets, and switch boards instantly with a robust command palette.",
			icon: Command,
			class: "lg:col-span-4"
		},
		{
			title: "Privacy by Design",
			desc: "No tracking, no cloud accounts, and no telemetry. Your workflow is your business, and we keep it that way.",
			icon: ShieldCheck,
			class: "lg:col-span-8"
		},
		{
			title: "Offline Ready",
			desc: "Work from the mountains or the subway. Sync whenever you're back online without missing a beat.",
			icon: Zap,
			class: "lg:col-span-6"
		},
		{
			title: "Extensible Views",
			desc: "Switch between Kanban, Table, and Gantt views instantly to visualize your project from every angle.",
			icon: LayoutPanelLeft,
			class: "lg:col-span-6"
		}
	];

	let gridRef = $state();

	onMount(() => {
		gsap.registerPlugin(ScrollTrigger);

		const cards = gridRef.querySelectorAll(".feature-card");

		gsap.fromTo(
			cards,
			{ y: 40, autoAlpha: 0 },
			{
				y: 0,
				autoAlpha: 1,
				duration: 1,
				stagger: 0.1,
				ease: "power2.out",
				scrollTrigger: {
					trigger: gridRef,
					start: "top 80%",
				},
			},
		);
	});
</script>

<section
	id="services"
	class="w-full bg-[#050505] text-white py-32 md:py-48 border-t border-white/5 relative z-10 overflow-hidden"
>
	<!-- Huge background glow -->
	<div
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#3B82F6] opacity-[0.02] blur-[200px] rounded-full pointer-events-none"
	></div>

	<div class="max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-center">
		<div class="text-center mb-24 max-w-2xl">
			<span class="text-xs font-mono text-[#3B82F6] uppercase tracking-[0.3em] mb-4 block">Core Capabilities</span>
			<h2 class="text-4xl md:text-6xl font-serif tracking-tight leading-tight">
				Engineered for the <br />
				<span class="italic text-white/40">Modern Developer.</span>
			</h2>
		</div>

		<div
			bind:this={gridRef}
			class="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 w-full"
		>
			{#each features as feature, i}
				<div
					class="feature-card group relative p-8 md:p-12 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 flex flex-col justify-between overflow-hidden {feature.class}"
				>
					<!-- Inner Glow -->
					<div class="absolute -top-24 -right-24 w-64 h-64 bg-[#3B82F6] opacity-0 group-hover:opacity-[0.08] blur-[80px] rounded-full transition-opacity duration-700 pointer-events-none"></div>
					
					<div class="relative z-10">
						<div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#3B82F6] group-hover:scale-110 transition-all duration-500 mb-8 border border-white/10">
							<svelte:component this={feature.icon} size={24} />
						</div>

						<h3 class="text-2xl md:text-3xl font-serif text-white/90 group-hover:text-white transition-colors duration-300 mb-4">
							{feature.title}
						</h3>
						
						<p class="text-white/40 group-hover:text-white/60 font-sans font-light leading-relaxed max-w-sm transition-colors duration-300">
							{feature.desc}
						</p>
					</div>

					<!-- Bottom indicator -->
					<div class="mt-12 w-12 h-1 bg-white/5 group-hover:bg-[#3B82F6] rounded-full transition-colors duration-500"></div>
				</div>
			{/each}
		</div>
	</div>
</section>

