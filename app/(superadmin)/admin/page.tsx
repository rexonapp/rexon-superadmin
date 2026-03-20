"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Filter, MoreVertical, Trash2, Shield,
  CheckCircle2, Users, X,
} from 'lucide-react';
import Loading from '../loading';
import { cn } from '@/lib/utils';

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
  superadmin: 'bg-blue-50 text-blue-700 border border-blue-200',
  admin:      'bg-cyan-50 text-cyan-700 border border-cyan-200',
  user:       'bg-gray-100 text-gray-600 border border-gray-200',
};

const roleOptions: { value: User['role']; label: string }[] = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin',      label: 'Admin'       },
  { value: 'user',       label: 'User'        },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
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

  const anyFilter = searchTerm !== '' || filterRole !== 'all';

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
    setPendingRole(user.role);
    setErrorMsg('');
    setShowRoleModal(true);
  };

  // ── Update role ────────────────────────────────────────────────────────────
  const updateUserRole = async () => {
    if (!selectedUser || !pendingRole) return;
    if (pendingRole === selectedUser.role) { setShowRoleModal(false); return; }

    setRoleLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/superadmin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setErrorMsg(data.error || 'Failed to update role.'); return; }
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, role: pendingRole as User['role'] } : u));
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
  const deleteUser = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/superadmin/users/${selectedUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) { console.error(data.error); return; }
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
    <div className="h-full flex flex-col gap-3 overflow-hidden">

      {/* ── Filters ── */}
      <div className="flex-shrink-0 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">

        {/* Search */}
        <div className="relative w-full sm:w-72 lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search name, username, email…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        {/* Role filter + clear */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40 h-9 text-sm bg-gray-50 border-gray-200 shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roleOptions.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {anyFilter && (
            <Button
              variant="ghost" size="sm"
              onClick={() => { setSearchTerm(''); setFilterRole('all'); }}
              className="h-9 px-3 text-sm text-gray-500 hover:text-rose-600 hover:bg-rose-50 shrink-0"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Result count */}
        <div className="sm:ml-auto">
          <span className="text-xs text-gray-400 font-medium">
          </span>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">

        {/* Scrollable table */}
        <div className="flex-1 min-h-0 overflow-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
          <Table className="min-w-[760px] w-full">
            <TableHeader>
              <TableRow className="hover:bg-gray-50 border-b border-gray-200">
                <TableHead className="text-xs font-bold uppercase tracking-wide text-gray-500 h-11 px-4 bg-gray-50 min-w-[200px] sticky top-0 z-10">Username</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-gray-500 h-11 px-4 bg-gray-50 min-w-[250px] sticky top-0 z-10">Name</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-gray-500 h-11 px-4 bg-gray-50 min-w-[200px] sticky top-0 z-10">E-mail</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-gray-500 h-11 px-4 bg-gray-50 min-w-[110px] sticky top-0 z-10">Role</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-gray-500 h-11 px-4 bg-gray-50 min-w-[100px] sticky top-0 z-10">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-gray-500 h-11 px-4 bg-gray-50 min-w-[130px] sticky top-0 z-10">Last Login</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-gray-500 h-11 px-4 bg-gray-50 min-w-[120px] sticky top-0 z-10">Joined</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-gray-500 h-11 px-4 text-right bg-gray-50 w-16 sticky top-0 z-10">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user, i) => (
                <TableRow
                  key={user.id}
                  className={cn(
                    'border-b border-gray-100 hover:bg-blue-100 transition-colors group',
                    i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white',
                  )}
                >
                    <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-9 h-9 ring-1 ring-gray-200 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-400 text-white text-xs font-bold">
                          {user.first_name[0]}{user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">
                          {user.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                   <TableCell className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                    
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px]">
                          {user.first_name} {user.last_name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {/* Contact */}
                  <TableCell className="px-4 py-3.5">
                    <p className="text-sm text-gray-800 truncate max-w-[190px]">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.phone ?? 'No phone'}</p>
                  </TableCell>

                  {/* Role */}
                  <TableCell className="px-4 py-3.5">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap',
                      roleColors[user.role] ?? roleColors.user,
                    )}>
                      {roleLabel(user.role)}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-4 py-3.5">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        Inactive
                      </span>
                    )}
                  </TableCell>

                  {/* Last Login */}
                  <TableCell className="px-4 py-3.5">
                    <p className="text-sm text-gray-800">{formatDate(user.last_login_at)}</p>
                  </TableCell>

                  {/* Joined */}
                  <TableCell className="px-4 py-3.5">
                    <p className="text-sm text-gray-800">{formatDate(user.created_at)}</p>
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
                          className="cursor-pointer text-sm py-2"
                          onClick={() => openRoleModal(user)}
                        >
                          <Shield className="w-4 h-4 mr-2 text-blue-500" /> Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-sm py-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                          onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Users className="w-7 h-7 opacity-40" />
                      </div>
                      <p className="font-semibold text-base text-gray-500">No users found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                      {anyFilter && (
                        <Button
                          variant="outline" size="sm"
                          onClick={() => { setSearchTerm(''); setFilterRole('all'); }}
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

        {/* Footer count */}
        {/* <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-white">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-semibold text-gray-700">{filteredUsers.length}</span>
            {' '}of{' '}
            <span className="font-semibold text-gray-700">{users.length}</span>
            {' '}user{users.length !== 1 ? 's' : ''}
          </p>
        </div> */}
      </div>

      {/* ── Role Change Modal ──────────────────────────────────────────────── */}
      <Dialog
        open={showRoleModal}
        onOpenChange={open => {
          if (!open) { setShowRoleModal(false); setSelectedUser(null); setErrorMsg(''); }
        }}
      >
        <DialogContent className="bg-white border-gray-200 sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl">
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Change User Role</h3>
                <p className="text-blue-200 text-xs mt-0.5">
                  {selectedUser?.first_name} {selectedUser?.last_name}{' '}
                  <span className="text-blue-300">@{selectedUser?.username}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Role options */}
          <div className="px-5 py-5 space-y-2">
            {roleOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPendingRole(value)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                  pendingRole === value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50/50',
                )}
              >
                <div className="flex items-center gap-2">
                  <Shield className={cn('w-4 h-4', pendingRole === value ? 'text-blue-600' : 'text-gray-400')} />
                  {label}
                  {selectedUser?.role === value && (
                    <span className="text-xs text-gray-400 font-normal">(current)</span>
                  )}
                </div>
                {pendingRole === value && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            ))}

            {errorMsg && (
              <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-1">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => { setShowRoleModal(false); setSelectedUser(null); setErrorMsg(''); }}
              disabled={roleLoading}
              className="flex-1 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={updateUserRole}
              disabled={roleLoading || !pendingRole || pendingRole === selectedUser?.role}
              className="flex-1 h-9 text-sm bg-blue-600 hover:bg-blue-700"
            >
              {roleLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Saving…
                </span>
              ) : 'Save Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent className="bg-white border-gray-200 rounded-2xl p-0 gap-0 overflow-hidden sm:max-w-sm">
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-rose-600 to-rose-500 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete User</h3>
                <p className="text-rose-200 text-xs mt-0.5">This action cannot be undone</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">
                {selectedUser?.first_name} {selectedUser?.last_name}
              </span>
              ? All data associated with this user will be permanently removed.
            </p>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 flex gap-2">
            <AlertDialogCancel
              onClick={() => setSelectedUser(null)}
              disabled={deleteLoading}
              className="flex-1 h-9 text-sm"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              disabled={deleteLoading}
              className="flex-1 h-9 text-sm bg-rose-600 hover:bg-rose-700 text-white border-0"
            >
              {deleteLoading ? (
                <svg className="animate-spin h-3.5 w-3.5 mx-auto" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}