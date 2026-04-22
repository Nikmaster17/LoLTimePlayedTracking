import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Gaming Time Tracker</h1>
        <p className="text-gray-600 mb-8">
          Log your gaming sessions, track your streaks, and see your stats.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
