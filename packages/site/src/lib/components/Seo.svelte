<script>
	import { base } from '$app/paths';
	let {
		title = "Worklog — Local-first Desktop Project Manager",
		description = "A high-performance desktop project manager built for speed, privacy, and seamless Git integration. Local-first, keyboard-driven, and offline-ready.",
		url = "https://worklog.app",
		image = base + "/og-image.png",
	} = $props();
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{title}</title>
	<meta name="title" content={title} />
	<meta name="description" content={description} />
	<meta name="robots" content="index, follow" />
	<meta name="theme-color" content="#050505" />
	<meta name="author" content="YusufCeng1z" />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={url} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={url} />
	<meta property="twitter:title" content={title} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={image} />
</svelte:head>
