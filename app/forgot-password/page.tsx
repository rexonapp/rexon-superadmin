'use client'

import { useState } from 'react'
import { AlertCircle, ShieldAlert, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim()) { setError('Please enter your email or username.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Show the specific error (not found, disabled, etc.)
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-brand-teal to-brand-orange/80 opacity-20 blur-lg" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border border-slate-100 shadow-2xl shadow-brand-teal/25 flex items-center justify-center">
              <img
                src="/rexon-logo.png"
                alt="Rexon"
                width={102}
                height={102}
                className="w-30 h-30 sm:w-[102px] sm:h-[102px] object-contain"
              />
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

          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-brand-teal-deep via-brand-teal to-brand-orange" />

          {/* Header */}
          <div className="flex items-start justify-between px-6 sm:px-8 pt-6">
            <div>
              <p className="text-base font-extrabold text-slate-800 tracking-tight">Reset Password</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {submitted ? 'Check your inbox' : "We'll send you a secure reset link"}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-brand-teal-deep text-white text-[10px] font-bold uppercase tracking-widest rounded-lg px-2.5 py-1.5 shadow-md shadow-brand-teal/35 whitespace-nowrap ml-3 mt-0.5">
              <ShieldAlert size={10} strokeWidth={3} />
              Admin Portal
            </div>
          </div>

          {/* Divider */}
          <div className="mx-6 sm:mx-8 mt-5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="px-6 sm:px-8 pt-5 pb-6">
            {submitted ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center text-center py-4 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Check your inbox</p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs">
                    A password reset link has been sent to the email address on this account. The link expires in{' '}
                    <span className="font-semibold text-slate-700">1 hour</span>.
                  </p>
                </div>
                <p className="text-[11px] text-slate-400">
                  Didn&apos;t receive it? Check your spam folder or{' '}
                  <button
                    onClick={() => { setSubmitted(false); setIdentifier('') }}
                    className="text-brand-teal-medium font-semibold hover:underline"
                  >
                    try again
                  </button>.
                </p>
              </div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-xs leading-snug">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="identifier" className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-widest">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="identifier"
                      type="text"
                      placeholder="Enter your email or username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      required
                      className="w-full h-11 pl-10 pr-4 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all duration-150 focus:border-brand-teal focus:bg-white focus:ring-4 focus:ring-brand-teal/20 hover:border-slate-300 placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-2.5 text-sm font-bold text-white bg-gradient-to-br from-brand-teal-deep via-brand-teal to-brand-orange rounded-2xl shadow-lg shadow-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <Mail size={15} />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Security notice */}
            <div className="mt-5 flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
              <ShieldAlert size={13} className="text-orange-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Reset links are valid for{' '}
                <span className="font-semibold text-orange-500">1 hour</span> and can only be used once.
              </p>
            </div>
          </div>
        </div>

        {/* Back to login */}
        <div className="flex items-center justify-between mt-5 px-2">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-brand-teal transition-colors font-medium"
          >
            <ArrowLeft size={11} />
            Back to Sign In
          </Link>
          <span className="text-[11px] text-slate-400 bg-white border border-slate-200 rounded-md px-2 py-0.5">v2.4.1</span>
        </div>

      </div>
    </div>
  )
}