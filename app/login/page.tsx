'use client'

import { useState } from 'react'
import { Eye, EyeOff, AlertCircle, LogIn, ShieldAlert, Lock, User, Shield } from 'lucide-react'
import Link from 'next/link'

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
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 overflow-hidden">

      {/* Background decorative blobs — pure Tailwind */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-teal/12 opacity-60 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-orange-100 opacity-50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-teal/8 opacity-40 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md">

        {/* ── Brand ── */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo */}
          <div className="relative mb-5">
            <div className="absolute -inset-2 rounded-full bg-brand-teal/20 blur-lg" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border border-slate-100 shadow-2xl shadow-brand-teal/25 flex items-center justify-center overflow-hidden">
              <img
                src="/rexon-logo.png"
                alt="Rexon"
                width={102}
                height={102}
                className="w-[72%] h-[72%] sm:w-[76%] sm:h-[76%] object-contain"
              />
            </div>
          </div>

         
        </div>

        {/* ── Card ── */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-2xl shadow-brand-teal/15 overflow-hidden">

          {/* Accent bar */}
          <div className="h-1 bg-brand-teal-deep" />

          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-6 sm:px-8 pt-6">
            <div className="min-w-0">
              <p className="text-base font-extrabold text-slate-800 tracking-tight">Welcome back</p>
              <p className="text-xs text-slate-400 mt-0.5">Sign in to access the admin dashboard</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-brand-teal-deep text-white text-[10px] font-bold uppercase tracking-widest rounded-lg px-2.5 py-2 shadow-md shadow-brand-teal/35 whitespace-nowrap">
              <Shield className="w-3.5 h-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
              Admin Portal
            </div>
          </div>

          {/* Divider */}
          <div className="mx-6 sm:mx-8 mt-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Form */}
          <div className="px-6 sm:px-8 pt-5 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-xs leading-snug">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-widest">
                  Username
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    required
                    className="w-full h-11 pl-10 pr-4 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all duration-150 focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/20 hover:border-slate-300 placeholder:text-slate-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full h-11 pl-10 pr-11 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all duration-150 focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/20 hover:border-slate-300 placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-teal transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end -mt-1">
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-slate-400 hover:text-brand-teal transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-2.5 text-sm font-bold text-white bg-brand-teal-deep rounded-2xl shadow-lg shadow-brand-teal/30 hover:bg-brand-teal-dark hover:shadow-xl hover:shadow-brand-teal/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <LogIn size={15} />
                      Sign in to Dashboard
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security notice */}
            <div className="mt-5 flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
              <ShieldAlert size={13} className="text-orange-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Admin control panel. Authorized persons only.
                <span className="font-semibold text-orange-500"> </span>{' '}
              </p>
            </div>
          </div>
        </div>

        {/* <div className="flex items-center justify-between mt-5 px-2">
          <span className="text-[11px] text-slate-400">© {new Date().getFullYear()} Rexon. All rights reserved.</span>
        </div> */}

      </div>
    </div>
  )
}