import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { sendAgentStatusEmail } from '@/lib/sendemail';
import { createSuperadminNotification, createAgentNotification } from '@/lib/notifications';


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const session = await getSession();
    const superadminId :any= session?.userId
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { status, domain } = await request.json();
    const { agentId } = await params;

    if (!['pending', 'approved', 'rejected','deactivated'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const isVerified = status === 'approved';

    await query(
      'UPDATE agents SET status = $1, is_verified = $2, updated_at = NOW() WHERE id = $3',
      [status, isVerified, agentId]
    );

    // TODO: Send notification to agent about verification status

    // Get agent info for email
    const result = await query(
      'SELECT full_name, email FROM agents WHERE id = $1',
      [agentId]
    );

    const agent = result.rows[0];
    // Send email when approved or rejected
    if (status === 'approved' || status === 'rejected') {
      await sendAgentStatusEmail({
        fullName: agent.full_name,
        email: agent.email,
        status: status,
        reason: "",
        domain: domain,
      });
    }
    await query(
      `UPDATE agents SET status = $1, is_verified = $2 WHERE id = $3`,
      [status, status === 'approved', agentId]
    );

    // Fetch agent details for notification message
    const agentRes = await query(
      `SELECT full_name FROM agents WHERE id = $1`,
      [agentId]
    );
    const agentName = agentRes.rows[0]?.full_name ?? 'Unknown Agent';

    const statusLabels: Record<string, string> = {
      approved:    'approved',
      rejected:    'rejected',
      deactivated: 'deactivated',
      pending:     'reactivated to pending',
    };

    await createSuperadminNotification({
      type:           'agent_status_changed',
      title:          'Agent Status Updated',
      message:        `Agent "${agentName}" has been ${statusLabels[status] ?? status}.`,
      referenceId:    agentId,
      referenceTable: 'agents',
      superadminId
      ,
    });

    // Notify the agent themselves
    const agentMessages: Record<string, { title: string; message: string }> = {
      approved:    { title: 'Account Approved',    message: 'Congratulations! Your agent account has been approved.' },
      rejected:    { title: 'Account Rejected',    message: 'Your agent account application has been rejected.' },
      deactivated: { title: 'Account Deactivated', message: 'Your agent account has been deactivated.' },
      pending:     { title: 'Account Reactivated', message: 'Your account has been reactivated and is under review.' },
    };

    if (agentMessages[status]) {
      await createAgentNotification({
        agentId:        agentId,
        type:           `agent_${status}`,
        title:          agentMessages[status].title,
        message:        agentMessages[status].message,
        referenceId:    agentId,
        referenceTable: 'agents',
      });
    }



    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update agent status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update status' },
      { status: 500 }
    );
  }
}