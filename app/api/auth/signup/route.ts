// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'
import { createSession } from '@/lib/session'

const ALLOWED_ROLES = ['superadmin', 'admin', 'user'] as const
type Role = typeof ALLOWED_ROLES[number]

export async function POST(request: NextRequest) {
  try {
    const {
      username,
      email,
      firstName,
      lastName,
      password,
      role = 'user',
      phone,
    } = await request.json()

    // ── Validation ─────────────────────────────────────────────────────────
    if (!username || !email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'All required fields must be filled.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (!ALLOWED_ROLES.includes(role as Role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    // ── Duplicate check ────────────────────────────────────────────────────
    const existing = await query(
      `SELECT id FROM superadmin_users WHERE username = $1 OR email = $2 LIMIT 1`,
      [username, email]
    )
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username or email already exists.' },
        { status: 409 }
      )
    }

    // ── Insert ─────────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12)

    const result = await query(
      `INSERT INTO superadmin_users
         (username, email, first_name, last_name, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, first_name, last_name, role`,
      [username, email, firstName, lastName, passwordHash, role, phone || null]
    )

    const user = result.rows[0]

    await createSession({
      userId:       user.id,
      email:        user.email,
      firstName:    user.first_name,
      lastName:     user.last_name,
      authProvider: 'credentials',
      role:         user.role,
    })

    return NextResponse.json(
      {
        user: {
          id:        user.id,
          username:  user.username,
          email:     user.email,
          firstName: user.first_name,
          lastName:  user.last_name,
          role:      user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}