import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: [
      { find: '@/src', replacement: path.resolve(import.meta.dirname ?? '.', './src') },
      { find: '@', replacement: path.resolve(import.meta.dirname ?? '.', './src') },
    ],
    // Prefer ".web" variants like Metro does (e.g. openRazorpayCheckout.web.ts).
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  define: {
    // Copied mobile code reads process.env.EXPO_PUBLIC_* — mapped to VITE_*
    // twins from .env, so all 268 mobile files stay byte-identical.
    'process.env.EXPO_PUBLIC_API_ORIGIN': 'import.meta.env.VITE_API_ORIGIN',
    'process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID': 'import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID',
    'process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID': 'import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID',
    'process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID': 'import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID',
  },
})
