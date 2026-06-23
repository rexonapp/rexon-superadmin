"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
} from 'lucide-react';
import Loading from '../loading';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useNotifications } from '@/lib/context/NotificationContext';
import { useAgentFilter } from '@/lib/context/AgentFilterContext';

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

interface Agent {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  city: string;
  agency_name: string;
  is_verified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'invite' | 'deactivated';
  created_at: string | null;
  kyc_document_s3_url: string | null;
  profile_photo_s3_url: string | null;
  domains: AgentDomain[];
}

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom';
interface DateRange { from: Date | undefined; to: Date | undefined; }
type SortKey = 'full_name' | 'agency_name' | 'city' | 'status' | 'created_at' | 'domains';
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
        col === sortKey ? 'text-brand-teal-medium bg-brand-teal/10' : 'text-gray-500 bg-gray-50',
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
  const handleClear = () => { setFromVal(''); setToVal(''); setError(''); onApply(undefined, undefined); onClose(); };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-white sm:max-w-sm p-0 gap-0 overflow-hidden border border-gray-200 shadow-xl">
        <VisuallyHidden><DialogTitle>Custom Date Range</DialogTitle></VisuallyHidden>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Custom Date Range</h3>
          <p className="text-xs text-gray-500 mt-0.5">Filter agents by registration date</p>
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

function DetailRow({ icon: Icon, label, value, accent = 'blue' }: {
  icon: React.ElementType; label: string; value?: string | null; accent?: 'blue' | 'amber';
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className={cn('w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0',
        accent === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-brand-teal/8 border-brand-teal/15 text-brand-teal-medium')}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-gray-400  tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'deactivated', 'invite'];

function AgentsPageInner() {
  const searchParams = useSearchParams();
  // Status filter lives in a shared context (set by the stat pills in the layout
  // and by the dropdown below) so a pill click filters the table live.
  const { statusFilter: filterStatus, setStatusFilter: setFilterStatus } = useAgentFilter();
  const [agents,           setAgents]           = useState<Agent[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [dateFilter,       setDateFilter]       = useState<DateFilterType>('all');
  const [dateRange,        setDateRange]        = useState<DateRange>({ from: undefined, to: undefined });
  const [showCustomDate,   setShowCustomDate]   = useState(false);
  const [selectedAgent,    setSelectedAgent]    = useState<Agent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDomainModal,  setShowDomainModal]  = useState(false);
  const [domainLoading,    setDomainLoading]    = useState(false);
  const [currentPage,      setCurrentPage]      = useState(1);
  const [sortKey,          setSortKey]          = useState<SortKey>('created_at');
  const [sortDir,          setSortDir]          = useState<SortDir>('desc');
  const [activeTab,        setActiveTab]        = useState<'overview' | 'contact' | 'domains'>('overview');

  const anyFilter = searchTerm !== '' || filterStatus !== 'all' || dateFilter !== 'all';

  const { refetchNotifications } = useNotifications();

  // On first load / direct navigation, seed the shared filter from the URL
  // (?status=) so a deep link like /agents?status=pending still works.
  useEffect(() => {
    const s = searchParams.get('status') ?? 'all';
    setFilterStatus(VALID_STATUSES.includes(s) ? s : 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to the first page whenever the status filter changes.
  useEffect(() => { setCurrentPage(1); }, [filterStatus]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/superadmin/agents');
        const d   = await res.json();
        if (d.success) setAgents(d.agents);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const updateAgentStatus = async (agentId: string, status: 'approved' | 'rejected' | 'invite' | 'deactivated' | 'pending') => {
    try {
      const res = await fetch(`/api/superadmin/agents/${agentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const d = await res.json();
      if (d.success) {
        setAgents(prev => prev.map(a =>
          a.id === agentId
            ? { ...a, status, is_verified: status === 'approved' }
            : a
        ));
        if (selectedAgent?.id === agentId) {
          setSelectedAgent(prev => prev ? { ...prev, status, is_verified: status === 'approved' } : null);
        }
        setShowDetailsModal(false);
        setSelectedAgent(null);
        refetchNotifications();
      }
    } catch (e) { console.error(e); }
  };

  const updateDomainStatus = async (domainId: string, newStatus: 'active' | 'deactivate') => {
    setDomainLoading(true);
    try {
      const res = await fetch(`/api/agent-domains/${domainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await res.json();
      if (d.success && selectedAgent) {
        const updatedDomains = selectedAgent.domains.map(dom =>
          dom.id === domainId ? { ...dom, status: newStatus, is_active: newStatus === 'active' } : dom
        );
        const updated = { ...selectedAgent, domains: updatedDomains };
        setSelectedAgent(updated);
        setAgents(prev => prev.map(a => a.id === selectedAgent.id ? updated : a));
        setShowDomainModal(false);
      }
    } catch (e) { console.error(e); }
    finally { setDomainLoading(false); }
  };

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

  const clearAllFilters = () => {
    setSearchTerm(''); setFilterStatus('all');
    setDateFilter('all'); setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

  const filtered = agents.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchSearch = a.full_name.toLowerCase().includes(q)
      || a.email.toLowerCase().includes(q)
      || a.agency_name.toLowerCase().includes(q)
      || a.city?.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchDate   = dateFilter === 'all' || isDateInRange(a.created_at, getRange(dateFilter));
    return matchSearch && matchStatus && matchDate;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av: string | number = '', bv: string | number = '';
    switch (sortKey) {
      case 'full_name':    av = a.full_name    ?? ''; bv = b.full_name    ?? ''; break;
      case 'agency_name':  av = a.agency_name  ?? ''; bv = b.agency_name  ?? ''; break;
      case 'city':         av = a.city         ?? ''; bv = b.city         ?? ''; break;
      case 'status':       av = a.status       ?? ''; bv = b.status       ?? ''; break;
      case 'created_at':   av = new Date(a.created_at ?? 0).getTime(); bv = new Date(b.created_at ?? 0).getTime(); break;
      case 'domains':      av = a.domains?.length ?? 0; bv = b.domains?.length ?? 0; break;
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
            placeholder="Search name, email, agency…"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        {/* Filters + Add Agent — same row on mobile */}
        <div className="flex items-center gap-2 sm:contents">
          <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setCurrentPage(1); }}>
            <SelectTrigger className="flex-1 sm:flex-none sm:w-36 h-9 text-sm bg-gray-50 border-gray-200 shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>

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

          {/* Add Agent — mobile only (right-pinned) */}
          <Link href="/agents/addAgent" className="ml-auto sm:hidden shrink-0">
            <Button size="sm" className="h-9 bg-brand-teal-deep hover:bg-brand-teal-dark text-white text-sm font-semibold px-3 whitespace-nowrap">
              + Add
            </Button>
          </Link>
        </div>

        {/* Add Agent — desktop only */}
        <div className="hidden sm:block sm:ml-auto">
          <Link href="/agents/addAgent">
            <Button size="sm" className="h-9 bg-brand-teal-deep hover:bg-brand-teal-dark text-white text-sm font-semibold px-4 shrink-0">
              + Add Agent
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">

        <div className="flex-1 min-h-0 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
          <Table className="w-full">
            <TableHeader>
              <TableRow className="hover:bg-gray-50 border-b border-gray-200">
                <SortableHead col="full_name"   label="Agent"      sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[180px] sticky top-0 z-10" />
                <SortableHead col="city"        label="City"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell min-w-[110px] sticky top-0 z-10" />
                <SortableHead col="agency_name" label="Agency"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell min-w-[130px] sticky top-0 z-10" />
                <SortableHead col="created_at"  label="Registered" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell min-w-[130px] sticky top-0 z-10" />
                <SortableHead col="domains"     label="Domain"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell min-w-[150px] sticky top-0 z-10" />
                <SortableHead col="status"      label="Status"     sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[90px] sticky top-0 z-10" />
                <TableHead className="text-l font-bold tracking-wide text-gray-500 h-11 px-4 text-right bg-gray-50 w-14 sticky top-0 z-10">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length > 0 ? paginated.map((agent, i) => (
                <TableRow key={agent.id}
                  className={cn(
                    'border-b border-gray-100 hover:bg-brand-teal/15 transition-colors group cursor-pointer',
                    i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white',
                    // Visually dim deactivated rows
                    agent.status === 'deactivated' && 'opacity-60',
                  )}
                  onClick={() => { setSelectedAgent(agent); setShowDetailsModal(true); setActiveTab('overview'); }}>

                  {/* Agent */}
                  <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-9 h-9 ring-1 ring-gray-200 shrink-0">
                        {agent.profile_photo_s3_url && <AvatarImage src={agent.profile_photo_s3_url} alt={agent.full_name} />}
                        <AvatarFallback className={cn(
                          'text-white text-xs font-bold',
                          agent.status === 'deactivated'
                            ? 'bg-gray-400'
                            : 'bg-gradient-to-br from-brand-teal-medium to-brand-teal-dark'
                        )}>
                          {agent.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-teal-medium transition-colors truncate max-w-[160px]">
                          {agent.full_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[160px]">{agent.email}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{agent.mobile_number}</p>
                        {/* City + Agency — visible only on mobile */}
                        {agent.city && <p className="sm:hidden text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate max-w-[160px]"><MapPin className="w-3 h-3 shrink-0" />{agent.city}</p>}
                        {agent.agency_name && <p className="sm:hidden text-xs text-gray-400 truncate max-w-[160px]">{agent.agency_name}</p>}
                      </div>
                    </div>
                  </TableCell>

                  {/* City */}
                  <TableCell className="hidden sm:table-cell px-4 py-3.5">
                    <p className="text-sm text-gray-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />{agent.city || '—'}
                    </p>
                  </TableCell>

                  {/* Agency */}
                  <TableCell className="hidden sm:table-cell px-4 py-3.5">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">{agent.agency_name}</p>
                  </TableCell>

                  {/* Registered */}
                  <TableCell className="hidden md:table-cell px-4 py-3.5">
                    <p className="text-sm text-gray-800">{fmtDate(agent.created_at)}</p>
                    {fmtTime(agent.created_at) && <p className="text-xs text-gray-400 mt-0.5">{fmtTime(agent.created_at)}</p>}
                  </TableCell>

                  {/* Domain */}
                  <TableCell className="hidden md:table-cell px-4 py-3.5">
                    {agent.domains?.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-800 font-medium truncate max-w-[250px]">
                          {agent.domains[0].full_domain}
                        </p>
                        {agent.domains.length > 1 && (
                          <p className="text-xs text-brand-teal-medium font-medium">+{agent.domains.length - 1} more</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No domain</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-4 py-3.5"><StatusBadge status={agent.status} /></TableCell>

                  {/* Actions */}
                  <TableCell className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"
                          className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity hover:bg-gray-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">

                        <DropdownMenuItem
                          onClick={() => { setSelectedAgent(agent); setShowDetailsModal(true); setActiveTab('overview'); }}
                          className="cursor-pointer text-sm py-2">
                          <Eye className="w-4 h-4 mr-2 text-brand-teal-medium" /> View Details
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href={`/agents/${agent.id}/edit`} className="flex items-center cursor-pointer text-sm py-2">
                            <Pencil className="w-4 h-4 mr-2 text-gray-500" /> Edit Agent
                          </Link>
                        </DropdownMenuItem>

                        {/* ── Pending actions ── */}
                        {agent.status === 'pending' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateAgentStatus(agent.id, 'approved')}
                              className="cursor-pointer text-sm py-2 text-emerald-600 focus:bg-emerald-50">
                              <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateAgentStatus(agent.id, 'rejected')}
                              className="cursor-pointer text-sm py-2 text-rose-600 focus:bg-rose-50">
                              <XCircle className="w-4 h-4 mr-2" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateAgentStatus(agent.id, 'deactivated')}
                              className="cursor-pointer text-sm py-2 text-gray-500 focus:bg-gray-50">
                              <Ban className="w-4 h-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* ── Invite actions ── */}
                        {agent.status === 'invite' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateAgentStatus(agent.id, 'approved')}
                              className="cursor-pointer text-sm py-2 text-emerald-600 focus:bg-emerald-50">
                              <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateAgentStatus(agent.id, 'rejected')}
                              className="cursor-pointer text-sm py-2 text-rose-600 focus:bg-rose-50">
                              <XCircle className="w-4 h-4 mr-2" /> Reject
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateAgentStatus(agent.id, 'deactivated')}
                              className="cursor-pointer text-sm py-2 text-red-500 focus:bg-gray-50">
                              <Ban className="w-4 h-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* ── Approved actions ── */}
                        {agent.status === 'approved' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateAgentStatus(agent.id, 'deactivated')}
                              className="cursor-pointer text-sm py-2 text-red-500 focus:bg-gray-50">
                              <Ban className="w-4 h-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* ── Rejected actions ── */}
                        {agent.status === 'rejected' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateAgentStatus(agent.id, 'deactivated')}
                              className="cursor-pointer text-sm py-2 text-red-500 focus:bg-gray-50">
                              <Ban className="w-4 h-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* ── Deactivated actions — reactivate back to pending ── */}
                        {agent.status === 'deactivated' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateAgentStatus(agent.id, 'pending')}
                              className="cursor-pointer text-sm py-2 text-brand-teal-medium focus:bg-brand-teal/8">
                              <RotateCcw className="w-4 h-4 mr-2" /> Reactivate
                            </DropdownMenuItem>
                          </>
                        )}

                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Users className="w-7 h-7 opacity-40" />
                      </div>
                      <p className="font-semibold text-base text-gray-500">No agents found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      {anyFilter && (
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

      {/* ── Custom Date Modal ── */}
      <CustomDateModal
        open={showCustomDate}
        onClose={() => { setShowCustomDate(false); if (!dateRange.from || !dateRange.to) setDateFilter('all'); }}
        dateRange={dateRange}
        onApply={(from, to) => { setDateRange({ from, to }); if (!from && !to) setDateFilter('all'); setCurrentPage(1); }}
      />

      {/* ── Details Modal ── */}
      <Dialog open={showDetailsModal} onOpenChange={open => { setShowDetailsModal(open); if (!open) setTimeout(() => setSelectedAgent(null), 300); }}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl w-full sm:max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl">
          <VisuallyHidden><DialogTitle>{selectedAgent?.full_name ?? 'Agent Details'}</DialogTitle></VisuallyHidden>

          {/* Modal header */}
          <div className="bg-brand-teal px-5 pt-5 pb-0 flex-shrink-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-12 h-12 ring-2 ring-white/30 shrink-0">
                  {selectedAgent?.profile_photo_s3_url && <AvatarImage src={selectedAgent.profile_photo_s3_url} alt={selectedAgent.full_name} />}
                  <AvatarFallback className="bg-white/20 text-white font-bold text-base">
                    {selectedAgent?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white leading-snug truncate">{selectedAgent?.full_name}</h2>
                  <p className="text-white/85 text-sm mt-0.5 truncate">{selectedAgent?.agency_name}</p>
                </div>
              </div>
              <div className="flex mt-4 flex-col items-end gap-1.5 flex-shrink-0">
                {selectedAgent && <StatusBadge status={selectedAgent.status} />}
              </div>
            </div>

            {/* Quick stats row */}
            {/* <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'City',    value: selectedAgent?.city ?? '—' },
                { label: 'Domains', value: `${selectedAgent?.domains?.length ?? 0} domain(s)` },
                { label: 'Joined',  value: fmtDate(selectedAgent?.created_at ?? null) },
              ].map(item => (
                <div key={item.label} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2.5">
                  <p className="text-white/85 text-xs font-semibold uppercase tracking-wide mb-0.5">{item.label}</p>
                  <p className="text-white font-bold text-sm truncate">{item.value}</p>
                </div>
              ))}
            </div> */}

            {/* Tabs */}
            <div className="flex border-b border-white/30">
              {(['overview', 'contact', 'domains'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn('px-5 py-2.5 text-sm font-semibold capitalize transition-all relative',
                    activeTab === tab ? 'text-white' : 'text-white/70 hover:text-white')}>
                  {tab}
                  {activeTab === tab && <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-t bg-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Modal body */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-white px-5 py-5"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>

            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-brand-teal-medium uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Agent Details
                </p>
                <DetailRow icon={Users}     label="Full Name"  value={selectedAgent?.full_name} />
                <DetailRow icon={Building2} label="Agency"     value={selectedAgent?.agency_name} />
                <DetailRow icon={MapPin}    label="City"       value={selectedAgent?.city} />
                <DetailRow icon={Calendar}  label="Registered" value={fmtDate(selectedAgent?.created_at ?? null)} />
                <DetailRow icon={Clock}     label="Status"     value={selectedAgent?.status ? statusCfg[selectedAgent.status]?.label : '—'} />

                {selectedAgent?.kyc_document_s3_url && (
                  <div className="mt-5">
                    <p className="text-xs font-bold text-brand-teal-medium uppercase tracking-widest mb-2">KYC Document</p>
                    <Button variant="outline" className="w-full justify-between rounded-xl h-10 text-sm"
                      onClick={() => selectedAgent.kyc_document_s3_url && window.open(selectedAgent.kyc_document_s3_url, '_blank')}>
                      <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> View KYC Document</span>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Contact tab */}
            {activeTab === 'contact' && (
              <div className="max-w-md">
                <p className="text-xs font-bold text-brand-teal-medium uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact Information
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-teal flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {selectedAgent?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{selectedAgent?.full_name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{selectedAgent?.agency_name}</p>
                    </div>
                  </div>
                </div>
                <DetailRow icon={Mail}   label="Email Address" value={selectedAgent?.email} />
                <DetailRow icon={Phone}  label="Mobile Number" value={selectedAgent?.mobile_number} />
                <DetailRow icon={MapPin} label="City"          value={selectedAgent?.city} />
              </div>
            )}

            {/* Domains tab */}
            {activeTab === 'domains' && (
              <div>
                <p className="text-xs font-bold text-brand-teal-medium uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Assigned Domains
                  {selectedAgent?.domains?.length ? (
                    <span className="ml-auto text-gray-400 font-normal normal-case tracking-normal text-xs">
                      {selectedAgent.domains.length} domain{selectedAgent.domains.length !== 1 ? 's' : ''}
                    </span>
                  ) : null}
                </p>
                {selectedAgent?.domains && selectedAgent.domains.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAgent.domains.map(dom => (
                      <div key={dom.id}
                        className="flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Globe className="w-4 h-4 text-brand-teal-medium shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{dom.full_domain}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border',
                                domainStatusCfg[dom.status] ?? domainStatusCfg.deactivate)}>
                                {dom.status}
                              </span>
                              {dom.status === 'active' && dom.activated_at && (
                                <p className="text-xs text-gray-400">Activated {fmtDate(dom.activated_at)}</p>
                              )}
                              {dom.status !== 'active' && dom.released_at && (
                                <p className="text-xs text-gray-400">Released {fmtDate(dom.released_at)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No domains assigned</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50 px-5 py-4 flex items-center justify-between gap-3 flex-wrap">

            {/* Action buttons based on current status */}
            <div className="flex gap-2.5 flex-1 flex-wrap">

              {/* Pending / Invite — show Approve + Reject + Deactivate */}
              {(selectedAgent?.status === 'pending' || selectedAgent?.status === 'invite') && (
                <>
                  <Button onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'approved')} size="sm"
                    className="flex-1 min-w-[100px] h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                  </Button>
                  <Button onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'rejected')} size="sm" variant="outline"
                    className="flex-1 min-w-[90px] h-9 border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-sm">
                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                  </Button>
                  <Button onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'deactivated')} size="sm" variant="outline"
                    className="flex-1 min-w-[110px] h-9 border-red-500 text-gray-500 hover:bg-gray-100 font-bold text-sm">
                    <Ban className="w-3.5 h-3.5 mr-1.5" /> Deactivate
                  </Button>
                </>
              )}

              {/* Approved — show Deactivate */}
              {selectedAgent?.status === 'approved' && (
                <>
                  <StatusBadge status={selectedAgent.status} />
                  <Button onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'deactivated')} size="sm" variant="outline"
                    className="h-9 px-4 border-gray-300 text-red-500 hover:bg-gray-100 font-bold text-sm">
                    <Ban className="w-3.5 h-3.5 mr-1.5" /> Deactivate
                  </Button>
                </>
              )}

              {/* Rejected — show Deactivate */}
              {selectedAgent?.status === 'rejected' && (
                <>
                  <StatusBadge status={selectedAgent.status} />
                  <Button onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'deactivated')} size="sm" variant="outline"
                    className="h-9 px-4 border-gray-300 text-red-500 hover:bg-gray-100 font-bold text-sm">
                    <Ban className="w-3.5 h-3.5 mr-1.5" /> Deactivate
                  </Button>
                </>
              )}

              {/* Deactivated — show Reactivate (back to pending) */}
              {selectedAgent?.status === 'deactivated' && (
                <>
                  <StatusBadge status={selectedAgent.status} />
                  <Button onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'pending')} size="sm"
                    className="h-9 px-4 bg-brand-teal-deep hover:bg-brand-teal-dark text-white font-bold text-sm">
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reactivate
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link href={selectedAgent ? `/agents/${selectedAgent.id}/edit` : '#'}>
                <Button variant="outline" size="sm" className="h-9 px-4 text-sm font-medium">
                  <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
              </Link>
              <Button variant="ghost" size="sm"
                onClick={() => { setShowDetailsModal(false); setTimeout(() => setSelectedAgent(null), 300); }}
                className="h-9 px-4 text-sm text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Domain Management Modal ── */}
      <Dialog open={showDomainModal} onOpenChange={setShowDomainModal}>
        <DialogContent className="bg-white border border-gray-200 shadow-2xl sm:max-w-xl max-h-[80dvh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl">
          <VisuallyHidden><DialogTitle>Domain Management</DialogTitle></VisuallyHidden>
          <div className="px-5 py-4 border-b border-gray-100 flex-none">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-teal-medium" /> Domain Management
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{selectedAgent?.full_name}</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
            {selectedAgent?.domains?.length ? selectedAgent.domains.map(dom => (
              <div key={dom.id} className="flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Globe className="w-4 h-4 text-brand-teal-medium shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{dom.full_domain}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', domainStatusCfg[dom.status] ?? domainStatusCfg.deactivate)}>
                        {dom.status}
                      </span>
                      {dom.status === 'active' && dom.activated_at && (
                        <p className="text-xs text-gray-400">Activated {fmtDate(dom.activated_at)}</p>
                      )}
                      {dom.status !== 'active' && dom.released_at && (
                        <p className="text-xs text-gray-400">Released {fmtDate(dom.released_at)}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ml-3 shrink-0">
                  {dom.status === 'active' ? (
                    <Button onClick={() => updateDomainStatus(dom.id, 'deactivate')} variant="outline" size="sm"
                      disabled={domainLoading} className="text-orange-600 hover:bg-orange-50 h-8 text-xs rounded-lg">Deactivate</Button>
                  ) : (
                    <Button onClick={() => updateDomainStatus(dom.id, 'active')} variant="outline" size="sm"
                      disabled={domainLoading} className="text-emerald-600 hover:bg-emerald-50 h-8 text-xs rounded-lg">Activate</Button>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-400">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No domains assigned</p>
              </div>
            )}
          </div>
          <div className="flex-none border-t border-gray-100 bg-gray-50 px-5 py-4">
            <Button variant="outline" onClick={() => setShowDomainModal(false)} className="w-full h-9 text-sm">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense>
      <AgentsPageInner />
    </Suspense>
  );
}