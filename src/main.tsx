import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy-load App so module-level crashes (e.g. missing env vars in supabase client)
// are caught by ErrorBoundary instead of producing a white screen
const App = React.lazy(() => import("./App.tsx"));

// Global safety net for unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("[Unhandled Rejection]", event.reason);
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  console.error("[Global Error]", event.error);
});

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  </ErrorBoundary>
);
