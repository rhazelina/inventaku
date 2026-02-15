// src/components/ErrorBoundary.jsx
import { Component } from "react";
import { AlertCircle, RefreshCw, Home, HelpCircle } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ errorInfo });
    
    // You can log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  renderErrorDetails() {
    const { error, errorInfo } = this.state;
    if (!error) return null;

    return (
      <div className="mt-6 w-full max-w-2xl mx-auto">
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Error Details</span>
            <button
              onClick={() => {
                const text = `Error: ${error.message}\n\nStack: ${error.stack}\n\nComponent Stack: ${errorInfo?.componentStack}`;
                navigator.clipboard.writeText(text);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Copy to clipboard
            </button>
          </div>
          <div className="p-4 font-mono text-xs overflow-auto max-h-60">
            <div className="text-red-600 font-semibold mb-2">{error.toString()}</div>
            {error.stack && (
              <>
                <div className="text-gray-500 mb-1">Stack trace:</div>
                <pre className="text-gray-700 whitespace-pre-wrap mb-4">
                  {error.stack}
                </pre>
              </>
            )}
            {errorInfo?.componentStack && (
              <>
                <div className="text-gray-500 mb-1">Component stack:</div>
                <pre className="text-gray-700 whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
          <div className="text-center max-w-2xl">
            <div className="relative inline-flex mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center animate-pulse">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              We encountered an unexpected error while loading this page.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 inline-block">
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Error message:</p>
                <code className="bg-white/50 px-2 py-1 rounded">
                  {this.state.error?.message || "Unknown error"}
                </code>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Page
              </button>
              
              <button
                onClick={() => window.location.href = "/dashboard"}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300"
              >
                <Home className="w-5 h-5" />
                Go to Dashboard
              </button>
            </div>

            {import.meta.env.DEV && this.renderErrorDetails()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;