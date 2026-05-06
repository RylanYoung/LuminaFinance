import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { hashPassword } from '../auth/crypto'
import { findUserByEmail } from '../auth/users'
import { createSession, getSession } from '../auth/session'
import { checkLockout, recordFailure, resetAttempts } from '../auth/rateLimit'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (getSession()) navigate('/dashboard', { replace: true })
  }, [navigate])

  // Tick down lockout countdown
  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [countdown])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')

      const { locked, remainingMs } = checkLockout(email)
      if (locked) {
        setCountdown(Math.ceil(remainingMs / 1000))
        setError(`Too many attempts. Try again in ${Math.ceil(remainingMs / 1000)}s.`)
        return
      }

      setLoading(true)
      try {
        const user = findUserByEmail(email)
        if (!user) {
          const { locked: nowLocked, attemptsLeft } = recordFailure(email)
          if (nowLocked) {
            setCountdown(30)
            setError('Too many attempts. Locked out for 30 seconds.')
          } else {
            setError(`Invalid email or password. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.`)
          }
          return
        }

        const hash = await hashPassword(password)
        if (hash !== user.passwordHash) {
          const { locked: nowLocked, attemptsLeft } = recordFailure(email)
          if (nowLocked) {
            setCountdown(30)
            setError('Too many attempts. Locked out for 30 seconds.')
          } else {
            setError(`Invalid email or password. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.`)
          }
          return
        }

        resetAttempts(email)
        createSession(user.id, user.email, user.name)
        navigate('/dashboard', { replace: true })
      } finally {
        setLoading(false)
      }
    },
    [email, password, navigate],
  )

  const isLockedOut = countdown > 0

  return (
    <main className="flex w-full min-h-screen overflow-hidden">
      {/* Left branding panel */}
      <section className="hidden lg:flex lg:w-1/2 relative bg-primary-container items-center justify-center p-container-padding overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container via-[#1a2640] to-[#0d1520]" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-primary-container/40 to-transparent" />
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="mb-stack-gap flex items-center gap-unit">
            <span className="material-symbols-outlined text-secondary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_balance
            </span>
            <span className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">Lumina Finance</span>
          </div>
          <h1 className="font-display-xl text-display-xl text-white mb-stack-gap">
            Clarity in wealth is the ultimate luxury
          </h1>
          <p className="font-body-lg text-body-lg text-on-primary-container max-w-md">
            Experience financial serenity through an interface designed for professionals who demand precision and elegance.
          </p>
        </div>
        <div className="absolute bottom-12 left-12 flex gap-gutter">
          <div className="w-12 h-1 bg-secondary rounded-full" />
          <div className="w-4 h-1 bg-outline-variant/30 rounded-full" />
          <div className="w-4 h-1 bg-outline-variant/30 rounded-full" />
        </div>
      </section>

      {/* Right form panel */}
      <section className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-surface px-container-padding py-section-margin relative">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-unit">
          <span className="material-symbols-outlined text-secondary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_balance
          </span>
          <span className="font-headline-md text-headline-md font-bold text-tertiary">Lumina Finance</span>
        </div>

        <div className="w-full max-w-[440px]">
          <header className="mb-section-margin">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-unit">Welcome back</h2>
            <p className="font-body-md text-body-md text-outline">Access your financial dashboard and insights.</p>
          </header>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-stack-gap mb-section-margin">
            <button
              type="button"
              className="flex items-center justify-center gap-gutter py-3 px-4 border border-outline-variant rounded-lg font-label-sm text-on-surface-variant hover:bg-surface-container-low transition-all active:scale-95"
            >
              <span className="font-label-sm text-label-sm">Google</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-gutter py-3 px-4 border border-outline-variant rounded-lg font-label-sm text-on-surface-variant hover:bg-surface-container-low transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
                apple
              </span>
              <span>Apple</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-section-margin">
            <div className="w-full border-t border-outline-variant/30" />
            <span className="absolute px-4 bg-surface text-label-xs font-label-xs text-outline uppercase tracking-widest">
              or sign in with email
            </span>
          </div>

          <form className="space-y-stack-gap" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-label-xs text-outline uppercase" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLockedOut}
                className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface placeholder:text-outline-variant form-input-focus disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-xs text-label-xs text-outline uppercase" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLockedOut}
                className="bg-transparent border-0 border-b border-outline-variant py-3 px-0 font-body-md text-on-surface placeholder:text-outline-variant form-input-focus disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-error-container px-4 py-3 text-label-sm font-label-sm text-on-error-container">
                {isLockedOut ? (
                  <span>
                    Account locked. Try again in <span className="font-bold">{countdown}s</span>.
                  </span>
                ) : (
                  error
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isLockedOut}
              className="w-full teal-gradient text-white py-4 rounded-lg font-headline-md text-headline-md shadow-ambient active:translate-y-px transition-all mt-stack-gap disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : isLockedOut ? `Locked (${countdown}s)` : 'Sign In'}
            </button>
          </form>

          <footer className="mt-section-margin text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              New to Lumina?{' '}
              <Link to="/signup" className="text-secondary font-semibold hover:underline ml-unit">
                Create account
              </Link>
            </p>
          </footer>
        </div>

        <div className="absolute bottom-8 flex gap-stack-gap opacity-60">
          <a href="#" className="font-label-xs text-label-xs text-outline hover:text-on-surface uppercase">
            Privacy Policy
          </a>
          <a href="#" className="font-label-xs text-label-xs text-outline hover:text-on-surface uppercase">
            Terms of Service
          </a>
          <a href="#" className="font-label-xs text-label-xs text-outline hover:text-on-surface uppercase">
            Support
          </a>
        </div>
      </section>
    </main>
  )
}
