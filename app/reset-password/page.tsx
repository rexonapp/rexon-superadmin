'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, ShieldAlert, Lock, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // Verify token on mount
  useEffect(() => {
    if (!token) { setTokenValid(false); return }
    fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then(r => setTokenValid(r.ok))
      .catch(() => setTokenValid(false))
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Reset failed. Please try again.'); return }
      setSuccess(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Password strength
  const strength = (() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength]

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 overflow-hidden">

      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-teal/12 opacity-60 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-orange-100 opacity-50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-teal/8 opacity-40 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-5">
            <div className="absolute -inset-2 rounded-3xl bg-brand-teal/20 blur-lg" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border border-slate-100 shadow-2xl shadow-brand-teal/25 flex items-center justify-center">
              <img src="/rexon-logo.png" alt="Rexon" width={102} height={102} className="w-30 h-30 sm:w-[102px] sm:h-[102px] object-contain" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Rexon</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-brand-teal/50" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administration Portal</p>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-brand-teal/50" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-2xl shadow-brand-teal/15 overflow-hidden">
          <div className="h-1 bg-brand-teal-deep" />

          {/* Header */}
          <div className="flex items-start justify-between px-6 sm:px-8 pt-6">
            <div>
              <p className="text-base font-extrabold text-slate-800 tracking-tight">Set New Password</p>
              <p className="text-xs text-slate-400 mt-0.5">Choose a strong, unique password</p>
            </div>
            <div className="flex items-center gap-1 bg-brand-teal-deep text-white text-[10px] font-bold uppercase tracking-widest rounded-lg px-2.5 py-1.5 shadow-md shadow-brand-teal/35 whitespace-nowrap ml-3 mt-0.5">
              <ShieldAlert size={10} strokeWidth={3} />
              Admin Portal
            </div>
          </div>

          <div className="mx-6 sm:mx-8 mt-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="px-6 sm:px-8 pt-5 pb-6">

            {/* Token loading */}
            {tokenValid === null && (
              <div className="flex items-center justify-center py-8 gap-2.5 text-slate-400 text-sm">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Verifying link...
              </div>
            )}

            {/* Invalid token */}
            {tokenValid === false && (
              <div className="flex flex-col items-center text-center py-4 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <XCircle size={28} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Link Expired or Invalid</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs">
                    This reset link has expired or already been used. Reset links are valid for 1 hour.
                  </p>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm font-bold text-white bg-brand-teal-deep hover:bg-brand-teal-dark rounded-2xl px-5 py-2.5 shadow-lg shadow-brand-teal/30 hover:-translate-y-0.5 transition-all duration-150"
                >
                  Request New Link
                </Link>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex flex-col items-center text-center py-4 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Password Updated!</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Your password has been changed successfully. You can now sign in with your new password.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="text-sm font-bold text-white bg-brand-teal-deep hover:bg-brand-teal-dark rounded-2xl px-5 py-2.5 shadow-lg shadow-brand-teal/30 hover:-translate-y-0.5 transition-all duration-150"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Form */}
            {tokenValid === true && !success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-xs leading-snug">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-widest">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      autoFocus
                      required
                      className="w-full h-11 pl-10 pr-11 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all duration-150 focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/20 hover:border-slate-300 placeholder:text-slate-300"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-teal transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex gap-1 flex-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-slate-200'}`} />
                        ))}
                      </div>
                      <span className={`text-[10px] font-bold ${['','text-red-400','text-orange-400','text-yellow-500','text-green-500'][strength]}`}>
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-widest">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="w-full h-11 pl-10 pr-11 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all duration-150 focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/20 hover:border-slate-300 placeholder:text-slate-300"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-teal transition-colors">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-red-400 font-medium pl-1">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-[11px] text-green-500 font-medium pl-1 flex items-center gap-1"><CheckCircle2 size={11} /> Passwords match</p>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-2.5 text-sm font-bold text-white bg-brand-teal-deep hover:bg-brand-teal-dark rounded-2xl shadow-lg shadow-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Security notice (only when form is shown) */}
            {tokenValid === true && !success && (
              <div className="mt-5 flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                <ShieldAlert size={13} className="text-orange-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  After updating, you&apos;ll be <span className="font-semibold text-orange-500">signed out of all sessions</span>.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 px-2">
          <Link href="/login" className="text-[11px] text-slate-400 hover:text-brand-teal transition-colors font-medium">
            ← Back to Sign In
          </Link>
          <span className="text-[11px] text-slate-400 bg-white border border-slate-200 rounded-md px-2 py-0.5">v2.4.1</span>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}