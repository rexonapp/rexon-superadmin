import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ domainId: string }> }) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { domainId } =await params;
    
    if (!domainId) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['active', 'deactivate'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be "active" or "deactivate"' },
        { status: 400 }
      );
    }

    // Check if domain exists
    const domainCheck = await query(
      'SELECT id, agent_id FROM agent_domains WHERE id = $1',
      [domainId]
    );

    if (domainCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    const agentId = domainCheck.rows[0].agent_id;
    const isActive = status === 'active';
    const timestamp = new Date().toISOString();

    // Update domain status
    const result = await query(`
      UPDATE agent_domains
      SET 
        status = $1,
        is_active = $2,
        ${status === 'active' ? 'activated_at = $3' : 'released_at = $3'},
        updated_at = NOW()
      WHERE id = $4
      RETURNING 
        id,
        agent_id,
        domain_name,
        full_domain,
        status,
        is_active,
        activated_at,
        released_at
    `, [status, isActive, timestamp, domainId]);

    const updatedDomain = result.rows[0];

    // Log the action
    console.log(`[Domain Update] Agent: ${agentId}, Domain: ${domainId}, Status: ${status}, Timestamp: ${timestamp}`);

    return NextResponse.json({
      success: true,
      domain: {
        id: updatedDomain.id,
        agent_id: updatedDomain.agent_id,
        domain_name: updatedDomain.domain_name,
        full_domain: updatedDomain.full_domain,
        status: updatedDomain.status,
        is_active: updatedDomain.is_active,
        activated_at: updatedDomain.activated_at,
        released_at: updatedDomain.released_at,
      },
      message: `Domain ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('[Agent Domains API Error]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { success: false, error: 'Failed to update domain status' },
      { status: 500 }
    );
  }
}