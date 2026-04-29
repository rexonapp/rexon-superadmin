'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'

type Role = 'superadmin' | 'admin' | 'user'
type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

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

// ── Reusable hook: debounced availability check ──────────────────────────────
function useAvailabilityCheck(value: string, field: 'username' | 'email', delay = 500) {
  const [status, setStatus] = useState<AvailabilityState>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!value.trim()) {
      setStatus('idle')
      return
    }

    setStatus('checking')

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/superadmin/users/check-availability?${field}=${encodeURIComponent(value.trim())}`)
        const data = await res.json()

        if (data.error) {
          setStatus('invalid')
        } else {
          setStatus(data.available ? 'available' : 'taken')
        }
      } catch {
        setStatus('idle')
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, field, delay])

  useEffect(() => {
    if (!value) setStatus('idle')
  }, [value])

  return status
}

// ── Inline status indicator ──────────────────────────────────────────────────
function FieldStatus({ status, takenMsg }: { status: AvailabilityState; takenMsg: string }) {
  if (status === 'idle') return null

  const config: Record<Exclude<AvailabilityState, 'idle'>, { icon: React.ReactNode; text: string; color: string }> = {
    checking:  { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, text: 'Checking…',     color: 'text-gray-500' },
    available: { icon: <CheckCircle2 className="w-3.5 h-3.5" />,         text: 'Available',      color: 'text-green-600' },
    taken:     { icon: <XCircle className="w-3.5 h-3.5" />,              text: takenMsg,         color: 'text-red-600'   },
    invalid:   { icon: <XCircle className="w-3.5 h-3.5" />,              text: 'Invalid format', color: 'text-red-600'   },
  }

  const { icon, text, color } = config[status]

  return (
    <span className={`flex items-center gap-1 text-xs font-medium mt-1 ${color}`}>
      {icon}{text}
    </span>
  )
}

// ── Input border helper ──────────────────────────────────────────────────────
function borderClass(status: AvailabilityState) {
  if (status === 'available') return 'border-green-400 focus:border-green-500 focus:ring-green-200'
  if (status === 'taken' || status === 'invalid') return 'border-red-400 focus:border-red-500 focus:ring-red-200'
  return 'border-gray-300 focus:border-orange-400 focus:ring-orange-200'
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AddUserPage() {
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
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [success,      setSuccess]      = useState('')
  const router = useRouter();
  const usernameStatus = useAvailabilityCheck(form.username, 'username')
  const emailStatus    = useAvailabilityCheck(form.email,    'email')

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (usernameStatus === 'taken')    return setError('That username is already taken.')
    if (usernameStatus === 'checking') return setError('Please wait — still checking username availability.')
    if (emailStatus === 'taken')       return setError('That email is already registered.')
    if (emailStatus === 'checking')    return setError('Please wait — still checking email availability.')
    if (emailStatus === 'invalid')     return setError('Please enter a valid email address.')

    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username:  form.username,
          email:     form.email,
          firstName: form.firstName,
          lastName:  form.lastName,
          phone:     form.phone,
          password:  form.password,
          role:      form.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add user.')
        return
      }
      setSuccess('User added successfully!')
      handleCancel()
      setTimeout(() => setSuccess(''), 3000)
      router.back();
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setForm({ username: '', email: '', firstName: '', lastName: '', phone: '', password: '', confirmPassword: '', role: 'user' })
    setError('')
    setSuccess('')
    router.back();
  }

  return (
    <>
      {/* Custom scrollbar styles scoped to this page */}
      <style>{`
        .add-user-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .add-user-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .add-user-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .add-user-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 99px;
        }
        .add-user-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>

      {/* Full-height scroll container — fills whatever space the layout gives */}
      <div className="add-user-scroll h-full overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto py-6 px-2">
          <Card className="border border-gray-200 shadow-md">
            <CardHeader className="border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg"
                  style={{ backgroundColor: '#f0f5ff', color: '#0f4c75' }}
                >
                  <UserPlus className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold" style={{ color: '#0f4c75' }}>Add New User</CardTitle>
                  <CardDescription className="text-sm mt-0.5 text-gray-600">Add a new user to the system</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-1">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-sm text-red-700">{error}</AlertDescription>
                  </Alert>
                )}
                {success && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-700">{success}</AlertDescription>
                  </Alert>
                )}

                {/* Name row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={form.firstName}
                      onChange={set('firstName')}
                      className="h-10 text-sm rounded-lg border border-gray-300 transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={set('lastName')}
                      className="h-10 text-sm rounded-lg border border-gray-300 transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Username</Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={form.username}
                    onChange={set('username')}
                    autoComplete="username"
                    className={`h-10 text-sm rounded-lg border transition-all focus:ring-2 ${borderClass(usernameStatus)}`}
                    required
                  />
                  <FieldStatus status={usernameStatus} takenMsg="Username already taken" />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                    className={`h-10 text-sm rounded-lg border transition-all focus:ring-2 ${borderClass(emailStatus)}`}
                    required
                  />
                  <FieldStatus status={emailStatus} takenMsg="Email already registered" />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                    Phone <span className="text-xs font-normal text-gray-500">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={set('phone')}
                    className="h-10 text-sm rounded-lg border border-gray-300 transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Role</Label>
                  <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v as Role }))}>
                    <SelectTrigger className="h-10 text-sm rounded-lg border border-gray-300 transition-all focus:border-orange-400">
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
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={set('password')}
                      autoComplete="new-password"
                      className="h-10 text-sm rounded-lg border border-gray-300 transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      autoComplete="new-password"
                      className="h-10 text-sm rounded-lg border border-gray-300 transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-200 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 h-10 text-sm font-semibold rounded-lg transition-all bg-brand-teal  hover:bg-brand-teal-dark duration-200 hover:shadow-md active:scale-95"
                    style={{ color: 'white', border: 'none' }}
                    disabled={loading || usernameStatus === 'taken' || emailStatus === 'taken' || emailStatus === 'invalid'}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Adding...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center">
                        <UserPlus className="w-4 h-4" />Add User
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 text-sm font-semibold rounded-lg transition-all"
                    style={{ borderColor: '#d0e0ff', color: '#0f4c75' }}
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}