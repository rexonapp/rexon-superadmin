// api/agents/check-domain/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const RESERVED_DOMAINS = new Set([
  'admin', 'api', 'www', 'app', 'mail', 'support', 'help', 'login',
  'register', 'dashboard', 'agent', 'agents', 'property', 'properties',
  'blog', 'about', 'contact', 'careers', 'terms', 'privacy', 'legal',
  'rexon', 'dev', 'staging', 'test', 'demo',
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name')?.trim().toLowerCase();

    if (!name) {
      return NextResponse.json({ error: 'Domain name is required' }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      return NextResponse.json({ error: 'Only lowercase letters, numbers, and hyphens allowed' }, { status: 400 });
    }
    if (name.length < 3 || name.length > 50) {
      return NextResponse.json({ error: 'Domain must be between 3 and 50 characters' }, { status: 400 });
    }
    if (name.startsWith('-') || name.endsWith('-')) {
      return NextResponse.json({ error: 'Domain cannot start or end with a hyphen' }, { status: 400 });
    }
    if (RESERVED_DOMAINS.has(name)) {
      return NextResponse.json({ available: false, reason: 'reserved' });
    }

    // ✅ Check BOTH active and pending — prevents race conditions
    const result = await query(
      `SELECT id FROM agent_domains 
       WHERE domain_name = $1 AND status IN ('active', 'pending')`,
      [name]
    );

    return NextResponse.json({ available: result.rows.length === 0 });

  } catch (error) {
    console.error('Domain check error:', error);
    return NextResponse.json({ error: 'Failed to check domain availability' }, { status: 500 });
  }
}