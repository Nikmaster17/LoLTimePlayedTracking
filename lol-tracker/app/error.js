'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-lol-dark-navy p-4">
      <div className="bg-lol-panel-gradient rounded-[2px] shadow-lol-card border border-lol-border-gold p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-lol-gold-primary mb-2 tracking-wider uppercase">
          Something went wrong
        </h1>
        <p className="text-lol-text-secondary mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="bg-lol-teal-primary text-lol-dark-navy rounded-[2px] px-6 py-2 font-medium transition-shadow hover:shadow-lol-teal-glow"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
