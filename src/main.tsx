import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { WorkspaceProvider } from "@/lib/workspace-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toast";
import App from "@/App";
import "@/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <WorkspaceProvider>
        <App />
        <Toaster />
      </WorkspaceProvider>
    </ErrorBoundary>
  </StrictMode>
);
