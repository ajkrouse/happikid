import {
  Component,
  ComponentType,
  ComponentPropsWithoutRef,
  createContext,
  lazy,
  LazyExoticComponent,
  ReactNode,
  Suspense,
  useContext,
} from "react";
import { RefreshCw } from "lucide-react";

/**
 * Incremented by LazyErrorBoundaryInner each time the user clicks "Tap to
 * retry".  retryableLazy() reads this value and creates a brand-new
 * React.lazy() type whenever it changes, forcing the import() factory to run
 * again instead of replaying the cached rejection from the previous attempt.
 */
const RetryKeyContext = createContext(0);

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  /** Incremented on each retry so that retryableLazy() creates a fresh lazy
   *  type and re-invokes the underlying import() factory. */
  retryKey: number;
}

/**
 * Class-based error boundary that catches chunk-load failures from React.lazy().
 * Wrap each <Suspense> block with this to show a friendly retry message instead
 * of a blank screen or full crash when a dynamic import fails.
 *
 * On retry, retryKey is incremented and published via RetryKeyContext.
 * retryableLazy() components read that key and call React.lazy(factory) fresh,
 * which re-executes the import() call so the browser issues a new network
 * request for the chunk rather than reusing the previously-failed lazy type's
 * cached rejection.  If the chunk is still unavailable, getDerivedStateFromError
 * catches the new failure and the fallback UI reappears — no infinite spinner.
 */
class LazyErrorBoundaryInner extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryKey: 0 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  private handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      retryKey: prev.retryKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-brand-evergreen/20 bg-brand-sage/50 px-6 py-8 text-center text-sm text-text-muted">
          <RefreshCw className="h-5 w-5 text-action-teal" />
          <p className="font-medium text-brand-evergreen">Couldn't load this section</p>
          <button
            onClick={this.handleRetry}
            className="rounded-md bg-action-teal px-4 py-1.5 text-xs font-semibold text-white hover:bg-action-teal/90 transition-colors"
          >
            Tap to retry
          </button>
        </div>
      );
    }

    return (
      <RetryKeyContext.Provider value={this.state.retryKey}>
        {this.props.children}
      </RetryKeyContext.Provider>
    );
  }
}

/**
 * Convenience wrapper: <LazyErrorBoundary fallback={...}> replaces a plain
 * <Suspense fallback={...}> and adds an error boundary around it automatically.
 */
export function LazyErrorBoundary({ children, fallback = null }: Props) {
  return (
    <LazyErrorBoundaryInner>
      <Suspense fallback={fallback}>{children}</Suspense>
    </LazyErrorBoundaryInner>
  );
}

/**
 * Drop-in replacement for React.lazy() that re-invokes the import() factory
 * whenever the nearest LazyErrorBoundary retries.
 *
 * React.lazy() attaches its promise (including any rejection) to the lazy
 * component type it returns.  Retrying with the same type always replays the
 * cached failure.  retryableLazy() fixes this by creating a brand-new
 * React.lazy(factory) call — and therefore a new type with no cached promise —
 * each time the enclosing LazyErrorBoundary increments its retry key.
 *
 * Usage (replaces React.lazy at the module level):
 *   const MapView = retryableLazy(() => import("@/components/MapView"));
 */
export function retryableLazy<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): ComponentType<ComponentPropsWithoutRef<T>> {
  // Keyed by retryKey so the same lazy instance is reused within a single
  // attempt but a fresh one is created for every retry.
  const lazyCache = new Map<number, LazyExoticComponent<T>>();

  function RetryableLazy(props: ComponentPropsWithoutRef<T>) {
    const retryKey = useContext(RetryKeyContext);
    if (!lazyCache.has(retryKey)) {
      lazyCache.set(retryKey, lazy(factory));
    }
    const LazyComp = lazyCache.get(retryKey)!;
    return <LazyComp {...(props as any)} />;
  }

  RetryableLazy.displayName = "RetryableLazy";
  return RetryableLazy;
}
