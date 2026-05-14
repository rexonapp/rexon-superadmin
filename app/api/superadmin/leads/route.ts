// app/api/superadmin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(`
      SELECT
        id,
        first_name,
        last_name,
        email,
        phone,
        is_verified,
        last_login,
        created_at
      FROM leads
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}