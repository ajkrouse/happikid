import { Component, type ReactNode } from "react";
import { Link } from "wouter";
import { WifiOff } from "lucide-react";
import { RetryKeyContext } from "@/components/LazyErrorBoundary";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
  isOffline: boolean;
  /** Incremented on each auto-retry so retryableLazy creates a fresh lazy type. */
  retryKey: number;
}

/**
 * Wraps the Suspense boundary so that lazy-chunk load failures
 * (network errors, hash mismatches after a deploy) show a friendly
 * fallback instead of a blank screen or silent spinner.
 *
 * Offline awareness:
 * - Detects navigator.onLine on mount and listens for online/offline events.
 * - When a chunk error occurs while offline, shows a distinct
 *   "You appear to be offline — we'll retry when you reconnect" message
 *   instead of prompting a reload that would also fail.
 * - When the device comes back online after a chunk error, the boundary
 *   increments retryKey (published via RetryKeyContext) and clears hasError.
 *   retryableLazy route components read the new retryKey and call a fresh
 *   React.lazy(factory), issuing a new network request for the chunk rather
 *   than replaying the cached rejection — no hard reload required.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isChunkError: false,
      isOffline: !navigator.onLine,
      retryKey: 0,
    };
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
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

  componentDidMount() {
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
  }

  /**
   * When connectivity returns after a chunk error, increment retryKey and
   * clear the error. retryableLazy components receive the new context value
   * and invoke a fresh React.lazy(factory) call — re-issuing the network
   * request rather than replaying the cached rejection.
   */
  private handleOnline = () => {
    this.setState((prev) => {
      if (prev.hasError && prev.isChunkError) {
        return {
          ...prev,
          isOffline: false,
          hasError: false,
          isChunkError: false,
          retryKey: prev.retryKey + 1,
        };
      }
      return { ...prev, isOffline: false };
    });
  };

  private handleOffline = () => {
    this.setState((prev) => ({ ...prev, isOffline: true }));
  };

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    // Log for observability without crashing the boundary itself
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Offline + chunk error: invite the user to wait rather than reload
      if (this.state.isOffline && this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="mb-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <WifiOff
                    className="h-8 w-8 text-gray-500"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                You appear to be offline
              </h1>
              <p className="text-gray-600 mb-6">
                We'll retry automatically when you reconnect.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Go home
              </Link>
            </div>
          </div>
        );
      }

      // Online or non-chunk error: show the standard reload prompt
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

    // Provide retryKey via context so retryableLazy route components re-invoke
    // their import() factory after an auto-retry triggered by reconnection.
    return (
      <RetryKeyContext.Provider value={this.state.retryKey}>
        {this.props.children}
      </RetryKeyContext.Provider>
    );
  }
}
