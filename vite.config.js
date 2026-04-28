import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: "autoUpdate", // Actualiza la app automáticamente si subes cambios
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Cotizador Herrajes",
        short_name: "Cotizador",
        description: "Generador de cotizaciones para Herrajes Tiscareño",
        theme_color: "#8B1E2D", // El rojo oscuro de tu barra superior
        background_color: "#2F2F2F", // El fondo oscuro de tu app
        display: "standalone", // ESTO ES CLAVE: Oculta la barra del navegador (URL) para que parezca app nativa
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable", // Ayuda a que Android adapte la forma del icono
          },
        ],
      },
    }),
  ],
});
