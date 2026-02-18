'use client'

import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck, AlertCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Role = 'superadmin' | 'admin' | 'user'

interface FormData {
  username: string
  email: string
  firstName: string
  lastName: string
  phone: string
  password: string
  confirmPassword: string
  role: Role
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          password: form.password,
          role: form.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed.'); return }
      window.location.href = '/'
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg border mb-4"
            style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted))' }}>
            <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Rexon</h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Administration Portal</p>
        </div>

        <Card>
          <CardHeader className="px-6 pt-6 pb-0">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Create Account</CardTitle>
                <CardDescription className="text-sm mt-0.5">Register a new admin user</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-normal mt-0.5">Super Admin</Badge>
            </div>
            <div className="mt-5" style={{ height: '1px', backgroundColor: 'hsl(var(--border))' }} />
          </CardHeader>

          <CardContent className="px-6 pt-5 pb-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input id="firstName" placeholder="John" value={form.firstName} onChange={set('firstName')} className="h-9 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" value={form.lastName} onChange={set('lastName')} className="h-9 text-sm" required />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input id="username" placeholder="johndoe" value={form.username} onChange={set('username')} autoComplete="username" className="h-9 text-sm" required />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={form.email} onChange={set('email')} autoComplete="email" className="h-9 text-sm" required />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone <span style={{ color: 'hsl(var(--muted-foreground))' }} className="text-xs font-normal">(optional)</span>
                </Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} className="h-9 text-sm" />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v as Role }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={form.password} onChange={set('password')} autoComplete="new-password" className="h-9 text-sm pr-9" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter password"
                    value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" className="h-9 text-sm pr-9" required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-9 text-sm font-medium" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" />Create Account</span>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Already have an account? </span>
              <a href="/login" className="text-sm font-medium underline-offset-4 hover:underline">Sign in</a>
            </div>
          </CardContent>

          <CardFooter className="px-6 pt-4 pb-6">
            <p className="text-xs text-center w-full leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
              This system is monitored. Unauthorized access attempts are logged and reported.
            </p>
          </CardFooter>
        </Card>

        <div className="flex items-center justify-between mt-5 px-1">
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>© {new Date().getFullYear()} Rexon</span>
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>v2.4.1</span>
        </div>
      </div>
    </div>
  )
}