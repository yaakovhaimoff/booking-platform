import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-gray-700">404</h1>
      <p className="text-gray-400">Page not found.</p>
      <Link to="/" className="text-indigo-600 hover:underline">Back to home</Link>
    </div>
  )
}
