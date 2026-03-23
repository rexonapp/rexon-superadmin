// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { query } from '@/lib/db'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

const secret = new TextEncoder().encode(process.env.RESET_TOKEN_SECRET!)

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json()

    if (!identifier?.trim()) {
      return NextResponse.json({ error: 'Please enter your email or username.' }, { status: 400 })
    }

    // Look up user by email OR username
    const result = await query(
      `SELECT id, username, email, first_name, is_active
       FROM superadmin_users
       WHERE (email = $1 OR username = $1)
       LIMIT 1`,
      [identifier.trim()]
    )

    const user = result.rows[0]

    // Tell the user explicitly if the account doesn't exist
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with that email or username.' },
        { status: 404 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'This account is disabled. Contact your administrator.' },
        { status: 403 }
      )
    }

    // Create a short-lived JWT (1 hour) — no DB row needed
    const token = await new SignJWT({ sub: String(user.id), purpose: 'password-reset' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret)

    const resetUrl = `${process.env.NEXT_PUBLIC_URL}/reset-password?token=${token}`

    const msg = {
      to: user.email,
      from: {
        email: 'admin@rexonproperties.in',
        name: process.env.SENDGRID_FROM_NAME ?? 'Rexon Administration',
      },
      subject: 'Reset your Rexon admin password',
      html: buildEmailHtml({ firstName: user.first_name, resetUrl }),
      text: buildEmailText({ firstName: user.first_name, resetUrl }),
    }

    await sgMail.send(msg)

    return NextResponse.json({
      message: 'A password reset link has been sent to your email address.',
    })
  } catch (error) {
    console.error('Forgot-password error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// ── Email templates ──────────────────────────────────────────────────────────

function buildEmailHtml({ firstName, resetUrl }: { firstName: string; resetUrl: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <div style="font-size:20px;font-weight:800;color:#1e293b;letter-spacing:-0.5px;">Rexon</div>
              <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:4px;">Administration Portal</div>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:20px;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(59,130,246,0.08);overflow:hidden;">
              <div style="height:4px;background:linear-gradient(to right,#1d4ed8,#60a5fa,#fb923c);"></div>
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 36px 36px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-size:18px;font-weight:800;color:#1e293b;">Reset your password</p>
                    <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6;">
                      Hi ${firstName}, we received a request to reset the password for your Rexon admin account.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="border-radius:12px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);">
                          <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;letter-spacing:0.2px;">
                            Set New Password →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;line-height:1.6;">Or copy and paste this link into your browser:</p>
                    <p style="margin:0 0 24px;font-size:11px;color:#3b82f6;word-break:break-all;">${resetUrl}</p>
                    <div style="height:1px;background:#e2e8f0;margin-bottom:20px;"></div>
                    <table cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;width:100%;">
                      <tr>
                        <td style="padding:14px 16px;">
                          <p style="margin:0;font-size:11px;color:#78716c;line-height:1.6;">
                            ⏱ This link expires in <strong style="color:#ea580c;">1 hour</strong> and can only be used once.<br/>
                            🔒 If you didn't request a reset, you can safely ignore this email — your password won't change.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                © ${new Date().getFullYear()} Rexon. All rights reserved.<br/>
                This email was sent to you because a password reset was requested for your admin account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildEmailText({ firstName, resetUrl }: { firstName: string; resetUrl: string }) {
  return `Hi ${firstName},

We received a request to reset the password for your Rexon admin account.

Click the link below to set a new password:
${resetUrl}

This link expires in 1 hour and can only be used once.

If you didn't request a password reset, you can safely ignore this email — your password will not change.

— Rexon Administration Portal`
}