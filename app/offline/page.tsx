import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <WifiOff className="h-12 w-12 text-gray-300 mx-auto" />
        <h1 className="text-xl font-bold text-gray-900">You&apos;re Offline</h1>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          S-WAPPER needs an internet connection. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
