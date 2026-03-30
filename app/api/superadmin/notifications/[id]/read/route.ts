import { NextResponse } from 'next/server';
import query  from '@/lib/db';
import { getSession } from '@/lib/session';


// PATCH /api/superadmin/notifications/[id]/read
// Marks a single notification as read by id.
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string } >}
) {
  const {id} =await params as any
  const session = await getSession(); 
  const superadminId = session?.userId;


  if (isNaN(id)) {
    return NextResponse.json(
      { success: false, error: 'Invalid notification id' },
      { status: 400 }
    );
  }

  try {
    const result = await query.query(`
        UPDATE superadmin_notifications
        SET is_read = TRUE
        WHERE id = $1 AND (superadmin_id = $2 OR superadmin_id IS NULL)
        RETURNING id, is_read
      `, [id, superadminId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('[notifications] PATCH read error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}