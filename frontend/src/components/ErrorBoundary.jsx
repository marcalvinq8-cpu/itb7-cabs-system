import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FADBD8]/30 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-[#FADBD8] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-[#C0392B]" />
          </div>
          <h1 className="text-xl font-bold text-[#1C2833] mb-2">Something went wrong</h1>
          <p className="text-sm text-[#717D7E] mb-6">
            An unexpected error occurred. You can try refreshing the page or go back to the dashboard.
          </p>
          {import.meta.env.DEV && (
            <pre className="text-left text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 overflow-auto max-h-32 text-red-600">
              {this.state.error?.message}
            </pre>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.setState({ error: null })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C0392B] text-white text-sm font-medium hover:bg-[#96281B] transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#1C2833] hover:bg-gray-50 transition-colors"
            >
              <Home className="h-4 w-4" /> Go Home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
