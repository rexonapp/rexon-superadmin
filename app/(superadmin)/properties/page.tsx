"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search, Filter, Eye, CheckCircle, XCircle, Clock, MapPin,
  MoreVertical, Building2, Phone, Mail, Calendar,
  Ruler, DollarSign, ImageIcon, ChevronLeft, ChevronRight,
  Star, Truck, ArrowUpRight, Package, Hash, UserCheck, X,
  ChevronsUpDown, ChevronUp, ChevronDown,
} from 'lucide-react';
import Loading from '../loading';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useNotifications } from '@/lib/context/NotificationContext';

interface WarehouseImage {
  id: string; s3_url: string; file_name: string; is_primary: boolean; image_order: number;
}

interface Warehouse {
  id: string; title: string; property_name: string; property_type: string;
  warehouse_size: string; space_available: string; space_unit: string;
  price_per_sqft: string; price_type: string; city: string; state: string;
  pincode: string; address: string; description: string;
  status: 'Pending' | 'Active' | 'rejected';
  is_verified: boolean; is_featured: boolean;
  created_at: string; updated_at: string; available_from: string; expiry_date: string;
  user_name: string; contact_person_name: string; contact_person_phone: string;
  contact_person_email: string; contact_person_designation: string;
  contact_person_relation: string; contact_person_alternate: string;
  amenities: string | string[] | Record<string, string>;
  road_connectivity: string; latitude: string; longitude: string;
  images_count: number; images?: WarehouseImage[];
}

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom';
interface DateRange { from: Date | undefined; to: Date | undefined; }
type SortKey = 'title' | 'city' | 'property_type' | 'price_per_sqft' | 'space_available' | 'status' | 'created_at' | 'images_count' | 'contact_person_name';
type SortDir = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const statusConfig: Record<string, { badge: string; dot: string; label: string }> = {
  Pending:  { badge: 'bg-amber-50 text-amber-700 border border-amber-200',        dot: 'bg-amber-400 animate-pulse', label: 'Pending'  },
  Active:   { badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',  dot: 'bg-emerald-500',             label: 'Active'   },
  rejected: { badge: 'bg-rose-50 text-rose-700 border border-rose-200',           dot: 'bg-rose-500',                label: 'Rejected' },
};

const fmt = (ds: string) =>
  ds ? new Date(ds).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

function parseAmenities(raw: string | string[] | Record<string, string>): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(a => String(a).trim()).filter(Boolean);
  if (typeof raw === 'object') return Object.values(raw).map(a => String(a).trim()).filter(Boolean);
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p.map(a => String(a).trim()).filter(Boolean); } catch { /**/ }
  return raw.split(',').map(a => a.trim()).filter(Boolean);
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig['Pending'];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap', cfg.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-gray-400 ml-1 shrink-0" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-blue-500 ml-1 shrink-0" />
    : <ChevronDown className="w-3 h-3 text-blue-500 ml-1 shrink-0" />;
}

function SortableHead({ col, label, sortKey, sortDir, onSort, className }: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  const active = col === sortKey;
  return (
    <TableHead
      onClick={() => onSort(col)}
      className={cn(
        'text-l font-bold tracking-wide h-11 px-4 whitespace-nowrap select-none cursor-pointer',
        'hover:bg-gray-100 transition-colors',
        active ? 'text-blue-600 bg-blue-50/60' : 'text-gray-500',
        className
      )}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </div>
    </TableHead>
  );
}

function CustomDateModal({ open, onClose, dateRange, onApply }: {
  open: boolean; onClose: () => void;
  dateRange: DateRange; onApply: (from: Date | undefined, to: Date | undefined) => void;
}) {
  const [fromVal, setFromVal] = useState('');
  const [toVal, setToVal] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFromVal(dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '');
      setToVal(dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '');
      setError('');
    }
  }, [open, dateRange]);

  const handleApply = () => {
    if (!fromVal || !toVal) { setError('Please select both dates.'); return; }
    const from = new Date(fromVal), to = new Date(toVal);
    if (from > to) { setError('Start date must be before end date.'); return; }
    onApply(startOfDay(from), endOfDay(to));
    onClose();
  };

  const handleClear = () => {
    setFromVal(''); setToVal(''); setError('');
    onApply(undefined, undefined);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-white sm:max-w-sm p-0 gap-0 overflow-hidden border border-gray-200 shadow-xl">
        <VisuallyHidden><DialogTitle>Custom Date Range</DialogTitle></VisuallyHidden>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Custom Date Range</h3>
          <p className="text-xs text-gray-500 mt-0.5">Filter warehouses by created date</p>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
            <input type="date" value={fromVal} max={toVal || undefined}
              onChange={e => { setFromVal(e.target.value); setError(''); }}
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Date</label>
            <input type="date" value={toVal} min={fromVal || undefined}
              onChange={e => { setToVal(e.target.value); setError(''); }}
              className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50" />
          </div>
          {fromVal && toVal && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <p className="text-xs font-medium text-blue-700">
                {format(new Date(fromVal), 'MMM d, yyyy')} → {format(new Date(toVal), 'MMM d, yyyy')}
              </p>
            </div>
          )}
          {error && <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="flex-1 h-9 text-sm">Clear</Button>
          <Button size="sm" onClick={handleApply} className="flex-1 h-9 text-sm">Apply Filter</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImageGallery({ images, loading }: { images: WarehouseImage[]; loading: boolean }) {
  const [current, setCurrent] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  useEffect(() => { setCurrent(0); setImgError({}); }, [images]);

  if (loading) return (
    <div className="w-full h-52 rounded-xl flex flex-col items-center justify-center gap-3 bg-blue-50 border-2 border-dashed border-blue-200">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-blue-500 font-medium">Loading images…</p>
    </div>
  );

  if (!images || images.length === 0) return (
    <div className="w-full h-52 rounded-xl flex flex-col items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200">
      <ImageIcon className="w-9 h-9 text-gray-300" />
      <p className="text-sm text-gray-400 font-medium">No images uploaded</p>
    </div>
  );

  const img = images[current];
  return (
    <div className="space-y-2">
      <div className="relative w-full h-52 rounded-xl overflow-hidden bg-gray-100 group border border-gray-200">
        {imgError[current] ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-50">
            <ImageIcon className="w-7 h-7 text-gray-300" />
            <p className="text-xs text-gray-400">Image unavailable</p>
          </div>
        ) : (
          <img
            src={img.s3_url}
            alt={img.file_name || `Image ${current + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(p => ({ ...p, [current]: true }))}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-2 right-2 bg-black/55 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {current + 1} / {images.length}
        </div>
        {img.is_primary && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> Primary
          </div>
        )}
        {images.length > 1 && (
          <>
            <button onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrent(c => (c + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {images.map((thumb, i) => (
            <button key={thumb.id} onClick={() => setCurrent(i)}
              className={cn('flex-shrink-0 w-12 h-9 rounded-lg overflow-hidden border-2 transition-all',
                i === current ? 'border-blue-500 scale-105 shadow-sm' : 'border-gray-200 opacity-60 hover:opacity-90')}>
              {imgError[i]
                ? <div className="w-full h-full bg-gray-100 flex items-center justify-center"><ImageIcon className="w-3 h-3 text-gray-400" /></div>
                : <img src={thumb.s3_url} alt="" className="w-full h-full object-cover" onError={() => setImgError(p => ({ ...p, [i]: true }))} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RowThumb({ warehouse }: { warehouse: Warehouse }) {
  const [error, setError] = useState(false);
  const primaryImg = warehouse.images?.find(i => i.is_primary) ?? warehouse.images?.[0];

  if (!primaryImg || error) {
    return (
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
        <Building2 className="w-5 h-5 text-blue-300" />
      </div>
    );
  }
  return (
    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm">
      <img src={primaryImg.s3_url} alt={warehouse.title} className="w-full h-full object-cover" onError={() => setError(true)} />
      {(warehouse.images?.length ?? 0) > 1 && (
        <div className="absolute bottom-0 right-0 bg-black/65 text-white text-[9px] font-bold px-1 rounded-tl leading-4">
          +{(warehouse.images?.length ?? 1) - 1}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, accent = 'blue' }: {
  icon: React.ElementType; label: string; value?: string | null; accent?: 'blue' | 'amber';
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0',
        accent === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-blue-50 border-blue-100 text-blue-600')}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-gray-400 tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

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
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const isAnyFilterActive = searchTerm !== '' || filterStatus !== 'all' || dateFilter !== 'all';
  const { refetchNotifications } = useNotifications();

  useEffect(() => { fetchWarehouses(); }, []);

  async function fetchWarehouses() {
    try {
      const res = await fetch('/api/superadmin/warehouses');
      const data = await res.json();
      if (data.success) setWarehouses(data.warehouses);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchImages(id: string): Promise<WarehouseImage[]> {
    try {
      const res = await fetch(`/api/superadmin/warehouses/${id}/images`);
      const data = await res.json();
      if (data.success) return data.images ?? [];
    } catch { /**/ }
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
        setWarehouses(prev => prev.map(w => w.id === id ? { ...w, status, is_verified: status === 'Active' } : w));
        setShowModal(false);
        setSelected(null);
        refetchNotifications();
        refetchNotifications();
      }
    } catch (e) { console.error(e); }
  }

  const isDateInRange = (ds: string | null, range: DateRange): boolean => {
    if (!ds || !range.from || !range.to) return true;
    const d = new Date(ds);
    if (isNaN(d.getTime())) return false;
    return d >= range.from && d <= range.to;
  };

  const getDateRangeForFilter = useCallback((f: DateFilterType): DateRange => {
    const today = new Date();
    switch (f) {
      case 'today':  return { from: startOfDay(today), to: endOfDay(today) };
      case 'week':   return { from: startOfWeek(today), to: endOfWeek(today) };
      case 'month':  return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'last7':  { const d = new Date(today); d.setDate(d.getDate() - 7); return { from: startOfDay(d), to: endOfDay(today) }; }
      case 'last30': { const d = new Date(today); d.setDate(d.getDate() - 30); return { from: startOfDay(d), to: endOfDay(today) }; }
      case 'custom': return dateRange;
      default: return { from: undefined, to: undefined };
    }
  }, [dateRange]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const handleDateFilterChange = (value: string) => {
    const f = value as DateFilterType;
    setDateFilter(f);
    if (f === 'custom') setShowCustomDateModal(true);
    else setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

  const handleCustomDateApply = (from: Date | undefined, to: Date | undefined) => {
    setDateRange({ from, to });
    if (!from && !to) setDateFilter('all');
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm(''); setFilterStatus('all');
    setDateFilter('all'); setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

  const filtered = warehouses.filter(w => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      w.title?.toLowerCase().includes(q) ||
      w.city?.toLowerCase().includes(q) ||
      w.property_name?.toLowerCase().includes(q) ||
      w.contact_person_email?.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    const range = getDateRangeForFilter(dateFilter);
    const matchesDate = dateFilter === 'all' ? true : isDateInRange(w.created_at, range);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';
    switch (sortKey) {
      case 'title':               aVal = a.title ?? '';               bVal = b.title ?? '';               break;
      case 'city':                aVal = a.city ?? '';                bVal = b.city ?? '';                break;
      case 'property_type':       aVal = a.property_type ?? '';       bVal = b.property_type ?? '';       break;
      case 'price_per_sqft':      aVal = parseFloat(a.price_per_sqft) || 0; bVal = parseFloat(b.price_per_sqft) || 0; break;
      case 'space_available':     aVal = parseFloat(a.space_available) || 0; bVal = parseFloat(b.space_available) || 0; break;
      case 'status':              aVal = a.status ?? '';               bVal = b.status ?? '';               break;
      case 'created_at':          aVal = new Date(a.created_at).getTime() || 0; bVal = new Date(b.created_at).getTime() || 0; break;
      case 'images_count':        aVal = a.images_count ?? 0;         bVal = b.images_count ?? 0;         break;
      case 'contact_person_name': aVal = a.contact_person_name ?? ''; bVal = b.contact_person_name ?? ''; break;
    }
    if (typeof aVal === 'string') {
      const cmp = aVal.localeCompare(bVal as string);
      return sortDir === 'asc' ? cmp : -cmp;
    }
    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);
    if (safePage > 3) pages.push('ellipsis');
    for (let p = Math.max(2, safePage - 1); p <= Math.min(totalPages - 1, safePage + 1); p++) pages.push(p);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading) return <Loading />;

  const cols: { key: SortKey; label: string; className?: string }[] = [
    { key: 'title',               label: 'Property',    className: 'min-w-[220px]' },
    { key: 'city',                label: 'Location',    className: 'min-w-[130px]' },
    { key: 'property_type',       label: 'Type & Size', className: 'min-w-[130px]' },
    { key: 'price_per_sqft',      label: 'Price',       className: 'min-w-[100px]' },
    { key: 'contact_person_name', label: 'Contact',     className: 'min-w-[140px]' },
    { key: 'images_count',        label: 'Images',      className: 'min-w-[80px]'  },
    { key: 'status',              label: 'Status',      className: 'min-w-[110px]' },
    { key: 'created_at',          label: 'Added',       className: 'min-w-[120px]' },
  ];

  return (
    /*
      Height chain:
        layout root:          h-screen overflow-hidden flex
        layout main:          flex-1 min-w-0 h-screen overflow-hidden flex-col
        layout content area:  flex-1 min-h-0 overflow-hidden p-4 sm:p-6
        THIS component:       h-full flex flex-col overflow-hidden
          → filters row:      flex-shrink-0
          → table card:       flex-1 min-h-0   ← fills all remaining space
    */
    <div className="h-full flex flex-col gap-3 overflow-hidden">

      {/* ── Filters ── */}
      <div className="flex-shrink-0 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-xl lg:w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search property, city, contact…"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-36 h-9 text-sm bg-gray-50 border-gray-200 shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent
              side="bottom"
              align="start"
              sideOffset={4}
              position="popper"
              avoidCollisions={false}
              className="max-h-60 overflow-y-auto"
            >              
              <SelectItem value="all">Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={handleDateFilterChange}>
            <SelectTrigger className={cn('w-40 h-9 text-sm border-gray-200 shrink-0',
              dateFilter !== 'all' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50')}>
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent
              side="bottom"
              align="start"
              sideOffset={4}
              position="popper"
              avoidCollisions={false}
              className="max-h-60 overflow-y-auto"
            >              
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range…</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === 'custom' && dateRange.from && dateRange.to && (
            <Button variant="outline" size="sm" onClick={() => setShowCustomDateModal(true)}
              className="h-9 px-3 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 whitespace-nowrap shrink-0">
              <Calendar className="w-3 h-3 mr-1.5" />
              {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d')}
            </Button>
          )}

          {isAnyFilterActive && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}
              className="h-9 px-3 text-sm text-gray-500 hover:text-rose-600 hover:bg-rose-50 shrink-0">
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>

        <div className="sm:ml-auto">
          <span className="text-xs text-gray-400 font-medium">
           
          </span>
        </div>
      </div>

      {/* ── Table card — flex-1 + min-h-0 fills all remaining vertical space ── */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">

        {/* Scrollable table area */}
        <div className="flex-1 min-h-0 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
          <Table className="min-w-[960px] w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
               
                {cols.map(c => (
                  <SortableHead key={c.key} col={c.key} label={c.label}
                    sortKey={sortKey} sortDir={sortDir} onSort={handleSort}
                    className={cn(c.className, 'bg-gray-50 sticky top-0 z-10')} />
                ))}
                <TableHead className="text-l font-bold tracking-wide text-gray-500 h-11 px-4 text-right bg-gray-50 w-16 sticky top-0 z-10">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length > 0 ? paginated.map((w, i) => (
                <TableRow key={w.id}
                  className={cn('border-b border-gray-100 hover:bg-blue-100 transition-colors group cursor-pointer',
                    i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white')}
                  onClick={() => openDetails(w)}>


                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <RowThumb warehouse={w} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug truncate max-w-[175px]">
                          {w.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[175px]">{w.property_name}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800 font-medium">{w.city}</span>
                    </div>
                    <p className="text-xs text-gray-400 ml-5 mt-0.5">{w.state}</p>
                  </TableCell>

                  <TableCell className="px-4 py-3.5">
                    <p className="text-sm text-gray-800 font-medium">{w.property_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{w.space_available} {w.space_unit}</p>
                  </TableCell>

                  <TableCell className="px-4 py-3.5">
                    <p className="text-sm font-bold text-gray-900">₹{w.price_per_sqft}</p>
                    <p className="text-xs text-gray-400 mt-0.5">/ sqft</p>
                  </TableCell>

                  <TableCell className="px-4 py-3.5">
                    <p className="text-sm text-gray-800 font-medium truncate max-w-[130px]">{w.contact_person_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{w.contact_person_phone}</p>
                  </TableCell>

                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-700 font-semibold">{w.images_count ?? 0}</span>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-3.5">
                    <StatusBadge status={w.status} />
                  </TableCell>

                  <TableCell className="px-4 py-3.5">
                    <span className="text-sm text-gray-600">{fmt(w.created_at)}</span>
                  </TableCell>

                  <TableCell className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"
                          className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openDetails(w)} className="cursor-pointer text-sm py-2">
                          <Eye className="w-4 h-4 mr-2 text-blue-500" /> View Details
                        </DropdownMenuItem>
                        {w.status === 'Pending' && (<>
                          <DropdownMenuItem onClick={() => updateStatus(w.id, 'Active')}
                            className="cursor-pointer text-sm py-2 text-emerald-600 focus:bg-emerald-50">
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(w.id, 'rejected')}
                            className="cursor-pointer text-sm py-2 text-rose-600 focus:bg-rose-50">
                            <XCircle className="w-4 h-4 mr-2" /> Reject
                          </DropdownMenuItem>
                        </>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Building2 className="w-7 h-7 opacity-40" />
                      </div>
                      <p className="font-semibold text-base text-gray-500">No items or properties found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      {isAnyFilterActive && (
                        <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-1 text-sm">
                          <X className="w-3.5 h-3.5 mr-1.5" /> Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination — always at bottom of card, never scrolls */}
        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white">
          
            <Pagination className="order-1 sm:order-2">
              <PaginationContent className="gap-0.5 flex-wrap justify-center">
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(safePage - 1)}
                    className={cn('h-8 text-sm cursor-pointer select-none', safePage === 1 && 'pointer-events-none opacity-40')} />
                </PaginationItem>
                {getPageNumbers().map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}><PaginationEllipsis className="h-8 w-8" /></PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink onClick={() => handlePageChange(item)} isActive={safePage === item}
                        className={cn('h-8 w-8 text-sm cursor-pointer select-none rounded-lg font-medium',
                          safePage === item ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white' : 'hover:bg-gray-100')}>
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(safePage + 1)}
                    className={cn('h-8 text-sm cursor-pointer select-none', safePage === totalPages && 'pointer-events-none opacity-40')} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <CustomDateModal
        open={showCustomDateModal}
        onClose={() => { setShowCustomDateModal(false); if (!dateRange.from || !dateRange.to) setDateFilter('all'); }}
        dateRange={dateRange}
        onApply={handleCustomDateApply}
      />

      {/* ── Detail Modal ── */}
      <Dialog open={showModal} onOpenChange={open => { setShowModal(open); if (!open) setTimeout(() => setSelected(null), 300); }}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl w-full sm:max-w-3xl max-h-[90dvh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl">
          <VisuallyHidden><DialogTitle>{selected?.title ?? 'Warehouse Details'}</DialogTitle></VisuallyHidden>

          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-5 pt-5 pb-0 flex-shrink-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-blue-100 text-xs font-bold uppercase tracking-wide bg-white/15 rounded-full px-2.5 py-1">
                    {selected?.property_type ?? '—'}
                  </span>
                  {selected?.is_featured && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Featured
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">{selected?.title}</h2>
                <p className="text-blue-200 text-sm mt-0.5 truncate">{selected?.property_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 py-4 flex-shrink-0">
                {selected && <StatusBadge status={selected.status} />}
                {/* <p className="text-blue-300 text-xs font-mono">#{selected?.id?.slice(0, 8)}</p> */}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Price / sqft', value: `₹${selected?.price_per_sqft}` },
                { label: 'Space',        value: `${selected?.space_available} ${selected?.space_unit}` },
                { label: 'City',         value: selected?.city },
              ].map(item => (
                <div key={item.label} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5">
                  <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-0.5">{item.label}</p>
                  <p className="text-white font-bold text-sm truncate">{item.value ?? '—'}</p>
                </div>
              ))}
            </div>

            <div className="flex border-b border-blue-500/40">
              {(['overview', 'contact', 'location'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('px-5 py-2.5 text-sm font-semibold capitalize transition-all relative',
                    activeTab === tab ? 'text-white' : 'text-blue-300 hover:text-blue-100')}>
                  {tab}
                  {activeTab === tab && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t bg-orange-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 bg-white px-5 py-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Photos
                    {selected?.images && (
                      <span className="ml-auto text-gray-400 font-normal normal-case tracking-normal text-xs">
                        {selected.images.length} photo{selected.images.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                  <ImageGallery images={selected?.images ?? []} loading={loadingImages} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Property Details
                  </p>
                  <DetailRow icon={Building2}  label="Property Type"   value={selected?.property_type} />
                  <DetailRow icon={Ruler}      label="Warehouse Size"  value={selected?.warehouse_size} />
                  <DetailRow icon={Package}    label="Space Available" value={selected ? `${selected.space_available} ${selected.space_unit}` : null} />
                  <DetailRow icon={DollarSign} label="Price / sqft"    value={selected ? `₹${selected.price_per_sqft}` : null} />
                  <DetailRow icon={Hash}       label="Price Type"      value={selected?.price_type} />
                  <DetailRow icon={Calendar}   label="Available From"  value={selected?.available_from ? fmt(selected.available_from) : null} />
                  <DetailRow icon={Calendar}   label="Expiry Date"     value={selected?.expiry_date ? fmt(selected.expiry_date) : null} />
                  {selected?.description && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Description</p>
                      <p className="text-sm text-gray-600 leading-relaxed bg-amber-50 rounded-xl p-3.5 border border-amber-100">{selected.description}</p>
                    </div>
                  )}
                  {(() => {
                    const list = selected?.amenities ? parseAmenities(selected.amenities) : [];
                    return list.length > 0 ? (
                      <div className="mt-4">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Amenities</p>
                        <div className="flex flex-wrap gap-1.5">
                          {list.map((a, idx) => (
                            <span key={idx} className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">{a}</span>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div className="max-w-md mx-auto">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {selected?.contact_person_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{selected?.contact_person_name}</p>
                      {selected?.contact_person_designation && <p className="text-sm text-gray-500 mt-0.5">{selected.contact_person_designation}</p>}
                      {selected?.contact_person_relation && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold mt-1 inline-block">{selected.contact_person_relation}</span>
                      )}
                    </div>
                  </div>
                </div>
                <DetailRow icon={Phone}     label="Primary Phone" value={selected?.contact_person_phone} />
                <DetailRow icon={Phone}     label="Alternate"     value={selected?.contact_person_alternate} />
                <DetailRow icon={Mail}      label="Email"         value={selected?.contact_person_email} />
                <DetailRow icon={UserCheck} label="Listed By"     value={selected?.user_name} />
                <div className="mt-5">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Timeline</p>
                  <DetailRow icon={Calendar} label="Listed On"    value={selected ? fmt(selected.created_at) : null} accent="amber" />
                  <DetailRow icon={Clock}    label="Last Updated" value={selected?.updated_at ? fmt(selected.updated_at) : null} accent="amber" />
                </div>
              </div>
            )}

            {activeTab === 'location' && (
              <div className="max-w-lg">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location Details
                </p>
                <DetailRow icon={MapPin} label="Full Address"      value={selected?.address} />
                <DetailRow icon={MapPin} label="City"              value={selected?.city} />
                <DetailRow icon={MapPin} label="State"             value={selected?.state} />
                <DetailRow icon={Hash}   label="Pincode"           value={selected?.pincode} />
                <DetailRow icon={Truck}  label="Road Connectivity" value={selected?.road_connectivity} />
                {selected?.latitude && selected?.longitude && (
                  <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Coordinates</p>
                      <p className="text-sm font-mono font-bold text-gray-800">{selected.latitude}, {selected.longitude}</p>
                    </div>
                    <a href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex-shrink-0">
                      Maps <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
            {selected?.status === 'Pending' ? (
              <div className="flex gap-2.5 flex-1 flex-wrap">
                <Button onClick={() => selected && updateStatus(selected.id, 'Active')} size="sm"
                  className="flex-1 min-w-[130px] h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                </Button>
                <Button onClick={() => selected && updateStatus(selected.id, 'rejected')} size="sm" variant="outline"
                  className="flex-1 min-w-[130px] h-9 border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-sm">
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject
                </Button>
              </div>
            ) : (
              <div className="flex-1"><StatusBadge status={selected?.status ?? 'Pending'} /></div>
            )}
            <Button variant="ghost" size="sm"
              onClick={() => { setShowModal(false); setTimeout(() => setSelected(null), 300); }}
              className="h-9 text-gray-900 hover:text-gray-700 hover:bg-gray-300 bg-gray-200 font-medium text-sm px-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}