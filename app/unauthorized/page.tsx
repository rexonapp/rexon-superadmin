'use client'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg border mx-auto mb-6"
          style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))' }}>
          <ShieldX className="w-5 h-5 text-destructive" strokeWidth={1.5} />
        </div>
        <h1 className="text-lg font-semibold tracking-tight mb-2">Access Denied</h1>
        <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
          You don't have permission to view this page. Contact your administrator if you believe this is a mistake.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => history.back()}>Go Back</Button>
          <Link href={'/'}>
          <Button size="sm">Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}