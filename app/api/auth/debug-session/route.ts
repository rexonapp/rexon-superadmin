import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    return NextResponse.json({
      session: session,
      hasSession: !!session,
      role: session?.role,
      userId: session?.userId,
      email: session?.email,
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ error: 'Failed to get session', details: error }, { status: 500 });
  }
}
