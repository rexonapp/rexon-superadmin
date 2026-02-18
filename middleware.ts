// middleware.ts  (root of your project, next to package.json)
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, JWTPayload } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
)


const AUTH_ONLY_ROUTES = ['/login', '/register']

const PROTECTED_PREFIXES = [
  '/',          // catches everything — refine below with PUBLIC_ROUTES
]
const PUBLIC_ROUTES = new Set([
  '/login',
  '/register',
])

/**
 * Routes only accessible by superadmin role.
 */
const SUPERADMIN_ONLY_PREFIXES = [
  '/admin',
]

/**
 * Routes accessible by admin OR superadmin.
 */
const ADMIN_PREFIXES = [
  '/dashboard',
  '/users',
  '/settings',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface SessionPayload extends JWTPayload {
  userId: number
  email: string
  firstName: string
  lastName: string
  role?: string
}

async function getSessionPayload(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get('session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as SessionPayload
  } catch {
    return null
  }
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname)
}

function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

function isSuperAdminRoute(pathname: string): boolean {
  return SUPERADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/signin') ||
    pathname.startsWith('/api/auth/signup') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname.startsWith('/api/auth/me') ||
    pathname.includes('.') // static files (favicon.ico, images, etc.)
  ) {
    return NextResponse.next()
  }

  const session = await getSessionPayload(request)
  const isLoggedIn = !!session


  if (isAuthOnlyRoute(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // ── 2. Public routes ───────────────────────────────────────────────────────
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // ── 3. All other routes require authentication ─────────────────────────────
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.role ?? 'user'

  // ── 4. Superadmin-only routes ──────────────────────────────────────────────
  if (isSuperAdminRoute(pathname)) {
    if (role !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    return NextResponse.next()
  }

  // ── 5. Admin + Superadmin routes ──────────────────────────────────────────
  if (isAdminRoute(pathname)) {
    if (role !== 'superadmin' && role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    return NextResponse.next()
  }

  // ── 6. Logged-in user — allow through ─────────────────────────────────────
  return NextResponse.next()
}

export const config = {

  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}