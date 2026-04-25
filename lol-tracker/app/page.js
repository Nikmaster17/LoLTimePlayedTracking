import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lol-dark-navy">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-lol-gold-primary tracking-widest uppercase">
          League Of Legends Playtime Tracker
        </h1>
        <p className="text-lol-text-secondary mb-8">
          Log your gaming sessions, track your streaks, and see your stats.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-lol-teal-primary text-lol-dark-navy px-6 py-2 rounded-[2px] font-medium transition-shadow hover:shadow-lol-teal-glow"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="border border-lol-border-bright text-lol-gold-light px-6 py-2 rounded-[2px] font-medium hover:bg-lol-gold-subtle"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
