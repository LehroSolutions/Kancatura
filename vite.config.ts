import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

// Static SPA served by any file host, so the policy ships as a meta tag. It is
// injected at build time only: the dev server needs inline HMR styles and a
// websocket connection that the production policy must not allow.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // Tailwind and the chart SVGs inject inline styles.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Convex sync is the only outbound call the app makes; the deployment URL is
  // configured through VITE_CONVEX_URL.
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join("; ");

function contentSecurityPolicy(): Plugin {
  return {
    name: "kancatura-csp",
    apply: "build",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY },
          injectTo: "head-prepend"
        }
      ];
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), contentSecurityPolicy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});