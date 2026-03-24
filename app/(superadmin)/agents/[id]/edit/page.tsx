'use client'
import { useState, useEffect, useRef } from 'react';
import { Upload, X, AlertCircle, User, MapPin, FileText, Briefcase, Eye, Trash2, CalendarIcon, CheckCircle2, Loader2, Globe, ArrowLeft, ExternalLink } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentFormData {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    primaryPhone: string;
    email: string;
    whatsappNumber: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    agencyName: string;
    domainName: string;
    languagesSpoken: string[];
    serviceAreas: string[];
    bio: string;
    profileImage: File | null;
    documents: File[];
  }

interface FieldErrors {
  fullName?: string;
  primaryPhone?: string;
  email?: string;
  whatsappNumber?: string;
  pincode?: string;
  aadharNumber?: string;
  panNumber?: string;
  domainName?: string;
}

type DomainStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error' | 'unchanged';

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Puducherry',
];



const LANGUAGES = [
  'Hindi','English','Tamil','Telugu','Kannada',
  'Malayalam','Marathi','Bengali','Gujarati','Punjabi',
];

const PLATFORM_DOMAIN = 'rexonproperties.in';

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params?.id as string;

  // Loading / saving state
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Existing S3 assets (shown when no new file chosen)
  const [existingProfileUrl, setExistingProfileUrl] = useState<string>('');
  const [existingKycUrl, setExistingKycUrl] = useState<string>('');
  const [existingKycName, setExistingKycName] = useState<string>('');

  // New file previews
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Original domain (to detect if user changed it)
  const [originalDomain, setOriginalDomain] = useState<string>('');

  // Domain availability
  const [domainStatus, setDomainStatus] = useState<DomainStatus>('idle');
  const domainDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validation
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<AgentFormData>({
    fullName: '', dateOfBirth: '', gender: '',
    primaryPhone: '', email: '', whatsappNumber: '',
    addressLine1: '', city: '', state: '', pincode: '',
    agencyName: '', domainName: '',
    languagesSpoken: [], serviceAreas: [], bio: '',
    profileImage: null, documents: [],
  });
  // ─── Fetch existing agent ──────────────────────────────────────────────────

  useEffect(() => {
    if (!agentId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (!res.ok) throw new Error('Agent not found');
        const { agent } = await res.json();

        setFormData({
            fullName: agent.full_name ?? '',
            dateOfBirth: agent.date_of_birth ? agent.date_of_birth.split('T')[0] : '',
            gender: agent.gender?.toLowerCase() ?? '',
            primaryPhone: agent.mobile_number ?? '',
            email: agent.email ?? '',
            whatsappNumber: agent.whatsapp_number ?? '',
            addressLine1: agent.address ?? '',
            city: agent.city ?? '',
            state: agent.state ?? '',
            pincode: agent.pincode ?? '',
            agencyName: agent.agency_name ?? '',
            domainName: agent.domain_name ?? '',
            languagesSpoken: agent.languages_spoken ?? [],
            serviceAreas: agent.service_areas ?? [],
            bio: agent.bio ?? '',
            profileImage: null,
            documents: [],
          });

        if (agent.profile_photo_s3_url) setExistingProfileUrl(agent.profile_photo_s3_url);
        if (agent.kyc_document_s3_url) {
          setExistingKycUrl(agent.kyc_document_s3_url);
          // Derive a display name from the S3 key
          const key = agent.kyc_document_s3_key ?? '';
          setExistingKycName(key.split('/').pop() ?? 'kyc-document');
        }

        const domain = agent.domain_name ?? '';
        setOriginalDomain(domain);
        if (domain) setDomainStatus('unchanged');
      } catch (err) {
        toast.error('Failed to load agent data');
        router.back();
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [agentId]);

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value?.trim()) return 'Full name is required';
        if (value.length < 3) return 'Name must be at least 3 characters';
        break;
      case 'primaryPhone':
        if (!value?.trim()) return 'Primary phone is required';
        if (!/^[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) return 'Enter a valid 10-digit mobile number';
        break;
      case 'email':
        if (!value?.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        break;
      case 'whatsappNumber':
        if (value && !/^[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) return 'Enter a valid 10-digit mobile number';
        break;
      case 'pincode':
        if (value) {
          if (!/^\d+$/.test(value)) return 'Pincode must contain only numbers';
          if (value.length !== 6) return 'Pincode must be exactly 6 digits';
        }
        break;
      case 'aadharNumber':
        if (value) {
          const cleaned = value.replace(/\s/g, '');
          if (!/^\d+$/.test(cleaned)) return 'Aadhar must contain only numbers';
          if (cleaned.length !== 12) return 'Aadhar must be exactly 12 digits';
        }
        break;
      case 'panNumber':
        if (value && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) {
          return 'Enter a valid PAN number (e.g., ABCDE1234F)';
        }
        break;
      case 'domainName':
        if (value && !/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and hyphens allowed';
        if (value && value.length < 3) return 'Domain must be at least 3 characters';
        if (value && value.length > 50) return 'Domain must be under 50 characters';
        if (value && (value.startsWith('-') || value.endsWith('-'))) return 'Domain cannot start or end with a hyphen';
        break;
    }
    return undefined;
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouchedFields(prev => new Set(prev).add(name));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleFieldBlur = (name: string) => {
    setTouchedFields(prev => new Set(prev).add(name));
    setFieldErrors(prev => ({ ...prev, [name]: validateField(name, formData[name as keyof AgentFormData]) }));
  };

  // ─── Domain handlers ──────────────────────────────────────────────────────

  const handleDomainChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, domainName: cleaned }));
    setTouchedFields(prev => new Set(prev).add('domainName'));
    const error = validateField('domainName', cleaned);
    setFieldErrors(prev => ({ ...prev, domainName: error }));

    if (domainDebounceRef.current) clearTimeout(domainDebounceRef.current);

    // If reverting to original domain, mark unchanged
    if (cleaned === originalDomain && originalDomain !== '') {
      setDomainStatus('unchanged');
      return;
    }

    if (!cleaned || cleaned.length < 3 || error) {
      setDomainStatus('idle');
      return;
    }

    setDomainStatus('checking');

    domainDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/agents/check-domain?name=${encodeURIComponent(cleaned)}${agentId ? `&agentId=${agentId}` : ''}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Check failed');
        setDomainStatus(data.available ? 'available' : 'taken');
      } catch {
        setDomainStatus('error');
      }
    }, 600);
  };

  // ─── File handlers ────────────────────────────────────────────────────────

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (!allowed.includes(file.type.toLowerCase())) {
      toast.error('Only image files are allowed (JPG, JPEG, PNG, WEBP, GIF)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Profile image must be less than 2MB');
      return;
    }
    setProfilePreview(URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, profileImage: file }));
  };

  const removeNewProfileImage = () => {
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePreview('');
    setFormData(prev => ({ ...prev, profileImage: null }));
    const input = document.getElementById('profileImage') as HTMLInputElement;
    if (input) input.value = '';
  };

  const removeExistingProfileImage = () => {
    setExistingProfileUrl('');
    removeNewProfileImage();
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length) { toast.error('Some files exceed 5MB limit'); return; }
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
  };

  const removeNewDocument = (index: number) => {
    setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
  };

  const removeExistingKyc = () => {
    setExistingKycUrl('');
    setExistingKycName('');
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languagesSpoken: prev.languagesSpoken.includes(language)
        ? prev.languagesSpoken.filter(l => l !== language)
        : [...prev.languagesSpoken, language],
    }));
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    ['fullName','primaryPhone','email'].forEach(f => {
      const err = validateField(f, formData[f as keyof AgentFormData]);
      if (err) errors[f as keyof FieldErrors] = err;
    });
    ['whatsappNumber','pincode','aadharNumber','panNumber','domainName'].forEach(f => {
      const val = formData[f as keyof AgentFormData];
      if (val) {
        const err = validateField(f, val);
        if (err) errors[f as keyof FieldErrors] = err;
      }
    });

    // Domain changed but not verified
    if (formData.domainName && formData.domainName !== originalDomain) {
      if (domainStatus === 'taken') errors.domainName = 'This domain is already taken. Please choose another.';
      if (domainStatus === 'idle' || domainStatus === 'error') errors.domainName = 'Please check domain availability first';
    }

    setFieldErrors(errors);
    setTouchedFields(new Set(['fullName','primaryPhone','email','whatsappNumber','pincode','aadharNumber','panNumber','domainName']));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      document.querySelector('.border-red-500')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);

    try {
      const upload = new FormData();

      // Scalar fields
      const scalars: (keyof AgentFormData)[] = [
        'fullName','dateOfBirth','gender','primaryPhone','email','whatsappNumber',
        'addressLine1','city','state','pincode',
        'agencyName','domainName','bio',
      ];
      scalars.forEach(k => upload.append(k, (formData[k] ?? '').toString()));

      upload.append('languagesSpoken', JSON.stringify(formData.languagesSpoken));
      upload.append('serviceAreas', JSON.stringify(formData.serviceAreas));

      // Whether the existing profile image should be deleted (user removed it)
      upload.append('removeProfileImage', (!existingProfileUrl && !formData.profileImage).toString());
      upload.append('removeKycDocument', (!existingKycUrl && !formData.documents.length).toString());

      if (formData.profileImage) upload.append('profileImage', formData.profileImage);
      formData.documents.forEach(f => upload.append('documents', f));

      const res = await fetch(`/api/agents/${agentId}`, { method: 'PUT', body: upload });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      toast.success('Agent updated successfully!');
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      toast.error('Update failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading skeleton ─────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const activeProfileSrc = profilePreview || existingProfileUrl;

  const errorClass = (field: keyof FieldErrors) =>
    touchedFields.has(field) && fieldErrors[field] ? 'border-red-500 focus-visible:ring-red-500' : '';

  const ErrorMsg = ({ field }: { field: keyof FieldErrors }) =>
    touchedFields.has(field) && fieldErrors[field] ? (
      <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
        <AlertCircle className="h-4 w-4" /> {fieldErrors[field]}
      </p>
    ) : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-gray-700 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span className="mx-2">/</span>
            <span>Agent</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Edit Agent</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1">Edit Agent</h1>
          <p className="text-sm text-gray-500">Updating profile for <span className="font-medium text-gray-700">{formData.fullName}</span></p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle>Personal Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={e => handleFieldChange('fullName', e.target.value)}
                    onBlur={() => handleFieldBlur('fullName')}
                    placeholder="e.g., John Doe"
                    className={`h-11 ${errorClass('fullName')}`}
                  />
                  <ErrorMsg field="fullName" />
                </div>

                {/* DOB + Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full h-11 justify-start text-left font-normal', !formData.dateOfBirth && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dateOfBirth ? format(new Date(formData.dateOfBirth), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                          onSelect={date => { if (date) setFormData(p => ({ ...p, dateOfBirth: format(date, 'yyyy-MM-dd') })); }}
                          disabled={date => date > new Date() || date < new Date('1900-01-01')}
                          captionLayout="dropdown"
                          className="rounded-lg border"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v }))}>
                      <SelectTrigger className="h-12"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Phone + WhatsApp */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryPhone">Primary Phone <span className="text-red-500">*</span></Label>
                    <Input
                      id="primaryPhone" type="tel" maxLength={10}
                      value={formData.primaryPhone}
                      onChange={e => handleFieldChange('primaryPhone', e.target.value)}
                      onBlur={() => handleFieldBlur('primaryPhone')}
                      placeholder="+91 98765 43210"
                      className={`h-11 ${errorClass('primaryPhone')}`}
                    />
                    <ErrorMsg field="primaryPhone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input
                      id="whatsappNumber" type="tel" maxLength={10}
                      value={formData.whatsappNumber}
                      onChange={e => handleFieldChange('whatsappNumber', e.target.value)}
                      onBlur={() => handleFieldBlur('whatsappNumber')}
                      placeholder="+91 98765 43210"
                      className={`h-11 ${errorClass('whatsappNumber')}`}
                    />
                    <ErrorMsg field="whatsappNumber" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="email" type="email"
                    value={formData.email}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    placeholder="john@example.com"
                    className={`h-11 ${errorClass('email')}`}
                  />
                  <ErrorMsg field="email" />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle>Address Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Full Address</Label>
                  <Textarea
                    id="addressLine1"
                    value={formData.addressLine1}
                    onChange={e => setFormData(p => ({ ...p, addressLine1: e.target.value }))}
                    rows={3}
                    placeholder="Enter your complete address including street, building name, landmark, area, etc."
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} placeholder="Mumbai" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={formData.state} onValueChange={v => setFormData(p => ({ ...p, state: v }))}>
                      <SelectTrigger className="h-12"><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input
                      value={formData.pincode} maxLength={6} inputMode="numeric"
                      onChange={e => handleFieldChange('pincode', e.target.value)}
                      onBlur={() => handleFieldBlur('pincode')}
                      placeholder="400001"
                      className={`h-11 ${errorClass('pincode')}`}
                    />
                    <ErrorMsg field="pincode" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle>Professional Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Agency Name</Label>
                  <Input value={formData.agencyName} onChange={e => setFormData(p => ({ ...p, agencyName: e.target.value }))} placeholder="e.g., Premier Estates Ltd." className="h-11" />
                </div>

                {/* Domain */}
                <div className="space-y-2">
                  <Label htmlFor="domainName">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-gray-500" />
                      Profile Domain
                      <span className="text-xs text-gray-400 font-normal">(optional)</span>
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="domainName"
                      value={formData.domainName}
                      onChange={e => handleDomainChange(e.target.value)}
                      placeholder="yourname"
                      maxLength={50}
                      className={cn(
                        'h-11 pl-3 pr-44',
                        touchedFields.has('domainName') && fieldErrors.domainName ? 'border-red-500 focus-visible:ring-red-500' :
                        domainStatus === 'available' ? 'border-green-500 focus-visible:ring-green-500' :
                        domainStatus === 'unchanged' ? 'border-blue-400 focus-visible:ring-blue-400' :
                        domainStatus === 'taken' ? 'border-red-500 focus-visible:ring-red-500' : ''
                      )}
                    />
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none select-none">
                      .{PLATFORM_DOMAIN}
                    </span>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {domainStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                      {domainStatus === 'available' && !fieldErrors.domainName && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {domainStatus === 'unchanged' && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
                      {(domainStatus === 'taken' || (touchedFields.has('domainName') && fieldErrors.domainName)) && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </span>
                  </div>

                  {touchedFields.has('domainName') && fieldErrors.domainName && (
                    <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{fieldErrors.domainName}</p>
                  )}
                  {!fieldErrors.domainName && domainStatus === 'checking' && formData.domainName.length >= 3 && (
                    <p className="text-sm text-gray-400 flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" />Checking availability…</p>
                  )}
                  {!fieldErrors.domainName && domainStatus === 'available' && (
                    <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /><strong>{formData.domainName}.{PLATFORM_DOMAIN}</strong>&nbsp;is available!</p>
                  )}
                  {!fieldErrors.domainName && domainStatus === 'unchanged' && (
                    <p className="text-sm text-blue-500 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Current domain: <strong>{formData.domainName}.{PLATFORM_DOMAIN}</strong></p>
                  )}
                  {!fieldErrors.domainName && domainStatus === 'taken' && (
                    <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /><strong>{formData.domainName}.{PLATFORM_DOMAIN}</strong>&nbsp;is already taken.</p>
                  )}
                  {!fieldErrors.domainName && domainStatus === 'error' && (
                    <p className="text-sm text-orange-500 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />Could not check availability. Please try again.</p>
                  )}
                  {domainStatus === 'idle' && !formData.domainName && (
                    <p className="text-xs text-gray-400">Your public profile will be at&nbsp;<span className="font-medium">yourname.{PLATFORM_DOMAIN}</span></p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Languages Spoken</Label>
                  <Select
                    value="select languages"
                    onValueChange={value => {
                      if (value && !formData.languagesSpoken.includes(value)) {
                        setFormData(prev => ({ ...prev, languagesSpoken: [...prev.languagesSpoken, value] }));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue>
                        {formData.languagesSpoken.length > 0 ? (
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {formData.languagesSpoken.length} {formData.languagesSpoken.length === 1 ? 'language' : 'languages'} selected
                            </span>
                            <span className="text-gray-500 text-sm">• Click to select more</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">Select languages...</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.filter(l => !formData.languagesSpoken.includes(l)).length > 0
                        ? LANGUAGES.filter(l => !formData.languagesSpoken.includes(l)).map(language => (
                            <SelectItem key={language} value={language}>{language}</SelectItem>
                          ))
                        : <div className="px-2 py-6 text-center text-sm text-gray-500">All languages selected</div>
                      }
                    </SelectContent>
                  </Select>
                  {formData.languagesSpoken.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.languagesSpoken.map(language => (
                        <Badge key={language} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1.5">
                          {language}
                          <button type="button" onClick={() => toggleLanguage(language)} className="ml-2 hover:text-blue-600">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / About You</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                    rows={5}
                    placeholder="Tell clients about your experience, expertise, and approach to real estate..."
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">This will be displayed on your public agent profile</p>
                </div>

    
                
              </CardContent>
            </Card>
          </div>

          {/* ── Right column (sticky sidebar) ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">

              {/* Profile Photo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Photo</CardTitle>
                  <CardDescription>Upload a new photo or keep the existing one</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeProfileSrc ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <img
                          src={activeProfileSrc}
                          alt="Profile preview"
                          className="w-full h-64 rounded-lg object-cover border-2 border-gray-200"
                        />
                        {/* Badge: new vs existing */}
                        {profilePreview && (
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">New</span>
                        )}
                        {existingProfileUrl && !profilePreview && (
                          <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Current</span>
                        )}
                        <div className="absolute inset-0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <Button type="button" size="icon" variant="secondary" onClick={() => setIsImageModalOpen(true)} className="h-10 w-10 rounded-full bg-white hover:bg-gray-100 text-gray-900" title="Preview">
                              <Eye className="h-5 w-5" />
                            </Button>
                            <Button type="button" size="icon" variant="destructive" onClick={profilePreview ? removeNewProfileImage : removeExistingProfileImage} className="h-10 w-10 rounded-full" title="Remove">
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('profileImage')?.click()}>
                        <Upload className="h-4 w-4 mr-2" /> {existingProfileUrl ? 'Replace Photo' : 'Upload Photo'}
                      </Button>
                      <input id="profileImage" type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
                    </div>
                  ) : (
                    <Label htmlFor="profileImage" className="block w-full cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                        <input id="profileImage" type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" onChange={handleProfileImageChange} className="hidden" />
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Upload Photo</p>
                        <p className="text-xs text-gray-500">JPG, PNG, WEBP, GIF (max 2MB)</p>
                      </div>
                    </Label>
                  )}
                </CardContent>
              </Card>

              {/* KYC Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">KYC Documents</CardTitle>
                  <CardDescription>Upload a valid ID proof (Passport, Driving License, or National ID)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing KYC */}
                  {existingKycUrl && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs text-blue-600 font-semibold mb-2 uppercase tracking-wide">Current Document</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{existingKycName}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <a href={existingKycUrl} target="_blank" rel="noopener noreferrer">
                            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:bg-blue-100" title="View document">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                          <Button type="button" size="icon" variant="ghost" onClick={removeExistingKyc} className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-500" title="Remove document">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload new */}
                  <Label htmlFor="documents" className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <input id="documents" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocumentChange} className="hidden" />
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Upload className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{existingKycUrl ? 'Upload Replacement' : 'Upload Document'}</p>
                      <p className="text-xs text-gray-500">PDF or JPG (max 5MB)</p>
                    </div>
                  </Label>

                  {/* New files queued */}
                  {formData.documents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">New Documents (will replace existing)</p>
                      {formData.documents.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                          </div>
                          <Button type="button" size="icon" variant="ghost" onClick={() => removeNewDocument(i)} className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-500 flex-shrink-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-bold shadow-md hover:shadow-lg"
                >
                  {saving ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" /><span>Saving…</span></>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="w-full py-6 text-base font-medium">
                  Cancel
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Profile Photo Preview</DialogTitle></DialogHeader>
          {activeProfileSrc && (
            <img src={activeProfileSrc} alt="Profile full size" className="w-full h-auto rounded-lg object-contain" />
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsImageModalOpen(false)}>Close</Button>
            <Button type="button" variant="destructive" onClick={() => { profilePreview ? removeNewProfileImage() : removeExistingProfileImage(); setIsImageModalOpen(false); }}>
              <Trash2 className="h-4 w-4 mr-2" /> Remove Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}