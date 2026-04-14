<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createSupabaseWithAuth0 } from './utils/supabase'

const isAuthenticated = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const accessToken = ref('')
const idTokenClaims = ref<unknown>(null)
const supabaseJwt = ref<unknown>(null)

function decodeJwtPayload(token) {
  const h = JSON.parse(atob(token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")));
  console.log(h);
  return h;
}

async function fetchToken() {
  isLoading.value = true
  errorMessage.value = ''
  accessToken.value = ''

  try {
    const { auth0 } = createSupabaseWithAuth0()
    const auth0Client = await auth0

    const token = await auth0Client.getTokenSilently()

    accessToken.value = token
    console.log(token.split(".").length); 
    console.log('Auth0 access token:', token)
    const p = decodeJwtPayload(token);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
    console.error('Auth0 token debug failed:', error)
  } finally {
    isLoading.value = false
  }
}

async function verifyRoleClaim() {
  isLoading.value = true
  errorMessage.value = ''
  idTokenClaims.value = null
  supabaseJwt.value = null

  try {
    const { auth0, supabase } = createSupabaseWithAuth0()
    const auth0Client = await auth0

    idTokenClaims.value = await auth0Client.getIdTokenClaims()

    const { data, error } = await supabase.rpc('debug_jwt')

    if (error) {
      throw error
    }

    supabaseJwt.value = data

    console.log('Auth0 ID token claims:', idTokenClaims.value)
    console.log('Supabase debug_jwt:', supabaseJwt.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
    console.error('Role claim verification failed:', error)
  } finally {
    isLoading.value = false
  }
}

async function refreshSessionState() {
  const { auth0 } = createSupabaseWithAuth0()
  const auth0Client = await auth0

  isAuthenticated.value = await auth0Client.isAuthenticated()
}

async function login() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { auth0 } = createSupabaseWithAuth0()
    const auth0Client = await auth0
    await auth0Client.loginWithRedirect()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
    isLoading.value = false
    console.error('Auth0 login failed:', error)
  }
}

async function logout() {
  errorMessage.value = ''

  const { auth0 } = createSupabaseWithAuth0()
  const auth0Client = await auth0

  auth0Client.logout()
}

onMounted(async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { auth0 } = createSupabaseWithAuth0()
    const auth0Client = await auth0
    const searchParams = new URLSearchParams(window.location.search)
    const hasAuthCallback = searchParams.has('code') && searchParams.has('state')

    if (hasAuthCallback) {
      await auth0Client.handleRedirectCallback()
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    await refreshSessionState()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
    console.error('Auth0 init failed:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <main>
    <p>authenticated: {{ isAuthenticated }}</p>
    <button :disabled="isLoading" @click="login">login</button>
    <button :disabled="isLoading || !isAuthenticated" @click="fetchToken">get token</button>
    <button :disabled="isLoading || !isAuthenticated" @click="verifyRoleClaim">verify role</button>
    <button :disabled="isLoading || !isAuthenticated" @click="logout">logout</button>
    <p v-if="errorMessage">{{ errorMessage }}</p>
    <pre v-if="accessToken">{{ accessToken }}</pre>
    <pre v-if="idTokenClaims">{{ JSON.stringify(idTokenClaims, null, 2) }}</pre>
    <pre v-if="supabaseJwt">{{ JSON.stringify(supabaseJwt, null, 2) }}</pre>
  </main>
</template>
