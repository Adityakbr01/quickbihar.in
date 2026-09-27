import React, { Component, ErrorInfo, ReactNode } from "react";

export interface Props {
  children: ReactNode;
}

export type ErrorBoundaryProps = Props;
export type ErrorFallbackProps = { error: Error; resetErrorBoundary: () => void };

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error Boundary error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: "#333", fontFamily: "sans-serif", backgroundColor: "#fff", minHeight: "100vh" }}>
          <h2>Something went wrong in the application.</h2>
          <pre style={{ color: "#d32f2f", backgroundColor: "#ffebee", padding: 16, borderRadius: 8, overflowX: "auto" }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 16px", backgroundColor: "#007AFF", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 12 }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
