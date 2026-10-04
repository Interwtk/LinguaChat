import { createClient } from '@supabase/supabase-js'
import { createLinguaChatSupabaseClient } from './client.js'
import { createEmailPasswordAuth } from './emailPassword.js'

let browserAuthService = null

export function getBrowserAuthService() {
  if (!browserAuthService) {
    const client = createLinguaChatSupabaseClient(createClient)
    browserAuthService = createEmailPasswordAuth(client, { origin: window.location.origin })
  }
  return browserAuthService
}
