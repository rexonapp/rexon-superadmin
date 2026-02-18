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
        id,
        user_id,
        full_name,
        email,
        mobile_number,
        city,
        agency_name,
        license_number,
        experience_years,
        specialization,
        is_verified,
        status,
        created_at,
        kyc_document_s3_url
      FROM agents
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      agents: result.rows,
    });
  } catch (error) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}