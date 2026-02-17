'use client'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, Home, ChevronDown, User, Mail, Lock, UserCircle, Phone, LogOut, AlertCircle, Building2, Plus, Settings, User2Icon } from 'lucide-react'
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  authProvider?: string;
  role?: string;
}

interface SignInData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const router= useRouter();

  const [signInData, setSignInData] = useState<SignInData>({
    email: '',
    password: '',
    rememberMe: false
  })

  const [signUpData, setSignUpData] = useState<SignUpData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  })
  const pathname = usePathname(); 


  useEffect(() => {
    checkSession()
    checkUrlError()
  }, [])

  const checkUrlError = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlError = urlParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
      setShowAuthModal(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }
  useEffect(() => {
    setShowProfileMenu(false);
  }, [pathname]);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (data.user) {
        setCurrentUser(data.user)
      }
    } catch (err) {
      console.error('Session check failed:', err)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAuthModal(false)
        setShowProfileMenu(false)
      }
    }
    if (showAuthModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showAuthModal])

  const handleEmailSignIn = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signInData.email,
          password: signInData.password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign in failed')
        return
      }

      setCurrentUser(data.user)
      setShowAuthModal(false)
      setSignInData({ email: '', password: '', rememberMe: false })
      window.location.reload()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!signUpData.firstName || !signUpData.lastName || !signUpData.email || !signUpData.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (signUpData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signUpData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign up failed')
        return
      }

      setCurrentUser(data.user)
      setShowAuthModal(false)
      setSignUpData({ firstName: '', lastName: '', email: '', password: '', phone: '' })
      window.location.reload()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    setError('')
    window.location.href = '/api/auth/google'
  }

  const handleMicrosoftSignIn = () => {
    setError('')
    window.location.href = '/api/auth/microsoft'
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setCurrentUser(null)
      setShowProfileMenu(false)
      window.location.href = '/'
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
    setError('')
  }

  const getUserInitials = (): string => {
    if (!currentUser) return '??'
    const first = currentUser.firstName?.[0] || currentUser.first_name?.[0] || ''
    const last = currentUser.lastName?.[0] || currentUser.last_name?.[0] || ''
    return (first + last).toUpperCase() || 'U'
  }

  const getUserFullName = (): string => {
    if (!currentUser) return ''
    const firstName = currentUser.firstName || currentUser.first_name || ''
    const lastName = currentUser.lastName || currentUser.last_name || ''
    return `${firstName} ${lastName}`.trim()
  }

  return (
    <>
      <nav className="bg-white/95 shadow-md sticky top-0 z-50 backdrop-blur-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <Link href={'/'}>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent tracking-tight">
                Rexon
              </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              <button className="flex items-center space-x-1 px-4 py-2 text-slate-700 hover:text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors">
                <span>Buy</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              <button className="flex items-center space-x-1 px-4 py-2 text-slate-700 hover:text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors">
                <span>Rent</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              <button className="px-4 py-2 text-slate-700 hover:text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors">
                Sell
              </button>
              
              <button className="px-4 py-2 text-slate-700 hover:text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors">
                About
              </button>
              
              <button className="px-4 py-2 text-slate-700 hover:text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-colors">
                Contact
              </button>
            </div>
            
            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Agent Join Button - Desktop */}
              <Link href='/agent/join'>
              <button className="hidden md:flex items-center space-x-2 px-4 py-2 text-blue-700 hover:text-orange-600 font-medium rounded-lg hover:bg-blue-50 transition-colors border-2 border-blue-200 hover:border-orange-300">
                <span>Join as Agent</span>
              </button>
              </Link>

              {/* List Property Button - Only when logged in */}
              {currentUser && (
                <Link href='/property'>
                <button className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-lg hover:shadow-orange-500/50">
                  <Plus className="h-4 w-4" />
                  <span>List Property</span>
                </button>
                </Link>
              )}
              
              {/* User Profile or Sign In */}
              {currentUser ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 focus:outline-none group"
                    aria-label="User menu"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:shadow-blue-500/50 transition-all ring-2 ring-blue-200 group-hover:ring-orange-300">
                      {getUserInitials()}
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block group-hover:text-blue-700 transition-colors" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-blue-100 overflow-hidden z-50">
                      {/* Profile Header */}
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-orange-50/30 border-b-2 border-blue-100">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-blue-900 truncate">
                              {getUserFullName()}
                            </p>
                            <p className="text-xs text-slate-600 truncate mt-0.5">
                              {currentUser.email}
                            </p>
                            {currentUser.authProvider && currentUser.authProvider !== 'email' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                                {currentUser.authProvider.charAt(0).toUpperCase() + currentUser.authProvider.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                          <UserCircle className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">My Profile</span>
                        </button>
                        
                        <button onClick={()=>router.push('/mylistings')} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">My Properties</span>
                        </button>
                        {currentUser?.role === 'superadmin' && (
                          <button onClick={()=>router.push('/superadmin/home')} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            <User2Icon className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Superadmin</span>
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setShowProfileMenu(false);
                            router.push('/settings/banner/upload');
                          }} 
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Settings</span>
                        </button>
                        
                        <div className="border-t-2 border-blue-100 my-2"></div>
                        
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors font-medium"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => openAuthModal('signin')}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-blue-500/50"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
              
              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden p-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-blue-100 bg-white">
            <div className="px-4 py-4 space-y-1">
              <button className="block w-full text-left px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                Buy
              </button>
              <button className="block w-full text-left px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                Rent
              </button>
              <button className="block w-full text-left px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                Sell
              </button>
              <button className="block w-full text-left px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                About
              </button>
              <button className="block w-full text-left px-4 py-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                Contact
              </button>
              
              <div className="pt-2 pb-1 space-y-2">
                <button className="block w-full text-left px-4 py-3 text-blue-700 hover:bg-blue-50 rounded-lg font-medium border-2 border-blue-200 transition-colors">
                  Join as Agent
                </button>
                
                {currentUser && (
                  <button className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 font-medium transition-all shadow-lg">
                    <Plus className="h-4 w-4" />
                    <span>List Property</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
            aria-hidden="true"
          />
          
          <div 
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border-2 border-blue-100"
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all z-10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8">
              {/* Modal Header */}
              <div className="text-center mb-8">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl inline-block mb-4 shadow-lg">
                  <Home className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent mb-2">
                  {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-slate-600">
                  {authMode === 'signin' ? 'Sign in to continue to Rexon' : 'Sign up to get started with Rexon'}
                </p>
              </div>

              {/* Toggle Tabs */}
              <div className="flex bg-blue-50 rounded-lg p-1 mb-6 border-2 border-blue-100">
                <button
                  onClick={() => {
                    setAuthMode('signin')
                    setError('')
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
                    authMode === 'signin'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup')
                    setError('')
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all ${
                    authMode === 'signup'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-orange-50 border-2 border-orange-200 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-700 font-medium">{error}</p>
                </div>
              )}
              
              {/* Social Sign In Buttons */}
              <div className="space-y-3 mb-6">
                <button 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
                
                <button 
                  onClick={handleMicrosoftSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#00A4EF">
                    <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
                  </svg>
                  <span>Continue with Microsoft</span>
                </button>
              </div>
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-blue-100"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500 font-medium">Or continue with email</span>
                </div>
              </div>
              
              {/* Sign In Form */}
              {authMode === 'signin' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="signin-email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                      <input
                        id="signin-email"
                        type="email"
                        value={signInData.email}
                        onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-11 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="signin-password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                      <input
                        id="signin-password"
                        type="password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                        placeholder="••••••••"
                        required
                        className="w-full pl-11 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <label htmlFor="remember" className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        id="remember"
                        type="checkbox" 
                        checked={signInData.rememberMe}
                        onChange={(e) => setSignInData({...signInData, rememberMe: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500 cursor-pointer" 
                      />
                      <span className="text-slate-700">Remember me</span>
                    </label>
                    <button className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  
                  <button
                    onClick={handleEmailSignIn}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-medium shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </div>
              )}

              {/* Sign Up Form */}
              {authMode === 'signup' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                        First Name
                      </label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                        <input
                          id="firstName"
                          type="text"
                          value={signUpData.firstName}
                          onChange={(e) => setSignUpData({...signUpData, firstName: e.target.value})}
                          placeholder="John"
                          required
                          className="w-full pl-11 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({...signUpData, lastName: e.target.value})}
                        placeholder="Doe"
                        required
                        className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                      <input
                        id="signup-email"
                        type="email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-11 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                      <input
                        id="phone"
                        type="tel"
                        value={signUpData.phone}
                        onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                        placeholder="+91 98765 43210"
                        className="w-full pl-11 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 pointer-events-none" />
                      <input
                        id="signup-password"
                        type="password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({...signUpData, password: e.target.value})}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className="w-full pl-11 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                  </div>
                  
                  <button
                    onClick={handleEmailSignUp}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 transition-all font-medium shadow-lg hover:shadow-orange-500/50 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}