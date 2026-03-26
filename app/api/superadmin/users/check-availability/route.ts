import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const email    = searchParams.get('email')

  // Must provide exactly one field
  if ((!username && !email) || (username && email)) {
    return NextResponse.json(
      { error: 'Provide either username or email, not both.' },
      { status: 400 }
    )
  }

  try {
    if (username) {
      const result = await query(
        `SELECT id FROM superadmin_users WHERE username = $1 LIMIT 1`,
        [username]
      )
      return NextResponse.json({ available: result.rows.length === 0 })
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ available: null, error: 'Invalid email address.' })
      }
      const result = await query(
        `SELECT id FROM superadmin_users WHERE email = $1 LIMIT 1`,
        [email]
      )
      return NextResponse.json({ available: result.rows.length === 0 })
    }
  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}