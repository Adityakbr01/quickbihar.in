import React, { Component, ComponentType, PropsWithChildren } from "react";
import { CommonErrorFallback, ErrorFallbackProps } from "./ErrorFallback";

export type { ErrorFallbackProps };

export type ErrorBoundaryProps = PropsWithChildren<{
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, stackTrace: string) => void;
}>;

type ErrorBoundaryState = { error: Error | null };

/**
 * Generic React error boundary.
 *
 * ponytail: moved from Jewelery/components/ — error boundaries have zero
 * business logic and should be available to all verticals.
 *
 * React only provides error boundary functionality through lifecycle methods
 * (componentDidCatch and getDerivedStateFromError) which are not available
 * in functional components.
 * https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static defaultProps: { FallbackComponent: ComponentType<ErrorFallbackProps> } =
    { FallbackComponent: CommonErrorFallback };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info.componentStack);
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render() {
    const { FallbackComponent } = this.props;
    return this.state.error && FallbackComponent ? (
      <FallbackComponent error={this.state.error} resetError={this.resetError} />
    ) : (
      this.props.children
    );
  }
}
