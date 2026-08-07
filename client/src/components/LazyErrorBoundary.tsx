import { Component, ReactNode, Suspense } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Class-based error boundary that catches chunk-load failures from React.lazy().
 * Wrap each <Suspense> block with this to show a friendly retry message instead
 * of a blank screen or full crash when a dynamic import fails.
 */
class LazyErrorBoundaryInner extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-brand-evergreen/20 bg-brand-sage/50 px-6 py-8 text-center text-sm text-text-muted">
          <RefreshCw className="h-5 w-5 text-action-teal" />
          <p className="font-medium text-brand-evergreen">Couldn't load this section</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="rounded-md bg-action-teal px-4 py-1.5 text-xs font-semibold text-white hover:bg-action-teal/90 transition-colors"
          >
            Tap to retry
          </button>
        </div>
      );
    }

    return this.props.children;
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
