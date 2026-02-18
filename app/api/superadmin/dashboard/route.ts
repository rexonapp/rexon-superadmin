import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get total warehouses
    const warehousesResult = await query('SELECT COUNT(*) as count FROM warehouses');
    const totalWarehouses = parseInt(warehousesResult.rows[0].count);

    // Get pending approvals
    const pendingResult = await query(
      "SELECT COUNT(*) as count FROM warehouses WHERE status = 'pending'"
    );
    const pendingApprovals = parseInt(pendingResult.rows[0].count);

    // Get today's listings
    const todayResult = await query(
      "SELECT COUNT(*) as count FROM warehouses WHERE DATE(created_at) = CURRENT_DATE"
    );
    const todayListings = parseInt(todayResult.rows[0].count);

    // Get total users
    const usersResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);

    // Get total agents
    const agentsResult = await query('SELECT COUNT(*) as count FROM agents');
    const totalAgents = parseInt(agentsResult.rows[0].count);

    // Get verified agents
    const verifiedAgentsResult = await query(
      'SELECT COUNT(*) as count FROM agents WHERE is_verified = true'
    );
    const verifiedAgents = parseInt(verifiedAgentsResult.rows[0].count);

    // Get recent activity
    const activityResult = await query(`
      SELECT 
        'New warehouse listing' as action,
        w.title as warehouse,
        CONCAT(u.first_name, ' ', u.last_name) as user,
        CASE 
          WHEN w.created_at > NOW() - INTERVAL '1 hour' THEN CONCAT(EXTRACT(MINUTE FROM NOW() - w.created_at)::int, ' min ago')
          WHEN w.created_at > NOW() - INTERVAL '1 day' THEN CONCAT(EXTRACT(HOUR FROM NOW() - w.created_at)::int, ' hours ago')
          ELSE TO_CHAR(w.created_at, 'Mon DD')
        END as time,
        w.status,
        w.id
      FROM warehouses w
      LEFT JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
      LIMIT 10
    `);

    const recentActivity = activityResult.rows.map(row => ({
      id: row.id,
      action: row.action,
      warehouse: row.warehouse,
      user: row.user,
      time: row.time,
      status: row.status === 'pending' ? 'pending' : row.status === 'approved' ? 'success' : 'warning',
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalWarehouses,
        pendingApprovals,
        totalUsers,
        totalAgents,
        verifiedAgents,
        todayListings,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}