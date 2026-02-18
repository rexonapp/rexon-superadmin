"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Filter, MoreVertical, Trash2, Shield,
  UserPlus, CheckCircle2, XCircle,
} from 'lucide-react';
import GlassCard from '@/components/superadmin/GlassCard';
import Loading from '../loading';

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: 'superadmin' | 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

// ── Config ────────────────────────────────────────────────────────────────────
const roleColors: Record<string, string> = {
  superadmin: 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm',
  admin:      'bg-cyan-100 text-cyan-700 border-cyan-200 shadow-sm',
  user:       'bg-gray-100 text-gray-700 border-gray-200 shadow-sm',
};

const roleOptions: { value: User['role']; label: string }[] = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin',      label: 'Admin'       },
  { value: 'user',       label: 'User'        },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function roleLabel(role: string) {
  return roleOptions.find(r => r.value === role)?.label ?? role;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]                     = useState<User[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [searchTerm, setSearchTerm]           = useState('');
  const [filterRole, setFilterRole]           = useState<string>('all');
  const [selectedUser, setSelectedUser]       = useState<User | null>(null);
  const [pendingRole, setPendingRole]         = useState<User['role'] | ''>('');
  const [roleLoading, setRoleLoading]         = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [showRoleModal, setShowRoleModal]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg]               = useState('');

  useEffect(() => { fetchUsers(); }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/superadmin/users');
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Open role modal ────────────────────────────────────────────────────────
  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setPendingRole(user.role);   // pre-select current role
    setErrorMsg('');
    setShowRoleModal(true);
  };

  // ── Update role ────────────────────────────────────────────────────────────
  // PATCH /api/superadmin/users/[userId]  { role }
  const updateUserRole = async () => {
    if (!selectedUser || !pendingRole) return;
    if (pendingRole === selectedUser.role) {
      setShowRoleModal(false);
      return;
    }

    setRoleLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/superadmin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingRole }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to update role.');
        return;
      }

      // Update local state immediately — no re-fetch needed
      setUsers(prev =>
        prev.map(u =>
          u.id === selectedUser.id ? { ...u, role: pendingRole as User['role'] } : u
        )
      );
      setShowRoleModal(false);
      setSelectedUser(null);
      setPendingRole('');
    } catch (err) {
      console.error('Failed to update role:', err);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setRoleLoading(false);
    }
  };

  // ── Delete user ────────────────────────────────────────────────────────────
  // DELETE /api/superadmin/users/[userId]
  const deleteUser = async () => {
    if (!selectedUser) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/superadmin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error(data.error);
        return;
      }

      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter(user => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      user.first_name.toLowerCase().includes(q) ||
      user.last_name.toLowerCase().includes(q)  ||
      user.email.toLowerCase().includes(q)      ||
      user.username.toLowerCase().includes(q);
    const matchRole = filterRole === 'all' || user.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading) return <Loading />;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <GlassCard className="p-6" gradient="blue">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              User Management
            </h2>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              Manage admin users and assign roles
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 shadow-lg shadow-blue-500/30 transition-all"
            onClick={() => window.location.href = '/register'}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent my-6" />

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by name, username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/50 border-white/60 focus:bg-white focus:border-blue-400 transition-all"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/50 border-white/60 focus:bg-white focus:border-blue-400">
              <Filter className="w-4 h-4 mr-2 text-blue-400" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roleOptions.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard className="p-0" gradient="blue">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/40 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-violet-50/50">
                <TableHead className="font-bold text-gray-700">User</TableHead>
                <TableHead className="font-bold text-gray-700">Contact</TableHead>
                <TableHead className="font-bold text-gray-700">Role</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                <TableHead className="font-bold text-gray-700">Last Login</TableHead>
                <TableHead className="font-bold text-gray-700">Joined</TableHead>
                <TableHead className="font-bold text-gray-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-b border-white/30 hover:bg-blue-100/80 transition-colors duration-150 group"
                >
                  {/* User */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-sm font-bold">
                          {user.first_name[0]}{user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact */}
                  <TableCell>
                    <p className="text-sm text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.phone ?? 'No phone'}</p>
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    <Badge variant="outline" className={roleColors[user.role] ?? roleColors.user}>
                      {roleLabel(user.role)}
                    </Badge>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {user.is_active ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Inactive</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Last Login */}
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(user.last_login_at)}
                  </TableCell>

                  {/* Joined */}
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(user.created_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => openRoleModal(user)}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/30">
          <p className="text-xs text-gray-500">
            Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
        </div>
      </GlassCard>

      {/* ── Role Change Modal ──────────────────────────────────────────────── */}
      <Dialog
        open={showRoleModal}
        onOpenChange={(open) => {
          if (!open) { setShowRoleModal(false); setSelectedUser(null); setErrorMsg(''); }
        }}
      >
        <DialogContent className="bg-white border-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update role for{' '}
              <span className="font-semibold">
                {selectedUser?.first_name} {selectedUser?.last_name}
              </span>{' '}
              <span className="text-gray-400">(@{selectedUser?.username})</span>
            </DialogDescription>
          </DialogHeader>

          {/* Role selector buttons */}
          <div className="space-y-2 py-2">
            {roleOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPendingRole(value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  pendingRole === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${pendingRole === value ? 'text-blue-600' : 'text-gray-400'}`} />
                  {label}
                  {selectedUser?.role === value && (
                    <span className="text-xs text-gray-400 font-normal">(current)</span>
                  )}
                </div>
                {pendingRole === value && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Error message */}
          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {errorMsg}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setShowRoleModal(false); setSelectedUser(null); setErrorMsg(''); }}
              disabled={roleLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={updateUserRole}
              disabled={roleLoading || !pendingRole || pendingRole === selectedUser?.role}
              className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
            >
              {roleLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Saving...
                </span>
              ) : 'Save Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Modal ──────────────────────────────────────── */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">
                {selectedUser?.first_name} {selectedUser?.last_name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSelectedUser(null)}
              disabled={deleteLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 min-w-[80px]"
            >
              {deleteLoading ? (
                <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}