// app/api/agents/register/route.ts - WITH DEBUGGING

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { sendAgentInviteEmail } from '@/lib/sendemail';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = 'rexon-web';
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const PLATFORM_DOMAIN = 'rexonproperties.in';
const BCRYPT_ROUNDS = 10;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function generateTemporaryPassword(): string {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower   = 'abcdefghjkmnpqrstuvwxyz';
  const digits  = '23456789';
  const special = '@#$!&*';
  const all     = upper + lower + digits + special;

  const mandatory = [
    upper  [Math.floor(Math.random() * upper.length)],
    lower  [Math.floor(Math.random() * lower.length)],
    digits [Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  const rest = Array.from({ length: 6 }, () => all[Math.floor(Math.random() * all.length)]);

  const combined = [...mandatory, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join('');
}

// ── Vercel domain provisioning ────────────────────────────────────────────────
async function addDomainToVercel(subdomain: string): Promise<{ success: boolean; error?: string }> {
  const fullDomain = `${subdomain}.${PLATFORM_DOMAIN}`;
  const projectId = process.env.VERCEL_REXON_CRM_PROJECT_ID || '';
  const token = process.env.VERCEL_TOKEN || '';
  const teamId = process.env.VERCEL_TEAM_ID || '';

  if (!projectId || !token) {
    console.warn('Vercel env vars missing — skipping domain provisioning');
    return { success: false, error: 'Vercel config missing' };
  }

  const url = teamId
    ? `https://api.vercel.com/v10/projects/${projectId}/domains?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/domains`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: fullDomain }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Domain already exists on project — that's fine
      if (data.error?.code === 'domain_already_in_use') {
        return { success: true };
      }
      console.error('Vercel domain add failed:', data);
      return { success: false, error: data.error?.message || 'Vercel API error' };
    }

    console.log(`Vercel domain added: ${fullDomain}`);
    return { success: true };
  } catch (err) {
    console.error('Vercel domain provision error:', err);
    return { success: false, error: 'Network error calling Vercel API' };
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 START: Agent Registration - Route.ts');
    console.log('═══════════════════════════════════════════════════════');

    const formData = await request.formData();

    // ── DEBUG: Log all form data keys ──
    const allKeys = Array.from(formData.keys());
    console.log('📋 All formData keys received:', allKeys);
    console.log('✓ Has "domainName" key?', formData.has('domainName'));
    console.log('✓ Raw domainName value:', formData.get('domainName'));
    console.log('✓ DomainName type:', typeof formData.get('domainName'));

    // Personal Details
    const fullName = formData.get('fullName') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string || null;
    const genderRaw = formData.get('gender') as string || null;
    const gender = genderRaw
      ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()
      : null;

    // Contact Information
    const primaryPhone = formData.get('primaryPhone') as string;
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const whatsappNumber = formData.get('whatsappNumber') as string || null;

    // Address Information
    const addressLine1 = formData.get('addressLine1') as string || '';
    const city = formData.get('city') as string || '';
    const state = formData.get('state') as string || '';
    const pincode = formData.get('pincode') as string || null;
    const fullAddress = addressLine1 || '';

    // Professional Information
    const agencyName = formData.get('agencyName') as string || '';
    const domainNameRaw = formData.get('domainName') as string;
    const domainName = (domainNameRaw || '').trim().toLowerCase();

    // ── DEBUG: Log extracted domain data ──
    console.log('📝 Domain extraction details:', {
      domainNameRaw,
      domainName,
      domainName_type: typeof domainName,
      domainName_length: domainName?.length,
      domainName_isEmpty: domainName === '',
      domainName_isFalsy: !domainName,
    });

    // Additional Information
    const languagesSpokenStr = formData.get('languagesSpoken') as string;
    const languagesSpoken = languagesSpokenStr ? JSON.parse(languagesSpokenStr) : [];
    const bio = formData.get('bio') as string || '';

    // TNC fields
    const termsAcceptedRaw = formData.get('termsAccepted') as string;
    const tncVersion = (formData.get('tncVersion') as string || '1.0').trim();
    const termsAccepted = termsAcceptedRaw === 'true';

    // Files
    const profileImage = formData.get('profileImage') as File | null;
    const documents = formData.getAll('documents') as File[];

    // ── Validation ────────────────────────────────────────────────────────
    if (!fullName || !primaryPhone || !email) {
      return NextResponse.json(
        { error: 'Please fill in all required fields: full name, primary phone, and email' },
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(primaryPhone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number' },
        { status: 400 }
      );
    }

    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'You must accept the Terms and Conditions to register' },
        { status: 400 }
      );
    }

    // ── Email duplicate check ──────────────────────────────────────────────
    const existingEmail = await query('SELECT id FROM agents WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return NextResponse.json(
        { error: 'This email is already registered as an agent' },
        { status: 400 }
      );
    }

    // ── Domain validation & duplicate check ───────────────────────────────
    if (domainName) {
      if (!/^[a-z0-9-]+$/.test(domainName)) {
        return NextResponse.json(
          { error: 'Domain name can only contain lowercase letters, numbers, and hyphens' },
          { status: 400 }
        );
      }
      if (domainName.length < 3 || domainName.length > 50) {
        return NextResponse.json(
          { error: 'Domain name must be between 3 and 50 characters' },
          { status: 400 }
        );
      }
      if (domainName.startsWith('-') || domainName.endsWith('-')) {
        return NextResponse.json(
          { error: 'Domain name cannot start or end with a hyphen' },
          { status: 400 }
        );
      }

      // ── Check both active and pending to prevent race conditions ──────────
      const domainCheck = await query(
        `SELECT id FROM agent_domains WHERE domain_name = $1 AND status IN ('active', 'pending')`,
        [domainName]
      );
      if (domainCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'This domain was just taken. Please choose another.' },
          { status: 409 }
        );
      }
    }

    // ── File uploads ──────────────────────────────────────────────────────
    let profilePhotoS3Key = null;
    let profilePhotoS3Url = null;
    let kycDocumentS3Key = null;
    let kycDocumentS3Url = null;

    if (profileImage && profileImage.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(profileImage.type)) {
        return NextResponse.json({ error: 'Profile image must be JPG, PNG, or WebP' }, { status: 400 });
      }
      if (profileImage.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Profile image must be less than 2MB' }, { status: 400 });
      }
      const fileExtension = profileImage.name.split('.').pop();
      const randomString = randomBytes(16).toString('hex');
      profilePhotoS3Key = `agents/profile/${Date.now()}-${randomString}.${fileExtension}`;
      const arrayBuffer = await profileImage.arrayBuffer();
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: profilePhotoS3Key,
        Body: Buffer.from(arrayBuffer),
        ContentType: profileImage.type,
      }));
      profilePhotoS3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-2'}.amazonaws.com/${profilePhotoS3Key}`;
    }

    if (documents && documents.length > 0) {
      const kycDocument = documents[0];
      if (!ALLOWED_DOCUMENT_TYPES.includes(kycDocument.type)) {
        return NextResponse.json({ error: 'KYC document must be PDF, JPG, or PNG' }, { status: 400 });
      }
      if (kycDocument.size > MAX_DOCUMENT_SIZE) {
        return NextResponse.json({ error: 'KYC document must be less than 5MB' }, { status: 400 });
      }
      const fileExtension = kycDocument.name.split('.').pop();
      const randomString = randomBytes(16).toString('hex');
      kycDocumentS3Key = `agents/kyc/${Date.now()}-${randomString}.${fileExtension}`;
      const arrayBuffer = await kycDocument.arrayBuffer();
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: kycDocumentS3Key,
        Body: Buffer.from(arrayBuffer),
        ContentType: kycDocument.type,
      }));
      kycDocumentS3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-2'}.amazonaws.com/${kycDocumentS3Key}`;
    }

    // ── Password hashing ──────────────────────────────────────────────────
    const temporaryPassword = generateTemporaryPassword();
    const passwordSalt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const passwordHash = await bcrypt.hash(temporaryPassword, passwordSalt);

    // ── Insert agent ──────────────────────────────────────────────────────
    const agentResult = await query(
      `INSERT INTO agents
       (full_name, email, mobile_number, whatsapp_number, city, state, address, pincode,
        date_of_birth, gender,
        agency_name, bio,
        profile_photo_s3_key, profile_photo_s3_url,
        kyc_document_s3_key, kyc_document_s3_url,
        languages_spoken,
        password_hash, password_salt, is_temporary_password,
        terms_accepted, is_verified, status,
        created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW() AT TIME ZONE 'Asia/Kolkata')
       RETURNING id, full_name, email, mobile_number, city, agency_name, status, created_at`,
      [
        fullName, email, primaryPhone, whatsappNumber,
        city, state, fullAddress, pincode,
        dateOfBirth, gender, agencyName, bio,
        profilePhotoS3Key, profilePhotoS3Url,
        kycDocumentS3Key, kycDocumentS3Url,
        languagesSpoken.length > 0 ? languagesSpoken : null,
        passwordHash, passwordSalt,
        true,   // is_temporary_password
        true,   // terms_accepted
        false,  // is_verified
        'pending',
      ]
    );

    const agentId = agentResult.rows[0].id;

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      null;

    await query(
      `INSERT INTO agent_tnc_acceptance (agent_id, tnc_version, ip_address)
       VALUES ($1, $2, $3)`,
      [agentId, tncVersion, clientIp]
    );

    // ── Insert domain + provision on Vercel ───────────────────────────────
    if (domainName) {
      const fullDomain = `${domainName}.${PLATFORM_DOMAIN}`;

      // 1. Save to DB as pending first
      await query(
        `INSERT INTO agent_domains
         (agent_id, domain_name, full_domain, status, is_active, created_at)
         VALUES ($1, $2, $3, 'pending', true, NOW())`,
        [agentId, domainName, fullDomain]
      );

      // 2. Call Vercel API to add the subdomain to rexon-crm project
      const vercelResult = await addDomainToVercel(domainName);

      // 3. Update DB status based on Vercel result
      await query(
        `UPDATE agent_domains
         SET status = $1, updated_at = NOW()
         WHERE agent_id = $2 AND domain_name = $3`,
        [vercelResult.success ? 'active' : 'failed', agentId, domainName]
      );

      if (!vercelResult.success) {
        // Don't fail the whole registration — agent is created, domain just needs retry
        console.error(`Domain provisioning failed for ${fullDomain}:`, vercelResult.error);
      }
    }

    // ── Send invite email with domain name ─────────────────────────────────
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 SENDING EMAIL');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 About to call sendAgentInviteEmail with:', {
      fullName,
      email,
      domainName,  // ← CHECK THIS!
      agencyName,
      city,
    });

    const emailResult = await sendAgentInviteEmail({
      fullName,
      email,
      temporaryPassword,
      agencyName: agencyName || undefined,
      city: city || undefined,
      domainName: domainName || undefined,  // ← PASSING THIS
    });

    console.log('📧 Email send result:', emailResult);
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ FINISHED: Agent Registration');
    console.log('═══════════════════════════════════════════════════════');

    return NextResponse.json({
      success: true,
      agent: agentResult.rows[0],
      message: 'Agent registered successfully. Login credentials have been sent to their email.',
      emailSent: emailResult.success,
    });

  } catch (error) {
    console.error('Agent registration error:', error);

    if (error instanceof Error && error.message.includes('unique constraint')) {
      if (error.message.includes('email')) {
        return NextResponse.json({ error: 'This email is already registered' }, { status: 400 });
      }
      if (error.message.includes('domain_name')) {
        return NextResponse.json({ error: 'This domain was just taken. Please choose another.' }, { status: 409 });
      }
    }

    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}

// GET — fetch agent profile by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    const agentResult = await query(
      `SELECT a.id, a.full_name, a.email, a.mobile_number, a.whatsapp_number, a.city, a.state, a.address, a.pincode,
              a.date_of_birth, a.gender,
              a.agency_name, a.bio,
              a.profile_photo_s3_url, a.kyc_document_s3_url,
              a.languages_spoken,
              a.terms_accepted, a.is_verified, a.status,
              a.created_at, a.updated_at,
              d.domain_name, d.full_domain
       FROM agents a
       LEFT JOIN agent_domains d ON d.agent_id = a.id AND d.is_active = true
       WHERE a.email = $1`,
      [email]
    );

    if (agentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, agent: agentResult.rows[0] });

  } catch (error) {
    console.error('Get agent profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch agent profile' }, { status: 500 });
  }
}

// PUT — update agent profile by email
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email as string || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required to update profile' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const allowedFields = [
      'full_name', 'mobile_number', 'whatsapp_number', 'city', 'state', 'address', 'pincode',
      'date_of_birth', 'gender', 'agency_name', 'bio', 'languages_spoken'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'languages_spoken' && Array.isArray(body[field])) {
          updates.push(`${field} = $${paramCount}`);
          values.push(body[field].length > 0 ? body[field] : null);
        } else {
          updates.push(`${field} = $${paramCount}`);
          values.push(body[field]);
        }
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(email);

    const result = await query(
      `UPDATE agents SET ${updates.join(', ')} WHERE email = $${paramCount}
       RETURNING id, full_name, email, mobile_number, city, state, agency_name, bio, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Agent profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      agent: result.rows[0],
      message: 'Agent profile updated successfully',
    });

  } catch (error) {
    console.error('Update agent profile error:', error);
    return NextResponse.json({ error: 'Failed to update agent profile' }, { status: 500 });
  }
}