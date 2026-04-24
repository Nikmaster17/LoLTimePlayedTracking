import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-amber-400">Gaming Time Tracker</h1>
        <p className="text-gray-400 mb-8">
          Log your gaming sessions, track your streaks, and see your stats.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-500"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="border border-teal-600 text-teal-400 px-6 py-2 rounded-lg font-medium hover:bg-teal-900"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
