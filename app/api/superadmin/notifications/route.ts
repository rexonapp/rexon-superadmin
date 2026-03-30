import { NextResponse } from 'next/server';
import  query  from '@/lib/db';       
import { getSession } from '@/lib/session';

// GET /api/superadmin/notifications
// Returns all notifications ordered by newest first.
// Unread notifications come first, then read ones.
// GET /api/superadmin/notifications
// GET /api/superadmin/notifications
export async function GET(req: Request) {
    try {
      const session = await getSession();
      const superadminId = session?.userId;
      if (!superadminId) return NextResponse.json({ success: false }, { status: 401 });
  
      const result = await query.query(`
        SELECT id, type, title, message, reference_id, reference_table, is_read, created_at
        FROM superadmin_notifications
        WHERE superadmin_id = $1
        ORDER BY is_read ASC, created_at DESC
        LIMIT 50
      `, [superadminId]);
  
      return NextResponse.json({ success: true, notifications: result.rows });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
    }
  }