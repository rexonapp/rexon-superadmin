import { NextResponse } from 'next/server';
import  query from '@/lib/db';
import { getSession } from '@/lib/session';

// DELETE /api/superadmin/notifications/[id]
// Permanently removes a single notification by id.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const {id}= await params as any
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
        DELETE FROM superadmin_notifications
        WHERE id = $1 AND (superadmin_id = $2 OR superadmin_id IS NULL)
        RETURNING id
      `, [id, superadminId]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('[notifications] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}