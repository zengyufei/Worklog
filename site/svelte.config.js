import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		// Configure base path from environment variable
		paths: {
			base: process.env.VITE_BASE_URL || '',
			assets: '' // This ensures assets use absolute paths like /_app/...
		},
		prerender: {
			handleMissingId: "ignore", // or 'warn' to see it without failing
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore 404s for favicon and other assets
				if (path === "/favicon.png" || path.startsWith("/favicon")) {
					return;
				}
				// Log other errors
				console.warn(`${message} (${path} referenced by ${referrer})`);
			},
			entries: [
				"*", // Include all routes by default
				// Dynamic routes will be handled by their individual entries functions
			],

		},
	}
};

export default config;
