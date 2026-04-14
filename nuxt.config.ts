// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	runtimeConfig: {
		public: {
			auth0Domain: process.env.NUXT_PUBLIC_AUTH0_DOMAIN || '',
			auth0ClientId: process.env.NUXT_PUBLIC_AUTH0_CLIENT_ID || '',
			auth0Audience: process.env.NUXT_PUBLIC_AUTH0_AUDIENCE || '',
			auth0RedirectUri:
				process.env.NUXT_PUBLIC_AUTH0_REDIRECT_URI || 'http://localhost:3000',
			supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
			supabasePublishableKey:
				process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
		},
	},
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	vite: {
		optimizeDeps: {
			include: ['@auth0/auth0-spa-js', '@supabase/supabase-js'],
		},
	},
});
