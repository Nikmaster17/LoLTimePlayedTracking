'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lol-dark-navy">
      <div className="w-full max-w-md bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-lol-gold-primary tracking-wider uppercase">
          Log in
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
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-lol-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-lol-teal-primary hover:underline">
            Sign up
          </Link>
        </p>
        <p className="text-center text-sm mt-2 text-lol-text-secondary">
          <Link href="/forgot-password" className="text-lol-teal-primary hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  )
}
