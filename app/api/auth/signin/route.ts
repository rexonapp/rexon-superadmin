// app/api/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { createSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      )
    }

    // Accept login by username OR email
    const result = await query(
      `SELECT id, username, email, first_name, last_name, password_hash, role, is_active
       FROM superadmin_users
       WHERE username = $1 OR email = $1
       LIMIT 1`,
      [username]
    )

    const user = result.rows[0]

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is disabled. Contact your administrator.' },
        { status: 403 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    // Stamp last login
    await query(
      `UPDATE superadmin_users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    )

    await createSession({
      userId:       user.id,
      email:        user.email,
      firstName:    user.first_name,
      lastName:     user.last_name,
      authProvider: 'credentials',
      role:         user.role,
    })

    return NextResponse.json({
      user: {
        id:        user.id,
        username:  user.username,
        email:     user.email,
        firstName: user.first_name,
        lastName:  user.last_name,
        role:      user.role,
      },
    })
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}