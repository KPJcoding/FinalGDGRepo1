import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/auth": "http://localhost:3000",
      "/questions": {
        target: "http://localhost:3000",
        changeOrigin: true,
        bypass: (req, res, options) => {
          const accept = req.headers.accept;
          if (accept && accept.includes('text/html')) {
            return req.url;
          }
        }
      },
      "/answers": "http://localhost:3000",
      "/votes": "http://localhost:3000",
      "/users": "http://localhost:3000",
      "/api": "http://localhost:3000",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
