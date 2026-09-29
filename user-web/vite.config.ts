import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.VITE_API_ORIGIN || env.EXPO_PUBLIC_API_ORIGIN || 'https://quickbihar.in'
  const googleWebClientId = env.VITE_GOOGLE_WEB_CLIENT_ID || env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ''
  const googleIosClientId = env.VITE_GOOGLE_IOS_CLIENT_ID || env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || ''
  const googleAndroidClientId = env.VITE_GOOGLE_ANDROID_CLIENT_ID || env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || ''

  return {
    plugins: [
      react(),
      tailwindcss(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    resolve: {
      alias: [
        { find: 'expo-notifications', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-notifications.web.ts') },
        { find: '@/src', replacement: path.resolve(import.meta.dirname ?? '.', './src') },
        { find: '@', replacement: path.resolve(import.meta.dirname ?? '.', './src') },
      ],
      extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.jsx', '.js', '.json'],
    },
    define: {
      'process.env.EXPO_PUBLIC_API_ORIGIN': JSON.stringify(apiOrigin),
      'process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID': JSON.stringify(googleWebClientId),
      'process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID': JSON.stringify(googleIosClientId),
      'process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID': JSON.stringify(googleAndroidClientId),
    },
  }
})
