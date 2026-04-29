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

interface WarehouseImage {
    id: string; s3_url: string; file_name: string; is_primary: boolean; image_order: number;
}

interface ActivityWarehouse {
    // warehouse fields
    warehouse_id: string;
    warehouse: string;
    property_type: string;
    city: string;
    state: string;
    price_per_sqft: string;
    space_available: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;

    // agent fields
    agent_id: string;
    full_name: string;
    email: string;
    mobile_number: string;
    agency_name: string;
}

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom';
interface DateRange { from: Date | undefined; to: Date | undefined; }
type SortKey =
    | 'warehouse'
    | 'city'
    | 'property_type'
    | 'price_per_sqft'
    | 'space_available'
    | 'status'
    | 'created_at'
    | 'full_name';
type SortDir = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

const statusConfig: Record<string, { badge: string; dot: string; label: string }> = {
    Pending: { badge: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400 animate-pulse', label: 'Pending' },
    Active: { badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
    rejected: { badge: 'bg-rose-50 text-rose-700 border border-rose-200', dot: 'bg-rose-500', label: 'Rejected' },
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
                'text-xs font-bold tracking-wide h-11 px-4 whitespace-nowrap select-none cursor-pointer',
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
        const from = new Date(fromVal + "T00:00:00");
        const to = new Date(toVal + "T23:59:59");
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
                            <p className="text-[13px] font-medium text-blue-700">
                                    {format(new Date(fromVal + "T00:00:00"), 'MMM d, yyyy')} → {format(new Date(toVal + "T23:59:59"), 'MMM d, yyyy')}
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

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<ActivityWarehouse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState<ActivityWarehouse | null>(null);
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

    useEffect(() => { fetchWarehouses(); }, []);

    async function fetchWarehouses() {
        try {
            const res = await fetch('/api/superadmin/dashboard');
            const data = await res.json();
            console.log(data.recentActivity, "fadfhadfjf")
            if (data.success) setWarehouses(data.recentActivity);
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

    // async function openDetails(warehouse: ActivityWarehouse) {
    //     setSelected({ ...warehouse });
    //     setShowModal(true);
    //     setActiveTab('overview');
    //     if (!warehouse.images) {
    //         setLoadingImages(true);
    //         const images = await fetchImages(warehouse.id);
    //         setLoadingImages(false);
    //         const updated = { ...warehouse, images };
    //         setSelected(updated);
    //         setWarehouses(prev => prev.map(w => w.id === warehouse.id ? updated : w));
    //     }
    // }

    // async function updateStatus(id: string, status: 'Active' | 'rejected') {
    //     try {
    //         const res = await fetch(`/api/superadmin/warehouses/${id}/status`, {
    //             method: 'PATCH',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ status }),
    //         });
    //         const data = await res.json();
    //         if (data.success) {
    //             setWarehouses(prev => prev.map(w => w.id === id ? { ...w, status, is_verified: status === 'Active' } : w));
    //             setShowModal(false);
    //             setSelected(null);
    //         }
    //     } catch (e) { console.error(e); }
    // }

    const isDateInRange = (ds: string | null, range: DateRange): boolean => {
        if (!ds || !range.from || !range.to) return true;
        const d = new Date(ds);
        if (isNaN(d.getTime())) return false;
        return d >= range.from && d <= range.to;
    };

    const getDateRangeForFilter = useCallback((f: DateFilterType): DateRange => {
        const today = new Date();
        switch (f) {
            case 'today': return { from: startOfDay(today), to: endOfDay(today) };
            case 'week': return { from: startOfWeek(today), to: endOfWeek(today) };
            case 'month': return { from: startOfMonth(today), to: endOfMonth(today) };
            case 'last7': { const d = new Date(today); d.setDate(d.getDate() - 7); return { from: startOfDay(d), to: endOfDay(today) }; }
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
            w.warehouse?.toLowerCase().includes(q) ||
            w.city?.toLowerCase().includes(q) ||
            w.full_name?.toLowerCase().includes(q) ||
            w.email?.toLowerCase().includes(q) ||
            w.agency_name?.toLowerCase().includes(q);

        const matchesStatus =
            filterStatus === 'all' || w.status === filterStatus.toLowerCase();

        const range = getDateRangeForFilter(dateFilter);
        const matchesDate =
            dateFilter === 'all' ? true : isDateInRange(w.created_at, range);

        return matchesSearch && matchesStatus && matchesDate;
    });

    const sorted = [...filtered].sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
      
        switch (sortKey) {
      
          // Property column
          case 'warehouse':
            aVal = a.warehouse ?? '';
            bVal = b.warehouse ?? '';
            break;
      
          // Agent column
          case 'full_name':
            aVal = a.full_name ?? '';
            bVal = b.full_name ?? '';
            break;
      
          // City column
          case 'city':
            aVal = a.city ?? '';
            bVal = b.city ?? '';
            break;
      
          // Type column
          case 'property_type':
            aVal = a.property_type ?? '';
            bVal = b.property_type ?? '';
            break;
      
          // Price column
          case 'price_per_sqft':
            aVal = Number(a.price_per_sqft) || 0;
            bVal = Number(b.price_per_sqft) || 0;
            break;
      
          // Status column
          case 'status':
            aVal = a.status ?? '';
            bVal = b.status ?? '';
            break;
      
          // Created date column
          case 'created_at':
            aVal = new Date(a.created_at).getTime();
            bVal = new Date(b.created_at).getTime();
            break;
      
          default:
            return 0;
        }
      
        // string sorting
        if (typeof aVal === 'string') {
          const cmp = aVal.localeCompare(bVal as string);
          return sortDir === 'asc' ? cmp : -cmp;
        }
      
        // number/date sorting
        return sortDir === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
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
        { key: 'warehouse', label: 'Property', className: 'min-w-[220px]' },
        { key: 'full_name', label: 'Agent', className: 'min-w-[180px]' },
        { key: 'city', label: 'City', className: 'min-w-[130px]' },
        { key: 'property_type', label: 'Type', className: 'min-w-[130px]' },
        { key: 'price_per_sqft', label: 'Price', className: 'min-w-[100px]' },
        { key: 'status', label: 'Status', className: 'min-w-[110px]' },
        { key: 'created_at', label: 'Created', className: 'min-w-[120px]' },
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
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
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
                        <SelectContent>
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
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginated.length > 0 ? paginated.map((w, i) => (
                                <TableRow key={`${w.warehouse_id}-${w.agent_id}-${w.created_at}-${i}`}

                                    className={cn('border-b border-gray-100 hover:bg-blue-100 transition-colors group cursor-pointer',
                                        i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white')}
                                    // onClick={() => openDetails(w)}
                                    >


                                    <TableCell className="px-4 py-3.5">
                                        <p className="text-sm font-semibold text-gray-800">
                                            {w.warehouse}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {w.space_available} sqft
                                        </p>
                                    </TableCell>

                                    <TableCell className="px-4 py-3.5">
                                        <p className="text-sm font-semibold text-gray-800">{w.full_name}</p>
                                        <p className="text-xs text-gray-500">{w.email}</p>
                                    </TableCell>

                                    <TableCell className="px-4 py-3.5">
                                        <p className="text-sm text-gray-900 font-medium">{w.city}</p>
                                        <p className="text-xs text-gray-400">{w.state}</p>
                                    </TableCell>

                                    <TableCell className="px-4 py-3.5">
                                        <span className="capitalize text-sm font-medium">
                                            {w.property_type}
                                        </span>
                                    </TableCell>

                                    <TableCell className="px-4 py-3.5">
                                        <p className="text-sm font-bold text-gray-900">₹{w.price_per_sqft}</p>
                                        <p className="text-xs text-gray-400">/ sqft</p>
                                    </TableCell>

                                    <TableCell className="px-4 py-3.5">
                                        <StatusBadge status={w.status} />
                                    </TableCell>
                                    <TableCell className="px-4 py-3.5">
                                        <span className="text-sm text-gray-800">
                                            {fmt(w.created_at)}
                                        </span>
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
                        {/* <p className="text-sm text-gray-500 order-2 sm:order-1">
              Showing{' '}
              <span className="font-semibold text-gray-700">{startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, sorted.length)}</span>
              {' '}of{' '}
              <span className="font-semibold text-gray-700">{sorted.length}</span>
            </p> */}
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
                onClose={() => {
                    setShowCustomDateModal(false);
                }}
                dateRange={dateRange}
                onApply={handleCustomDateApply}
            />
        </div>
    );
}