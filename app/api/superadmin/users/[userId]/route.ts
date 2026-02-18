// app/api/superadmin/users/[userId]/route.ts
//
//  PATCH  /api/superadmin/users/:userId  — update role
//  DELETE /api/superadmin/users/:userId  — delete user
//
// Note: the page calls BOTH at the same URL /api/superadmin/users/${userId}
// NOT /api/superadmin/users/${userId}/role — they are differentiated by HTTP method.

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

type Params = { params: Promise<{ userId: string }> };

// ── PATCH — update role ───────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const { role }   = await request.json();

    // Must match the user_role ENUM defined in schema.sql
    const validRoles = ['superadmin', 'admin', 'user'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Allowed: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Prevent superadmin from downgrading their own role
    if (session.userId === Number(userId) && role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'You cannot change your own role.' },
        { status: 400 }
      );
    }

    // updated_at is handled automatically by the DB trigger trg_superadmin_users_updated_at
    const result = await query(
      `UPDATE superadmin_users
       SET role = $1
       WHERE id = $2
       RETURNING id, role`,
      [role, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, role: result.rows[0].role });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

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
      `DELETE FROM superadmin_users WHERE id = $1 RETURNING id`,
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