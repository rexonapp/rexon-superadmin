"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Calendar, X } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
    Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
    PaginationLink, PaginationNext, PaginationPrevious,
  } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
interface Activity {
    id: string;
    full_name: string;
    email: string;
    updated_at: string;
    status?: string; // optional (depends on API)
}

type DateRange = { from?: Date; to?: Date };
type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom';

export default function AgentActivityPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");

    const [dateRange, setDateRange] = useState<DateRange>({});
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;


    const isAnyFilterActive =
    searchTerm !== "" ||
    statusFilter !== "all" ||
    timeFilter !== "all" ||
    (dateRange.from && dateRange.to);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const res = await fetch("/api/agents/recent-activity");
            const data = await res.json();

            if (data.success) {
                setActivities(data.data.totalActivities);
            }
        } catch (error) {
            console.error("Failed to fetch activities", error);
        } finally {
            setLoading(false);
        }
    };

    // ----------- FILTER LOGIC -----------
    const filteredActivities = activities.filter((a) => {
        const q = searchTerm.toLowerCase();

        const matchesSearch =
            a.full_name?.toLowerCase().includes(q) ||
            a.email?.toLowerCase().includes(q);

        const matchesStatus =
            statusFilter === "all" || a.status === statusFilter;

        const now = new Date();
        const activityDate = new Date(a.updated_at);

        let matchesTime = true;

        if (timeFilter === "today") {
            matchesTime = activityDate.toDateString() === now.toDateString();
        } else if (timeFilter === "week") {
            const start = new Date();
            start.setDate(now.getDate() - now.getDay());
            matchesTime = activityDate >= start;
        } else if (timeFilter === "month") {
            matchesTime =
                activityDate.getMonth() === now.getMonth() &&
                activityDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === "last7") {
            const d = new Date();
            d.setDate(now.getDate() - 7);
            matchesTime = activityDate >= d;
        } else if (timeFilter === "last30") {
            const d = new Date();
            d.setDate(now.getDate() - 30);
            matchesTime = activityDate >= d;
        } else if (timeFilter === "custom") {
            if (dateRange.from && dateRange.to) {
                matchesTime =
                    activityDate >= dateRange.from &&
                    activityDate <= dateRange.to;
            }
        }

        return matchesSearch && matchesStatus && matchesTime;
    });

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setTimeFilter("all");
        setDateRange({});
    };

    // const handleDateFilterChange = (value: string) => {
    //     const f = value as DateFilterType;
    //     setTimeFilter(f);
    //     if (f === 'custom') setShowCustomDateModal(true);
    //     else setDateRange({ from: undefined, to: undefined });
    //     setCurrentPage(1);
    // };

    const handleCustomDateApply = (from: Date | undefined, to: Date | undefined) => {
        setDateRange({ from, to });
    
        if (from && to) {
            setTimeFilter("custom");
        } else {
            setTimeFilter("all");
        }
    
        setCurrentPage(1);
    };

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
            setSearchTerm(''); setStatusFilter('all');
            setTimeFilter('all'); setDateRange({ from: undefined, to: undefined });
            setCurrentPage(1);
        };

        if (!open) return null;

        return (
            <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
                <DialogContent className="bg-white sm:max-w-sm p-0 gap-0 overflow-hidden border border-gray-200 shadow-xl">
                    <VisuallyHidden><DialogTitle>Custom Date Range</DialogTitle></VisuallyHidden>
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="text-[15px] font-semibold text-gray-900">Custom Date Range</h3>
                        <p className="text-[13px] text-gray-500 mt-0.5">Filter warehouses by created date</p>
                    </div>
                    <div className="px-5 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
                            <input type="date" value={fromVal} max={toVal || undefined}
                                onChange={e => { setFromVal(e.target.value); setError(''); }}
                                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[14px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent bg-gray-50" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">End Date</label>
                            <input type="date" value={toVal} min={fromVal || undefined}
                                onChange={e => { setToVal(e.target.value); setError(''); }}
                                className="w-full h-10 rounded-lg border border-gray-200 px-3 text-[14px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent bg-gray-50" />
                        </div>
                        {fromVal && toVal && (
                            <div className="bg-brand-teal/8 border border-brand-teal/25 rounded-lg px-3 py-2.5 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-brand-teal-medium shrink-0" />
                                <p className="text-[13px] font-medium text-brand-teal-dark">
                                    {format(new Date(fromVal + "T00:00:00"), 'MMM d, yyyy')} → {format(new Date(toVal + "T23:59:59"), 'MMM d, yyyy')}
                                </p>
                            </div>
                        )}
                        {error && <p className="text-[12px] font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
                    </div>
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleClear} className="flex-1 h-9 text-[13px]">Clear</Button>
                        <Button size="sm" onClick={handleApply} className="flex-1 h-9 text-[13px]">Apply Filter</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }


    if (loading) return <p className="p-6">Loading...</p>;


        // SORTING
        const sorted = [...filteredActivities].sort(
            (a, b) =>
                new Date(b.updated_at).getTime() -
                new Date(a.updated_at).getTime()
        );

        const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        const handlePageChange = (page: number) => setCurrentPage(page);

    return (
        <div className="space-y-3">

            {/* 🔍 FILTER UI */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">

                {/* Search */}
                <div className="relative w-full sm:max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                        placeholder="Search by agent, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-9 text-sm bg-gray-50"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">

                    {/* Status */}
                    <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[140px] h-9 text-sm bg-gray-50">
                            <Filter className="w-3 h-3 mr-1" />
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Invite">Invite</SelectItem>
                            <SelectItem value="Approved">Approved</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Time */}
                    <Select
                        value={timeFilter}
                        onValueChange={(val) => {
                            if (val === "custom") {
                                setShowCustomDateModal(true);
                            } else {
                                setTimeFilter(val);
                            }
                        }}
                    >
                        <SelectTrigger className="w-[150px] h-9 text-sm bg-gray-50">
                            <Calendar className="w-3 h-3 mr-1" />
                            <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="last7">Last 7 Days</SelectItem>
                            <SelectItem value="last30">Last 30 Days</SelectItem>
                            <SelectItem value="custom">Custom Range...</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Clear */}
                    {isAnyFilterActive && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                            <X className="w-3 h-3 mr-1" /> Clear
                        </Button>
                    )}
                </div>
            </div>

            {/* 📅 CUSTOM DATE */}
            <CustomDateModal
                open={showCustomDateModal}
                onClose={() => {
                    setShowCustomDateModal(false);
                }}
                dateRange={dateRange}
                onApply={handleCustomDateApply}
            />

            {/* 📊 TABLE */}
            <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-500">
                        <tr>
                            <th className="text-left p-3">Agent</th>
                            <th className="text-left p-3">Email</th>
                            <th className="text-left p-3">Last Login</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginated.length > 0 ? (
                            paginated.map((activity) => (
                                <tr key={activity.id} className="border-t">
                                    <td className="p-3">{activity.full_name}</td>
                                    <td className="p-3">{activity.email}</td>
                                    <td className="p-3">
                                        {new Date(activity.updated_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-center p-6 text-gray-400">
                                    No data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
              {/* PAGINATION UI */}
              {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() =>
                                    currentPage > 1 && handlePageChange(currentPage - 1)}
                                    className={`${
                                        currentPage === 1
                                          ? "pointer-events-none opacity-40 cursor-not-allowed"
                                          : "cursor-pointer"
                                      }`}
                            />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                                <PaginationLink
                                    isActive={currentPage === page}
                                    onClick={() => handlePageChange(page)}
                                    className={cn('h-8 w-8 text-sm cursor-pointer select-none rounded-lg font-medium',
                                    currentPage === page ? 'bg-brand-teal-deep text-white border-brand-teal-deep hover:bg-brand-teal-dark hover:text-white' : 'hover:bg-gray-100')}
                                >
                                    {page}
                                </PaginationLink>
                            </PaginationItem>
                        ))} 

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        currentPage < totalPages &&
                                        handlePageChange(currentPage + 1)
                                    }
                                    className={`${currentPage === totalPages
                                            ? "pointer-events-none opacity-40"
                                            : "cursor-pointer"
                                        }`}
                                />
                            </PaginationItem>

                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}