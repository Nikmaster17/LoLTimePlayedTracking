'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setMessage('Account created! Check your email to confirm, then log in.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lol-dark-navy">
      <div className="w-full max-w-md bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-lol-gold-primary tracking-wider uppercase">
          Create an account
        </h1>
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
          <div>
            <label className="block text-sm font-medium mb-1 text-lol-text-primary" htmlFor="password">
              Password
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
          {message && <p className="text-lol-gold-light text-sm">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-lol-teal-primary text-lol-dark-navy rounded-[2px] py-2 font-medium transition-shadow hover:shadow-lol-teal-glow disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-lol-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-lol-teal-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
