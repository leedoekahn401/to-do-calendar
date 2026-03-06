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
        // should send the user back to a successful login.
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  // 3. The UI
  return (
    <button
      onClick={loginWithGoogle}
      className="bg-[#00E5FF] text-black font-bold text-2xl px-8 py-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px]"
    >
      Sign In With Google
    </button>
  )
}