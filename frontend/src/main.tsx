import React from "react";
import ReactDOM from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./styles/index.css";

const RUNTIME_ERROR_STORAGE_KEY = "pp_last_runtime_error_v1";
const isNativeRuntime = Capacitor.isNativePlatform();

const persistRuntimeError = (payload: Record<string, string | null>) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RUNTIME_ERROR_STORAGE_KEY,
      JSON.stringify({
        ...payload,
        capturedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Ignore storage failures so runtime logging never becomes the next failure.
  }
};

if (typeof document !== "undefined") {
  document.documentElement.dataset.runtime = isNativeRuntime ? "native" : "web";
}

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const error = event.error as Error | undefined;
    persistRuntimeError({
      source: "window.error",
      name: error?.name ?? "Error",
      message: error?.message ?? event.message ?? "Unknown window error",
      stack: error?.stack ?? null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason =
      event.reason instanceof Error
        ? event.reason
        : new Error(typeof event.reason === "string" ? event.reason : "Unhandled promise rejection");

    persistRuntimeError({
      source: "window.unhandledrejection",
      name: reason.name,
      message: reason.message,
      stack: reason.stack ?? null,
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {
        // Keep dev startup quiet even if a stale service worker fails to unregister.
      });
    });
  });
} else if (Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {
        // Native builds should not keep a PWA cache layer.
      });
    });
  });
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Keep the app usable even when PWA registration fails.
    });
  });
}
