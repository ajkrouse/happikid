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
  useEffect,
} from "react";
import { RefreshCw } from "lucide-react";

/**
 * Incremented by LazyErrorBoundaryInner each time the user clicks "Tap to
 * retry".  retryableLazy() reads this value and creates a brand-new
 * React.lazy() type whenever it changes, forcing the import() factory to run
 * again instead of replaying the cached rejection from the previous attempt.
 */
const RetryKeyContext = createContext(0);

/**
 * Called by <LoadSignal> (rendered inside the Suspense) when children mount
 * successfully, so the boundary can cancel its stall-detection timeout.
 */
const ClearTimeoutContext = createContext<(() => void) | null>(null);

/**
 * Rendered as the first child inside the Suspense.  When it mounts it means
 * the lazy content resolved, so we can cancel the stall-detection timeout.
 */
function LoadSignal() {
  const cancelStallTimeout = useContext(ClearTimeoutContext);
  useEffect(() => {
    cancelStallTimeout?.();
  }, [cancelStallTimeout]);
  return null;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Milliseconds to wait before treating a stalled Suspense as an error.
   *  Defaults to 8 000 ms (8 s).  Pass 0 to disable the timeout. */
  timeoutMs?: number;
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
 *
 * Additionally, a stall-detection timer is started on mount and on every retry.
 * If the Suspense has not resolved within `timeoutMs` the boundary transitions
 * to the error state, giving the user the same "Tap to retry" escape hatch for
 * slow / hung network requests.
 */
class LazyErrorBoundaryInner extends Component<
  Props & { timeoutMs: number },
  State
> {
  private stallTimerId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props & { timeoutMs: number }) {
    super(props);
    this.state = { hasError: false, retryKey: 0 };
  }

  // -------------------------------------------------------------------------
  // Stall-detection helpers
  // -------------------------------------------------------------------------

  private startStallTimer() {
    this.cancelStallTimer();
    const ms = this.props.timeoutMs;
    if (ms <= 0) return;
    this.stallTimerId = setTimeout(() => {
      // Only transition if we are not already showing the error UI.
      if (!this.state.hasError) {
        this.setState({ hasError: true });
      }
    }, ms);
  }

  /** Called by <LoadSignal> when children mount (i.e. load succeeded). */
  private cancelStallTimer = () => {
    if (this.stallTimerId !== null) {
      clearTimeout(this.stallTimerId);
      this.stallTimerId = null;
    }
  };

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  componentDidMount() {
    this.startStallTimer();
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    // Restart the timer whenever the user clicks "Tap to retry".
    if (prevState.retryKey !== this.state.retryKey) {
      this.startStallTimer();
    }
  }

  componentWillUnmount() {
    this.cancelStallTimer();
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
        <ClearTimeoutContext.Provider value={this.cancelStallTimer}>
          {this.props.children}
        </ClearTimeoutContext.Provider>
      </RetryKeyContext.Provider>
    );
  }
}

/**
 * Convenience wrapper: <LazyErrorBoundary fallback={...}> replaces a plain
 * <Suspense fallback={...}> and adds an error boundary around it automatically.
 *
 * A stall-detection timer starts when the boundary mounts.  If the inner
 * Suspense has not resolved within `timeoutMs` (default 8 000 ms) the boundary
 * transitions to the "Couldn't load this section" error UI so the user always
 * has a "Tap to retry" escape hatch instead of being stuck on an infinite
 * spinner.  The timer resets on every retry and is cancelled as soon as the
 * lazy children mount successfully.
 */
export function LazyErrorBoundary({
  children,
  fallback = null,
  timeoutMs = 8_000,
}: Props) {
  return (
    <LazyErrorBoundaryInner timeoutMs={timeoutMs}>
      <Suspense fallback={fallback}>
        {/* LoadSignal cancels the stall timer the moment content is ready. */}
        <LoadSignal />
        {children}
      </Suspense>
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
