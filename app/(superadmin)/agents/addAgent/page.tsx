'use client'
import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, User, MapPin, FileText, Briefcase, Eye, Trash2, CalendarIcon, CheckCircle2, Loader2, Globe, ScrollText, ExternalLink, Phone, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AgentFormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  primaryPhone: string;
  sameAsPhone: boolean;
  whatsappNumber: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
  agencyName: string;
  domainName: string;
  languagesSpoken: string[];
  bio: string;
  reraNumber: string;
  profileImage: File | null;
  documents: File[];
}

interface FieldErrors {
  fullName?: string;
  dateOfBirth?: string;
  primaryPhone?: string;
  whatsappNumber?: string;
  email?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  agencyName?: string;
  domainName?: string;
  languagesSpoken?: string;
  bio?: string;
  profileImage?: string;
  documents?: string;
  termsAccepted?: string;
}

interface TncSection {
  id: number;
  section_number: number;
  section_title: string;
  section_content: string;
  tnc_version: string;
}

type DomainStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'
];

const PLATFORM_DOMAIN = 'rexonproperties.in';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const isAdult = (dob: string): boolean => {
  if (!dob) return false;
  const birth = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  return age > 18 || (age === 18 && m > 0) || (age === 18 && m === 0 && today.getDate() >= birth.getDate());
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperadminAgentCreation() {
  const router = useRouter();

  const [formData, setFormData] = useState<AgentFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    primaryPhone: '',
    sameAsPhone: false,
    whatsappNumber: '',
    email: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
    agencyName: '',
    domainName: '',
    languagesSpoken: [],
    bio: '',
    reraNumber: '',
    profileImage: null,
    documents: [],
  });

  const [uploading, setUploading] = useState(false);
  const [profilePreview, setProfilePreview] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Domain availability
  const [domainStatus, setDomainStatus] = useState<DomainStatus>('idle');
  const domainDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // T&C
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isTncDialogOpen, setIsTncDialogOpen] = useState(false);
  const [tncSections, setTncSections] = useState<TncSection[]>([]);
  const [tncVersion, setTncVersion] = useState('1.0');
  const [tncLoading, setTncLoading] = useState(false);
  const [tncError, setTncError] = useState('');

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value || value.trim() === '') return 'Please enter full name.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        if (value.trim().length > 100) return 'Name must be under 100 characters.';
        if (!/^[a-zA-Z\s.]+$/.test(value)) return 'Only letters, spaces, and periods allowed.';
        break;
      case 'dateOfBirth':
        if (!value) return 'Please select date of birth.';
        if (!isAdult(value)) return 'Agent must be at least 18 years old.';
        break;
      case 'primaryPhone':
        if (!value || value.trim() === '') return 'Mobile number is required.';
        if (!/^[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) return 'Enter valid 10-digit Indian mobile number.';
        break;
      case 'whatsappNumber':
        if (value && !/^[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) return 'Enter valid 10-digit mobile number.';
        break;
      case 'email':
        if (!value || value.trim() === '') return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter valid email address.';
        break;
      case 'addressLine1':
        if (!value || value.trim() === '') return 'Address is required.';
        if (value.trim().length < 10) return 'Address must be at least 10 characters.';
        break;
      case 'city':
        if (!value || value.trim() === '') return 'City is required.';
        break;
      case 'state':
        if (!value || value.trim() === '') return 'State is required.';
        break;
      case 'pincode':
        if (value) {
          if (!/^\d+$/.test(value)) return 'Pincode must contain only numbers.';
          if (value.length !== 6) return 'Pincode must be exactly 6 digits.';
        }
        break;
      case 'agencyName':
        if (value && value.length > 150) return 'Agency name must be under 150 characters.';
        break;
      case 'domainName':
        if (value && !/^[a-z0-9-]+$/.test(value)) return 'Only lowercase letters, numbers, and hyphens allowed.';
        if (value && value.length < 3) return 'Domain must be at least 3 characters.';
        if (value && value.length > 50) return 'Domain must be under 50 characters.';
        if (value && (value.startsWith('-') || value.endsWith('-'))) return 'Domain cannot start or end with hyphen.';
        break;
      case 'languagesSpoken':
        if (!value || value.length === 0) return 'Please select at least one language.';
        break;
    }
    return undefined;
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouchedFields(prev => new Set(prev).add(name));
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFieldBlur = (name: string) => {
    setTouchedFields(prev => new Set(prev).add(name));
    const val = formData[name as keyof AgentFormData];
    const error = validateField(name, val);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  // ── Domain check ───────────────────────────────────────────────────────────

  const handleDomainChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, domainName: cleaned }));
    setTouchedFields(prev => new Set(prev).add('domainName'));
    const error = validateField('domainName', cleaned);
    setFieldErrors(prev => ({ ...prev, domainName: error }));

    if (domainDebounceRef.current) clearTimeout(domainDebounceRef.current);

    if (!cleaned || cleaned.length < 3 || error) {
      setDomainStatus('idle');
      return;
    }

    setDomainStatus('checking');

    domainDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/agents/check-domain?name=${encodeURIComponent(cleaned)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Check failed');
        setDomainStatus(data.available ? 'available' : 'taken');
      } catch {
        setDomainStatus('error');
      }
    }, 600);
  };

  // ── Same as phone toggle ───────────────────────────────────────────────────

  const handleSameAsPhone = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sameAsPhone: checked,
      whatsappNumber: checked ? prev.primaryPhone : '',
    }));
    if (checked) setFieldErrors(prev => ({ ...prev, whatsappNumber: undefined }));
  };

  // ── Languages ──────────────────────────────────────────────────────────────

  const toggleLanguage = (language: string) => {
    const updated = formData.languagesSpoken.includes(language)
      ? formData.languagesSpoken.filter(l => l !== language)
      : [...formData.languagesSpoken, language];
    setFormData(prev => ({ ...prev, languagesSpoken: updated }));
    setTouchedFields(prev => new Set(prev).add('languagesSpoken'));
    setFieldErrors(prev => ({ ...prev, languagesSpoken: updated.length === 0 ? 'Please select at least one language.' : undefined }));
  };

  // ── Profile image ──────────────────────────────────────────────────────────

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTouchedFields(prev => new Set(prev).add('profileImage'));
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setFieldErrors(prev => ({ ...prev, profileImage: 'Only JPG, PNG, or WEBP files allowed.' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFieldErrors(prev => ({ ...prev, profileImage: 'Profile image must be less than 2MB.' }));
      return;
    }
    setProfilePreview(URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, profileImage: file }));
    setFieldErrors(prev => ({ ...prev, profileImage: undefined }));
  };

  const removeProfileImage = () => {
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePreview('');
    setFormData(prev => ({ ...prev, profileImage: null }));
    const input = document.getElementById('profileImage') as HTMLInputElement;
    if (input) input.value = '';
  };

  // ── Documents ──────────────────────────────────────────────────────────────

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    setTouchedFields(prev => new Set(prev).add('documents'));
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      setFieldErrors(prev => ({ ...prev, documents: 'Some files exceed 5MB limit.' }));
      return;
    }
    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
    setFieldErrors(prev => ({ ...prev, documents: undefined }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
  };

  // ── T&C dialog ─────────────────────────────────────────────────────────────

  const openTncDialog = async () => {
    setIsTncDialogOpen(true);
    if (tncSections.length > 0) return;
    setTncLoading(true);
    setTncError('');
    try {
      const res = await fetch('/api/agents/terms');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setTncSections(data.sections);
      setTncVersion(data.version);
    } catch {
      setTncError('Failed to load Terms and Conditions. Please try again.');
    } finally {
      setTncLoading(false);
    }
  };

  // ── Form validation ────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    const always = ['fullName', 'dateOfBirth', 'primaryPhone', 'email', 'addressLine1', 'city', 'state'];
    always.forEach(f => {
      const e = validateField(f, formData[f as keyof AgentFormData]);
      if (e) errors[f as keyof FieldErrors] = e;
    });

    if (formData.pincode) {
      const e = validateField('pincode', formData.pincode);
      if (e) errors.pincode = e;
    }
    if (formData.agencyName) {
      const e = validateField('agencyName', formData.agencyName);
      if (e) errors.agencyName = e;
    }
    if (!formData.sameAsPhone && formData.whatsappNumber) {
      const e = validateField('whatsappNumber', formData.whatsappNumber);
      if (e) errors.whatsappNumber = e;
    }

    const langErr = validateField('languagesSpoken', formData.languagesSpoken);
    if (langErr) errors.languagesSpoken = langErr;

    if (formData.domainName) {
      const e = validateField('domainName', formData.domainName);
      if (e) errors.domainName = e;
      if (!e && domainStatus !== 'available' && domainStatus !== 'idle') {
        errors.domainName = 'Please check domain availability first.';
      }
    }

    if (!termsAccepted) errors.termsAccepted = 'You must accept the Terms & Conditions.';

    setFieldErrors(errors);
    setTouchedFields(new Set([...always, 'pincode', 'agencyName', 'whatsappNumber', 'languagesSpoken', 'domainName', 'termsAccepted']));
    return Object.keys(errors).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting.');
      setTimeout(() => {
        const el = document.querySelector('[data-error="true"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        // Map domainName field
        const fieldName = key;

        if (key === 'profileImage' && val) {
          fd.append('profileImage', val as File);
        } else if (key === 'documents') {
          (val as File[]).forEach(f => fd.append('documents', f));
        } else if (key === 'languagesSpoken') {
          fd.append(fieldName, JSON.stringify(val));
        } else {
          fd.append(fieldName, val?.toString() ?? '');
        }
      });
      fd.append('termsAccepted', 'true');
      fd.append('tncVersion', tncVersion);

      console.log('📤 Superadmin Agent Creation with:', {
        domainName: formData.domainName,
      });

      const response = await fetch('/api/agents/register', { method: 'POST', body: fd });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Agent creation failed');

      toast.success('Agent created successfully!', {
        description: 'The agent has been registered and will receive login credentials via email.',
      });

      setTimeout(() => router.back(), 2000);
    } catch (error) {
      toast.error('Agent creation failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  // ── Error helper ───────────────────────────────────────────────────────────
  const ErrMsg = ({ field }: { field: keyof FieldErrors }) =>
    touchedFields.has(field) && fieldErrors[field] ? (
      <p data-error="true" className="text-sm text-red-500 flex items-center gap-1 mt-1">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{fieldErrors[field]}
      </p>
    ) : null;

  const inputCls = (field: keyof FieldErrors) =>
    `h-11 ${touchedFields.has(field) && fieldErrors[field] ? 'border-red-400 focus-visible:ring-red-400' : ''}`;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-gray-50/40">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-gray-400 mb-4 gap-1.5">
            <span className="hover:text-gray-600 cursor-pointer">Agents</span>
            <span>/</span>
            <span className="text-gray-700 font-medium">Create New Agent</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Create New Agent</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Add a new real estate agent to your network. Fill out the form below with all required information.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ────────────────────── LEFT COLUMN ────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── 1. Personal Details ── */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <User className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Personal Details</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Basic information about the agent</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={e => handleFieldChange('fullName', e.target.value)}
                    onBlur={() => handleFieldBlur('fullName')}
                    placeholder="e.g., John Doe"
                    maxLength={100}
                    className={inputCls('fullName')}
                  />
                  <ErrMsg field="fullName" />
                </div>

                {/* DOB + Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full h-11 justify-start text-left font-normal',
                            !formData.dateOfBirth && 'text-muted-foreground',
                            touchedFields.has('dateOfBirth') && fieldErrors.dateOfBirth && 'border-red-400'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dateOfBirth ? format(new Date(formData.dateOfBirth), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                          onSelect={date => {
                            if (date) handleFieldChange('dateOfBirth', format(date, 'yyyy-MM-dd'));
                          }}
                          disabled={date => date > new Date() || date < new Date('1900-01-01')}
                          captionLayout="dropdown"
                          className="rounded-lg border"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <ErrMsg field="dateOfBirth" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Gender</Label>
                    <Select value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 2. Contact Information ── */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Contact Information</CardTitle>
                    <CardDescription className="text-xs mt-0.5">How to reach the agent</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Primary Phone */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center h-11 px-3 border rounded-md bg-gray-50 text-sm text-gray-500 font-medium select-none">
                      +91
                    </div>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.primaryPhone}
                      onChange={e => {
                        handleFieldChange('primaryPhone', e.target.value.replace(/\D/g, ''));
                        if (formData.sameAsPhone) setFormData(prev => ({ ...prev, whatsappNumber: e.target.value.replace(/\D/g, '') }));
                      }}
                      onBlur={() => handleFieldBlur('primaryPhone')}
                      placeholder="98765 43210"
                      className={cn('h-11 flex-1', touchedFields.has('primaryPhone') && fieldErrors.primaryPhone && 'border-red-400')}
                    />
                  </div>
                  <ErrMsg field="primaryPhone" />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-gray-400" />
                      WhatsApp Number
                    </Label>
                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                      <Checkbox
                        checked={formData.sameAsPhone}
                        onCheckedChange={checked => handleSameAsPhone(!!checked)}
                        className="h-3.5 w-3.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      Same as mobile
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center h-11 px-3 border rounded-md bg-gray-50 text-sm text-gray-500 font-medium select-none">
                      +91
                    </div>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={formData.sameAsPhone ? formData.primaryPhone : formData.whatsappNumber}
                      onChange={e => handleFieldChange('whatsappNumber', e.target.value.replace(/\D/g, ''))}
                      onBlur={() => handleFieldBlur('whatsappNumber')}
                      placeholder="98765 43210"
                      disabled={formData.sameAsPhone}
                      className={cn('h-11 flex-1', touchedFields.has('whatsappNumber') && fieldErrors.whatsappNumber && 'border-red-400')}
                    />
                  </div>
                  <ErrMsg field="whatsappNumber" />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    placeholder="john@example.com"
                    className={inputCls('email')}
                  />
                  <ErrMsg field="email" />
                </div>
              </CardContent>
            </Card>

            {/* ── 3. Address Information ── */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Address Information</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Agent's residential or office address</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={formData.addressLine1}
                    onChange={e => handleFieldChange('addressLine1', e.target.value)}
                    onBlur={() => handleFieldBlur('addressLine1')}
                    rows={3}
                    placeholder="Enter complete address including street, building, landmark, area, etc."
                    className={cn('resize-none', touchedFields.has('addressLine1') && fieldErrors.addressLine1 && 'border-red-400')}
                  />
                  <ErrMsg field="addressLine1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">City <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.city}
                      onChange={e => handleFieldChange('city', e.target.value)}
                      onBlur={() => handleFieldBlur('city')}
                      placeholder="Mumbai"
                      className={inputCls('city')}
                    />
                    <ErrMsg field="city" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">State <span className="text-red-500">*</span></Label>
                    <Select value={formData.state} onValueChange={v => handleFieldChange('state', v)}>
                      <SelectTrigger className={cn('h-11', touchedFields.has('state') && fieldErrors.state && 'border-red-400')}>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <ErrMsg field="state" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Pincode</Label>
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={e => handleFieldChange('pincode', e.target.value.replace(/\D/g, ''))}
                      onBlur={() => handleFieldBlur('pincode')}
                      placeholder="400001"
                      className={inputCls('pincode')}
                    />
                    <ErrMsg field="pincode" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 4. Professional Information ── */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Professional Information</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Agency and profile details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Agency Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Agency / Company Name</Label>
                  <Input
                    value={formData.agencyName}
                    onChange={e => handleFieldChange('agencyName', e.target.value)}
                    onBlur={() => handleFieldBlur('agencyName')}
                    placeholder="e.g., Premier Estates Ltd."
                    maxLength={150}
                    className={inputCls('agencyName')}
                  />
                  <ErrMsg field="agencyName" />
                </div>

                {/* Domain Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-gray-400" />
                      Domain Name
                      <span className="text-xs text-gray-400 font-normal">(optional)</span>
                    </span>
                  </Label>
                  <div className="relative">
                    <Input
                      value={formData.domainName}
                      onChange={e => handleDomainChange(e.target.value)}
                      placeholder="yourname"
                      maxLength={50}
                      className={cn(
                        'h-11 pl-3 pr-48',
                        touchedFields.has('domainName') && fieldErrors.domainName
                          ? 'border-red-400 focus-visible:ring-red-400'
                          : domainStatus === 'available' ? 'border-green-500 focus-visible:ring-green-500'
                          : domainStatus === 'taken' ? 'border-red-400' : ''
                      )}
                    />
                    <span className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none select-none">
                      .{PLATFORM_DOMAIN}
                    </span>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {domainStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                      {domainStatus === 'available' && !fieldErrors.domainName && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {(domainStatus === 'taken' || (touchedFields.has('domainName') && fieldErrors.domainName)) && domainStatus !== 'checking' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </span>
                  </div>
                  {!fieldErrors.domainName && domainStatus === 'available' && (
                    <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /><strong>{formData.domainName}.{PLATFORM_DOMAIN}</strong> is available!</p>
                  )}
                  {!fieldErrors.domainName && domainStatus === 'checking' && (
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Checking availability...</p>
                  )}
                  {!fieldErrors.domainName && domainStatus === 'idle' && !formData.domainName && (
                    <p className="text-xs text-gray-400">Public profile: <span className="font-medium">yourname.{PLATFORM_DOMAIN}</span></p>
                  )}
                  <ErrMsg field="domainName" />
                </div>

                {/* Languages */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Languages Spoken <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value=""
                    onValueChange={v => { if (v) toggleLanguage(v); }}
                  >
                    <SelectTrigger className={cn('h-11', touchedFields.has('languagesSpoken') && fieldErrors.languagesSpoken && 'border-red-400')}>
                      <SelectValue
                        placeholder={
                          formData.languagesSpoken.length > 0
                            ? `${formData.languagesSpoken.length} ${formData.languagesSpoken.length === 1 ? 'language' : 'languages'} selected`
                            : 'Select languages…'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.filter(l => !formData.languagesSpoken.includes(l)).length > 0
                        ? LANGUAGES.filter(l => !formData.languagesSpoken.includes(l)).map(l => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))
                        : <div className="px-2 py-4 text-center text-sm text-gray-400">All languages selected</div>
                      }
                    </SelectContent>
                  </Select>
                  {formData.languagesSpoken.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {formData.languagesSpoken.map(l => (
                        <Badge key={l} variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 text-xs">
                          {l}
                          <button type="button" onClick={() => toggleLanguage(l)} className="ml-1.5 hover:text-blue-900">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <ErrMsg field="languagesSpoken" />
                </div>

                {/* RERA */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    RERA Registration Number
                    <span className="ml-2 text-xs text-gray-400 font-normal">(if applicable)</span>
                  </Label>
                  <Input
                    value={formData.reraNumber}
                    onChange={e => setFormData(p => ({ ...p, reraNumber: e.target.value }))}
                    placeholder="e.g., MAHARERA12345678"
                    className="h-11"
                  />
                  <p className="text-xs text-gray-400">Required if operating in RERA-regulated states.</p>
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">About Agent</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={e => handleFieldChange('bio', e.target.value)}
                    onBlur={() => handleFieldBlur('bio')}
                    rows={5}
                    placeholder="Tell about the agent's experience, expertise, and approach..."
                    maxLength={1000}
                    className={cn('resize-none', touchedFields.has('bio') && fieldErrors.bio && 'border-red-400')}
                  />
                  <div className="flex items-center justify-between">
                    <ErrMsg field="bio" />
                    <p className={cn('text-xs ml-auto', formData.bio.length > 900 ? 'text-orange-500' : 'text-gray-400')}>
                      {formData.bio.length}/1000
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 5. Terms & Compliance ── */}
            <Card className={cn(
              'transition-colors',
              touchedFields.has('termsAccepted') && fieldErrors.termsAccepted
                ? 'border-red-300 bg-red-50/20' : ''
            )}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <ScrollText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Terms & Compliance</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Required for registration</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  type="button"
                  onClick={openTncDialog}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Read Full Terms &amp; Conditions
                </button>

                <Separator />

                {/* Terms Acceptance */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="termsAccepted"
                    checked={termsAccepted}
                    onCheckedChange={checked => {
                      setTermsAccepted(!!checked);
                      setTouchedFields(prev => new Set(prev).add('termsAccepted'));
                      setFieldErrors(prev => ({ ...prev, termsAccepted: checked ? undefined : 'You must accept the Terms & Conditions.' }));
                    }}
                    className={cn(
                      'mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
                      touchedFields.has('termsAccepted') && fieldErrors.termsAccepted ? 'border-red-400' : ''
                    )}
                  />
                  <Label htmlFor="termsAccepted" className="text-sm text-gray-700 leading-relaxed cursor-pointer select-none">
                    I have read and agree to all the {' '}
                    <button type="button" onClick={openTncDialog} className="font-semibold text-blue-600 hover:underline underline-offset-2">
                      Terms &amp; Conditions
                    </button>
                    {' '} of Rexon. <span className="text-red-500 ml-1">*</span>
                  </Label>
                </div>
                {touchedFields.has('termsAccepted') && fieldErrors.termsAccepted && (
                  <p className="text-sm text-red-500 flex items-center gap-1 -mt-2 ml-7">
                    <AlertCircle className="h-3.5 w-3.5" />{fieldErrors.termsAccepted}
                  </p>
                )}

                {termsAccepted && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    Terms and Conditions accepted. Ready to create agent.
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* ────────────────────── RIGHT COLUMN ────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-5">

              {/* Profile Photo */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Profile Photo
                    <span className="ml-1 text-xs font-normal text-gray-400">(Optional)</span>
                  </CardTitle>
                  <CardDescription className="text-xs">JPG, PNG, or WEBP — Max 2MB</CardDescription>
                </CardHeader>
                <CardContent>
                  {profilePreview ? (
                    <div className="space-y-3">
                      <div className="relative group rounded-lg overflow-hidden border border-gray-200">
                        <img src={profilePreview} alt="Profile preview" className="w-full h-56 object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button type="button" size="icon" variant="secondary" onClick={() => setIsImageModalOpen(true)} className="h-9 w-9 rounded-full bg-white/90 hover:bg-white text-gray-900">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="icon" onClick={removeProfileImage} className="h-9 w-9 rounded-full bg-red-500 hover:bg-red-600 text-white">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button type="button" variant="outline" className="w-full h-9 text-sm" onClick={() => document.getElementById('profileImage')?.click()}>
                        <Upload className="h-3.5 w-3.5 mr-2" />Change Photo
                      </Button>
                      <input id="profileImage" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleProfileImageChange} className="hidden" />
                    </div>
                  ) : (
                    <Label htmlFor="profileImage" className="block cursor-pointer">
                      <div className={cn(
                        'border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50/60 transition-all',
                        touchedFields.has('profileImage') && fieldErrors.profileImage ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                      )}>
                        <input id="profileImage" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleProfileImageChange} className="hidden" />
                        <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-0.5">Upload Photo</p>
                        <p className="text-xs text-gray-400">Clear, professional photo with face visible</p>
                      </div>
                    </Label>
                  )}
                </CardContent>
              </Card>

              {/* KYC Documents */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    ID / KYC Documents
                    <span className="ml-1 text-xs font-normal text-gray-400">(Optional)</span>
                  </CardTitle>
                  <CardDescription className="text-xs">Aadhaar, PAN Card, or Driving Licence — PDF/JPG, Max 5MB</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor="documents" className="block cursor-pointer">
                    <div className={cn(
                      'border-2 border-dashed rounded-lg p-5 text-center hover:border-blue-400 hover:bg-blue-50/60 transition-all',
                      touchedFields.has('documents') && fieldErrors.documents ? 'border-red-300' : 'border-gray-200'
                    )}>
                      <input id="documents" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocumentChange} className="hidden" />
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Upload className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Upload Document</p>
                      <p className="text-xs text-gray-400">PDF or image (Max. 5MB)</p>
                    </div>
                  </Label>
                  {touchedFields.has('documents') && fieldErrors.documents && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1.5"><AlertCircle className="h-3.5 w-3.5" />{fieldErrors.documents}</p>
                  )}
                  {formData.documents.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {formData.documents.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                          <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate flex-1">{doc.name}</span>
                          <button type="button" onClick={() => removeDocument(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="space-y-2.5">
                <Button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-bold shadow-sm hover:shadow-md transition-all"
                >
                  {uploading
                    ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Creating…</>
                    : 'Create Agent'
                  }
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="w-full h-11 text-sm font-medium text-gray-600">
                  Cancel
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Fields marked <span className="text-red-500">*</span> are required.
                Information is encrypted and secure.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Image Preview Modal ── */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Profile Photo Preview</DialogTitle></DialogHeader>
          {profilePreview && <img src={profilePreview} alt="Full size" className="w-full h-auto rounded-lg object-contain" />}
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setIsImageModalOpen(false)}>Close</Button>
            <Button variant="destructive" onClick={() => { removeProfileImage(); setIsImageModalOpen(false); }} className="bg-red-500 hover:bg-red-600">
              <Trash2 className="h-4 w-4 mr-1.5" />Delete Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── T&C Dialog ── */}
      <Dialog open={isTncDialogOpen} onOpenChange={setIsTncDialogOpen}>
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col overflow-hidden p-0 gap-0">

          {/* Fixed header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <ScrollText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Terms and Conditions</DialogTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  Agent Registration and Property Listing{tncVersion && !tncLoading && ` — v${tncVersion}`}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
            {tncLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
                <p className="text-sm text-gray-400">Loading…</p>
              </div>
            )}
            {tncError && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="h-7 w-7 text-red-400" />
                <p className="text-sm text-gray-500">{tncError}</p>
                <Button variant="outline" size="sm" onClick={() => { setTncSections([]); openTncDialog(); }}>Try Again</Button>
              </div>
            )}
            {!tncLoading && !tncError && tncSections.length > 0 && (
              <div className="space-y-5">
                {tncSections.map((s, idx) => (
                  <div key={s.id}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{s.section_number}. {s.section_title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{s.section_content}</p>
                    {idx < tncSections.length - 1 && <Separator className="mt-5" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixed footer */}
          <div className="px-6 py-4 border-t bg-gray-50/80 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-gray-400">By clicking "Accept", you confirm you have read all terms above.</p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setIsTncDialogOpen(false)}>Close</Button>
                <Button
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setTermsAccepted(true);
                    setTouchedFields(prev => new Set(prev).add('termsAccepted'));
                    setFieldErrors(prev => ({ ...prev, termsAccepted: undefined }));
                    setIsTncDialogOpen(false);
                    toast.success('Terms and Conditions accepted');
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />Accept
                </Button>
              </div>
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}