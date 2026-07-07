import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ warehouseId: string }> }
) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        const { warehouseId } = await params;
        const result = await query(
            `
      SELECT
        id,
        property_id,
        agent_email,
        agent_name,
        agent_id,
        lead_name,
        lead_email,
        lead_phone,
        created_at
      FROM property_enquiries
      WHERE property_id = $1
      ORDER BY created_at DESC
      `,
            [warehouseId]
        );

        return NextResponse.json({
            success: true,
            leads: result.rows,
        });
    } catch (error) {
        console.error("Error fetching interested leads:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Internal Server Error",
            },
            { status: 500 }
        );
    }
}