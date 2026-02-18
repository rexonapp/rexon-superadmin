

import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/session'

export async function POST() {
  try {
    await deleteSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    await deleteSession()
  } catch {
   
  }
  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  )
}