"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("UI error boundary caught:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-12 text-center min-h-[300px]">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="font-medium">Something went wrong here.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
          </div>
          <button
            onClick={this.reset}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
