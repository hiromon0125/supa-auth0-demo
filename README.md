# Nuxt Minimal Reproduction for auth0 and supabase

This follows the guide from https://supabase.com/docs/guides/auth/third-party/auth0?queryGroups=auth0-create-client&auth0-create-client=ts

with slight tweaks to current usage.

## Setup

- install dependencies (`pnpm install` or any package manager of your choice)
- Copy env file `cp .env.example .env`
- Fill in the .env from supabase and auth0
- Setup auth0 action for post login and add to after "Start" in the workflow:
```js
exports.onExecutePostLogin = async (event, api) => {
  api.idToken.setCustomClaim('role', 'authenticated')
}
```
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

