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
      className="group relative flex items-center justify-center gap-3 w-full sm:w-auto bg-white text-black px-6 py-3 font-bold text-lg rounded-xl thick-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all duration-200"
    >
      <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span>Continue with Google</span>
    </button>
  )
}