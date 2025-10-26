import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/v1/store": {
        target: "https://staging-api.sync360.africa",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
