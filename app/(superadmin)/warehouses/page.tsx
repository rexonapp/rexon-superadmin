"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, MapPin, MoreVertical } from 'lucide-react';
import GlassCard from '@/components/superadmin/GlassCard';
import Loading from '../loading';

interface Warehouse {
  id: string;
  title: string;
  property_name: string;
  property_type: string;
  warehouse_size: string;
  space_available: string;
  space_unit: string;
  price_per_sqft: string;
  city: string;
  state: string;
  status: 'Pending' | 'Active' | 'rejected';
  is_verified: boolean;
  created_at: string;
  user_name: string;
  contact_person_name: string;
  contact_person_phone: string;
  images_count: number;
}

const statusColors = {
  Pending: 'bg-sky-100 text-sky-700 border-sky-300 shadow-sm',
  Active: 'bg-cyan-100 text-cyan-700 border-cyan-300 shadow-sm',
  rejected: 'bg-rose-100 text-rose-700 border-rose-300 shadow-sm',
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/superadmin/warehouses');
      const data = await response.json();

      if (data.success) {
        setWarehouses(data.warehouses);
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWarehouseStatus = async (warehouseId: string, status: 'Active' | 'rejected') => {
    try {
      const response = await fetch(`/api/superadmin/warehouses/${warehouseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (data.success) {
        setWarehouses(warehouses.map(w =>
          w.id === warehouseId ? { ...w, status, is_verified: status === 'Active' } : w
        ));
        setShowDetailsModal(false);
        setSelectedWarehouse(null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const filteredWarehouses = warehouses.filter(warehouse => {
    const matchesSearch =
      warehouse.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.property_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || warehouse.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Loading/>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <GlassCard className="p-6" gradient="amber">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text ">
              Warehouse Management
            </h2>
            <p className="text-sm text-gray-600 mt-1 font-medium">Review and approve warehouse listings</p>
          </div>
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 shadow-lg px-3 py-1.5">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-bold">{warehouses.filter(w => w.status === 'Pending').length} Pending</span>
          </Badge>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-amber-200 to-transparent my-6" />

        <div className="pt-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search warehouses by title or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/50 border focus:bg-white focus:border-amber-400 transition-all"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px] bg-white/50 border-white/60 focus:bg-white focus:border-amber-400">
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
          </div>
        </div>
      </GlassCard>

      {/* Warehouses Table */}
      <GlassCard className="p-0" >
        <div className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/40 ">
                  <TableHead className="font-bold text-gray-700">Property</TableHead>
                  <TableHead className="font-bold text-gray-700">Location</TableHead>
                  <TableHead className="font-bold text-gray-700">Type & Size</TableHead>
                  <TableHead className="font-bold text-gray-700">Price</TableHead>
                  <TableHead className="font-bold text-gray-700">Contact</TableHead>
                  <TableHead className="font-bold text-gray-700">Status</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.length > 0 ? (
                  filteredWarehouses.map((warehouse) => (
                    <TableRow
                      key={warehouse.id}
                      className="border-b border-white/30 hover:bg-blue-100/80 transition-colors duration-150 group"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{warehouse.title}</p>
                          <p className="text-xs text-gray-500">{warehouse.property_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{warehouse.city}, {warehouse.state}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900">{warehouse.property_type}</p>
                          <p className="text-xs text-gray-500">{warehouse.space_available} {warehouse.space_unit}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900">₹{warehouse.price_per_sqft}/sqft</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900">{warehouse.contact_person_name}</p>
                          <p className="text-xs text-gray-500">{warehouse.contact_person_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[warehouse.status]}>
                          {warehouse.status}
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedWarehouse(warehouse);
                                setShowDetailsModal(true);
                              }}
                              className="cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {warehouse.status === 'Pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => updateWarehouseStatus(warehouse.id, 'Active')}
                                  className="cursor-pointer text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => updateWarehouseStatus(warehouse.id, 'rejected')}
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
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                      No warehouses found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </GlassCard>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-3xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">{selectedWarehouse?.title}</DialogTitle>
                <p className="text-gray-600 text-sm mt-1">{selectedWarehouse?.property_name}</p>
              </div>
              {selectedWarehouse && (
                <Badge variant="outline" className={statusColors[selectedWarehouse.status]}>
                  {selectedWarehouse.status}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <Separator className="bg-gray-200" />

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Property Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Property Type</p>
                  <p className="text-sm text-gray-900">{selectedWarehouse?.property_type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Warehouse Size</p>
                  <p className="text-sm text-gray-900">{selectedWarehouse?.warehouse_size}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Space Available</p>
                  <p className="text-sm text-gray-900">{selectedWarehouse?.space_available} {selectedWarehouse?.space_unit}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Price per sqft</p>
                  <p className="text-sm font-medium text-gray-900">₹{selectedWarehouse?.price_per_sqft}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Location & Listing Info</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{selectedWarehouse?.city}, {selectedWarehouse?.state}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Listed On</p>
                  <p className="text-sm text-gray-900">{selectedWarehouse && formatDate(selectedWarehouse.created_at)}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Contact Person</p>
                  <p className="text-sm text-gray-900">{selectedWarehouse?.contact_person_name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Phone Number</p>
                  <p className="text-sm text-gray-900">{selectedWarehouse?.contact_person_phone}</p>
                </div>
              </div>
            </div>
          </div>

          {selectedWarehouse?.status === 'Pending' && (
            <>
              <Separator className="bg-gray-200" />
              <div className="flex gap-3">
                <Button
                  onClick={() => selectedWarehouse && updateWarehouseStatus(selectedWarehouse.id, 'Active')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Listing
                </Button>
                <Button
                  onClick={() => selectedWarehouse && updateWarehouseStatus(selectedWarehouse.id, 'rejected')}
                  variant="outline"
                  className="flex-1 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Listing
                </Button>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedWarehouse(null);
              }}
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