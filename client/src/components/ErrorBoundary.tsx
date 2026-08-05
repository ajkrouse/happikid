import { Component, type ReactNode } from "react";
import { Link } from "wouter";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

/**
 * Wraps the Suspense boundary so that lazy-chunk load failures
 * (network errors, hash mismatches after a deploy) show a friendly
 * "Reload page" prompt instead of a blank screen or silent spinner.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    // Detect dynamic import / chunk failures (network drop mid-navigation or deploy hash mismatch)
    const isChunkError =
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("Importing a module script failed") ||
      message.includes("ChunkLoadError") ||
      message.includes("Loading chunk") ||
      message.includes("Loading CSS chunk") ||
      message.includes("Failed to fetch") ||
      message.includes("NetworkError");

    return { hasError: true, isChunkError };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    // Log for observability without crashing the boundary itself
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="mb-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {this.state.isChunkError
                ? "New version available"
                : "Something went wrong"}
            </h1>
            <p className="text-gray-600 mb-6">
              {this.state.isChunkError
                ? "A newer version of this page is available. Reload to get the latest."
                : "An unexpected error occurred. Reloading the page usually fixes it."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Reload page
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
