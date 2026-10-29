import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Kancatura: render failure", error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "var(--background, #fafafa)",
          color: "var(--foreground, #0a0a0a)",
          fontFamily: '"Manrope Variable", Manrope, sans-serif'
        }}
      >
        <div style={{ maxWidth: "560px", display: "grid", gap: "12px" }}>
          <h1 style={{ margin: 0, fontSize: "22px" }}>Kancatura could not start</h1>
          <p style={{ margin: 0, color: "var(--muted-foreground, #737373)", lineHeight: 1.6 }}>
            Something in the workspace failed to render. Your data is stored locally in this browser and has not been
            changed.
          </p>
          <pre
            style={{
              margin: 0,
              padding: "12px",
              overflowX: "auto",
              border: "1px solid var(--border, #e5e5e5)",
              borderRadius: "8px",
              background: "var(--surface, #fff)",
              fontFamily: '"JetBrains Mono Variable", monospace',
              fontSize: "12px",
              whiteSpace: "pre-wrap"
            }}
          >
            {error.message || "Unknown render error"}
          </pre>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              style={{
                padding: "8px 14px",
                border: "1px solid var(--primary, #111)",
                borderRadius: "8px",
                background: "var(--primary, #111)",
                color: "var(--background, #fafafa)",
                font: "inherit",
                cursor: "pointer"
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 14px",
                border: "1px solid var(--border, #e5e5e5)",
                borderRadius: "8px",
                background: "var(--surface, #fff)",
                color: "var(--foreground, #0a0a0a)",
                font: "inherit",
                cursor: "pointer"
              }}
            >
              Reload workspace
            </button>
          </div>
          <p style={{ margin: 0, color: "var(--muted-foreground, #737373)", fontSize: "12px" }}>
            If this keeps happening, export your workspace from Settings and report the message above.
          </p>
        </div>
      </div>
    );
  }
}