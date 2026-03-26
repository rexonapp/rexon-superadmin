"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, Save, Building2, Mail, Camera, X, ZoomIn, ZoomOut, RotateCcw, Check, Loader2 } from 'lucide-react';
import GlassCard from '@/components/superadmin/GlassCard';
import { useBranding } from '@/lib/context/BrandingContext';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface SettingsState {
  companyName: string;
  logoFinal: string;           // data-URL (new) | S3 URL (loaded) | '' (cleared)
  autoApproveListings: boolean;
  autoApproveAgents: boolean;
  maintenanceMode: boolean;
  minWarehouseSize: string;
  maxListingsPerUser: string;
  sendgridApiKey: string | undefined; // undefined = don't touch existing key in DB
  sendgridConfigured: boolean;        // read-only, from server
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
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const imgLoaded = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => { imageRef.current = img; };
    img.src = src;
  }, []);

  useEffect(() => { imgLoaded(imageSrc); }, [imageSrc, imgLoaded]);

  const handleMouseDown  = (e: React.MouseEvent) => { setDragging(true); dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }; };
  const handleMouseMove  = (e: React.MouseEvent) => { if (!dragging) return; setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); };
  const handleMouseUp    = () => setDragging(false);
  const handleTouchStart = (e: React.TouchEvent) => { const t = e.touches[0]; setDragging(true); dragStart.current = { x: t.clientX - position.x, y: t.clientY - position.y }; };
  const handleTouchMove  = (e: React.TouchEvent) => { if (!dragging) return; const t = e.touches[0]; setPosition({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y }); };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img    = imageRef.current;
    if (!canvas || !img) return;
    const SIZE = 200;
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2); ctx.clip();
    const PREVIEW = 192;
    const nat = img.naturalWidth / img.naturalHeight;
    const baseW = nat >= 1 ? PREVIEW : PREVIEW * nat;
    const baseH = nat >= 1 ? PREVIEW / nat : PREVIEW;
    const drawW = baseW * scale; const drawH = baseH * scale;
    const ratio = SIZE / PREVIEW;
    ctx.drawImage(img, (PREVIEW / 2 + position.x - drawW / 2) * ratio, (PREVIEW / 2 + position.y - drawH / 2) * ratio, drawW * ratio, drawH * ratio);
    onConfirm(canvas.toDataURL('image/png'));
  };

  const PREVIEW = 192;
  const nat   = imageRef.current ? imageRef.current.naturalWidth / imageRef.current.naturalHeight : 1;
  const baseW = nat >= 1 ? PREVIEW : PREVIEW * nat;
  const baseH = nat >= 1 ? PREVIEW / nat : PREVIEW;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-gray-900">Adjust Logo</h4>
            <p className="text-xs text-gray-500 mt-0.5">Drag to reposition · slider to zoom</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex justify-center">
          <div
            className="relative rounded-full border-4 border-blue-200 shadow-lg cursor-grab active:cursor-grabbing select-none"
            style={{ width: PREVIEW, height: PREVIEW }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt="crop preview" draggable={false} style={{ position: 'absolute', width: baseW * scale, height: baseH * scale, left: PREVIEW / 2 + position.x - (baseW * scale) / 2, top: PREVIEW / 2 + position.y - (baseH * scale) / 2, pointerEvents: 'none', userSelect: 'none' }} />
            <div className="absolute inset-0 rounded-full ring-2 ring-blue-400/40 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Zoom</span><span>{Math.round(scale * 100)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"><ZoomOut className="w-4 h-4 text-gray-600" /></button>
            <input type="range" min="30" max="300" step="5" value={Math.round(scale * 100)} onChange={e => setScale(Number(e.target.value) / 100)} className="flex-1 accent-blue-500" />
            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"><ZoomIn className="w-4 h-4 text-gray-600" /></button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} className="flex-1 gap-1.5 text-gray-600">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button size="sm" onClick={handleConfirm} className="flex-1 gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
            <Check className="w-3.5 h-3.5" /> Apply
          </Button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Settings Page
───────────────────────────────────────────────────────────── */
export default function SettingsPage() {
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

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setLogoUrl, setCompanyName } = useBranding();


  // Load existing settings on mount
  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/superadmin/settings');
        const data = await res.json();
        if (data.success && data.settings) {
          const s = data.settings;
          setSettings(p => ({
            ...p,
            companyName:         s.company_name           ?? '',
            logoFinal:           s.logo_s3_url            ?? '',
            autoApproveListings: s.auto_approve_listings  ?? false,
            autoApproveAgents:   s.auto_approve_agents    ?? false,
            maintenanceMode:     s.maintenance_mode       ?? false,
            minWarehouseSize:    String(s.min_warehouse_size    ?? 100),
            maxListingsPerUser:  String(s.max_listings_per_user ?? 10),
            sendgridConfigured:  s.sendgrid_configured    ?? false,
            sendgridApiKey:      undefined,
          }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  const handleSave = async () => {
    setSaving(true);
    try {
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
        if (data.logoUrl)            setLogoUrl(data.logoUrl);
        if (settings.logoFinal === '') setLogoUrl('');
        setCompanyName(settings.companyName);

        if (data.logoUrl) setSettings(p => ({ ...p, logoFinal: data.logoUrl }));
        if (settings.sendgridApiKey) setSettings(p => ({ ...p, sendgridApiKey: undefined, sendgridConfigured: true }));
       toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings: ' + (data.error || 'Unknown error'));}
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const approvalSettings = [
    { id: 'autoApproveListings', label: 'Auto-approve listings', description: 'New warehouse listings go live immediately without manual review' },
    { id: 'autoApproveAgents',   label: 'Auto-approve agents',   description: 'New agent registrations are approved immediately without manual review' },
  ];

  const ic = { blue: 'p-2.5 rounded-xl bg-blue-500/10 ring-4 ring-blue-500/10', cyan: 'p-2.5 rounded-xl bg-cyan-500/10 ring-4 ring-cyan-500/10' };
  const iv = { blue: 'w-5 h-5 text-blue-600', cyan: 'w-5 h-5 text-cyan-600' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      {cropSrc && (
        <LogoCropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />
      )}

      <div className="h-full">
        <div className="space-y-4 pb-6">

          {/* Header */}
          <GlassCard className="px-5 py-4" gradient="blue">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">System Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">Configure system-wide settings and preferences</p>
              </div>
              <Button onClick={handleSave} disabled={saving} size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 transition-all">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
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
            <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent mb-4" />

            <div className="flex items-center gap-5 p-4 rounded-xl bg-white/40 border border-white/40 shadow-sm">
              {/* Logo uploader */}
              <div className="relative shrink-0">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-blue-300 bg-blue-50/60 hover:bg-blue-100/60 hover:border-blue-400 cursor-pointer transition-all group shadow-md"
                >
                  {settings.logoFinal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.logoFinal} alt="Logo" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-blue-400 group-hover:text-blue-500 transition-colors">
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
                  className="bg-white/70 focus:bg-white focus:border-cyan-400 font-medium transition-all h-9 text-sm"
                />
                {settings.logoFinal && settings.logoFinal.startsWith('data:') && (
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-500 hover:text-blue-700 font-semibold underline underline-offset-2 transition-colors">
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
            <Separator className="bg-gradient-to-r from-transparent via-cyan-200 to-transparent mb-4" />

            <div className="space-y-2.5">
              {approvalSettings.map(setting => (
                <div key={setting.id} className="flex items-center justify-between p-4 rounded-xl bg-white/40 hover:bg-cyan-50/60 border border-white/40 hover:border-cyan-200 shadow-sm transition-colors duration-150">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{setting.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">{setting.description}</p>
                  </div>
                  <Switch
                    checked={settings[setting.id as keyof typeof settings] as boolean}
                    onCheckedChange={checked => setSettings({ ...settings, [setting.id]: checked })}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-cyan-600 ml-4"
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
            <Separator className="bg-gradient-to-r from-transparent via-cyan-200 to-transparent mb-4" />

            <div className="p-4 rounded-xl bg-white/40 border border-white/40 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" /> SendGrid
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
                  className="w-64 bg-white/60 border-white/60 focus:bg-white focus:border-cyan-400 font-mono transition-all h-9 text-sm"
                />
              </div>
            </div>
          </GlassCard>

        </div>
      </div>
    </>
  );
}