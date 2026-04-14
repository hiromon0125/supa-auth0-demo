import { createAuth0Client } from '@auth0/auth0-spa-js';
import { createClient } from '@supabase/supabase-js';

let auth0ClientPromise: ReturnType<typeof createAuth0Client> | undefined;

export function createSupabaseWithAuth0() {
	const config = useRuntimeConfig();
	const publicConfig = config.public;

	const missingValues = [
		['NUXT_PUBLIC_AUTH0_DOMAIN', publicConfig.auth0Domain],
		['NUXT_PUBLIC_AUTH0_CLIENT_ID', publicConfig.auth0ClientId],
		['NUXT_PUBLIC_AUTH0_REDIRECT_URI', publicConfig.auth0RedirectUri],
		['NUXT_PUBLIC_SUPABASE_URL', publicConfig.supabaseUrl],
		[
			'NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
			publicConfig.supabasePublishableKey,
		],
	].filter(([, value]) => !value);

	if (missingValues.length > 0) {
		throw new Error(
			`Missing required public runtime config: ${missingValues
				.map(([key]) => key)
				.join(', ')}`,
		);
	}

	auth0ClientPromise ??= createAuth0Client({
		domain: publicConfig.auth0Domain as string,
		clientId: publicConfig.auth0ClientId as string,
		authorizationParams: {
			audience: (publicConfig.auth0Audience as string) || undefined,
			redirect_uri: publicConfig.auth0RedirectUri as string,
		},
	});

	const supabase = createClient(
		publicConfig.supabaseUrl as string,
		publicConfig.supabasePublishableKey as string,
		{
			accessToken: async () => {
				// const token =
				// 	(await (await auth0ClientPromise)?.getTokenSilently()) ?? null;
				const idToken = (await (await auth0ClientPromise)?.getIdTokenClaims())
					?.__raw;
				if (!idToken) throw new Error('Missing ID token');
				return idToken;
				// return token;
			},
		},
	);

	return { auth0: auth0ClientPromise, supabase };
}
