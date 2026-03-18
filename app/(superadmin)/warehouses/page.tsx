"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Search, Filter, Eye, CheckCircle, XCircle, Clock, MapPin,
  MoreVertical, Building2, Phone, Mail, Calendar,
  Ruler, DollarSign, ImageIcon, ChevronLeft, ChevronRight,
  Star, Truck, ArrowUpRight, Package, Hash, UserCheck, X
} from 'lucide-react';
import GlassCard from '@/components/superadmin/GlassCard';
import Loading from '../loading';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/* ══════════════════════════════════════════ TYPES ══════════════════════════════════════════ */
interface WarehouseImage {
  id: string;
  s3_url: string;
  file_name: string;
  is_primary: boolean;
  image_order: number;
}

interface Warehouse {
  id: string;
  title: string;
  property_name: string;
  property_type: string;
  warehouse_size: string;
  space_available: string;
  space_unit: string;
  price_per_sqft: string;
  price_type: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  description: string;
  status: 'Pending' | 'Active' | 'rejected';
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  available_from: string;
  expiry_date: string;
  user_name: string;
  contact_person_name: string;
  contact_person_phone: string;
  contact_person_email: string;
  contact_person_designation: string;
  contact_person_relation: string;
  contact_person_alternate: string;
  amenities: string | string[] | Record<string, string>;
  road_connectivity: string;
  latitude: string;
  longitude: string;
  images_count: number;
  images?: WarehouseImage[];
}

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

/* ── Status styles ── */
const statusColors: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-300',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  rejected: 'bg-rose-50 text-rose-700 border-rose-300',
};
const statusDot: Record<string, string> = {
  Pending: 'bg-amber-400 animate-pulse',
  Active: 'bg-emerald-500',
  rejected: 'bg-rose-500',
};

/* ── Helpers ── */
const fmt = (ds: string) =>
  ds ? new Date(ds).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

function parseAmenities(raw: string | string[] | Record<string, string>): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(a => String(a).trim()).filter(Boolean);
  if (typeof raw === 'object') return Object.values(raw).map(a => String(a).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(a => String(a).trim()).filter(Boolean);
  } catch { /* not JSON */ }
  return raw.split(',').map(a => a.trim()).filter(Boolean);
}

/* ══════════════════════════════════════════ CUSTOM DATE MODAL ══════════════════════════════════════════ */
function CustomDateModal({
  open,
  onClose,
  dateRange,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  dateRange: DateRange;
  onApply: (from: Date | undefined, to: Date | undefined) => void;
}) {
  const [fromVal, setFromVal] = useState(
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''
  );
  const [toVal, setToVal] = useState(
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''
  );
  const [error, setError] = useState('');

  // Sync when modal reopens with existing range
  useEffect(() => {
    if (open) {
      setFromVal(dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '');
      setToVal(dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '');
      setError('');
    }
  }, [open]);

  const handleApply = () => {
    if (!fromVal || !toVal) {
      setError('Please select both start and end dates.');
      return;
    }
    const from = new Date(fromVal);
    const to = new Date(toVal);
    if (from > to) {
      setError('Start date must be before or equal to end date.');
      return;
    }
    setError('');
    onApply(startOfDay(from), endOfDay(to));
    onClose();
  };

  const handleClear = () => {
    setFromVal('');
    setToVal('');
    setError('');
    onApply(undefined, undefined);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-white border border-gray-200 shadow-2xl sm:max-w-sm p-0 gap-0 overflow-hidden">
        <VisuallyHidden><DialogTitle>Select Custom Date Range</DialogTitle></VisuallyHidden>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 px-5 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-100" />
            <h3 className="text-white font-bold text-sm">Custom Date Range</h3>
          </div>
          <p className="text-blue-200 text-xs mt-0.5">Filter listings by created date</p>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={fromVal}
              max={toVal || undefined}
              onChange={e => { setFromVal(e.target.value); setError(''); }}
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-gray-50 hover:border-gray-300 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              value={toVal}
              min={fromVal || undefined}
              onChange={e => { setToVal(e.target.value); setError(''); }}
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-gray-50 hover:border-gray-300 transition-colors"
            />
          </div>

          {/* Preview */}
          {fromVal && toVal && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs font-semibold text-blue-700">
                {format(new Date(fromVal), 'MMM d, yyyy')}
                <span className="mx-1.5 text-blue-400">→</span>
                {format(new Date(toVal), 'MMM d, yyyy')}
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="flex-1 h-9 text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="flex-1 h-9 bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 hover:opacity-90 text-white font-bold border-0"
          >
            Apply Filter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════ IMAGE GALLERY ══════════════════════════════════════════ */
function ImageGallery({ images, loading }: { images: WarehouseImage[]; loading: boolean }) {
  const [current, setCurrent] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setCurrent(0);
    setImgError({});
  }, [images]);

  if (loading) {
    return (
      <div className="w-full h-56 rounded-xl flex flex-col items-center justify-center gap-3
                      bg-blue-50 border-2 border-dashed border-blue-200">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-blue-500 font-medium">Loading images…</p>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-56 rounded-xl flex flex-col items-center justify-center gap-3
                      bg-gray-50 border-2 border-dashed border-gray-200">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-400 font-medium">No images uploaded</p>
      </div>
    );
  }

  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length);
  const next = () => setCurrent(c => (c + 1) % images.length);
  const img = images[current];

  return (
    <div className="space-y-2">
      <div className="relative w-full h-56 rounded-xl overflow-hidden bg-gray-100 group border border-gray-200">
        {imgError[current] ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-50">
            <ImageIcon className="w-8 h-8 text-gray-300" />
            <p className="text-xs text-gray-400">Image unavailable</p>
          </div>
        ) : (
          <img
            src={img.s3_url}
            alt={img.file_name || `Warehouse image ${current + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(prev => ({ ...prev, [current]: true }))}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-2.5 right-2.5 bg-black/50 backdrop-blur-sm
                        text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {current + 1} / {images.length}
        </div>
        {img.is_primary && (
          <div className="absolute top-2.5 left-2.5 bg-orange-500 text-white
                          text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
            <Star className="w-3 h-3 fill-current" /> Primary
          </div>
        )}
        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white
                         text-gray-700 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white
                         text-gray-700 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {images.map((thumb, i) => (
            <button key={thumb.id} onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all
                ${i === current
                  ? 'border-blue-600 shadow-md shadow-blue-200 scale-105'
                  : 'border-gray-200 opacity-60 hover:opacity-90 hover:border-gray-300'}`}>
              {imgError[i] ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-3 h-3 text-gray-400" />
                </div>
              ) : (
                <img src={thumb.s3_url} alt="" className="w-full h-full object-cover"
                  onError={() => setImgError(p => ({ ...p, [i]: true }))} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Row thumbnail (table) ── */
function RowThumb({ warehouse }: { warehouse: Warehouse }) {
  const [error, setError] = useState(false);
  const img = warehouse.images?.find(i => i.is_primary) ?? warehouse.images?.[0];

  if (!img || error) {
    return (
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center
                      flex-shrink-0 border border-blue-100">
        <Building2 className="w-5 h-5 text-blue-300" />
      </div>
    );
  }
  return (
    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
      <img src={img.s3_url} alt="" className="w-full h-full object-cover"
        onError={() => setError(true)} />
      {(warehouse.images?.length ?? 0) > 1 && (
        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1 rounded-tl leading-4">
          +{(warehouse.images?.length ?? 1) - 1}
        </div>
      )}
    </div>
  );
}

/* ── Shared detail row inside modal ── */
function DetailRow({ icon: Icon, label, value, accent = 'blue' }: {
  icon: React.ElementType; label: string; value?: string | null; accent?: 'blue' | 'orange';
}) {
  if (!value) return null;
  const iconBg = accent === 'orange'
    ? 'bg-orange-50 border-orange-100 text-orange-500'
    : 'bg-blue-50 border-blue-100 text-blue-600';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ PAGE ══════════════════════════════════════════ */
export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<Warehouse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'contact' | 'location'>('overview');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const isAnyFilterActive = searchTerm !== '' || filterStatus !== 'all' || dateFilter !== 'all';

  useEffect(() => { fetchWarehouses(); }, []);

  async function fetchWarehouses() {
    try {
      const res = await fetch('/api/superadmin/warehouses');
      const data = await res.json();
      if (data.success) setWarehouses(data.warehouses);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchImages(warehouseId: string): Promise<WarehouseImage[]> {
    try {
      const res = await fetch(`/api/superadmin/warehouses/${warehouseId}/images`);
      const data = await res.json();
      if (data.success) return data.images ?? [];
    } catch (e) { console.error('Image fetch error:', e); }
    return [];
  }

  async function openDetails(warehouse: Warehouse) {
    setSelected({ ...warehouse });
    setShowModal(true);
    setActiveTab('overview');

    if (!warehouse.images) {
      setLoadingImages(true);
      const images = await fetchImages(warehouse.id);
      setLoadingImages(false);
      const updated = { ...warehouse, images };
      setSelected(updated);
      setWarehouses(prev => prev.map(w => w.id === warehouse.id ? updated : w));
    }
  }

  async function updateStatus(id: string, status: 'Active' | 'rejected') {
    try {
      const res = await fetch(`/api/superadmin/warehouses/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setWarehouses(prev => prev.map(w =>
          w.id === id ? { ...w, status, is_verified: status === 'Active' } : w
        ));
        setShowModal(false);
        setSelected(null);
      }
    } catch (e) { console.error(e); }
  }

  const isDateInRange = (dateString: string | null, range: DateRange): boolean => {
    if (!dateString || !range.from || !range.to) return true;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const startOfRangeDay = new Date(range.from);
    startOfRangeDay.setHours(0, 0, 0, 0);
    const endOfRangeDay = new Date(range.to);
    endOfRangeDay.setHours(23, 59, 59, 999);
    return date >= startOfRangeDay && date <= endOfRangeDay;
  };

  const handleDateFilterChange = (value: string) => {
    const filterValue = value as DateFilterType;
    setDateFilter(filterValue);
    if (filterValue === 'custom') {
      setShowCustomDateModal(true);
    } else {
      setDateRange({ from: undefined, to: undefined });
    }
  };

  const handleCustomDateApply = (from: Date | undefined, to: Date | undefined) => {
    setDateRange({ from, to });
    // If both cleared, reset filter to 'all'
    if (!from && !to) {
      setDateFilter('all');
    }
  };

  const getDateRangeForFilter = (filterType: DateFilterType): DateRange => {
    const today = new Date();
    switch (filterType) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'week':
        return { from: startOfWeek(today), to: endOfWeek(today) };
      case 'month':
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'last7': {
        const from = new Date(today);
        from.setDate(from.getDate() - 7);
        return { from: startOfDay(from), to: endOfDay(today) };
      }
      case 'last30': {
        const from = new Date(today);
        from.setDate(from.getDate() - 30);
        return { from: startOfDay(from), to: endOfDay(today) };
      }
      case 'custom':
        return dateRange;
      default:
        return { from: undefined, to: undefined };
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setDateFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setShowCustomDateModal(false);
  };

  const getDateFilterDisplay = () => {
    if (dateFilter === 'custom' && dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`;
    }
    switch (dateFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'last7': return 'Last 7 Days';
      case 'last30': return 'Last 30 Days';
      case 'custom': return 'Custom Range';
      default: return 'Date Range';
    }
  };

  const stats = {
    pending: warehouses.filter(w => w.status === 'Pending').length,
    active: warehouses.filter(w => w.status === 'Active').length,
    rejected: warehouses.filter(w => w.status === 'rejected').length,
  };

  const filteredAgents = warehouses.filter(w => {
    const matchesSearch =
      w.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.property_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.contact_person_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;

    const currentDateRange = getDateRangeForFilter(dateFilter);
    const matchesDate = dateFilter === 'all' ? true : isDateInRange(w.created_at, currentDateRange);

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">

      {/* ── Header card ── */}
      <GlassCard className="p-6" gradient="amber">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Warehouse Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">Review, verify and manage warehouse listings</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: `${stats.pending} Pending`, dot: 'bg-amber-400 animate-pulse', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
              { label: `${stats.active} Active`, dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              { label: `${stats.rejected} Rejected`, dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-2 ${s.bg} rounded-xl px-3 py-2 border shadow-sm`}>
                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-amber-200 to-transparent my-5" />

        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
            <Input
              placeholder="Search by title, city or property name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/60 border-white/70 focus:bg-white focus:border-amber-400 transition-all"
            />
          </div>

          {/* Status filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/60 border-white/70 focus:bg-white focus:border-amber-400">
              <Filter className="w-4 h-4 mr-2 text-amber-400" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Date filter */}
          <div className="w-full sm:w-48 lg:w-auto lg:flex-shrink-0 group relative">
            <Select value={dateFilter} onValueChange={handleDateFilterChange}>
              <SelectTrigger className={`h-10 w-full lg:w-auto rounded-lg text-sm transition-all ${
                dateFilter !== 'all'
                  ? 'bg-blue-50 border border-blue-300 hover:border-blue-400 focus:border-blue-400'
                  : 'bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-blue-400'
              }`}>
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="custom">Custom Range…</SelectItem>
              </SelectContent>
            </Select>

            {/* Hover tooltip */}
            {dateFilter !== 'all' && (
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg">
                  <p className="font-medium">{getDateFilterDisplay()}</p>
                  <p className="text-gray-300 text-xs mt-1">Click to change</p>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                </div>
              </div>
            )}
          </div>

          {/* Edit range button (only when custom is active and applied) */}
          {dateFilter === 'custom' && dateRange.from && dateRange.to && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomDateModal(true)}
              className="h-10 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 rounded-lg transition-colors text-sm whitespace-nowrap w-full sm:w-auto"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d')}
            </Button>
          )}

          {/* Clear all */}
          {isAnyFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-10 px-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm whitespace-nowrap w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-1.5" />
              Clear All
            </Button>
          )}
        </div>

        {/* Results counter */}
        <div className="flex items-center justify-between lg:justify-end mt-3">
          <span className="text-sm text-gray-600 lg:hidden">Results:</span>
          <span className="text-sm text-gray-600 font-medium">
            <span className="text-blue-600 font-bold">{filteredAgents.length}</span> warehouses
          </span>
        </div>
      </GlassCard>

      {/* ── Table ── */}
      <GlassCard className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/40 bg-gray-50/60">
                <TableHead className="font-bold text-gray-600 w-10 pl-4">#</TableHead>
                <TableHead className="font-bold text-gray-600">Property</TableHead>
                <TableHead className="font-bold text-gray-600">Location</TableHead>
                <TableHead className="font-bold text-gray-600">Type & Size</TableHead>
                <TableHead className="font-bold text-gray-600">Price</TableHead>
                <TableHead className="font-bold text-gray-600">Contact</TableHead>
                <TableHead className="font-bold text-gray-600">Images</TableHead>
                <TableHead className="font-bold text-gray-600">Status</TableHead>
                <TableHead className="font-bold text-gray-600 text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length > 0 ? filteredAgents.map((w, i) => (
                <TableRow key={w.id}
                  className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors group">
                  <TableCell className="pl-4 text-gray-400 text-xs font-medium">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <RowThumb warehouse={w} />
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm leading-tight">{w.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{w.property_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{w.city}, {w.state}</span>
                    </div>
                    {w.pincode && <p className="text-xs text-gray-400 ml-5">{w.pincode}</p>}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-800 font-medium">{w.property_type}</p>
                    <p className="text-xs text-gray-400">{w.space_available} {w.space_unit}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-bold text-gray-900">
                      ₹{w.price_per_sqft}
                      <span className="font-normal text-gray-400 text-xs">/sqft</span>
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-800">{w.contact_person_name}</p>
                    <p className="text-xs text-gray-400">{w.contact_person_phone}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">{w.images_count ?? 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline"
                      className={`${statusColors[w.status]} flex items-center gap-1.5 w-fit font-semibold text-xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[w.status]}`} />
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openDetails(w)} className="cursor-pointer">
                          <Eye className="w-4 h-4 mr-2 text-blue-600" /> View Details
                        </DropdownMenuItem>
                        {w.status === 'Pending' && (<>
                          <DropdownMenuItem
                            onClick={() => updateStatus(w.id, 'Active')}
                            className="cursor-pointer text-emerald-600 focus:bg-emerald-50">
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatus(w.id, 'rejected')}
                            className="cursor-pointer text-rose-600 focus:bg-rose-50">
                            <XCircle className="w-4 h-4 mr-2" /> Reject
                          </DropdownMenuItem>
                        </>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Building2 className="w-12 h-12 opacity-20" />
                      <p className="font-semibold">No warehouses found</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {/* ══════════════════════════════════════════════════════════════
          CUSTOM DATE RANGE MODAL
      ══════════════════════════════════════════════════════════════ */}
      <CustomDateModal
        open={showCustomDateModal}
        onClose={() => {
          setShowCustomDateModal(false);
          // If user closes without applying and no range is set, reset to 'all'
          if (!dateRange.from || !dateRange.to) {
            setDateFilter('all');
          }
        }}
        dateRange={dateRange}
        onApply={handleCustomDateApply}
      />

      {/* ══════════════════════════════════════════════════════════════
          DETAILS MODAL
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={showModal} onOpenChange={open => { setShowModal(open); if (!open) setSelected(null); }}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl sm:max-w-4xl
                                   max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <VisuallyHidden>
            <DialogTitle>{selected?.title ?? 'Warehouse Details'}</DialogTitle>
          </VisuallyHidden>

          {/* Coloured header banner */}
          <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 px-6 pt-5 pb-0 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-2.5 py-0.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-100" />
                    <span className="text-blue-100 text-[11px] font-bold uppercase tracking-wide">
                      {selected?.property_type ?? '—'}
                    </span>
                  </div>
                  {selected?.is_featured && (
                    <span className="bg-orange-500 text-white text-[11px] font-bold px-2.5 py-0.5
                                     rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" /> Featured
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white leading-snug">{selected?.title}</h2>
                <p className="text-blue-200 text-sm mt-0.5">{selected?.property_name}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                {selected && (
                  <Badge variant="outline"
                    className={`${statusColors[selected.status]} font-bold px-3 py-1 bg-white`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 inline-block ${statusDot[selected.status]}`} />
                    {selected.status}
                  </Badge>
                )}
                <p className="text-blue-300 text-xs font-mono">#{selected?.id?.slice(0, 8)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: 'Price / sqft', value: `₹${selected?.price_per_sqft}`, border: 'border-blue-500/50 bg-white/10' },
                { label: 'Space Available', value: `${selected?.space_available} ${selected?.space_unit}`, border: 'border-blue-500/50 bg-white/10' },
                { label: 'City', value: selected?.city, border: 'border-orange-400/60 bg-orange-500/15' },
              ].map(item => (
                <div key={item.label} className={`${item.border} border rounded-xl px-3 py-2.5`}>
                  <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide mb-0.5">{item.label}</p>
                  <p className="text-white font-bold text-sm truncate">{item.value ?? '—'}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-0 mt-4 border-b border-blue-500/50">
              {(['overview', 'contact', 'location'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-xs font-bold capitalize transition-all relative
                    ${activeTab === tab ? 'text-white' : 'text-blue-300 hover:text-blue-100'}`}>
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t bg-orange-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 bg-white px-6 py-5">

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Photos
                    <span className="ml-auto text-gray-400 font-normal normal-case tracking-normal">
                      {selected?.images ? `${selected.images.length} image${selected.images.length !== 1 ? 's' : ''}` : ''}
                    </span>
                  </p>
                  <ImageGallery images={selected?.images ?? []} loading={loadingImages} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Property Details
                  </p>
                  <DetailRow icon={Building2} label="Property Type" value={selected?.property_type} />
                  <DetailRow icon={Ruler} label="Warehouse Size" value={selected?.warehouse_size} />
                  <DetailRow icon={Package} label="Space Available" value={selected ? `${selected.space_available} ${selected.space_unit}` : null} />
                  <DetailRow icon={DollarSign} label="Price / sqft" value={selected ? `₹${selected.price_per_sqft}` : null} />
                  <DetailRow icon={Hash} label="Price Type" value={selected?.price_type} />
                  <DetailRow icon={Calendar} label="Available From" value={selected?.available_from ? fmt(selected.available_from) : null} />
                  <DetailRow icon={Calendar} label="Expiry Date" value={selected?.expiry_date ? fmt(selected.expiry_date) : null} />

                  {selected?.description && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Description</p>
                      <p className="text-sm text-gray-600 leading-relaxed bg-orange-50 rounded-xl p-3 border border-orange-100">
                        {selected.description}
                      </p>
                    </div>
                  )}

                  {(() => {
                    const list = selected?.amenities ? parseAmenities(selected.amenities) : [];
                    return list.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {list.map((a, i) => (
                            <span key={i} className="bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="max-w-md">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-600
                                    flex items-center justify-center text-white font-bold text-2xl
                                    shadow-lg shadow-blue-200 flex-shrink-0">
                      {selected?.contact_person_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{selected?.contact_person_name}</p>
                      {selected?.contact_person_designation && (
                        <p className="text-sm text-gray-500">{selected.contact_person_designation}</p>
                      )}
                      {selected?.contact_person_relation && (
                        <span className="text-[11px] bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 text-white px-2.5 py-0.5 rounded-full font-semibold mt-1.5 inline-block">
                          {selected.contact_person_relation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <DetailRow icon={Phone} label="Primary Phone" value={selected?.contact_person_phone} />
                <DetailRow icon={Phone} label="Alternate" value={selected?.contact_person_alternate} />
                <DetailRow icon={Mail} label="Email" value={selected?.contact_person_email} />
                <DetailRow icon={UserCheck} label="Listed By" value={selected?.user_name} />
                <div className="mt-5">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Listing Timeline</p>
                  <DetailRow icon={Calendar} label="Listed On" value={selected ? fmt(selected.created_at) : null} accent="orange" />
                  <DetailRow icon={Clock} label="Last Updated" value={selected?.updated_at ? fmt(selected.updated_at) : null} accent="orange" />
                </div>
              </div>
            )}

            {activeTab === 'location' && (
              <div className="max-w-lg">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location Details
                </p>
                <DetailRow icon={MapPin} label="Full Address" value={selected?.address} />
                <DetailRow icon={MapPin} label="City" value={selected?.city} />
                <DetailRow icon={MapPin} label="State" value={selected?.state} />
                <DetailRow icon={Hash} label="Pincode" value={selected?.pincode} />
                <DetailRow icon={Truck} label="Road Connectivity" value={selected?.road_connectivity} />
                {selected?.latitude && selected?.longitude && (
                  <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Coordinates</p>
                      <p className="text-sm font-mono font-bold text-gray-800">
                        {selected.latitude}, {selected.longitude}
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-white
                                 bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 hover:opacity-90
                                 px-3 py-2 rounded-lg transition-opacity shadow-sm flex-shrink-0">
                      Open Maps <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex-shrink-0
                          flex items-center justify-between gap-3 flex-wrap">
            {selected?.status === 'Pending' ? (
              <div className="flex gap-3 flex-1 flex-wrap">
                <Button
                  onClick={() => selected && updateStatus(selected.id, 'Active')}
                  className="flex-1 min-w-[140px] bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 hover:opacity-90 text-white font-bold shadow-sm border-0">
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve Listing
                </Button>
                <Button
                  onClick={() => selected && updateStatus(selected.id, 'rejected')}
                  variant="outline"
                  className="flex-1 min-w-[140px] border-rose-300 text-rose-600 hover:bg-rose-50 font-bold">
                  <XCircle className="w-4 h-4 mr-2" /> Reject Listing
                </Button>
              </div>
            ) : (
              <div className="flex-1">
                <Badge variant="outline"
                  className={`${statusColors[selected?.status ?? 'Pending']} text-sm px-4 py-1.5 font-bold`}>
                  <span className={`w-2 h-2 rounded-full mr-2 inline-block ${statusDot[selected?.status ?? 'Pending']}`} />
                  Listing is {selected?.status}
                </Badge>
              </div>
            )}
            <Button variant="ghost"
              onClick={() => { setShowModal(false); setSelected(null); }}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}