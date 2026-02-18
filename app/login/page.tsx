'use client'

import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck, AlertCircle, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function SuperAdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !password) { setError('Please enter both username and password.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Sign in failed.'); return }
      window.location.href = '/'
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
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
                <CardTitle className="text-base font-semibold">Sign in</CardTitle>
                <CardDescription className="text-sm mt-0.5">Restricted to authorized personnel</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-normal mt-0.5">Super Admin</Badge>
            </div>
            <div className="mt-5" style={{ height: '1px', backgroundColor: 'hsl(var(--border))' }} />
          </CardHeader>

          <CardContent className="px-6 pt-5 pb-2">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input id="username" type="text" placeholder="Enter your username" value={username}
                  onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus className="h-9 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="h-9 text-sm pr-9" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><LogIn className="w-4 h-4" />Sign in</span>
                )}
              </Button>
            </form>
            <div className="mt-5 text-center">
              <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Don't have an account? </span>
              <a href="/register" className="text-sm font-medium underline-offset-4 hover:underline">Register</a>
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