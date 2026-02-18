// api/agents/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

const BUCKET_NAME = 'rexon-web';
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB for profile image
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB for documents

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    // Personal Details
    const fullName = formData.get('fullName') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string || null;
    const genderRaw = formData.get('gender') as string || null;

    // Map gender to database-allowed values (capitalize first letter)
    const gender = genderRaw
      ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()
      : null;
    
    // Contact Information
    const primaryPhone = formData.get('primaryPhone') as string;
    const secondaryPhone = formData.get('secondaryPhone') as string || null;
    const email = formData.get('email') as string;
    const whatsappNumber = formData.get('whatsappNumber') as string || null;
    
    // Address Information
    const addressLine1 = formData.get('addressLine1') as string || '';
    const addressLine2 = formData.get('addressLine2') as string || '';
    const city = formData.get('city') as string || '';
    const state = formData.get('state') as string || '';
    const pincode = formData.get('pincode') as string || null;
    
    // Combine address
    const fullAddress = [addressLine1, addressLine2].filter(Boolean).join(', ');
    
    // Professional Information
    const agencyName = formData.get('agencyName') as string || '';
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

    // Validation
    if (!fullName || !primaryPhone || !email) {
      return NextResponse.json(
        { error: 'Please fill in all required fields: full name, primary phone, and email' },
        { status: 400 }
      );
    }

    // Validate phone number format (Indian mobile)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(primaryPhone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if email is already registered
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

    let profilePhotoS3Key = null;
    let profilePhotoS3Url = null;
    let kycDocumentS3Key = null;
    let kycDocumentS3Url = null;

    // Upload profile image if provided
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
      const uniqueFileName = `profile-${Date.now()}-${randomString}.${fileExtension}`;
      
      profilePhotoS3Key = `agents/profile/${uniqueFileName}`;

      const arrayBuffer = await profileImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: profilePhotoS3Key,
        Body: buffer,
        ContentType: profileImage.type,
      });

      await s3Client.send(uploadCommand);
      profilePhotoS3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-2'}.amazonaws.com/${profilePhotoS3Key}`;
    }

    // Upload KYC documents if provided (use first document as main KYC)
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
      const uniqueFileName = `kyc-${Date.now()}-${randomString}.${fileExtension}`;
      
      kycDocumentS3Key = `agents/kyc/${uniqueFileName}`;

      const arrayBuffer = await kycDocument.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: kycDocumentS3Key,
        Body: buffer,
        ContentType: kycDocument.type,
      });

      await s3Client.send(uploadCommand);
      kycDocumentS3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-2'}.amazonaws.com/${kycDocumentS3Key}`;
    }

    // Map specialization to database enum values
    let dbSpecialization = 'All';
    if (specialization.toLowerCase().includes('residential')) {
      dbSpecialization = 'Residential';
    } else if (specialization.toLowerCase().includes('commercial')) {
      dbSpecialization = 'Commercial';
    } else if (specialization.toLowerCase().includes('industrial') || specialization.toLowerCase().includes('warehouse')) {
      dbSpecialization = 'Industrial';
    }

    // Insert agent record
    const agentResult = await query(
      `INSERT INTO agents 
       (full_name, email, mobile_number, city, address,
        date_of_birth, gender,
        agency_name, license_number, experience_years, properties_managed, specialization,
        profile_photo_s3_key, profile_photo_s3_url,
        kyc_document_s3_key, kyc_document_s3_url,
        terms_accepted, is_verified, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
        0, // properties_managed default
        dbSpecialization,
        profilePhotoS3Key,
        profilePhotoS3Url,
        kycDocumentS3Key,
        kycDocumentS3Url,
        true, // terms_accepted
        false, // is_verified
        'Pending' // status
      ]
    );

    return NextResponse.json({
      success: true,
      agent: agentResult.rows[0],
      message: 'Agent registration submitted successfully. We will review and get back to you.',
    });

  } catch (error) {
    console.error('Agent registration error:', error);
    
    // Check for unique constraint violations
    if (error instanceof Error && error.message.includes('unique constraint')) {
      if (error.message.includes('email')) {
        return NextResponse.json(
          { error: 'This email is already registered' },
          { status: 400 }
        );
      }
      if (error.message.includes('license_number')) {
        return NextResponse.json(
          { error: 'This license number is already registered' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch agent profile
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const agentResult = await query(
      `SELECT id, full_name, email, mobile_number, city, address,
              date_of_birth, gender,
              agency_name, license_number, experience_years, properties_managed, specialization,
              profile_photo_s3_url, kyc_document_s3_url,
              terms_accepted, is_verified, status,
              created_at, updated_at
       FROM agents`,
    );

    if (agentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: agentResult.rows[0],
    });

  } catch (error) {
    console.error('Get agent profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent profile' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update agent profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Build dynamic update query based on provided fields
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
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE agents 
      SET ${updates.join(', ')}
      RETURNING id, full_name, email, city, agency_name, updated_at
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: result.rows[0],
      message: 'Agent profile updated successfully',
    });

  } catch (error) {
    console.error('Update agent profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update agent profile' },
      { status: 500 }
    );
  }
}