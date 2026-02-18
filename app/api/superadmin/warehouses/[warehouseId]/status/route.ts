import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string } >}
) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const { warehouseId } =await params;

    if (!['pending', 'Active', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const isVerified = status === 'Active';

    await query(
      'UPDATE warehouses SET status = $1, is_verified = $2, updated_at = NOW() WHERE id = $3',
      [status, isVerified, warehouseId]
    );

    // TODO: Send notification to warehouse owner about status change

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update warehouse status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    );
  }
}