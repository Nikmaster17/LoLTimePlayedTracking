import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-700 mb-4">404</h1>
        <p className="text-xl font-semibold text-white mb-2">Page not found</p>
        <p className="text-gray-400 mb-8">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="bg-teal-600 text-white rounded-lg px-6 py-2 font-medium hover:bg-teal-500"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
