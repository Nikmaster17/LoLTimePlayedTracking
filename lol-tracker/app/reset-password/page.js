'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [expired, setExpired] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => setExpired(true), 5000)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        clearTimeout(timeout)
        setReady(true)
      }
    })
    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lol-dark-navy">
        {expired ? (
          <div className="text-center">
            <p className="text-lol-text-primary font-medium mb-2">Reset link is invalid or expired.</p>
            <Link href="/forgot-password" className="text-lol-teal-primary hover:underline text-sm">
              Request a new one
            </Link>
          </div>
        ) : (
          <p className="text-lol-text-secondary">Verifying reset link...</p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lol-dark-navy">
      <div className="w-full max-w-md bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-lol-gold-primary tracking-wider uppercase">
          Set new password
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-lol-text-primary" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary placeholder-lol-text-muted"
            />
          </div>
          {error && <p className="text-lol-red-accent text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-lol-teal-primary text-lol-dark-navy rounded-[2px] py-2 font-medium transition-shadow hover:shadow-lol-teal-glow disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
