import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const { agentId } = await params;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const isVerified = status === 'approved';

    await query(
      'UPDATE agents SET status = $1, is_verified = $2, updated_at = NOW() WHERE id = $3',
      [status, isVerified, agentId]
    );

    // TODO: Send notification to agent about verification status

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update agent status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    );
  }
}