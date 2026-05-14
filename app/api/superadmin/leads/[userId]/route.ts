

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

type Params = { params: Promise<{ userId: string }> };



// ── DELETE — remove user ──────────────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Prevent self-deletion — session.userId is a number per SessionData in lib/session.ts
    if (session.userId === Number(userId)) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own account.' },
        { status: 400 }
      );
    }

    const result = await query(
      `DELETE FROM leads WHERE id = $1 RETURNING id`,
      [userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}