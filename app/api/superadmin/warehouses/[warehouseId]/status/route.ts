import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { createAgentNotification, createSuperadminNotification } from '@/lib/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ warehouseId: string } >}
) {
  try {
    const session = await getSession();
    const superadminId:any= session?.userId;
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

    await query(
      `UPDATE warehouses SET status = $1 WHERE id = $2`,
      [status, warehouseId]
    );

    // Fetch warehouse + agent details
    const whRes = await query(
      `SELECT w.title, w.user_id FROM warehouses w WHERE w.id = $1`,
      [warehouseId]
    );
    const warehouse = whRes.rows[0];
    const warehouseName = warehouse?.title   ?? 'Unknown Warehouse';
    const agentId       = warehouse?.user_id;

    await createSuperadminNotification({
      type:           'warehouse_status_changed',
      title:          'Warehouse Status Updated',
      message:        `Warehouse "${warehouseName}" has been ${status.toLowerCase()}.`,
      referenceId:    warehouseId,
      referenceTable: 'warehouses',
      superadminId,
    });

    // Notify the agent who owns the warehouse
    if (agentId) {
      const agentWarehouseMessages: Record<string, { title: string; message: string }> = {
        approved: { title: 'Warehouse Approved',    message: `Your warehouse "${warehouseName}" has been approved and is now live.` },
        rejected: { title: 'Warehouse Rejected',    message: `Your warehouse "${warehouseName}" has been rejected.` },
        Active:   { title: 'Warehouse Approved',    message: `Your warehouse "${warehouseName}" has been approved and is now live.` },
        Pending:  { title: 'Warehouse Under Review', message: `Your warehouse "${warehouseName}" is under review.` },
      };

      await createAgentNotification({
        agentId:        warehouse.user_id,
        type:           `property_${status.toLowerCase()}`,
        title:          status === 'Active' ? 'Property Approved' : 'Property Rejected',
        message:        status === 'Active'
          ? `Your property "${warehouse.title}" has been approved and is now live.`
          : `Your property "${warehouse.title}" has been rejected.`,
        referenceId:    warehouseId,
        referenceTable: 'properties',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update warehouse status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    );
  }
}