import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    return new Response(JSON.stringify({ message: 'Hello' }), { status: 200 });
}