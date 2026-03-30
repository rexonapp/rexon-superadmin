import { NextResponse } from 'next/server';
import  query from '@/lib/db';
import { getSession } from '@/lib/session';

// PATCH /api/superadmin/notifications/read-all
// Marks every unread notification as read in one query.
export async function PATCH() {
    const session = await getSession(); 
    const superadminId = session?.userId;

  try {
    await query.query(`
        UPDATE superadmin_notifications
        SET is_read = TRUE
        WHERE is_read = FALSE
        AND (superadmin_id = $1 OR superadmin_id IS NULL)
      `, [superadminId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[notifications] PATCH read-all error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}