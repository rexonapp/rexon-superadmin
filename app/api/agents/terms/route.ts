

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT id, section_number, section_title, section_content, tnc_version
       FROM   tnc_sections
       WHERE  is_active = TRUE
       ORDER  BY section_number ASC`,
      []
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Terms and Conditions not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      version: result.rows[0].tnc_version,
      sections: result.rows,
    });

  } catch (error) {
    console.error('Failed to fetch T&C:', error);
    return NextResponse.json(
      { error: 'Failed to load Terms and Conditions' },
      { status: 500 }
    );
  }
}