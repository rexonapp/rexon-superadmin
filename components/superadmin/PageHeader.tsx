'use client';

import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
}

export default function PageHeader({ icon: Icon, title, children }: PageHeaderProps) {
  return (
    <div className="flex-shrink-0 flex flex-row items-center justify-between bg-brand-teal rounded-xl px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/20 ring-2 ring-white/30">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      {children && <div className="ml-auto">{children}</div>}
    </div>
  );
}
