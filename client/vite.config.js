import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url"
import path from 'path';;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: "index.html",
      output: {
        manualChunks: {
          // Core libraries
          react: ["react", "react-dom"],
          redux: ["@reduxjs/toolkit", "react-redux"],
          router: ["react-router-dom"],

          // UI libraries
          mui: ["@mui/material", "@emotion/react", "@emotion/styled"],
          radix: [
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          motion: ["framer-motion", "motion"],

          // Editors & Markdown
          markdown: [
            "@uiw/react-md-editor",
            "@uiw/react-markdown-editor",
            "@uiw/react-markdown-preview",
            "remark-math",
            "rehype-katex",
            "rehype-raw",
            "rehype-highlight",
            "katex",
          ],

          // Utility
          utils: [
            "axios",
            "date-fns",
            "slugify",
            "clsx",
            "class-variance-authority",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0", // Allow external access
    port: 5173,
    strictPort: true,
  },
});
