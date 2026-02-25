import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch agents
    const agentsResult = await query(`
      SELECT 
        id,
        full_name,
        email,
        mobile_number,
        city,
        agency_name,
        is_verified,
        status,
        created_at,
        kyc_document_s3_url,
        profile_photo_s3_url
      FROM agents
      ORDER BY created_at DESC
    `);

    // Fetch all domains
    const domainsResult = await query(`
      SELECT 
        id,
        agent_id,
        domain_name,
        full_domain,
        status,
        is_active,
        activated_at,
        released_at
      FROM agent_domains
      ORDER BY created_at DESC
    `);

    // Map domains to agents
    const domainsMap = new Map();
    domainsResult.rows.forEach(domain => {
      if (!domainsMap.has(domain.agent_id)) {
        domainsMap.set(domain.agent_id, []);
      }
      domainsMap.get(domain.agent_id).push({
        id: domain.id,
        domain_name: domain.domain_name,
        full_domain: domain.full_domain,
        status: domain.status,
        is_active: domain.is_active,
        activated_at: domain.activated_at,
        released_at: domain.released_at,
      });
    });

    // Attach domains to agents
    const agentsWithDomains = agentsResult.rows.map(agent => ({
      ...agent,
      domains: domainsMap.get(agent.id) || [],
    }));

    return NextResponse.json({
      success: true,
      agents: agentsWithDomains,
    });
  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}