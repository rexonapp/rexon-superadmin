'use client'
import { useState } from 'react';
import { Upload, X, AlertCircle, User, Mail, Phone, Building2, Award, MapPin, FileText, Briefcase, Eye, Trash2, CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';

// shadcn/ui imports
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
import { cn } from '@/lib/utils';

interface AgentFormData {
  // Personal Information
  fullName: string;
  dateOfBirth: string;
  gender: string;

  // Contact Information
  primaryPhone: string;
  // secondaryPhone: string;
  email: string;
  whatsappNumber: string;

  // Address Information
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;

  // Professional Information
  agencyName: string;
  licenseNumber: string;
  experienceYears: string;
  specialization: string;

  // Identity & Verification
  aadharNumber: string;
  panNumber: string;
  reraRegistration: string;

  // Additional Information
  languagesSpoken: string[];
  serviceAreas: string[];
  bio: string;

  // Documents
  profileImage: File | null;
  documents: File[];
}

interface FieldErrors {
  fullName?: string;
  primaryPhone?: string;
  // secondaryPhone?: string;
  email?: string;
  whatsappNumber?: string;
  pincode?: string;
  aadharNumber?: string;
  panNumber?: string;
  profileImage?: string;
  documents?: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry'
];

const SPECIALIZATIONS = [
  'Residential Properties',
  'Commercial Properties',
  'Industrial Properties',
  'Warehouse & Logistics',
  'Agricultural Land',
  'Luxury Properties',
  'Investment Properties'
];

const LANGUAGES = [
  'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 
  'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'
];

export default function AgentRegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<AgentFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    primaryPhone: '',
    // secondaryPhone: '',
    email: '',
    whatsappNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    agencyName: '',
    licenseNumber: '',
    experienceYears: '',
    specialization: '',
    aadharNumber: '',
    panNumber: '',
    reraRegistration: '',
    languagesSpoken: [],
    serviceAreas: [],
    bio: '',
    profileImage: null,
    documents: [],
  });
  
  const [uploading, setUploading] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value || value.trim() === '') return 'Full name is required';
        if (value.length < 3) return 'Name must be at least 3 characters';
        break;

      case 'primaryPhone':
        if (!value || value.trim() === '') return 'Primary phone is required';
        if (!/^[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) {
          return 'Enter a valid 10-digit mobile number ';
        }
        break;


      case 'email':
        if (!value || value.trim() === '') return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Enter a valid email address';
        }
        break;

      case 'whatsappNumber':
        if (value && !/^[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) {
          return 'Enter a valid 10-digit mobile number';
        }
        break;

      case 'pincode':
        if (value) {
          if (!/^\d+$/.test(value)) {
            return 'Pincode must contain only numbers';
          }
          if (value.length !== 6) {
            return 'Pincode must be exactly 6 digits';
          }
        }
        break;

      case 'aadharNumber':
        if (value) {
          const cleaned = value.replace(/\s/g, '');
          if (!/^\d+$/.test(cleaned)) {
            return 'Aadhar must contain only numbers';
          }
          if (cleaned.length !== 12) {
            return 'Aadhar must be exactly 12 digits';
          }
        }
        break;

      case 'panNumber':
        if (value) {
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value.toUpperCase())) {
            return 'Enter a valid PAN number (e.g., ABCDE1234F)';
          }
        }
        break;

      case 'profileImage':
        if (!formData.profileImage) {
          return 'Profile photo is required';
        }
        break;
    }
    return undefined;
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Mark field as touched
    setTouchedFields(prev => new Set(prev).add(name));

    // Validate field
    const error = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleFieldBlur = (name: string) => {
    setTouchedFields(prev => new Set(prev).add(name));
    const error = validateField(name, formData[name as keyof AgentFormData]);
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languagesSpoken: prev.languagesSpoken.includes(language)
        ? prev.languagesSpoken.filter(l => l !== language)
        : [...prev.languagesSpoken, language]
    }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setFieldErrors(prev => ({ ...prev, profileImage: undefined }));
    setTouchedFields(prev => new Set(prev).add('profileImage'));

    // Accept common image formats: jpg, jpeg, png, webp, gif
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setFieldErrors(prev => ({
        ...prev,
        profileImage: 'Only image files are allowed (JPG, JPEG, PNG, WEBP, GIF)'
      }));
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setFieldErrors(prev => ({
        ...prev,
        profileImage: 'Profile image must be less than 2MB'
      }));
      return;
    }

    setProfilePreview(URL.createObjectURL(file));
    setFormData(prev => ({ ...prev, profileImage: file }));
    setFieldErrors(prev => ({ ...prev, profileImage: undefined }));
  };

  const removeProfileImage = () => {
    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
    }
    setProfilePreview('');
    setFormData(prev => ({ ...prev, profileImage: null }));
    const input = document.getElementById('profileImage') as HTMLInputElement;
    if (input) input.value = '';

    // Validate after removal
    setTouchedFields(prev => new Set(prev).add('profileImage'));
    setFieldErrors(prev => ({ ...prev, profileImage: 'Profile photo is required' }));
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    // Clear previous errors
    setFieldErrors(prev => ({ ...prev, documents: undefined }));
    setTouchedFields(prev => new Set(prev).add('documents'));

    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversized = files.filter(file => file.size > maxSize);
    if (oversized.length > 0) {
      setFieldErrors(prev => ({
        ...prev,
        documents: 'Some files exceed 5MB limit'
      }));
      return;
    }

    setFormData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
    setFieldErrors(prev => ({ ...prev, documents: undefined }));
  };

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    const requiredFields = ['fullName', 'primaryPhone', 'email'];

    // Validate all required fields
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof AgentFormData]);
      if (error) {
        errors[field as keyof FieldErrors] = error;
      }
    });


    if (formData.whatsappNumber) {
      const error = validateField('whatsappNumber', formData.whatsappNumber);
      if (error) errors.whatsappNumber = error;
    }

    if (formData.pincode) {
      const error = validateField('pincode', formData.pincode);
      if (error) errors.pincode = error;
    }

    if (formData.aadharNumber) {
      const error = validateField('aadharNumber', formData.aadharNumber);
      if (error) errors.aadharNumber = error;
    }

    if (formData.panNumber) {
      const error = validateField('panNumber', formData.panNumber);
      if (error) errors.panNumber = error;
    }

    // Validate profile image
    const profileImageError = validateField('profileImage', formData.profileImage);
    if (profileImageError) errors.profileImage = profileImageError;

    // Set all errors and mark all fields as touched
    setFieldErrors(errors);
    const allFields = new Set([
      ...requiredFields,
      'whatsappNumber',
      'pincode',
      'aadharNumber',
      'panNumber',
      'profileImage'
    ]);
    setTouchedFields(allFields);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');

      // Scroll to first error
      const firstErrorField = document.querySelector('.border-blue-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setUploading(true);

    try {
      const uploadFormData = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'profileImage' && value) {
          uploadFormData.append('profileImage', value as File);
        } else if (key === 'documents') {
          (value as File[]).forEach(file => {
            uploadFormData.append('documents', file);
          });
        } else if (key === 'languagesSpoken' || key === 'serviceAreas') {
          uploadFormData.append(key, JSON.stringify(value));
        } else {
          uploadFormData.append(key, value.toString());
        }
      });

      const response = await fetch('/api/agents/register', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast.success('Registration submitted successfully!', {
        description: 'We will review your application and get back to you.',
      });

      setTimeout(() => {
        router.back;
      }, 2000);

    } catch (error) {
      toast.error('Registration failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Add Agent</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Add Agent</h1>
          {/* <p className="text-gray-600">Join our network of top-tier real estate professionals. Fill out the form below to create your agent profile and start connecting with clients.</p> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Forms */}
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
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-blue-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                    onBlur={() => handleFieldBlur('fullName')}
                    placeholder="e.g., John Doe"
                    className={`h-11 ${touchedFields.has('fullName') && fieldErrors.fullName ? 'border-blue-500' : ''}`}
                  />
                  {touchedFields.has('fullName') && fieldErrors.fullName && (
                    <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal",
                            !formData.dateOfBirth && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dateOfBirth ? format(new Date(formData.dateOfBirth), 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          
                          selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData({ ...formData, dateOfBirth: format(date, 'yyyy-MM-dd') });
                            }
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          captionLayout="dropdown"
                          className="rounded-lg border"


                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
  <Label htmlFor="gender">Gender</Label>
  <Select
    value={formData.gender}
    onValueChange={(value) => setFormData({ ...formData, gender: value })}
  >
    <SelectTrigger id="gender" className="w-full h-12">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryPhone">
                      Primary Phone <span className="text-blue-500">*</span>
                    </Label>
                    <Input
                      id="primaryPhone"
                      type="tel"
                      pattern='[0-9]{10}'
                      maxLength={10}
                      minLength={10}
                      value={formData.primaryPhone}
                      onChange={(e) => handleFieldChange('primaryPhone', e.target.value)}
                      onBlur={() => handleFieldBlur('primaryPhone')}
                      placeholder="+91 98765 43210"
                      className={`h-11 ${touchedFields.has('primaryPhone') && fieldErrors.primaryPhone ? 'border-blue-500' : ''}`}
                    />
                    {touchedFields.has('primaryPhone') && fieldErrors.primaryPhone && (
                      <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {fieldErrors.primaryPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      pattern='[0-9]{10}'
                      maxLength={10}
                      minLength={10}
                      value={formData.whatsappNumber}
                      onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                      onBlur={() => handleFieldBlur('whatsappNumber')}
                      placeholder="+91 98765 43210"
                      className={`h-11 ${touchedFields.has('whatsappNumber') && fieldErrors.whatsappNumber ? 'border-blue-500' : ''}`}
                    />
                    {touchedFields.has('whatsappNumber') && fieldErrors.whatsappNumber && (
                      <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {fieldErrors.whatsappNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-blue-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    placeholder="john@example.com"
                    className={`h-11 ${touchedFields.has('email') && fieldErrors.email ? 'border-blue-500' : ''}`}
                  />
                  {touchedFields.has('email') && fieldErrors.email && (
                    <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
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
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    rows={3}
                    placeholder="Enter your complete address including street, building name, landmark, area, etc."
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Mumbai"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value })}
                    >
                      <SelectTrigger id="state" className=" w-full h-12">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      pattern='[0-9]{6}'
                      inputMode='numeric'
                      onChange={(e) => handleFieldChange('pincode', e.target.value)}
                      onBlur={() => handleFieldBlur('pincode')}
                      placeholder="400001"
                      maxLength={6}
                      className={`h-11 ${touchedFields.has('pincode') && fieldErrors.pincode ? 'border-blue-500' : ''}`}
                    />
                    {touchedFields.has('pincode') && fieldErrors.pincode && (
                      <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {fieldErrors.pincode}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
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
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    id="agencyName"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    placeholder="e.g., Premier Estates Ltd."
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="REG-123456"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Years of Experience</Label>
                    <Input
                      id="experienceYears"
                      type="number"
                      min="0"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      placeholder="5"
                      className="h-11"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="specialization">Specialization</Label>
    <Select
      value={formData.specialization}
      onValueChange={(value) => setFormData({ ...formData, specialization: value })}
    >
      <SelectTrigger id="specialization" className="w-full h-12">
        <SelectValue placeholder="Select specialization" />
      </SelectTrigger>
      <SelectContent>
        {SPECIALIZATIONS.map(spec => (
          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  <div className="space-y-2">
    <Label>Languages Spoken</Label>
    <Select
      value="select languages"
      name='select languages'
      onValueChange={(value) => {
        if (value && !formData.languagesSpoken.includes(value)) {
          setFormData(prev => ({
            ...prev,
            languagesSpoken: [...prev.languagesSpoken, value]
          }));
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
        {LANGUAGES.filter(lang => !formData.languagesSpoken.includes(lang)).length > 0 ? (
          LANGUAGES.filter(lang => !formData.languagesSpoken.includes(lang)).map((language) => (
            <SelectItem key={language} value={language}>
              {language}
            </SelectItem>
          ))
        ) : (
          <div className="px-2 py-6 text-center text-sm text-gray-500">
            All languages selected
          </div>
        )}
      </SelectContent>
    </Select>
  </div>
</div>

{formData.languagesSpoken.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {formData.languagesSpoken.map((language) => (
      <Badge
        key={language}
        variant="secondary"
        className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1.5"
      >
        {language}
        <button
          type="button"
          onClick={() => toggleLanguage(language)}
          className="ml-2 hover:text-blue-600"
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    ))}
  </div>
)}

                <div className="space-y-2">
                  <Label htmlFor="reraRegistration">RERA Registration Number</Label>
                  <Input
                    id="reraRegistration"
                    value={formData.reraRegistration}
                    onChange={(e) => setFormData({ ...formData, reraRegistration: e.target.value })}
                    placeholder="RERA/12345/2023"
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aadharNumber">Aadhar Number</Label>
                    <Input
                      id="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={(e) => handleFieldChange('aadharNumber', e.target.value)}
                      onBlur={() => handleFieldBlur('aadharNumber')}
                      placeholder="1234 5678 9012"
                      maxLength={12}
                      className={`h-11 ${touchedFields.has('aadharNumber') && fieldErrors.aadharNumber ? 'border-blue-500' : ''}`}
                    />
                    {touchedFields.has('aadharNumber') && fieldErrors.aadharNumber && (
                      <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {fieldErrors.aadharNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN Number</Label>
                    <Input
                      id="panNumber"
                      value={formData.panNumber}
                      onChange={(e) => handleFieldChange('panNumber', e.target.value.toUpperCase())}
                      onBlur={() => handleFieldBlur('panNumber')}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className={`h-11 ${touchedFields.has('panNumber') && fieldErrors.panNumber ? 'border-blue-500' : ''}`}
                    />
                    {touchedFields.has('panNumber') && fieldErrors.panNumber && (
                      <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-4 w-4" />
                        {fieldErrors.panNumber}
                      </p>
                    )}
                  </div>
                </div>

                

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / About You</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={5}
                    placeholder="Tell clients about your experience, expertise, and approach to real estate. Highlight your achievements, areas of specialization, and what makes you unique..."
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500">This will be displayed on your public agent profile</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Profile Photo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg ">
                    <span>Profile Photo</span>
                    <span className='mx-2 text-sm text-blue-500'>*</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profilePreview ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <img
                          src={profilePreview}
                          alt="Profile preview"
                          className="w-full h-64 rounded-lg object-cover border-2 border-gray-200"
                        />
                        <div className="absolute inset-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              onClick={() => setIsImageModalOpen(true)}
                              className="h-10 w-10 rounded-full bg-white hover:bg-gray-100 text-gray-900"
                              title="View full size"
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              onClick={removeProfileImage}
                              className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600"
                              title="Delete image"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Label htmlFor="profileImage" className="block">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById('profileImage')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Change Photo
                        </Button>
                      </Label>
                      <input
                        id="profileImage"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="profileImage" className="block w-full cursor-pointer">
                        <div className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all ${
                          touchedFields.has('profileImage') && fieldErrors.profileImage
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300'
                        }`}>
                          <input
                            id="profileImage"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                            onChange={handleProfileImageChange}
                            className="hidden"
                          />
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">Upload Photo</p>
                          <p className="text-xs text-gray-500">JPG, JPEG, PNG, WEBP, GIF (MAX. 2MB)</p>
                        </div>
                      </Label>
                      {touchedFields.has('profileImage') && fieldErrors.profileImage && (
                        <p className="text-sm text-blue-500 flex items-center gap-1 mt-2">
                          <AlertCircle className="h-4 w-4" />
                          {fieldErrors.profileImage}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">KYC Documents</CardTitle>
                  <CardDescription>
                    Upload a valid ID proof (Passport, Driving License, or National ID)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="documents" className="block w-full cursor-pointer">
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all ${
                        touchedFields.has('documents') && fieldErrors.documents
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}>
                        <input
                          id="documents"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleDocumentChange}
                          className="hidden"
                        />
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Upload className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Upload Document</p>
                        <p className="text-xs text-gray-500">PDF or JPG (MAX. 5MB)</p>
                      </div>
                    </Label>
                    {touchedFields.has('documents') && fieldErrors.documents && (
                      <p className="text-sm text-blue-500 flex items-center gap-1 mt-2">
                        <AlertCircle className="h-4 w-4" />
                        {fieldErrors.documents}
                      </p>
                    )}
                  </div>

                  {formData.documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeDocument(index)}
                            className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-600 flex-shrink-0"
                          >
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
                  disabled={uploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-bold shadow-md hover:shadow-lg"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Agent</span>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="w-full py-6 text-base font-medium"
                >
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
          <DialogHeader>
            <DialogTitle>Profile Photo Preview</DialogTitle>
          </DialogHeader>
          <div className="relative w-full">
            {profilePreview && (
              <img
                src={profilePreview}
                alt="Profile full size"
                className="w-full h-auto rounded-lg object-contain"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImageModalOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                removeProfileImage();
                setIsImageModalOpen(false);
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}