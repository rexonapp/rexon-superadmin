import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const result = await query(
      `
      SELECT
        id,
        full_name,
        email,
        updated_at
      FROM agents
      WHERE updated_at IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 10
      `
    );

    const activities = result.rows.map((agent: any) => ({
      id: agent.id,
      action: "Agent logged in",
      user: agent.full_name,
      email: agent.email,
      time: agent.updated_at,
      type: "agent",
      status: "info",
    }));

   const totalActivities = await query(
    `SELECT
      id,
      full_name,
      email,
      updated_at
    FROM agents
    WHERE updated_at IS NOT NULL
    ORDER BY updated_at DESC`
  );

    return NextResponse.json({
      success: true,
      data: {activities, totalActivities: totalActivities.rows}
    });
  } catch (error) {
    console.error("Fetch agent activity error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}