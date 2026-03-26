// app/api/superadmin/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomBytes } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'rexon-web';

async function uploadLogoToS3(base64DataUrl: string, superadminId: number) {
  const [meta, base64] = base64DataUrl.split(',');
  const mimeType = meta.match(/data:([^;]+);/)?.[1] ?? 'image/png';
  const ext      = mimeType.split('/')[1] || 'png';
  const s3Key    = `superadmin/${superadminId}/logo/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket:      BUCKET_NAME,
    Key:         s3Key,
    Body:        Buffer.from(base64, 'base64'),
    ContentType: mimeType,
  }));

  return {
    s3Key,
    s3Url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-2'}.amazonaws.com/${s3Key}`,
  };
}

async function deleteLogoFromS3(s3Key: string) {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }));
  } catch (err) {
    console.warn('[settings] Could not delete old logo from S3:', err);
  }
}

async function requireSuperadmin(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId)
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { rows } = await query(
    `SELECT id, role, is_active FROM superadmin_users WHERE id = $1`,
    [session.userId],
  );
  const user = rows[0];
  if (!user || user.role !== 'superadmin' || !user.is_active)
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };

  return { userId: user.id as number };
}

export async function GET(request: NextRequest) {
  const guard = await requireSuperadmin(request);
  if ('error' in guard) return guard.error;

  try {
    const { rows } = await query(
      `SELECT
         company_name,
         logo_s3_url,
         auto_approve_listings,
         auto_approve_agents,
         maintenance_mode,
         min_warehouse_size,
         max_listings_per_user,
         CASE WHEN sendgrid_api_key IS NOT NULL AND sendgrid_api_key <> ''
              THEN TRUE ELSE FALSE END AS sendgrid_configured,
         updated_at
       FROM superadmin_settings WHERE id = 1`,
      [],
    );
    return NextResponse.json({ success: true, settings: rows[0] ?? {} });
  } catch (err) {
    console.error('[settings GET]', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireSuperadmin(request);
  if ('error' in guard) return guard.error;
  const { userId } = guard;

  try {
    const {
      companyName         = '',
      logoFinal,                 
      autoApproveListings = false,
      autoApproveAgents   = false,
      maintenanceMode     = false,
      minWarehouseSize    = 100,
      maxListingsPerUser  = 10,
      sendgridApiKey,             
    } = await request.json();

    const { rows: [prev] } = await query(
      `SELECT logo_s3_key, logo_s3_url
       FROM superadmin_settings WHERE id = 1`,
      [],
    );

    let newLogoS3Key: string | null = prev?.logo_s3_key ?? null;
    let newLogoS3Url: string | null = prev?.logo_s3_url ?? null;

    if (logoFinal === '') {
      if (newLogoS3Key) await deleteLogoFromS3(newLogoS3Key);
      newLogoS3Key = null;
      newLogoS3Url = null;
    } else if (logoFinal?.startsWith('data:')) {
      const uploaded = await uploadLogoToS3(logoFinal, userId);
      if (newLogoS3Key) await deleteLogoFromS3(newLogoS3Key);
      newLogoS3Key = uploaded.s3Key;
      newLogoS3Url = uploaded.s3Url;
    }

    const sendgridClause = sendgridApiKey !== undefined ? ', sendgrid_api_key = $12' : '';
    const params: unknown[] = [
      companyName,
      newLogoS3Key,
      newLogoS3Url,
      Boolean(autoApproveListings),
      Boolean(autoApproveAgents),
      Boolean(maintenanceMode),
      Number(minWarehouseSize) || 100,
      Number(maxListingsPerUser) || 10,
      userId,     // updated_by
      new Date(), // updated_at
      1,          
    ];
    if (sendgridApiKey !== undefined) params.push(sendgridApiKey || null);

    await query(
      `UPDATE superadmin_settings SET
         company_name          = $1,
         logo_s3_key           = $2,
         logo_s3_url           = $3,
         auto_approve_listings = $4,
         auto_approve_agents   = $5,
         maintenance_mode      = $6,
         min_warehouse_size    = $7,
         max_listings_per_user = $8,
         updated_by            = $9,
         updated_at            = $10
         ${sendgridClause}
       WHERE id = $11`,
      params,
    );

   
    return NextResponse.json({
      success: true,
      logoUrl: newLogoS3Url,
      message: 'Settings saved successfully',
    });
  } catch (err) {
    console.error('[settings POST]', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}