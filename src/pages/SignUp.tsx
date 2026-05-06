import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { hashPassword } from '../auth/crypto'
import { findUserByEmail, saveUser } from '../auth/users'
import { createSession, getSession } from '../auth/session'

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export default function SignUp() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (getSession()) navigate('/dashboard', { replace: true })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (findUserByEmail(email)) {
      setError('An account with this email already exists.')
      return
    }

    setLoading(true)
    try {
      const passwordHash = await hashPassword(password)
      const user = {
        id: generateId(),
        email,
        name,
        passwordHash,
        createdAt: Date.now(),
      }
      saveUser(user)
      createSession(user.id, user.email, user.name)
      navigate('/dashboard', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-0 md:p-6 lg:p-12 bg-background">
      <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden soft-elevation border border-outline-variant/30">
        {/* Left branding panel */}
        <div className="relative hidden md:flex flex-col justify-between p-12 bg-primary-container text-white overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-40">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl" />
            <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-tertiary-fixed/10 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-lg teal-gradient flex items-center justify-center shadow-lg">
                <span
                  className="material-symbols-outlined text-white"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  cloud_done
                </span>
              </div>
              <span className="font-headline-md text-headline-md font-bold tracking-tight">Lumina Finance</span>
            </div>
            <h1 className="font-display-xl text-display-xl leading-tight mb-6">
              Experience Financial Serenity
            </h1>
            <p className="font-body-lg text-body-lg text-on-primary-container max-w-md opacity-90">
              Join a community of professionals mastering their wealth with clarity and precision through our minimalist interface.
            </p>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                <span className="font-label-xs text-label-xs uppercase tracking-widest text-secondary-fixed">
                  Trusted by 10k+ users
                </span>
              </div>
              <p className="font-label-sm text-label-sm italic text-outline-variant">
                "Lumina transformed how I view my investments. The interface is quiet, capable, and truly serene."
              </p>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex flex-col p-8 md:p-12 lg:p-16 justify-center bg-surface">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Create Account</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Your journey to financial clarity starts here.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Display Name */}
              <div className="space-y-1">
                <label className="font-label-xs text-label-xs text-on-surface-variant uppercase ml-1" htmlFor="display-name">
                  Display Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors">
                      person
                    </span>
                  </div>
                  <input
                    id="display-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-outline-variant focus:border-secondary focus:ring-0 pl-10 py-3 font-body-md text-on-surface transition-all placeholder:text-outline/50 outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="font-label-xs text-label-xs text-on-surface-variant uppercase ml-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors">
                      mail
                    </span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-outline-variant focus:border-secondary focus:ring-0 pl-10 py-3 font-body-md text-on-surface transition-all placeholder:text-outline/50 outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="font-label-xs text-label-xs text-on-surface-variant uppercase ml-1" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-secondary transition-colors">
                      lock
                    </span>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-outline-variant focus:border-secondary focus:ring-0 pl-10 pr-10 py-3 font-body-md text-on-surface transition-all placeholder:text-outline/50 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-error-container px-4 py-3 text-label-sm font-label-sm text-on-error-container">
                  {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full teal-gradient text-white py-4 px-6 rounded-lg font-headline-md text-headline-md shadow-lg active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account…' : 'Start Journey'}
                  {!loading && (
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  )}
                </button>
              </div>
            </form>

            <div className="my-10 flex items-center gap-4">
              <div className="h-[1px] flex-grow bg-outline-variant/30" />
              <span className="font-label-xs text-label-xs text-outline uppercase tracking-widest">Or social join</span>
              <div className="h-[1px] flex-grow bg-outline-variant/30" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-outline-variant/50 hover:bg-surface-container-low transition-colors font-label-sm text-label-sm"
              >
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-outline-variant/50 hover:bg-surface-container-low transition-colors font-label-sm text-label-sm"
              >
                <span className="material-symbols-outlined text-on-surface">apple</span>
                Apple
              </button>
            </div>

            <p className="mt-12 text-center font-body-md text-body-md text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="text-secondary font-bold hover:underline underline-offset-4 ml-1">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
