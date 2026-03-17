"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, Eye, CheckCircle, XCircle, MoreVertical, FileText, Pencil, Globe, X, Calendar, ChevronDown } from 'lucide-react';
import Loading from '../loading';
import Link from 'next/link';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

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
  status: 'pending' | 'approved' | 'rejected' | 'invite';
  created_at: string | null;
  kyc_document_s3_url: string | null;
  profile_photo_s3_url: string | null;
  domains: AgentDomain[];
}

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'last7' | 'last30' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const statusColors = {
  pending: 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm',
  approved: 'bg-cyan-100 text-cyan-700 border-cyan-300 shadow-sm',
  rejected: 'bg-rose-100 text-rose-700 border-rose-300 shadow-sm',
  invite: 'bg-purple-100 text-purple-700 border-purple-300 shadow-sm',
};

const domainStatusColors = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  deactivate: 'bg-orange-100 text-orange-700 border-orange-300',
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainLoading, setDomainLoading] = useState(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/superadmin/agents');
      const data = await response.json();
      if (data.success) setAgents(data.agents);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeForFilter = (filterType: DateFilterType): DateRange => {
    const today = new Date();
    
    switch (filterType) {
      case 'today':
        return {
          from: startOfDay(today),
          to: endOfDay(today),
        };
      case 'week':
        return {
          from: startOfWeek(today),
          to: endOfWeek(today),
        };
      case 'month':
        return {
          from: startOfMonth(today),
          to: endOfMonth(today),
        };
      case 'last7': {
        const from = new Date(today);
        from.setDate(from.getDate() - 7);
        return {
          from: startOfDay(from),
          to: endOfDay(today),
        };
      }
      case 'last30': {
        const from = new Date(today);
        from.setDate(from.getDate() - 30);
        return {
          from: startOfDay(from),
          to: endOfDay(today),
        };
      }
      case 'custom':
        return dateRange;
      default:
        return { from: undefined, to: undefined };
    }
  };

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

  const handleCustomDateSelect = (fromDate: Date | undefined, toDate: Date | undefined) => {
    setDateRange({ from: fromDate, to: toDate });
  };

  const handleApplyCustomDate = () => {
    if (dateRange.from && dateRange.to) {
      setShowCustomDateModal(false);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setDateFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setShowCustomDateModal(false);
  };

  const clearDateFilter = () => {
    setDateFilter('all');
    setDateRange({ from: undefined, to: undefined });
  };

  const updateAgentStatus = async (agentId: string, status: 'approved' | 'rejected' | 'invite') => {
    try {
      const response = await fetch(`/api/superadmin/agents/${agentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        setAgents(agents.map(a =>
          a.id === agentId ? { ...a, status, is_verified: status === 'approved' } : a
        ));
        setShowDetailsModal(false);
        setSelectedAgent(null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const updateDomainStatus = async (domainId: string, newStatus: 'active' | 'deactivate') => {
    setDomainLoading(true);
    try {
      const response = await fetch(`/api/agent-domains/${domainId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success && selectedAgent) {
        const updatedDomains = selectedAgent.domains.map(d =>
          d.id === domainId ? { ...d, status: newStatus, is_active: newStatus === 'active' } : d
        );
        const updatedAgent = { ...selectedAgent, domains: updatedDomains };
        setSelectedAgent(updatedAgent);
        setAgents(agents.map(a => a.id === selectedAgent.id ? updatedAgent : a));
        setShowDomainModal(false);
      }
    } catch (error) {
      console.error('Failed to update domain status:', error);
    } finally {
      setDomainLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch =
      agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.agency_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    
    const currentDateRange = getDateRangeForFilter(dateFilter);
    const matchesDate = dateFilter === 'all' ? true : isDateInRange(agent.created_at, currentDateRange);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const formatDateSafe = (dateString: string | null): string | null => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return null;
    }
  };

  const formatTimeSafe = (dateString: string | null): string | null => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return null;
    }
  };

  const formatDateForDomain = (dateString: string | null) => {
    const formatted = formatDateSafe(dateString);
    return formatted || 'N/A';
  };

  const isAnyFilterActive = searchTerm !== '' || filterStatus !== 'all' || dateFilter !== 'all';

  // Get display text for date filter button
  const getDateFilterDisplay = () => {
    if (dateFilter === 'custom' && dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`;
    }
    
    switch (dateFilter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'last7':
        return 'Last 7 Days';
      case 'last30':
        return 'Last 30 Days';
      case 'custom':
        return 'Custom Range';
      default:
        return 'Date Range';
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and verify agent registrations</p>
        </div>
        <Link href="/agents/addAgent">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all">
            + Add Agent
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar - Compact Responsive */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col gap-4">
          {/* Top Row: Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            
            {/* Search Input - More Responsive Width */}
            <div className="relative w-full lg:flex-1 lg:max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search agents by name, email, or agency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition-all"
              />
            </div>

            {/* Filter Controls - Responsive Layout */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:flex-wrap lg:flex-nowrap lg:gap-2">
              
              {/* Status Filter */}
              <div className="w-full sm:w-48 lg:w-40 flex-shrink-0">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition-all">
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="invite">Invite</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter with Smart Display */}
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
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                {/* Hover Tooltip for Active Filter */}
                {dateFilter !== 'all' && (
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg">
                      <p className="font-medium">{getDateFilterDisplay()}</p>
                      <p className="text-gray-300 text-xs mt-1">Click to change</p>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit/Clear Date Button - Shows When Custom Date Selected */}
              {dateFilter === 'custom' && dateRange.from && dateRange.to && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomDateModal(true)}
                  className="h-10 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 rounded-lg transition-colors text-sm whitespace-nowrap w-full sm:w-auto lg:w-auto"
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Edit Range
                </Button>
              )}

              {/* Clear Button */}
              {isAnyFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-10 px-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm whitespace-nowrap w-full sm:w-auto lg:w-auto"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Results Counter - Bottom Right on Desktop, Full Width on Mobile */}
          <div className="flex items-center justify-between lg:justify-end">
            <span className="text-sm text-gray-600 lg:hidden">Results:</span>
            <span className="text-sm text-gray-600 font-medium">
              <span className="text-blue-600 font-bold">{filteredAgents.length}</span> agents
            </span>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50">
                <TableHead className="h-12 px-4 font-semibold text-gray-700 text-sm">Agent</TableHead>
                <TableHead className="h-12 px-4 font-semibold text-gray-700 text-sm">Contact</TableHead>
                <TableHead className="h-12 px-4 font-semibold text-gray-700 text-sm">Agency Name</TableHead>
                <TableHead className="h-12 px-4 font-semibold text-gray-700 text-sm">Registered (IST)</TableHead>
                <TableHead className="h-12 px-4 font-semibold text-gray-700 text-sm">Domain</TableHead>
                <TableHead className="h-12 px-4 font-semibold text-gray-700 text-sm">Status</TableHead>
                <TableHead className="h-12 px-4 font-semibold text-gray-700 text-sm text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-100"
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 ring-1 ring-gray-200">
                          {agent.profile_photo_s3_url ? (
                            <AvatarImage 
                              src={agent.profile_photo_s3_url} 
                              alt={agent.full_name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-xs font-bold">
                            {agent.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{agent.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">{agent.city}</p>
                        </div>
                      </div>
                    </TableCell>
                   
                    <TableCell className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{agent.email}</p>
                        <p className="text-xs text-gray-500 truncate">{agent.mobile_number}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{agent.agency_name}</p>
                      </div>
                    </TableCell>


                    <TableCell className="px-4 py-3">
                      {formatDateSafe(agent.created_at) ? (
                        <div className="space-y-0.5">
                          <p className="text-sm text-gray-900 font-medium">{formatDateSafe(agent.created_at)}</p>
                          {formatTimeSafe(agent.created_at) && (
                            <p className="text-xs text-gray-500">{formatTimeSafe(agent.created_at)}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">—</p>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-3">
                    {agent.domains && agent.domains.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {agent.domains.slice(0, 1).map((domain) => (
                          <div key={domain.id} className="grid gap-1">
                            <span className="text-sm text-gray-800 font-medium truncate leading-tight">
                              {domain.full_domain}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-medium w-fit px-2 py-0.5 ${domainStatusColors[domain.status as keyof typeof domainStatusColors]}`}
                            >
                              {domain.status === 'active' ? '● Active' : '● Deactivated'}
                            </Badge>
                          </div>
                        ))}
                        {agent.domains.length > 1 && (
                          <span className="text-xs text-blue-500 font-medium">
                            +{agent.domains.length - 1} more domain{agent.domains.length - 1 > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">No domains</span>
                    )}
                  </TableCell>
                   
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className={`${statusColors[agent.status]} font-medium`}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg">
                          <DropdownMenuItem
                            onClick={() => { setSelectedAgent(agent); setShowDetailsModal(true); }}
                            className="cursor-pointer text-sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          {/* {agent.domains && agent.domains.length > 0 && (
                            <DropdownMenuItem
                              onClick={() => { setSelectedAgent(agent); setShowDomainModal(true); }}
                              className="cursor-pointer text-sm"
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Manage Domains
                            </DropdownMenuItem>
                          )} */}

                          <DropdownMenuItem asChild>
                            <Link
                              href={`/agents/${agent.id}/edit`}
                              className="flex items-center cursor-pointer text-sm"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Agent
                            </Link>
                          </DropdownMenuItem>

                          {agent.status === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => updateAgentStatus(agent.id, 'invite')}
                                className="cursor-pointer text-purple-600 text-sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Send Invite
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateAgentStatus(agent.id, 'approved')}
                                className="cursor-pointer text-green-600 text-sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateAgentStatus(agent.id, 'rejected')}
                                className="cursor-pointer text-red-600 text-sm"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}

                          {agent.status === 'invite' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => updateAgentStatus(agent.id, 'approved')}
                                className="cursor-pointer text-green-600 text-sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateAgentStatus(agent.id, 'rejected')}
                                className="cursor-pointer text-red-600 text-sm"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-12 text-center">
                    <div className="space-y-2">
                      <p className="text-base font-medium text-gray-900">No agents found</p>
                      <p className="text-sm text-gray-500">Try adjusting your filters or search term</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Custom Date Range Modal - Professional Design */}
      <Dialog open={showCustomDateModal} onOpenChange={setShowCustomDateModal}>
        <DialogContent className="bg-white border border-gray-200 sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              <Calendar className="w-5 h-5 inline mr-2 text-blue-600" />
              Select Date Range
            </DialogTitle>
          </DialogHeader>

          <Separator className="bg-gray-200" />

          <div className="space-y-5 py-4">
            {/* From Date */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">From Date</label>
              <Input
                type="date"
                value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  handleCustomDateSelect(date, dateRange.to);
                }}
                className="w-full border border-gray-300 rounded-lg h-10 px-3 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition-all"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">To Date</label>
              <Input
                type="date"
                value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  handleCustomDateSelect(dateRange.from, date);
                }}
                className="w-full border border-gray-300 rounded-lg h-10 px-3 focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition-all"
              />
            </div>

            {/* Preview when both dates selected */}
            {dateRange.from && dateRange.to && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Selected Range</span>
                  <span className="text-xs font-semibold text-blue-600 bg-white px-2 py-1 rounded">
                    {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {format(dateRange.from, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-600">to</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(dateRange.to, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            )}

            {/* Info text */}
            {!dateRange.from || !dateRange.to ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">Tip:</span> Select both from and to dates to filter agents
                </p>
              </div>
            ) : null}
          </div>

          <Separator className="bg-gray-200" />

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDateRange({ from: undefined, to: undefined });
                setDateFilter('all');
                setShowCustomDateModal(false);
              }}
              className="flex-1 rounded-lg h-10"
            >
              Reset
            </Button>
            <Button
              onClick={handleApplyCustomDate}
              disabled={!dateRange.from || !dateRange.to}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-white border border-gray-200 sm:max-w-3xl rounded-lg">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold text-gray-900">{selectedAgent?.full_name}</DialogTitle>
                <p className="text-gray-600 text-sm mt-1">{selectedAgent?.agency_name}</p>
              </div>
              {selectedAgent && (
                <Badge variant="outline" className={`${statusColors[selectedAgent.status]} font-medium flex-shrink-0`}>
                  {selectedAgent.status}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Separator className="bg-gray-200" />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Email Address</p>
                <p className="text-sm text-gray-900">{selectedAgent?.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Mobile Number</p>
                <p className="text-sm text-gray-900">{selectedAgent?.mobile_number}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">City</p>
                <p className="text-sm text-gray-900">{selectedAgent?.city}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Domains</p>
                <p className="text-sm text-gray-900">
                  {selectedAgent?.domains?.length || 0} domain(s)
                </p>
              </div>
            </div>

            {selectedAgent?.kyc_document_s3_url && (
              <>
                <Separator className="bg-gray-200" />
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">KYC Document</p>
                  <Button
                    variant="outline"
                    className="w-full justify-between rounded-lg h-10"
                    onClick={() => selectedAgent.kyc_document_s3_url && window.open(selectedAgent.kyc_document_s3_url, '_blank')}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      View KYC Document
                    </span>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {selectedAgent?.status === 'pending' && (
            <>
              <Separator className="bg-gray-200" />
              <div className="flex gap-2">
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'invite')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg h-10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'approved')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg h-10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'rejected')}
                  variant="outline"
                  className="flex-1 text-red-600 hover:bg-red-50 rounded-lg h-10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </>
          )}

          {selectedAgent?.status === 'invite' && (
            <>
              <Separator className="bg-gray-200" />
              <div className="flex gap-2">
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'approved')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg h-10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'rejected')}
                  variant="outline"
                  className="flex-1 text-red-600 hover:bg-red-50 rounded-lg h-10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </>
          )}

          <DialogFooter>
            <Link href={selectedAgent ? `/agents/${selectedAgent.id}/edit` : '#'} className="flex-1">
              <Button variant="outline" className="w-full rounded-lg h-10 gap-2">
                <Pencil className="w-4 h-4" />
                Edit Agent
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => { setShowDetailsModal(false); setSelectedAgent(null); }}
              className="flex-1 rounded-lg h-10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Management Modal */}
      <Dialog open={showDomainModal} onOpenChange={setShowDomainModal}>
        <DialogContent className="bg-white border border-gray-200 sm:max-w-2xl rounded-lg">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>Domain Management</span>
                </DialogTitle>
                <p className="text-gray-600 text-sm mt-1">{selectedAgent?.full_name}</p>
              </div>
            </div>
          </DialogHeader>

          <Separator className="bg-gray-200" />

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {selectedAgent?.domains && selectedAgent.domains.length > 0 ? (
              selectedAgent.domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{domain.full_domain}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline"
                          className={`text-xs font-medium ${domainStatusColors[domain.status as keyof typeof domainStatusColors]}`}
                        >
                          {domain.status}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          {domain.status === 'active' 
                            ? `Activated on ${formatDateForDomain(domain.activated_at)}` 
                            : `Released on ${formatDateForDomain(domain.released_at)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    {domain.status === 'active' ? (
                      <Button
                        onClick={() => updateDomainStatus(domain.id, 'deactivate')}
                        variant="outline"
                        size="sm"
                        disabled={domainLoading}
                        className="text-orange-600 hover:bg-orange-50 rounded-lg h-9 text-xs whitespace-nowrap"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        onClick={() => updateDomainStatus(domain.id, 'active')}
                        variant="outline"
                        size="sm"
                        disabled={domainLoading}
                        className="text-green-600 hover:bg-green-50 rounded-lg h-9 text-xs whitespace-nowrap"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm font-medium">No domains assigned</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDomainModal(false)}
              className="w-full rounded-lg h-10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}