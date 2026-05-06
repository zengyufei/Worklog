<script>
    import DocsSidebar from "$lib/components/DocsSidebar.svelte";
    import TableOfContents from "$lib/components/TableOfContents.svelte";
    import { onMount } from "svelte";
    import gsap from "gsap";

    let { children } = $props();
    let contentRef = $state();

    onMount(() => {
        gsap.fromTo(contentRef, 
            { opacity: 0, y: 10 }, 
            { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.3 }
        );
    });
</script>

<div class="min-h-screen bg-[#050505] flex flex-col md:flex-row relative">
    <!-- Background Decor -->
    <div class="fixed top-0 right-0 w-[50vw] h-[50vh] bg-[#3B82F6] opacity-[0.03] blur-[150px] rounded-full pointer-events-none z-0"></div>
    <div class="fixed bottom-0 left-0 w-[40vw] h-[40vh] bg-[#3B82F6] opacity-[0.02] blur-[120px] rounded-full pointer-events-none z-0"></div>

    <DocsSidebar />
    
    <main 
        class="flex-1 px-6 md:px-16 pt-32 pb-24 relative z-10 max-w-5xl mx-auto md:ml-64 xl:mr-80"
    >
        <div bind:this={contentRef} class="prose prose-invert max-w-none">
            {@render children()}
        </div>
    </main>

    <TableOfContents container={contentRef} />
</div>

<style>
    :global(.prose h1) {
        font-family: 'Instrument Serif', serif;
        font-size: 3.5rem;
        font-weight: 400;
        margin-bottom: 2rem;
        letter-spacing: -0.02em;
    }
    :global(.prose h2) {
        font-family: 'Instrument Serif', serif;
        font-size: 2.25rem;
        font-weight: 400;
        margin-top: 3rem;
        margin-bottom: 1.5rem;
        color: rgba(255, 255, 255, 0.9);
        scroll-margin-top: 100px;
    }
    :global(.prose h3) {
        font-family: 'Instrument Serif', serif;
        font-size: 1.5rem;
        font-weight: 400;
        margin-top: 2rem;
        margin-bottom: 1rem;
        color: rgba(255, 255, 255, 0.8);
        scroll-margin-top: 100px;
    }
    :global(.prose p) {
        font-family: 'Inter', sans-serif;
        font-size: 1.125rem;
        line-height: 1.8;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 1.5rem;
    }
    :global(.prose code) {
        background: rgba(255, 255, 255, 0.05);
        padding: 0.2rem 0.4rem;
        border-radius: 0.25rem;
        font-size: 0.9em;
        color: #3B82F6;
    }
    :global(.prose pre) {
        background: rgba(255, 255, 255, 0.03) !important;
        border: 1px border-white/10;
        border-radius: 1rem;
        padding: 1.5rem;
        margin: 2rem 0;
    }
    :global(.prose ul) {
        list-style-type: none;
        padding-left: 0;
        margin: 1.5rem 0;
    }
    :global(.prose li) {
        position: relative;
        padding-left: 1.5rem;
        margin-bottom: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
    }
    :global(.prose li::before) {
        content: "";
        position: absolute;
        left: 0;
        top: 0.6rem;
        width: 0.5rem;
        height: 1px;
        background: #3B82F6;
    }
</style>
