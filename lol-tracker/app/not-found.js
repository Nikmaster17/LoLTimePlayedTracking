import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lol-dark-navy">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-lol-gold-primary mb-4 tracking-widest">404</h1>
        <p className="text-xl font-semibold text-lol-gold-light mb-2">Page not found</p>
        <p className="text-lol-text-secondary mb-8">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="bg-lol-teal-primary text-lol-dark-navy rounded-[2px] px-6 py-2 font-medium transition-shadow hover:shadow-lol-teal-glow"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
