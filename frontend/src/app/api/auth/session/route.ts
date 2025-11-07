import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { action } = await req.json().catch(() => ({ action: 'set' }));
    const res = NextResponse.json({ ok: true });
    if (action === 'clear') {
      res.cookies.set('at', '', { maxAge: 0, path: '/' });
    } else {
      res.cookies.set('at', '1', { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
    }
    return res;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

