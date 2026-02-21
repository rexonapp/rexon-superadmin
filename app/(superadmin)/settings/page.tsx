"use client";

import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Bell, Database, Mail, Globe, Lock, Save } from 'lucide-react';
import GlassCard from '@/components/superadmin/GlassCard';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    autoApprove: false,
    emailNotifications: true,
    agentVerification: true,
    maintenanceMode: false,
    requireKYC: true,
    minWarehouseSize: '100',
    maxListingsPerUser: '10',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const settingsSections = [
    {
      title: 'Approval Settings',
      icon: Shield,
      settings: [
        {
          id: 'autoApprove',
          label: 'Auto-approve listings',
          description: 'Automatically approve all warehouse listings without manual review',
          type: 'toggle',
        },
        {
          id: 'agentVerification',
          label: 'Require agent verification',
          description: 'Agents must be verified before they can list properties',
          type: 'toggle',
        },
      ],
    },
    {
      title: 'Notification Settings',
      icon: Bell,
      settings: [
        {
          id: 'emailNotifications',
          label: 'Email notifications',
          description: 'Send email notifications for pending approvals',
          type: 'toggle',
        },
      ],
    },
    {
      title: 'Security Settings',
      icon: Lock,
      settings: [
        {
          id: 'requireKYC',
          label: 'Require KYC for agents',
          description: 'Agents must submit KYC documents during registration',
          type: 'toggle',
        },
      ],
    },
    {
      title: 'System Settings',
      icon: Database,
      settings: [
        {
          id: 'maintenanceMode',
          label: 'Maintenance mode',
          description: 'Put the system in maintenance mode (users cannot access)',
          type: 'toggle',
        },
        {
          id: 'minWarehouseSize',
          label: 'Minimum warehouse size (sqft)',
          description: 'Minimum size required for warehouse listings',
          type: 'number',
        },
        {
          id: 'maxListingsPerUser',
          label: 'Max listings per user',
          description: 'Maximum number of listings a user can create',
          type: 'number',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <GlassCard className="p-6" gradient="blue">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              System Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1 font-medium">Configure system-wide settings and preferences</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-cyan-500/40 transition-all"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </GlassCard>

      <div className="space-y-6">
        {settingsSections.map((section, sectionIdx) => {
          const gradients = ['blue', 'cyan', 'blue', 'cyan'];
          const gradient = gradients[sectionIdx % gradients.length] as 'blue' | 'cyan';

          const iconClasses = {
            blue: 'p-3 rounded-xl bg-blue-500/10 ring-4 ring-blue-500/10',
            cyan: 'p-3 rounded-xl bg-cyan-500/10 ring-4 ring-cyan-500/10',
          };

          const iconColorClasses = {
            blue: 'w-6 h-6 text-blue-600',
            cyan: 'w-6 h-6 text-cyan-600',
          };

          const separatorClasses = {
            blue: 'bg-gradient-to-r from-transparent via-blue-200 to-transparent mb-6',
            cyan: 'bg-gradient-to-r from-transparent via-cyan-200 to-transparent mb-6',
          };

          return (
            <GlassCard
              key={section.title}
              className="p-6"
              gradient={gradient}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={iconClasses[gradient]}>
                  <section.icon className={iconColorClasses[gradient]} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
              </div>

              <Separator className={separatorClasses[gradient]} />

              <div className="space-y-4">
                {section.settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-5 rounded-xl bg-white/40 hover:bg-blue-100/60 border border-white/40 hover:border-blue-200 shadow-sm transition-colors duration-150 group"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{setting.label}</p>
                      <p className="text-sm text-gray-600 mt-1 font-medium">{setting.description}</p>
                    </div>

                    {setting.type === 'toggle' ? (
                      <Switch
                        checked={settings[setting.id as keyof typeof settings] as boolean}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          [setting.id]: checked
                        })}
                        className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-cyan-600"
                      />
                    ) : (
                      <Input
                        type="number"
                        value={String(settings[setting.id as keyof typeof settings])}
                        onChange={(e) => setSettings({
                          ...settings,
                          [setting.id]: e.target.value
                        })}
                        className="w-28 bg-white/60 border-white/60 focus:bg-white focus:border-cyan-400 text-center font-bold transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Role Management Section */}
      <GlassCard className="p-6" gradient="blue">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-500/10 ring-4 ring-blue-500/10">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Role Permissions</h3>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-blue-200 to-transparent mb-6" />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/40 bg-gradient-to-r from-blue-50/50 via-cyan-50/50 to-sky-50/50">
                <TableHead className="text-left font-bold text-gray-700">Permission</TableHead>
                <TableHead className="text-center font-bold text-gray-700">Super Admin</TableHead>
                <TableHead className="text-center font-bold text-gray-700">Admin</TableHead>
                <TableHead className="text-center font-bold text-gray-700">User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: 'Approve Warehouses', superadmin: true, admin: true,  user: false },
                { name: 'Verify Agents', superadmin: true, admin: true,  user: false },
                { name: 'Manage Users', superadmin: true, admin: true,  user: false },
                { name: 'View Analytics', superadmin: true, admin: true,  user: false },
                { name: 'Create Listings', superadmin: true, admin: true,  user: true },
                { name: 'System Settings', superadmin: true, admin: false,  user: false },
              ].map((perm, idx) => (
                <TableRow key={idx} className="border-b border-white/30 hover:bg-blue-100/80 transition-colors duration-150 group">
                  <TableCell className="font-bold text-gray-900">{perm.name}</TableCell>
                  <TableCell className="text-center">
                    {perm.superadmin && (
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 mx-auto shadow-lg shadow-blue-500/50"></div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {perm.admin && (
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 mx-auto shadow-lg shadow-blue-500/50"></div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {perm.user && (
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 mx-auto shadow-lg shadow-blue-500/50"></div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
}