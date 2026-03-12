import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { warehouseId } = await params;

    console.log('[Images API] Fetching images for warehouse:', warehouseId);

    // Debug: check what rows exist without any filter
    const debugResult = await query(
      `SELECT id, file_name, s3_url, status, is_primary, image_order 
       FROM uploads 
       WHERE warehouse_id = $1`,
      [warehouseId]
    );
    console.log('[Images API] Total rows (no filter):', debugResult.rows.length);
    console.log('[Images API] Distinct status values:', [...new Set(debugResult.rows.map((r: any) => r.status))]);
    console.log('[Images API] All rows:', JSON.stringify(debugResult.rows, null, 2));

    // Fetch without status filter — the original 'active' filter was blocking all results
    const result = await query(
      `SELECT 
        id,
        file_name,
        file_type,
        file_size,
        s3_key,
        s3_url,
        image_order,
        is_primary,
        status,
        created_at
      FROM uploads
      WHERE warehouse_id = $1
      ORDER BY 
        CASE WHEN is_primary = true THEN 0 ELSE 1 END,
        image_order ASC NULLS LAST,
        created_at ASC`,
      [warehouseId]
    );

    console.log('[Images API] Returning', result.rows.length, 'images');

    return NextResponse.json({
      success: true,
      images: result.rows,
    });
  } catch (error) {
    console.error('Warehouse images API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}