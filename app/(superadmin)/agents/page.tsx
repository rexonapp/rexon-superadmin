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
import { Search, Filter, Eye, CheckCircle, XCircle, MoreVertical, FileText, Pencil, Globe } from 'lucide-react';
import GlassCard from '@/components/superadmin/GlassCard';
import Loading from '../loading';
import Link from 'next/link';

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
  created_at: string;
  kyc_document_s3_url: string | null;
  profile_photo_s3_url: string | null;
  domains: AgentDomain[];
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
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<AgentDomain | null>(null);
  const [domainLoading, setDomainLoading] = useState(false);

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
        // Update the local agent data
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
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <GlassCard className="p-6" gradient="cyan">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Agent Management
            </h2>
            <p className="text-sm text-gray-600 mt-1 font-medium">Verify and manage agent registrations</p>
          </div>
          <Link href="/agents/addAgent">
            <Button className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 shadow-lg shadow-blue-500/30 transition-all">
              Add Agent
            </Button>
          </Link>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-cyan-200 to-transparent my-6" />

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search agents by name, email, or agency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/50 border-white/60 focus:bg-white focus:border-cyan-400 transition-all"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/50 border-white/60 focus:bg-white focus:border-cyan-400">
              <Filter className="w-4 h-4 mr-2 text-cyan-400" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="invite">Invite</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Agents Table */}
      <GlassCard className="p-0" gradient="emerald">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/40 bg-gradient-to-r from-cyan-50/50 via-emerald-50/50 to-teal-50/50">
                <TableHead className="font-bold text-gray-700">Agent</TableHead>
                <TableHead className="font-bold text-gray-700">Contact</TableHead>
                <TableHead className="font-bold text-gray-700">Domain</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                <TableHead className="font-bold text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    className="border-b border-white/30 hover:bg-blue-100/80 transition-colors duration-150 group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all">
                          {agent.profile_photo_s3_url ? (
                            <AvatarImage 
                              src={agent.profile_photo_s3_url} 
                              alt={agent.full_name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-sm font-bold">
                            {agent.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{agent.full_name}</p>
                          <p className="text-xs text-gray-500 font-medium">{agent.city}</p>
                        </div>
                      </div>
                    </TableCell>
                   
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-900">{agent.email}</p>
                        <p className="text-xs text-gray-500">{agent.mobile_number}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {agent.domains && agent.domains.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {agent.domains.slice(0, 2).map((domain) => (
                            <div key={domain.id} className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">{domain.full_domain}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${domainStatusColors[domain.status as keyof typeof domainStatusColors]}`}
                              >
                                {domain.status}
                              </Badge>
                            </div>
                          ))}
                          {agent.domains.length > 2 && (
                            <span className="text-xs text-gray-500">+{agent.domains.length - 2} more</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No domains</span>
                      )}
                    </TableCell>
                   
                    <TableCell>
                      <Badge variant="outline" className={statusColors[agent.status]}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* View Details */}
                          <DropdownMenuItem
                            onClick={() => { setSelectedAgent(agent); setShowDetailsModal(true); }}
                            className="cursor-pointer"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          {/* Manage Domains */}
                          {agent.domains && agent.domains.length > 0 && (
                            <DropdownMenuItem
                              onClick={() => { setSelectedAgent(agent); setShowDomainModal(true); }}
                              className="cursor-pointer"
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              Manage Domains
                            </DropdownMenuItem>
                          )}

                          {/* Edit Agent */}
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/agents/${agent.id}/edit`}
                              className="flex items-center cursor-pointer"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit Agent
                            </Link>
                          </DropdownMenuItem>

                          {/* Status Actions */}
                          {agent.status === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => updateAgentStatus(agent.id, 'invite')}
                                className="cursor-pointer text-purple-600 focus:text-purple-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Send Invite
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateAgentStatus(agent.id, 'approved')}
                                className="cursor-pointer text-green-600 focus:text-green-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateAgentStatus(agent.id, 'rejected')}
                                className="cursor-pointer text-red-600 focus:text-red-600"
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
                                className="cursor-pointer text-green-600 focus:text-green-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateAgentStatus(agent.id, 'rejected')}
                                className="cursor-pointer text-red-600 focus:text-red-600"
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
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    No agents found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </GlassCard>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedAgent?.full_name}</DialogTitle>
                <p className="text-gray-600 text-sm mt-1">{selectedAgent?.agency_name}</p>
              </div>
              {selectedAgent && (
                <Badge variant="outline" className={statusColors[selectedAgent.status]}>
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
                    className="w-full justify-between"
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
              <div className="flex gap-3">
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'invite')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'approved')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Agent
                </Button>
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'rejected')}
                  variant="outline"
                  className="flex-1 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Agent
                </Button>
              </div>
            </>
          )}

          {selectedAgent?.status === 'invite' && (
            <>
              <Separator className="bg-gray-200" />
              <div className="flex gap-3">
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'approved')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Agent
                </Button>
                <Button
                  onClick={() => selectedAgent && updateAgentStatus(selectedAgent.id, 'rejected')}
                  variant="outline"
                  className="flex-1 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Agent
                </Button>
              </div>
            </>
          )}

          <DialogFooter>
            <Link href={selectedAgent ? `/agents/${selectedAgent.id}/edit` : '#'} className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Pencil className="w-4 h-4" />
                Edit Agent
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => { setShowDetailsModal(false); setSelectedAgent(null); }}
              className="flex-1"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Management Modal */}
      <Dialog open={showDomainModal} onOpenChange={setShowDomainModal}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Domain Management
                </DialogTitle>
                <p className="text-gray-600 text-sm mt-1">{selectedAgent?.full_name}</p>
              </div>
            </div>
          </DialogHeader>

          <Separator className="bg-gray-200" />

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedAgent?.domains && selectedAgent.domains.length > 0 ? (
              selectedAgent.domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Globe className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">{domain.full_domain}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline"
                          className={domainStatusColors[domain.status as keyof typeof domainStatusColors]}
                        >
                          {domain.status}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          {domain.status === 'active' 
                            ? `Activated on ${formatDate(domain.activated_at || '')}` 
                            : `Released on ${formatDate(domain.released_at || '')}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {domain.status === 'active' ? (
                      <Button
                        onClick={() => updateDomainStatus(domain.id, 'deactivate')}
                        variant="outline"
                        size="sm"
                        disabled={domainLoading}
                        className="text-orange-600 hover:bg-orange-50"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        onClick={() => updateDomainStatus(domain.id, 'active')}
                        variant="outline"
                        size="sm"
                        disabled={domainLoading}
                        className="text-green-600 hover:bg-green-50"
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No domains assigned to this agent
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDomainModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}