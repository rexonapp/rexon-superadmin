"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface BrandingContextValue {
  companyName: string;
  logoUrl: string;
  refreshBranding: () => Promise<void>;
  setLogoUrl: (url: string) => void;
  setCompanyName: (name: string) => void;
}

const BrandingContext = createContext<BrandingContextValue>({
  companyName: '',
  logoUrl: '',
  refreshBranding: async () => {},
  setLogoUrl: () => {},
  setCompanyName: () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const refreshBranding = useCallback(async () => {
    try {
      const res  = await fetch('/api/superadmin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setCompanyName(data.settings.company_name ?? '');
        setLogoUrl(data.settings.logo_s3_url ?? '');
      }
    } catch (err) {
      console.error('Failed to load branding:', err);
    }
  }, []);

  useEffect(() => { refreshBranding(); }, [refreshBranding]);

  return (
    <BrandingContext.Provider value={{ companyName, logoUrl, refreshBranding, setLogoUrl, setCompanyName }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);