import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react-ui";
          if (id.includes("node_modules/three/")) return "three-core";
          if (id.includes("node_modules/@react-three/")) return "react-three";
        },
      },
    },
  },
});
