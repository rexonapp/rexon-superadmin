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
        w.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        (SELECT COUNT(*) FROM uploads WHERE warehouse_id = w.id) as images_count
      FROM warehouses w
      LEFT JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      warehouses: result.rows,
    });
  } catch (error) {
    console.error('Warehouses API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}