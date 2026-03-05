import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/home';

    if (code) {
        const cookieStore = await cookies(); // Ensure this is awaited
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // This can be ignored if middleware is handling the refresh
                        }
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Use the 'origin' to prevent open redirect vulnerabilities
            return NextResponse.redirect(`${origin}${next}`);
        }

        // Log the actual error to your console for better debugging
        console.error('Auth Callback Error:', error.message);
    }

    return NextResponse.redirect(`${origin}/?error=auth-callback-failed`);
}