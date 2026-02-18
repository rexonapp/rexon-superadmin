// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/lib/session';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_URL + '/api/auth/google/callback';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent('Google authentication cancelled')}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=missing_code', request.url)
      );
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokens);
      throw new Error('Failed to exchange code for tokens');
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      console.error('User info fetch failed:', googleUser);
      throw new Error('Failed to fetch user info');
    }

    let user;

    const googleUserResult = await query(
      'SELECT id, first_name, last_name, email, auth_provider, google_id, role FROM users WHERE google_id = $1',
      [googleUser.id]
    );

    if (googleUserResult.rows.length > 0) {
      user = googleUserResult.rows[0];
      console.log('Existing Google user logging in:', user.email);
    } else {
      const emailResult = await query(
        'SELECT id, first_name, last_name, email, auth_provider, google_id, role FROM users WHERE email = $1',
        [googleUser.email.toLowerCase()]
      );

      if (emailResult.rows.length > 0) {
        const existingUser = emailResult.rows[0];
        
        if (existingUser.auth_provider === 'email') {
          const updateResult = await query(
            `UPDATE users 
             SET google_id = $1, 
                 auth_provider = 'google',
                 is_verified = true,
                 first_name = COALESCE(NULLIF(first_name, ''), $2),
                 last_name = COALESCE(NULLIF(last_name, ''), $3)
             WHERE id = $4
             RETURNING id, first_name, last_name, email, auth_provider, role`,
            [
              googleUser.id,
              googleUser.given_name || '',
              googleUser.family_name || '',
              existingUser.id
            ]
          );
          user = updateResult.rows[0];
          console.log('Linked existing email account with Google:', user.email);
        } else if (existingUser.auth_provider === 'microsoft') {
          return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent('This email is already registered with Microsoft. Please sign in with Microsoft.')}`, request.url)
          );
        } else if (existingUser.auth_provider === 'google' && !existingUser.google_id) {
          const updateResult = await query(
            `UPDATE users 
             SET google_id = $1
             WHERE id = $2
             RETURNING id, first_name, last_name, email, auth_provider, role`,
            [googleUser.id, existingUser.id]
          );
          user = updateResult.rows[0];
        }
      } else {
        const insertResult = await query(
          `INSERT INTO users (first_name, last_name, email, google_id, auth_provider, is_verified, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
           RETURNING id, first_name, last_name, email, auth_provider, role`,
          [
            googleUser.given_name || '',
            googleUser.family_name || '',
            googleUser.email.toLowerCase(),
            googleUser.id,
            'google',
            true
          ]
        );
        user = insertResult.rows[0];
        console.log('New Google user registered:', user.email);
      }
    }

    if (!user) {
      throw new Error('Failed to create or retrieve user');
    }

    await createSession({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      authProvider: user.auth_provider || 'google',
      role: user.role || 'customer',
    });

    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    console.log('Session created successfully for user:', user.email);

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent('Authentication failed. Please try again.')}`, request.url)
    );
  }
}