"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Shield, Save, Building2, Mail, Camera, X,
  ZoomIn, ZoomOut, RotateCcw, Check, Loader2,
  AlertTriangle,
} from 'lucide-react';
import GlassCard from '@/components/superadmin/GlassCard';
import { useBranding } from '@/lib/context/BrandingContext';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface SettingsState {
  companyName: string;
  logoFinal: string;
  autoApproveListings: boolean;
  autoApproveAgents: boolean;
  maintenanceMode: boolean;
  minWarehouseSize: string;
  maxListingsPerUser: string;
  sendgridApiKey: string | undefined;
  sendgridConfigured: boolean;
}

/* ─────────────────────────────────────────────────────────────
   Unsaved Changes Modal
───────────────────────────────────────────────────────────── */
interface UnsavedChangesModalProps {
  onStay: () => void;
  onLeave: () => void;
  onSaveAndLeave: () => Promise<void>;
}

function UnsavedChangesModal({ onStay, onLeave, onSaveAndLeave }: UnsavedChangesModalProps) {
  const [saving, setSaving] = useState(false);

  const handleSaveAndLeave = async () => {
    setSaving(true);
    try {
      await onSaveAndLeave();
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onStay(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStay]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onStay}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-brand-teal" />

        <div className="p-6 space-y-5">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-snug">
                You have unsaved changes
              </h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Your changes will be permanently lost if you leave this page without saving.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5">
            <Button
              variant="outline"
              onClick={onLeave}
              className="flex-1 h-10 border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 font-medium transition-all text-sm"
            >
              Discard & Leave
            </Button>
            <Button
              variant="outline"
              onClick={onStay}
              className="flex-1 h-10 border-gray-200 text-gray-700 hover:bg-gray-50 font-medium transition-all text-sm"
            >
              Keep Editing
            </Button>
            <Button
              onClick={handleSaveAndLeave}
              disabled={saving}
              className="flex-1 h-10 bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold shadow-md shadow-brand-teal/20 transition-all text-sm gap-2"
            >
              {saving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                : <><Save className="w-3.5 h-3.5" /> Save & Leave</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Logo Crop Modal
───────────────────────────────────────────────────────────── */
interface CropModalProps {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

function LogoCropModal({ imageSrc, onConfirm, onCancel }: CropModalProps) {
  const DISPLAY = 240;
  const OUTPUT  = 400;

  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const scaleRef   = useRef(1);
  const offsetRef  = useRef({ x: 0, y: 0 });
  const lastPtrRef = useRef<{ x: number; y: number } | null>(null);
  const [scaleDisplay, setScaleDisplay] = useState(1);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current    = img;
      scaleRef.current  = 1;
      offsetRef.current = { x: 0, y: 0 };
      setScaleDisplay(1);
      requestAnimationFrame(draw);
    };
    img.src = imageSrc;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  function paint(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    S: number,
    scale: number,
    offset: { x: number; y: number },
  ) {
    const ar    = img.naturalWidth / img.naturalHeight;
    const baseW = ar >= 1 ? S * ar : S;
    const baseH = ar >= 1 ? S : S / ar;
    const drawW = baseW * scale;
    const drawH = baseH * scale;
    const ratio = S / DISPLAY;
    ctx.drawImage(
      img,
      S / 2 + offset.x * ratio - drawW / 2,
      S / 2 + offset.y * ratio - drawH / 2,
      drawW,
      drawH,
    );
  }

  function draw() {
    const canvas = previewRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const S   = DISPLAY;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    ctx.clip();
    paint(ctx, img, S, scaleRef.current, offsetRef.current);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(13,148,136,0.35)';
    ctx.lineWidth   = 3;
    ctx.stroke();
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!lastPtrRef.current) return;
    offsetRef.current = {
      x: offsetRef.current.x + (e.clientX - lastPtrRef.current.x),
      y: offsetRef.current.y + (e.clientY - lastPtrRef.current.y),
    };
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    draw();
  };

  const onPointerUp = () => { lastPtrRef.current = null; };

  const applyScale = (raw: number) => {
    const next  = Math.min(3, Math.max(0.5, raw));
    const ratio = next / scaleRef.current;
    offsetRef.current = { x: offsetRef.current.x * ratio, y: offsetRef.current.y * ratio };
    scaleRef.current  = next;
    setScaleDisplay(next);
    draw();
  };

  const handleReset = () => {
    scaleRef.current  = 1;
    offsetRef.current = { x: 0, y: 0 };
    setScaleDisplay(1);
    draw();
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;
    const S   = OUTPUT;
    const out = document.createElement('canvas');
    out.width = out.height = S;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    ctx.clip();
    paint(ctx, img, S, scaleRef.current, offsetRef.current);
    onConfirm(out.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-gray-900">Adjust Logo</h4>
            <p className="text-xs text-gray-500 mt-0.5">Drag to reposition · slider to zoom</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center">
          <canvas
            ref={previewRef}
            width={DISPLAY}
            height={DISPLAY}
            className="rounded-full touch-none shadow-lg"
            style={{ width: DISPLAY, height: DISPLAY, cursor: 'grab' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Zoom</span>
            <span>{Math.round(scaleDisplay * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => applyScale(scaleRef.current - 0.1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <input
              type="range" min="50" max="300" step="5"
              value={Math.round(scaleDisplay * 100)}
              onChange={e => applyScale(Number(e.target.value) / 100)}
              className="flex-1 accent-brand-teal"
            />
            <button onClick={() => applyScale(scaleRef.current + 0.1)} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleReset} className="flex-1 gap-1.5 text-gray-600">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button size="sm" onClick={handleConfirm} className="flex-1 gap-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white">
            <Check className="w-3.5 h-3.5" /> Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Settings Page
───────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<SettingsState>({
    companyName:          '',
    logoFinal:            '',
    autoApproveListings:  false,
    autoApproveAgents:    false,
    maintenanceMode:      false,
    minWarehouseSize:     '100',
    maxListingsPerUser:   '10',
    sendgridApiKey:       undefined,
    sendgridConfigured:   false,
  });

  // The "clean" baseline — what was last saved/loaded from the server
  const savedSettings = useRef<SettingsState | null>(null);

  const [loading, setLoading]               = useState(true);
  const [saving,  setSaving]                = useState(false);
  const [isDirty, setIsDirty]               = useState(false);
  const [cropSrc, setCropSrc]               = useState<string | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Stores the href the user tried to navigate to
  const pendingNavUrl = useRef<string | null>(null);
  // Set true right before we programmatically push so the guard ignores it
  const allowNavRef   = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setLogoUrl, setCompanyName } = useBranding();

  /* ── Dirty detection ──────────────────────────────────────── */
  useEffect(() => {
    if (!savedSettings.current) return;
    const s = savedSettings.current;
    const dirty =
      settings.companyName         !== s.companyName         ||
      settings.logoFinal           !== s.logoFinal           ||
      settings.autoApproveListings !== s.autoApproveListings ||
      settings.autoApproveAgents   !== s.autoApproveAgents   ||
      settings.maintenanceMode     !== s.maintenanceMode     ||
      settings.minWarehouseSize    !== s.minWarehouseSize    ||
      settings.maxListingsPerUser  !== s.maxListingsPerUser  ||
      (settings.sendgridApiKey !== undefined && settings.sendgridApiKey !== '');
    setIsDirty(dirty);
  }, [settings]);

  /* ── Browser unload guard (tab close / hard refresh) ─────── */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* ── Click capture guard ──────────────────────────────────── */
  // Runs in the capture phase — fires before React's synthetic events and
  // before Next.js Link's onClick, so we can cancel navigation reliably.
  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (e: MouseEvent) => {
      // If we just allowed a nav (after modal "Leave"), skip
      if (allowNavRef.current) return;

      // Walk up the DOM to find the nearest <a> tag
      let el = e.target as HTMLElement | null;
      while (el && el.tagName !== 'A') {
        el = el.parentElement;
      }
      if (!el) return;

      const anchor = el as HTMLAnchorElement;
      const href   = anchor.getAttribute('href');

      // Ignore non-navigation or external hrefs
      if (!href) return;
      if (href.startsWith('http://') || href.startsWith('https://')) return;
      if (href.startsWith('#')) return;
      if (anchor.target === '_blank') return;

      // Compare just the pathname (strip query/hash for comparison)
      const targetPath  = href.split('?')[0].split('#')[0];
      const currentPath = window.location.pathname;
      if (targetPath === currentPath) return;

      // Intercept — show unsaved modal instead of navigating
      e.preventDefault();
      e.stopPropagation();
      pendingNavUrl.current = href;
      setShowUnsavedModal(true);
    };

    // capture: true = fires before bubbling, before Next.js Link handler
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isDirty]);

  /* ── Load settings ────────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/superadmin/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          const loaded: SettingsState = {
            companyName:         s.company_name           ?? '',
            logoFinal:           s.logo_s3_url            ?? '',
            autoApproveListings: s.auto_approve_listings  ?? false,
            autoApproveAgents:   s.auto_approve_agents    ?? false,
            maintenanceMode:     s.maintenance_mode       ?? false,
            minWarehouseSize:    String(s.min_warehouse_size    ?? 100),
            maxListingsPerUser:  String(s.max_listings_per_user ?? 10),
            sendgridConfigured:  s.sendgrid_configured    ?? false,
            sendgridApiKey:      undefined,
          };
          setSettings(loaded);
          savedSettings.current = loaded;
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Core save logic ──────────────────────────────────────── */
  const performSave = useCallback(async () => {
    const payload: Record<string, unknown> = {
      companyName:         settings.companyName,
      autoApproveListings: settings.autoApproveListings,
      autoApproveAgents:   settings.autoApproveAgents,
      maintenanceMode:     settings.maintenanceMode,
      minWarehouseSize:    Number(settings.minWarehouseSize)  || 100,
      maxListingsPerUser:  Number(settings.maxListingsPerUser) || 10,
    };

    if (settings.logoFinal === '') {
      payload.logoFinal = '';
    } else if (settings.logoFinal.startsWith('data:')) {
      payload.logoFinal = settings.logoFinal;
    }

    if (settings.sendgridApiKey !== undefined) {
      payload.sendgridApiKey = settings.sendgridApiKey;
    }

    const res  = await fetch('/api/superadmin/settings', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (data.success) {
      if (data.logoUrl)              setLogoUrl(data.logoUrl);
      if (settings.logoFinal === '') setLogoUrl('');
      setCompanyName(settings.companyName);

      const updated: SettingsState = {
        ...settings,
        logoFinal:          data.logoUrl ?? (settings.logoFinal === '' ? '' : settings.logoFinal),
        sendgridApiKey:     undefined,
        sendgridConfigured: settings.sendgridApiKey ? true : settings.sendgridConfigured,
      };
      setSettings(updated);
      savedSettings.current = updated;
      setIsDirty(false);
      toast.success('Settings saved successfully');
    } else {
      throw new Error(data.error || 'Unknown error');
    }
  }, [settings, setLogoUrl, setCompanyName]);

  /* ── Save button ──────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    try {
      await performSave();
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  /* ── Modal: Stay ──────────────────────────────────────────── */
  const handleStay = useCallback(() => {
    setShowUnsavedModal(false);
    pendingNavUrl.current = null;
  }, []);

  /* ── Modal: Leave without saving ─────────────────────────── */
  const handleLeave = useCallback(() => {
    setShowUnsavedModal(false);
    allowNavRef.current = true;
    const url = pendingNavUrl.current;
    pendingNavUrl.current = null;
    if (url) router.push(url);
    // Reset allow flag after a tick so the guard re-arms for future use
    setTimeout(() => { allowNavRef.current = false; }, 100);
  }, [router]);

  /* ── Modal: Save then leave ───────────────────────────────── */
  const handleSaveAndLeave = useCallback(async () => {
    await performSave();
    allowNavRef.current = true;
    setShowUnsavedModal(false);
    const url = pendingNavUrl.current;
    pendingNavUrl.current = null;
    if (url) router.push(url);
    setTimeout(() => { allowNavRef.current = false; }, 100);
  }, [performSave, router]);

  /* ── File handlers ────────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropConfirm = (dataUrl: string) => {
    setSettings(p => ({ ...p, logoFinal: dataUrl }));
    setCropSrc(null);
  };

  const approvalSettings = [
    { id: 'autoApproveListings', label: 'Auto-approve listings', description: 'New warehouse listings go live immediately without manual review' },
    { id: 'autoApproveAgents',   label: 'Auto-approve agents',   description: 'New agent registrations are approved immediately without manual review' },
  ];

  const ic = { blue: 'p-2.5 rounded-xl bg-brand-teal/10 ring-4 ring-brand-teal/10', cyan: 'p-2.5 rounded-xl bg-brand-teal-medium/10 ring-4 ring-brand-teal-medium/10' };
  const iv = { blue: 'w-5 h-5 text-brand-teal-medium', cyan: 'w-5 h-5 text-brand-teal' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-teal-medium" />
      </div>
    );
  }

  return (
    <>
      {/* Logo crop modal */}
      {cropSrc && (
        <LogoCropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />
      )}

      {/* Unsaved changes modal */}
      {showUnsavedModal && (
        <UnsavedChangesModal
          onStay={handleStay}
          onLeave={handleLeave}
          onSaveAndLeave={handleSaveAndLeave}
        />
      )}

      <div className="space-y-4 pb-6">

          {/* Header */}
          <GlassCard className="px-5 py-4" gradient="blue">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-brand-teal-dark">
                  System Settings
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">
                  Configure system-wide settings and preferences
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Unsaved badge */}
                {isDirty && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold shadow-sm animate-in fade-in duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Unsaved changes
                  </span>
                )}

                <Button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  size="sm"
                  className="flex items-center gap-2 bg-brand-teal-deep text-white hover:bg-brand-teal-dark shadow-lg shadow-brand-teal/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Branding */}
          <GlassCard className="px-5 py-4" gradient="blue">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={ic.blue}><Building2 className={iv.blue} /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Branding</h3>
                <p className="text-xs text-gray-500 font-medium">Platform identity shown across the app and emails</p>
              </div>
            </div>
            <Separator className="bg-gradient-to-r from-transparent via-brand-teal/25 to-transparent mb-4" />

            <div className="flex items-center gap-5 p-4 rounded-xl bg-white/40 border border-white/40 shadow-sm">
              <div className="relative shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-brand-teal/35 bg-brand-teal/10 hover:bg-brand-teal/15 hover:border-brand-teal cursor-pointer transition-all group shadow-md"
                >
                  {settings.logoFinal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.logoFinal} alt="Logo" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-brand-teal group-hover:text-brand-teal transition-colors">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] font-semibold text-center leading-tight">Upload<br />Logo</span>
                    </div>
                  )}
                  {settings.logoFinal && (
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                      <span className="text-[9px] font-semibold text-white">Change</span>
                    </div>
                  )}
                </div>
                {settings.logoFinal && (
                  <button
                    onClick={e => { e.stopPropagation(); setSettings(p => ({ ...p, logoFinal: '' })); }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-colors z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              </div>

              <div className="flex-1 space-y-1.5">
                <div>
                  <p className="font-bold text-gray-900 text-sm">Company / Platform Title</p>
                  <p className="text-xs text-gray-500 font-medium">Shown in the header, browser tab, and outgoing emails</p>
                </div>
                <Input
                  type="text"
                  placeholder="e.g. WarehouseHub"
                  value={settings.companyName}
                  onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                  className="bg-white/70 focus:bg-white focus:border-brand-teal-medium font-medium transition-all h-9 text-sm"
                />
                {settings.logoFinal && settings.logoFinal.startsWith('data:') && (
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs text-brand-teal-medium hover:text-brand-orange-dark font-semibold underline underline-offset-2 transition-colors">
                    Re-adjust logo position & zoom →
                  </button>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Approval Settings */}
          <GlassCard className="px-5 py-4" gradient="cyan">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={ic.cyan}><Shield className={iv.cyan} /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Approval Settings</h3>
                <p className="text-xs text-gray-500 font-medium">Control how listings and agents are approved</p>
              </div>
            </div>
            <Separator className="bg-gradient-to-r from-transparent via-brand-teal/25 to-transparent mb-4" />

            <div className="space-y-2.5">
              {approvalSettings.map(setting => (
                <div key={setting.id} className="flex items-center justify-between p-4 rounded-xl bg-white/40 hover:bg-brand-teal/8 border border-white/40 hover:border-brand-teal/25 shadow-sm transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{setting.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">{setting.description}</p>
                  </div>
                  <Switch
                    checked={settings[setting.id as keyof typeof settings] as boolean}
                    onCheckedChange={checked => setSettings({ ...settings, [setting.id]: checked })}
                    className="data-[state=checked]:bg-brand-teal ml-4"
                  />
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Email Provider */}
          <GlassCard className="px-5 py-4" gradient="cyan">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={ic.cyan}><Mail className={iv.cyan} /></div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Email Provider</h3>
                <p className="text-xs text-gray-500 font-medium">SendGrid is used to send all transactional emails</p>
              </div>
            </div>
            <Separator className="bg-gradient-to-r from-transparent via-brand-teal/25 to-transparent mb-4" />

            <div className="p-4 rounded-xl bg-white/40 border border-white/40 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/8 border border-brand-teal/25 text-brand-teal-dark text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal/80 inline-block" /> SendGrid
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {settings.sendgridConfigured ? '✓ Key configured' : 'Active provider'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">SendGrid API Key</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    {settings.sendgridConfigured ? 'A key is saved — enter a new one to replace it' : 'Your API key from the SendGrid dashboard'}
                  </p>
                </div>
                <Input
                  type="password"
                  placeholder={settings.sendgridConfigured ? 'Leave blank to keep existing' : 'SG.••••••••••••••••••••'}
                  value={settings.sendgridApiKey ?? ''}
                  onChange={e => setSettings({ ...settings, sendgridApiKey: e.target.value === '' ? undefined : e.target.value })}
                  className="w-64 bg-white/60 border-white/60 focus:bg-white focus:border-brand-teal-medium font-mono transition-all h-9 text-sm"
                />
              </div>
            </div>
          </GlassCard>

      </div>
    </>
  );
}