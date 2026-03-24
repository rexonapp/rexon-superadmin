import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';

// ─── S3 ───────────────────────────────────────────────────────────────────────

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = 'rexon-web';
const PLATFORM_DOMAIN = 'rexonproperties.in';
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function deleteS3Key(key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  } catch {
    console.warn(`[S3] Could not delete key: ${key}`);
  }
}

async function uploadToS3(file: File, folder: string): Promise<{ key: string; url: string }> {
  const ext = file.name.split('.').pop();
  const rand = randomBytes(16).toString('hex');
  const key = `${folder}/${Date.now()}-${rand}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buf,
    ContentType: file.type,
  }));

  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-2'}.amazonaws.com/${key}`;
  return { key, url };
}

// ─── GET /api/agents/[id] ─────────────────────────────────────────────────────

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    const result = await query(
      `SELECT
         a.id, a.full_name, a.email, a.mobile_number,
         a.whatsapp_number, a.city, a.state, a.pincode, a.address,
         a.date_of_birth, a.gender,
         a.agency_name,
         a.languages_spoken,
         a.bio,
         a.profile_photo_s3_key, a.profile_photo_s3_url,
         a.kyc_document_s3_key, a.kyc_document_s3_url,
         a.is_verified, a.status,
         a.created_at, a.updated_at,
         d.domain_name, d.full_domain
       FROM agents a
       LEFT JOIN agent_domains d ON d.agent_id = a.id AND d.is_active = true
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, agent: result.rows[0] });
  } catch (err) {
    console.error('[GET /api/agents/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

// ─── PUT /api/agents/[id] ─────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    // ── 1. Fetch current agent record ─────────────────────────────────────────
    const currentResult = await query(
      `SELECT a.*, d.id AS domain_row_id, d.domain_name AS current_domain
       FROM agents a
       LEFT JOIN agent_domains d ON d.agent_id = a.id AND d.is_active = true
       WHERE a.id = $1`,
      [id]
    );

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    const current = currentResult.rows[0];

    // ── 2. Parse multipart body ───────────────────────────────────────────────
    const formData = await request.formData();

    const fullName       = (formData.get('fullName')       as string || '').trim();
    const email          = (formData.get('email')          as string || '').trim().toLowerCase();
    const primaryPhone   = (formData.get('primaryPhone')   as string || '').trim();
    const dateOfBirth    = (formData.get('dateOfBirth')    as string) || null;
    const genderRaw      = (formData.get('gender')         as string) || null;
    const gender         = genderRaw ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase() : null;
    const whatsappNumber = (formData.get('whatsappNumber') as string) || null;
    const addressLine1   = (formData.get('addressLine1')   as string) || '';
    const city           = (formData.get('city')           as string) || '';
    const state          = (formData.get('state')          as string) || '';
    const pincode        = (formData.get('pincode')        as string) || null;
    const agencyName     = (formData.get('agencyName')     as string) || '';
    const domainName     = (formData.get('domainName')     as string || '').trim().toLowerCase();
    const bio            = (formData.get('bio')            as string) || '';

    const languagesRaw   = (formData.get('languagesSpoken') as string) || '[]';
    const languagesSpoken: string[] = JSON.parse(languagesRaw);

    const removeProfileImage = formData.get('removeProfileImage') === 'true';
    const removeKycDocument  = formData.get('removeKycDocument')  === 'true';

    const newProfileImage = formData.get('profileImage') as File | null;
    const newDocuments    = formData.getAll('documents') as File[];

    // ── 3. Field validation ───────────────────────────────────────────────────
    if (!fullName || !primaryPhone || !email) {
      return NextResponse.json(
        { error: 'Full name, primary phone, and email are required' },
        { status: 400 }
      );
    }
    if (!/^[6-9]\d{9}$/.test(primaryPhone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number' }, { status: 400 });
    }
    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    // ── 4. Email uniqueness (ignore current agent) ────────────────────────────
    if (email !== current.email) {
      const emailCheck = await query(
        'SELECT id FROM agents WHERE email = $1 AND id != $2',
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return NextResponse.json({ error: 'This email is already registered to another agent' }, { status: 400 });
      }
    }

    // ── 5. Domain validation & uniqueness ─────────────────────────────────────
    const domainChanged = domainName !== (current.current_domain ?? '');

    if (domainName) {
      if (!/^[a-z0-9-]+$/.test(domainName)) {
        return NextResponse.json({ error: 'Domain can only contain lowercase letters, numbers, and hyphens' }, { status: 400 });
      }
      if (domainName.length < 3 || domainName.length > 50) {
        return NextResponse.json({ error: 'Domain must be between 3 and 50 characters' }, { status: 400 });
      }
      if (domainName.startsWith('-') || domainName.endsWith('-')) {
        return NextResponse.json({ error: 'Domain cannot start or end with a hyphen' }, { status: 400 });
      }

      if (domainChanged) {
        const domainCheck = await query(
          `SELECT id FROM agent_domains WHERE domain_name = $1 AND agent_id != $2`,
          [domainName, id]
        );
        if (domainCheck.rows.length > 0) {
          return NextResponse.json({ error: 'This domain is already taken. Please choose another.' }, { status: 409 });
        }
      }
    }

    // ── 6. Handle profile image ───────────────────────────────────────────────
    let profilePhotoS3Key: string | null = current.profile_photo_s3_key;
    let profilePhotoS3Url: string | null = current.profile_photo_s3_url;

    if (removeProfileImage && !newProfileImage) {
      await deleteS3Key(current.profile_photo_s3_key);
      profilePhotoS3Key = null;
      profilePhotoS3Url = null;
    } else if (newProfileImage && newProfileImage.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(newProfileImage.type)) {
        return NextResponse.json({ error: 'Profile image must be JPG, PNG, or WebP' }, { status: 400 });
      }
      if (newProfileImage.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Profile image must be less than 2MB' }, { status: 400 });
      }
      await deleteS3Key(current.profile_photo_s3_key);
      const uploaded = await uploadToS3(newProfileImage, 'agents/profile');
      profilePhotoS3Key = uploaded.key;
      profilePhotoS3Url = uploaded.url;
    }

    // ── 7. Handle KYC document ────────────────────────────────────────────────
    let kycDocumentS3Key: string | null = current.kyc_document_s3_key;
    let kycDocumentS3Url: string | null = current.kyc_document_s3_url;

    if (removeKycDocument && !newDocuments.length) {
      await deleteS3Key(current.kyc_document_s3_key);
      kycDocumentS3Key = null;
      kycDocumentS3Url = null;
    } else if (newDocuments.length > 0) {
      const kycDoc = newDocuments[0];
      if (!ALLOWED_DOCUMENT_TYPES.includes(kycDoc.type)) {
        return NextResponse.json({ error: 'KYC document must be PDF, JPG, or PNG' }, { status: 400 });
      }
      if (kycDoc.size > MAX_DOCUMENT_SIZE) {
        return NextResponse.json({ error: 'KYC document must be less than 5MB' }, { status: 400 });
      }
      await deleteS3Key(current.kyc_document_s3_key);
      const uploaded = await uploadToS3(kycDoc, 'agents/kyc');
      kycDocumentS3Key = uploaded.key;
      kycDocumentS3Url = uploaded.url;
    }

    // ── 8. Update agents table ────────────────────────────────────────────────
    const agentResult = await query(
      `UPDATE agents SET
         full_name            = $1,
         email                = $2,
         mobile_number        = $3,
         date_of_birth        = $4,
         gender               = $5,
         whatsapp_number      = $6,
         address              = $7,
         city                 = $8,
         state                = $9,
         pincode              = $10,
         agency_name          = $11,
         languages_spoken     = $12,
         bio                  = $13,
         profile_photo_s3_key = $14,
         profile_photo_s3_url = $15,
         kyc_document_s3_key  = $16,
         kyc_document_s3_url  = $17,
         updated_at           = CURRENT_TIMESTAMP
       WHERE id = $18
       RETURNING id, full_name, email, mobile_number, city, agency_name, status, updated_at`,
      [
        fullName, email, primaryPhone,
        dateOfBirth, gender, whatsappNumber,
        addressLine1, city, state, pincode,
        agencyName,
        languagesSpoken,
        bio,
        profilePhotoS3Key, profilePhotoS3Url,
        kycDocumentS3Key, kycDocumentS3Url,
        id,
      ]
    );

    // ── 9. Upsert domain ──────────────────────────────────────────────────────
    if (domainChanged || (!domainName && current.domain_row_id)) {
      if (current.domain_row_id) {
        if (domainName) {
          const fullDomain = `${domainName}.${PLATFORM_DOMAIN}`;
          await query(
            `UPDATE agent_domains SET domain_name = $1, full_domain = $2, updated_at = NOW() WHERE id = $3`,
            [domainName, fullDomain, current.domain_row_id]
          );
        } else {
          await query(
            `UPDATE agent_domains SET is_active = false, updated_at = NOW() WHERE id = $1`,
            [current.domain_row_id]
          );
        }
      } else if (domainName) {
        const fullDomain = `${domainName}.${PLATFORM_DOMAIN}`;
        await query(
          `INSERT INTO agent_domains (agent_id, domain_name, full_domain, status, is_active, activated_at)
           VALUES ($1, $2, $3, 'pending', true, NOW())`,
          [id, domainName, fullDomain]
        );
      }
    }

    return NextResponse.json({
      success: true,
      agent: agentResult.rows[0],
      message: 'Agent profile updated successfully.',
    });

  } catch (err) {
    console.error('[PUT /api/agents/[id]]', err);

    if (err instanceof Error && err.message.includes('unique constraint')) {
      if (err.message.includes('email')) {
        return NextResponse.json({ error: 'This email is already registered' }, { status: 400 });
      }
      if (err.message.includes('domain_name')) {
        return NextResponse.json({ error: 'This domain was just taken. Please choose another.' }, { status: 409 });
      }
    }

    return NextResponse.json({ error: 'Failed to update agent. Please try again.' }, { status: 500 });
  }
}