// api/auth/microsoft/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/lib/session';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_URL + '/api/auth/microsoft/callback';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent('Microsoft authentication cancelled')}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=missing_code', request.url)
      );
    }

    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(
        new URL('/?error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();

    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info from Microsoft');
      return NextResponse.redirect(
        new URL('/?error=failed_to_get_user_info', request.url)
      );
    }

    const msUser = await userInfoResponse.json();
    const msEmail = msUser.mail || msUser.userPrincipalName;
    
    if (!msEmail) {
      return NextResponse.redirect(
        new URL('/?error=no_email_from_microsoft', request.url)
      );
    }

    const normalizedEmail = msEmail.toLowerCase();

    const msUserResult = await query(
      'SELECT id, first_name, last_name, email, auth_provider, microsoft_id, role FROM users WHERE microsoft_id = $1',
      [msUser.id]
    );

    let user;

    if (msUserResult.rows.length > 0) {
      // User already exists with this Microsoft account - just log them in
      user = msUserResult.rows[0];
      
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
    } else {
      // User doesn't exist by Microsoft ID, check if email exists
      const emailCheckResult = await query(
        'SELECT id, first_name, last_name, email, auth_provider, microsoft_id, role FROM users WHERE email = $1',
        [normalizedEmail]
      );

      if (emailCheckResult.rows.length > 0) {
        const existingUser = emailCheckResult.rows[0];
        
        // Email exists with a different auth method
        if (existingUser.auth_provider === 'email') {
          // User registered with email/password, link Microsoft account
          await query(
            'UPDATE users SET microsoft_id = $1, auth_provider = $2, is_verified = true, last_login = CURRENT_TIMESTAMP WHERE id = $3',
            [msUser.id, 'microsoft', existingUser.id]
          );
          
          user = {
            ...existingUser,
            auth_provider: 'microsoft',
            microsoft_id: msUser.id
          };
        } else if (existingUser.auth_provider === 'google') {
          // User registered with Google, don't allow Microsoft login
          return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent('This email is registered with Google. Please sign in with Google.')}`, request.url)
          );
        } else {
          return NextResponse.redirect(
            new URL(`/?error=${encodeURIComponent('This email is already registered with another provider')}`, request.url)
          );
        }
      } else {
        // New user - create account
        const insertResult = await query(
          `INSERT INTO users (first_name, last_name, email, microsoft_id, auth_provider, is_verified, created_at, last_login)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id, first_name, last_name, email, auth_provider, microsoft_id, role`,
          [
            msUser.givenName || '',
            msUser.surname || '',
            normalizedEmail,
            msUser.id,
            'microsoft',
            true
          ]
        );
        
        user = insertResult.rows[0];
      }
    }

    // session with user data
    await createSession({
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      authProvider: user.auth_provider,
      role: user.role || 'customer',
    });

    return NextResponse.redirect(new URL('/', request.url));
    
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=authentication_failed', request.url)
    );
  }
}