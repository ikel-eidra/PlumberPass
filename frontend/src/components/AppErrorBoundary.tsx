import React from "react";

const RUNTIME_ERROR_STORAGE_KEY = "pp_last_runtime_error_v1";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

const persistRuntimeError = (error: Error, componentStack?: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RUNTIME_ERROR_STORAGE_KEY,
      JSON.stringify({
        message: error.message,
        name: error.name,
        stack: error.stack ?? null,
        componentStack: componentStack ?? null,
        capturedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Ignore storage failures so the fallback UI can still render.
  }
};

export default class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    persistRuntimeError(error, info.componentStack);
    console.error("PlumberPass runtime error", error, info);
  }

  handleReload = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.location.reload();
  };

  handleReturnHome = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.location.assign("/");
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="app-error-shell" role="alert">
        <div className="app-error-card">
          <p className="app-error-eyebrow">PlumberPass runtime guard</p>
          <h1>One screen hit an app error.</h1>
          <p className="app-error-copy">
            The app caught a runtime failure and stopped the current screen before it could fully
            break. Reload the app first. If it happens again, send this screen as the bug report.
          </p>
          <div className="app-error-detail">
            <strong>{this.state.error.name || "Error"}</strong>
            <span>{this.state.error.message || "Unknown runtime error."}</span>
          </div>
          <div className="app-error-actions">
            <button type="button" onClick={this.handleReload}>
              Reload app
            </button>
            <button type="button" className="ghost" onClick={this.handleReturnHome}>
              Return home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
