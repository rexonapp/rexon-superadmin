import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { query } from '@/lib/db';
import { randomBytes } from 'crypto';

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
const PLATFORM_DOMAIN = 'rexon.com';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

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
    const addressLine2 = formData.get('addressLine2') as string || '';
    const city = formData.get('city') as string || '';
    const state = formData.get('state') as string || '';
    const pincode = formData.get('pincode') as string || null;
    const fullAddress = [addressLine1, addressLine2].filter(Boolean).join(', ');

    // Professional Information
    const agencyName = formData.get('agencyName') as string || '';
    const domainName = (formData.get('domainName') as string || '').trim().toLowerCase();
    const licenseNumber = formData.get('licenseNumber') as string || '';
    const experienceYears = formData.get('experienceYears') as string || '0';
    const specialization = formData.get('specialization') as string || '';
    const reraRegistration = formData.get('reraRegistration') as string || null;

    // Identity & Verification
    const aadharNumber = formData.get('aadharNumber') as string || null;
    const panNumber = formData.get('panNumber') as string || null;

    // Additional Information
    const languagesSpokenStr = formData.get('languagesSpoken') as string;
    const languagesSpoken = languagesSpokenStr ? JSON.parse(languagesSpokenStr) : [];
    const serviceAreasStr = formData.get('serviceAreas') as string;
    const serviceAreas = serviceAreasStr ? JSON.parse(serviceAreasStr) : [];
    const bio = formData.get('bio') as string || '';

    // Files
    const profileImage = formData.get('profileImage') as File | null;
    const documents = formData.getAll('documents') as File[];

    // ── Validation ────────────────────────────────────────────────────────────
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

    // ── Email duplicate check ─────────────────────────────────────────────────
    const existingEmail = await query(
      'SELECT id FROM agents WHERE email = $1',
      [email]
    );
    if (existingEmail.rows.length > 0) {
      return NextResponse.json(
        { error: 'This email is already registered as an agent' },
        { status: 400 }
      );
    }

    // ── Domain validation & duplicate check ───────────────────────────────────
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

      // Race condition safety — re-check at submit time
      const domainCheck = await query(
        `SELECT id FROM agent_domains WHERE domain_name = $1 AND status = 'pending'`,
        [domainName]
      );
      if (domainCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'This domain was just taken. Please choose another.' },
          { status: 409 }
        );
      }
    }

    // ── File uploads ──────────────────────────────────────────────────────────
    let profilePhotoS3Key = null;
    let profilePhotoS3Url = null;
    let kycDocumentS3Key = null;
    let kycDocumentS3Url = null;

    if (profileImage && profileImage.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.includes(profileImage.type)) {
        return NextResponse.json(
          { error: 'Profile image must be JPG, PNG, or WebP' },
          { status: 400 }
        );
      }
      if (profileImage.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: 'Profile image must be less than 2MB' },
          { status: 400 }
        );
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
        return NextResponse.json(
          { error: 'KYC document must be PDF, JPG, or PNG' },
          { status: 400 }
        );
      }
      if (kycDocument.size > MAX_DOCUMENT_SIZE) {
        return NextResponse.json(
          { error: 'KYC document must be less than 5MB' },
          { status: 400 }
        );
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

    // ── Specialization mapping ────────────────────────────────────────────────
    let dbSpecialization = 'All';
    if (specialization.toLowerCase().includes('residential')) {
      dbSpecialization = 'Residential';
    } else if (specialization.toLowerCase().includes('commercial')) {
      dbSpecialization = 'Commercial';
    } else if (
      specialization.toLowerCase().includes('industrial') ||
      specialization.toLowerCase().includes('warehouse')
    ) {
      dbSpecialization = 'Industrial';
    }

    // ── Insert agent ──────────────────────────────────────────────────────────
    const agentResult = await query(
      `INSERT INTO agents
       (full_name, email, mobile_number, city, address,
        date_of_birth, gender,
        agency_name, license_number, experience_years, properties_managed, specialization,
        profile_photo_s3_key, profile_photo_s3_url,
        kyc_document_s3_key, kyc_document_s3_url,
        terms_accepted, is_verified, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id, full_name, email, mobile_number, city, agency_name, status, created_at`,
      [
        fullName,
        email,
        primaryPhone,
        city,
        fullAddress,
        dateOfBirth,
        gender,
        agencyName,
        licenseNumber,
        parseInt(experienceYears) || 0,
        0,
        dbSpecialization,
        profilePhotoS3Key,
        profilePhotoS3Url,
        kycDocumentS3Key,
        kycDocumentS3Url,
        true,
        false,
        'Pending',
      ]
    );

    const agentId = agentResult.rows[0].id;

    // ── Insert domain record if provided ──────────────────────────────────────
    if (domainName) {
      const fullDomain = `${domainName}.${PLATFORM_DOMAIN}`;
      await query(
        `INSERT INTO agent_domains
         (agent_id, domain_name, full_domain, status, is_active, activated_at)
         VALUES ($1, $2, $3, 'pending', true, NOW())`,
        [agentId, domainName, fullDomain]
      );
    }

    return NextResponse.json({
      success: true,
      agent: agentResult.rows[0],
      message: 'Agent registration submitted successfully. We will review and get back to you.',
    });

  } catch (error) {
    console.error('Agent registration error:', error);

    if (error instanceof Error && error.message.includes('unique constraint')) {
      if (error.message.includes('email')) {
        return NextResponse.json({ error: 'This email is already registered' }, { status: 400 });
      }
      if (error.message.includes('license_number')) {
        return NextResponse.json({ error: 'This license number is already registered' }, { status: 400 });
      }
      if (error.message.includes('domain_name')) {
        return NextResponse.json({ error: 'This domain was just taken. Please choose another.' }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

// GET — fetch agent profile by email (query param)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    const agentResult = await query(
      `SELECT a.id, a.full_name, a.email, a.mobile_number, a.city, a.address,
              a.date_of_birth, a.gender,
              a.agency_name, a.license_number, a.experience_years, a.properties_managed, a.specialization,
              a.profile_photo_s3_url, a.kyc_document_s3_url,
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
      'full_name', 'mobile_number', 'city', 'address',
      'date_of_birth', 'gender', 'agency_name', 'experience_years',
      'properties_managed', 'bio'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(body[field]);
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
       RETURNING id, full_name, email, city, agency_name, updated_at`,
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