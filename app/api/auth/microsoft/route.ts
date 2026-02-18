// app/api/auth/microsoft/route.ts
import { NextResponse } from 'next/server';

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_URL + '/api/auth/microsoft/callback';

export async function GET() {
  console.log('Microsoft OAuth initiated');
  console.log('Client ID:', MICROSOFT_CLIENT_ID?.substring(0, 8) + '...');
  console.log('Redirect URI:', REDIRECT_URI);

  if (!MICROSOFT_CLIENT_ID) {
    console.error('MICROSOFT_CLIENT_ID is not set');
    return NextResponse.redirect(
      new URL('/?error=microsoft_client_id_not_configured', '/')
    );
  }

  if (!process.env.NEXT_PUBLIC_URL) {
    console.error('NEXT_PUBLIC_URL is not set');
    return NextResponse.redirect(
      new URL('/?error=next_public_url_not_configured', '/')
    );
  }

  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    response_mode: 'query',
    scope: 'https://graph.microsoft.com/User.Read openid profile email offline_access',
    prompt: 'select_account',
  });

  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  
  console.log('Redirecting to Microsoft:', authUrl.substring(0, 100) + '...');
  
  return Response.redirect(authUrl);
}