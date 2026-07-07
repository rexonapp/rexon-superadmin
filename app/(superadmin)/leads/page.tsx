"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search, Filter, Eye, CheckCircle, XCircle, MoreVertical,
  FileText, Pencil, Globe, X, Calendar,
  ChevronsUpDown, ChevronUp, ChevronDown, Users,
  Phone, Mail, MapPin, Hash, Clock, Building2, Ban, RotateCcw,
  Trash2,
} from 'lucide-react';
import Loading from '../loading';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useNotifications } from '@/lib/context/NotificationContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentDomain {
  id: string;
  domain_name: string;
  full_domain: string;
  status: string;
  is_active: boolean;
  activated_at: string | null;
  released_at: string | null;
}

interface lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_verified: boolean;
  created_at: string | null;
  last_login: string | null;
  phone: number;
}

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom';
interface DateRange { from: Date | undefined; to: Date | undefined; }
type SortKey = 'full_name' | 'created_at' | 'last_login';
type SortDir = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

// ── Status config ─────────────────────────────────────────────────────────────

const statusCfg: Record<string, { badge: string; dot: string; label: string }> = {
  pending:     { badge: 'bg-amber-50 text-amber-700 border border-amber-200',       dot: 'bg-amber-400 animate-pulse', label: 'Pending'     },
  approved:    { badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500',             label: 'Approved'    },
  rejected:    { badge: 'bg-rose-50 text-rose-700 border border-rose-200',          dot: 'bg-rose-500',                label: 'Rejected'    },
  invite:      { badge: 'bg-purple-50 text-purple-700 border border-purple-200',    dot: 'bg-purple-400',              label: 'Invited'     },
  deactivated: { badge: 'bg-gray-100 text-gray-500 border border-gray-300',         dot: 'bg-gray-400',                label: 'Deactivated' },
};

const domainStatusCfg: Record<string, string> = {
  active:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  deactivate: 'bg-orange-50 text-orange-700 border-orange-200',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(ds: string | null): string {
  if (!ds) return '—';
  try {
    const d = new Date(ds);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
  } catch { return '—'; }
}

function fmtTime(ds: string | null): string | null {
  if (!ds) return null;
  try {
    const d = new Date(ds);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  } catch { return null; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = statusCfg[status] ?? statusCfg['pending'];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap', cfg.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-gray-400 ml-1 shrink-0" />;
  return sortDir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-brand-teal-medium ml-1 shrink-0" />
    : <ChevronDown className="w-3 h-3 text-brand-teal-medium ml-1 shrink-0" />;
}

function SortableHead({ col, label, sortKey, sortDir, onSort, className }: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void; className?: string;
}) {
  return (
    <TableHead
      onClick={() => onSort(col)}
      className={cn(
        'text-l font-bold  tracking-wide h-11 px-4 whitespace-nowrap select-none cursor-pointer transition-colors',
        'hover:bg-gray-100',
        col === sortKey ? 'text-brand-teal-deep bg-brand-teal/25' : 'text-brand-teal-dark bg-brand-teal/15',
        className,
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
  const [toVal,   setToVal]   = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (open) {
      setFromVal(dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '');
      setToVal(dateRange.to   ? format(dateRange.to,   'yyyy-MM-dd') : '');
      setError('');
    }
  }, [open, dateRange]);

  const handleApply = () => {
    if (!fromVal || !toVal) { setError('Please select both dates.'); return; }
    const from = new Date(fromVal), to = new Date(toVal);
    if (from > to) { setError('Start date must be before end date.'); return; }
    onApply(startOfDay(from), endOfDay(to)); onClose();
  };
  const handleClear = () => { setFromVal(''); setToVal(''); setError(''); onApply(undefined, undefined); };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-white sm:max-w-sm p-0 gap-0 overflow-hidden border border-gray-200 shadow-xl">
        <VisuallyHidden><DialogTitle>Custom Date Range</DialogTitle></VisuallyHidden>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Custom Date Range</h3>
          <p className="text-xs text-gray-500 mt-0.5">Filter leads by registration date</p>
        </div>
        <div className="px-5 py-5 space-y-4">
          {['Start', 'End'].map((lbl) => {
            const isFrom = lbl === 'Start';
            return (
              <div key={lbl} className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{lbl} Date</label>
                <input
                  type="date"
                  value={isFrom ? fromVal : toVal}
                  max={isFrom ? toVal || undefined : undefined}
                  min={isFrom ? undefined : fromVal || undefined}
                  onChange={e => { isFrom ? setFromVal(e.target.value) : setToVal(e.target.value); setError(''); }}
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal bg-gray-50"
                />
              </div>
            );
          })}
          {fromVal && toVal && (
            <div className="bg-brand-teal/8 border border-brand-teal/25 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-brand-teal-medium shrink-0" />
              <p className="text-xs font-medium text-brand-teal-dark">
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



// ── Page ─────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads,           setLead]           = useState<lead[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [filterStatus,     setFilterStatus]     = useState('all');
  const [dateFilter,       setDateFilter]       = useState<DateFilterType>('all');
  const [dateRange,        setDateRange]        = useState<DateRange>({ from: undefined, to: undefined });
  const [showCustomDate,   setShowCustomDate]   = useState(false);
  const [currentPage,      setCurrentPage]      = useState(1);
  const [sortKey,          setSortKey]          = useState<SortKey>('created_at');
  const [sortDir,          setSortDir]          = useState<SortDir>('desc');

  const anyFilter = searchTerm !== '' || filterStatus !== 'all' || dateFilter !== 'all';
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedlead, setSelectedLead]       = useState<lead | null>(null);

  
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/superadmin/leads');
        const d   = await res.json();
        console.log(d, "d")
        if (d.success) setLead(d.users);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

 


  // ── Filtering & sorting ───────────────────────────────────────────────────

  const isDateInRange = (ds: string | null, r: DateRange): boolean => {
    if (!ds || !r.from || !r.to) return true;
    const d = new Date(ds);
    return !isNaN(d.getTime()) && d >= r.from && d <= r.to;
  };

  const getRange = useCallback((f: DateFilterType): DateRange => {
    const today = new Date();
    switch (f) {
      case 'today':  return { from: startOfDay(today),   to: endOfDay(today)   };
      case 'week':   return { from: startOfWeek(today),  to: endOfWeek(today)  };
      case 'month':  return { from: startOfMonth(today), to: endOfMonth(today) };
      case 'last7':  { const d = new Date(today); d.setDate(d.getDate() - 7);  return { from: startOfDay(d), to: endOfDay(today) }; }
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
    if (f === 'custom') setShowCustomDate(true);
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


  const filtered = leads.filter(a => {
    const q = searchTerm.toLowerCase();
    const full_name = `${a.first_name} ${a.last_name}`;
    const matchSearch = full_name.toLowerCase().includes(q)
      || a.email.toLowerCase().includes(q);
    // const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchDate   = dateFilter === 'all' || isDateInRange(a.created_at, getRange(dateFilter));
    return matchSearch && matchDate;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number | boolean = '', bv: string | number | boolean = '';
    switch (sortKey) {
      case 'full_name':
        av = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim();
        bv = `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim();
        break; 
      case 'created_at': av = new Date(a.created_at ?? 0).getTime(); bv = new Date(b.created_at ?? 0).getTime(); break;
      case 'last_login': av = new Date(a.last_login ?? 0).getTime(); bv = new Date(b.last_login ?? 0).getTime(); break;
    }
    if (typeof av === 'string') { const c = av.localeCompare(bv as string); return sortDir === 'asc' ? c : -c; }
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const startIdx   = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated  = sorted.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const pageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (safePage > 3) pages.push('ellipsis');
    for (let p = Math.max(2, safePage - 1); p <= Math.min(totalPages - 1, safePage + 1); p++) pages.push(p);
    if (safePage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

   // ── Delete user ────────────────────────────────────────────────────────────
   const deleteUser = async () => {
    if (!selectedlead) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/superadmin/leads/${selectedlead.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) { console.error(data.error); return; }
      setLead(prev => prev.filter(u => u.id !== selectedlead.id));
      setShowDeleteModal(false);
      setSelectedLead(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setDeleteLoading(false);
    }
  };
  if (loading) return <Loading />;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">

      {/* ── Filters ── */}
      <div className="flex-shrink-0 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">

        {/* Search — full width on mobile */}
        <div className="relative w-full sm:w-xl lg:w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search name, email…"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        {/* Date filter + Clear — same row on mobile */}
        <div className="flex items-center gap-2 sm:contents">
          <Select value={dateFilter} onValueChange={handleDateFilterChange}>
            <SelectTrigger className={cn('flex-1 sm:flex-none sm:w-40 h-9 text-sm border-gray-200 shrink-0',
              dateFilter !== 'all' ? 'bg-brand-teal/8 border-brand-teal/35 text-brand-teal-dark' : 'bg-gray-50')}>
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
            <Button variant="outline" size="sm" onClick={() => setShowCustomDate(true)}
              className="h-9 px-3 text-xs text-brand-teal-medium border-brand-teal/25 hover:bg-brand-teal/10 whitespace-nowrap shrink-0">
              <Calendar className="w-3 h-3 mr-1.5" />
              {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d')}
            </Button>
          )}

          {anyFilter && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}
              className="h-9 px-3 text-sm text-gray-500 hover:text-rose-600 hover:bg-rose-50 shrink-0">
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">

        <div className="flex-1 min-h-0 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-brand-teal/15 border-b border-brand-teal/20">
                <SortableHead col="full_name" label="Name"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[160px] sticky top-0 z-10" />
                <TableHead className="hidden sm:table-cell text-l font-bold tracking-wide text-brand-teal-dark bg-brand-teal/15 font-semibold h-11 px-4 min-w-[160px] sticky top-0 z-10">E-mail</TableHead>
                <TableHead className="hidden sm:table-cell text-l font-bold tracking-wide text-brand-teal-dark bg-brand-teal/15 font-semibold h-11 px-4 min-w-[160px] sticky top-0 z-10">Phone</TableHead>
                <TableHead className="text-l font-bold tracking-wide text-brand-teal-dark bg-brand-teal/15 font-semibold h-11 px-4 min-w-[90px] sticky top-0 z-10">Status</TableHead>
                <SortableHead col="last_login" label="Last Login" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell min-w-[120px] sticky top-0 z-10" />
                <SortableHead col="created_at" label="Registered" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell min-w-[130px] sticky top-0 z-10" />
                <TableHead className="text-l font-bold tracking-wide text-brand-teal-dark bg-brand-teal/15 font-semibold h-11 px-4 text-right w-14 sticky top-0 z-10">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length > 0 ? paginated.map((lead, i) => (
                <TableRow key={lead.id}
                  // className={cn(
                  //   'border-b border-gray-100 hover:bg-brand-teal/15 transition-colors group cursor-pointer',
                  //   i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white',
                  //   // Visually dim deactivated rows
                  //   lead.status === 'deactivated' && 'opacity-60',
                  // )}
                  // onClick={() => { setSelectedAgent(lead); setShowDetailsModal(true); setActiveTab('overview'); }}
                  >

                  {/* Name — always visible; email shown as subtitle on mobile */}
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-9 h-9 ring-1 ring-gray-200 shrink-0">
                        <AvatarFallback className="bg-brand-teal-dark text-white text-xs font-bold">
                          {lead.first_name[0]}{lead.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 transition-colors truncate max-w-[150px]">
                          {lead.first_name} {lead.last_name}
                        </p>
                        <p className="sm:hidden text-xs text-gray-400 mt-0.5 truncate max-w-[150px]">{lead.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Email — hidden on mobile */}
                  <TableCell className="hidden sm:table-cell px-4 py-3.5">
                    <p className="text-sm text-gray-800">{lead.email}</p>
                  </TableCell>
                  
                  <TableCell className="hidden sm:table-cell px-4 py-3.5">
                    <p className="text-sm text-gray-800">{lead.phone}</p>
                  </TableCell>

                  {/* Status — always visible */}
                  <TableCell className="px-4 py-3.5">
                    {lead.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-500 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        Deleted
                      </span>
                    )}
                  </TableCell>

                  {/* Last Login — hidden on mobile */}
                  <TableCell className="hidden sm:table-cell px-4 py-3.5">
                    <p className="text-sm text-gray-800">{fmtDate(lead.last_login)}</p>
                    {fmtTime(lead.last_login) && <p className="text-xs text-gray-400 mt-0.5">{fmtTime(lead.last_login)}</p>}
                  </TableCell>

                  {/* Registered — hidden on mobile and tablet */}
                  <TableCell className="hidden md:table-cell px-4 py-3.5">
                    <p className="text-sm text-gray-800">{fmtDate(lead.created_at)}</p>
                    {fmtTime(lead.created_at) && <p className="text-xs text-gray-400 mt-0.5">{fmtTime(lead.created_at)}</p>}
                  </TableCell>
                  {/* Actions */}
                  <TableCell className="px-4 py-3.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="cursor-pointer text-sm py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                          onClick={() => { setSelectedLead(lead); setShowDeleteModal(true); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Lead
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Users className="w-7 h-7 opacity-40" />
                      </div>
                      <p className="font-semibold text-base text-gray-500">No Leads found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      {anyFilter && (
                        <Button
                          variant="outline" size="sm"
                          onClick={() => { setSearchTerm(''); }}
                          className="mt-1 text-sm"
                        >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white">
            <Pagination className="order-1 sm:order-2">
              <PaginationContent className="gap-0.5 flex-wrap justify-center">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => safePage > 1 && setCurrentPage(safePage - 1)}
                    className={cn('h-8 text-sm cursor-pointer select-none', safePage === 1 && 'pointer-events-none opacity-40')}
                  />
                </PaginationItem>
                {pageNumbers().map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`e${idx}`}><PaginationEllipsis className="h-8 w-8" /></PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink onClick={() => setCurrentPage(item)} isActive={safePage === item}
                        className={cn('h-8 w-8 text-sm cursor-pointer select-none rounded-lg font-medium',
                          safePage === item ? 'bg-brand-teal-deep text-white border-brand-teal-deep hover:bg-brand-teal-dark hover:text-white' : 'hover:bg-gray-100')}>
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => safePage < totalPages && setCurrentPage(safePage + 1)}
                    className={cn('h-8 text-sm cursor-pointer select-none', safePage === totalPages && 'pointer-events-none opacity-40')}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* ── Delete Lead Confirmation ── */}
      <AlertDialog open={showDeleteModal} onOpenChange={open => { if (!open) { setShowDeleteModal(false); setSelectedLead(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">
                {selectedlead ? `${selectedlead.first_name ?? ''} ${selectedlead.last_name ?? ''}`.trim() || selectedlead.email : ''}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <button
              type="button"
              onClick={() => { setShowDeleteModal(false); setSelectedLead(null); }}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-[#da7948] hover:bg-[#c4693e] text-white transition-colors"
            >
              Cancel
            </button>
            <AlertDialogAction
              onClick={deleteUser}
              disabled={deleteLoading}
              className="bg-brand-teal-deep hover:bg-brand-teal-dark text-white"
            >
              {deleteLoading ? 'Deleting…' : 'Delete Lead'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Custom Date Modal ── */}

      <CustomDateModal
        open={showCustomDate}
        onClose={() => {
          setShowCustomDate(false);
        }}
        dateRange={dateRange}
        onApply={handleCustomDateApply}
      />

    </div>
  );
}