# Nuxt Minimal Reproduction for auth0 and supabase

This follows the guide from https://supabase.com/docs/guides/auth/third-party/auth0?queryGroups=auth0-create-client&auth0-create-client=ts
For https://github.com/supabase/supabase-js/issues/1770

with slight tweaks to current usage as a work around.

## Setup

- install dependencies (`pnpm install` or any package manager of your choice)
- Copy env file `cp .env.example .env`
- Fill in the .env from supabase and auth0
- Setup auth0 action for post login and add to after "Start" in the workflow:
```js
exports.onExecutePostLogin = async (event, api) => {
  // api.accessToken.setCustomClaim('role', 'authenticated') <-- this no longer works for whatever reason. More explanation below.
  api.idToken.setCustomClaim('role', 'authenticated')
}
```
- Fix application URLs to localhost:3000
I had to fix Alloed Callback URLs, Allowed Logout URLs, Allowed Web Origins
to localhost:3000

- Optionally to check that supabase is working register a postgres function in the SQL editor and run it once:
```sql
create or replace function public.debug_jwt()
returns json
language sql
stable
as $$
  select json_build_object(
    'role', auth.jwt() ->> 'role',
    'sub', auth.jwt() ->> 'sub'
  );
$$;
```

## Start the application

- `pnpm dev` or equivalent for your package manager
- open localhost:3000
- Click on login and continue until navigated back
- Click on "get token"(this will spit out jwe tokens)
- Click on "verify role"

You should then see something such as below:
```json
{
  "role": "authenticated",
  "sub": "google-oauth2|1111111111111111111111"
}
```

If something isn't right authenticated will be "anon".

## Problems discovered during this creation of repro

1. Outdated code: 
This is now incorrect:
```js
const auth0 = new Auth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>',
  },
})
```

Instead do the following:
```js
const auth0 = createAuth0Client({
  domain: '<AUTH0_DOMAIN>',
  clientId: '<AUTH0_CLIENT_ID>',
  authorizationParams: {
    redirect_uri: '<MY_CALLBACK_URL>',
  },
})
```

2. Main source of problem for token
Documentation suggests the following:
```js
const supabase = createClient(
  'https://<supabase-project>.supabase.co',
  'SUPABASE_PUBLISHABLE_KEY',
  {
    accessToken: async () => {
      const accessToken = await auth0.getTokenSilently()
      // Alternatively you can use (await auth0.getIdTokenClaims()).__raw to
      // use an ID token instead.
      return accessToken
    },
  }
)
```
This no longer works or at least didn't work for me.
Instead, below is a work around that did work.
```js
const supabase = createClient(
  'https://<supabase-project>.supabase.co',
  'SUPABASE_PUBLISHABLE_KEY',
  {
    accessToken: async () => {
        const idToken = (await (await auth0ClientPromise)?.getIdTokenClaims())?.__raw;
				if (!idToken) throw new Error('Missing ID token');
				return idToken;
    },
  }
)
```
Since we are relying on idToken the auth0 action had to be updated
```js
exports.onExecutePostLogin = async (event, api) => {
  api.idToken.setCustomClaim('role', 'authenticated')
}
```
I think the main cause of the issue may be that custom claims are now standardized or recommended to use namespaces and auth0 may remove non-namespaced claims. However there is no specific documentation on this, so its very hard to confirm, but there are forums on auth0 that states similar issues.
ref: https://community.auth0.com/t/auth0-suddenly-not-allowing-not-namespaced-custom-claims-in-the-token/92363
