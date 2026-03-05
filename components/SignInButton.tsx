'use client' // This is required for interactive buttons in Next.js

import { createClient } from '@/supabase/supabase-browser'

// 1. Initialize the client OUTSIDE the component 
// so it doesn't get recreated every time the button re-renders.
const supabase = createClient()

export default function LoginButton() {

  // 2. Your login function
  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // It's highly recommended to explicitly state where Google 
        // should send the user back to after a successful login.
        redirectTo: `${window.location.origin}/auth/callback?`
      }
    })
  }

  // 3. The UI
  return (
    <button
      onClick={loginWithGoogle}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Sign in with Google
    </button>
  )
}