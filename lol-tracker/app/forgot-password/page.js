'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a password reset link.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lol-dark-navy">
      <div className="w-full max-w-md bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-8">
        <h1 className="text-2xl font-bold mb-2 text-center text-lol-gold-primary tracking-wider uppercase">
          Forgot password
        </h1>
        <p className="text-lol-text-secondary text-sm text-center mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-lol-text-primary" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-lol-panel-light border border-lol-border-gold text-lol-text-primary rounded-[2px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lol-teal-primary placeholder-lol-text-muted"
            />
          </div>
          {error && <p className="text-lol-red-accent text-sm">{error}</p>}
          {message && <p className="text-lol-gold-light text-sm">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-lol-teal-primary text-lol-dark-navy rounded-[2px] py-2 font-medium transition-shadow hover:shadow-lol-teal-glow disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-lol-text-secondary">
          Remember your password?{' '}
          <Link href="/login" className="text-lol-teal-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
