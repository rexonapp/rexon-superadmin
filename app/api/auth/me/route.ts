//api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    return NextResponse.json({ user: session });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}