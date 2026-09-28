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
        { find: '@react-native-google-signin/google-signin', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/google-signin.web.ts') },
        { find: '@shopify/flash-list', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/shopify-flash-list.web.tsx') },
        { find: 'expo-image-picker', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-image-picker.web.ts') },
        { find: '@react-native-community/datetimepicker', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/datetimepicker.web.tsx') },
        { find: 'react-native-reanimated-carousel', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/react-native-reanimated-carousel.web.tsx') },
        { find: 'react-native-razorpay', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/react-native-razorpay.web.ts') },
        { find: 'react-native-reanimated', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/react-native-reanimated.web.tsx') },
        { find: 'react-native-safe-area-context', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/react-native-safe-area-context.web.tsx') },
        { find: 'react-native-svg', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/react-native-svg.web.tsx') },
        { find: 'react-native-webview', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/react-native-webview.web.tsx') },
        { find: '@lodev09/react-native-true-sheet', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/react-native-true-sheet.web.tsx') },
        { find: '@react-native-async-storage/async-storage', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/async-storage.web.ts') },
        { find: '@tanstack/query-async-storage-persister', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/query-async-storage-persister.web.ts') },
        { find: 'lottie-react-native', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/lottie-react-native.web.tsx') },
        { find: 'react-native-gesture-handler', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/react-native-gesture-handler.web.tsx') },
        { find: 'expo-modules-core', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-modules-core.web.ts') },
        { find: '@expo/vector-icons', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-vector-icons.web.tsx') },
        { find: 'expo-linear-gradient', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-linear-gradient.web.tsx') },
        { find: 'expo-location', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-location.web.ts') },
        { find: 'expo-image', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-image.web.tsx') },
        { find: 'expo-linking', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-linking.web.ts') },
        { find: 'expo-secure-store', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-secure-store.web.ts') },
        { find: 'expo-constants', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-constants.web.ts') },
        { find: 'expo-device', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-device.web.ts') },
        { find: 'expo-notifications', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-notifications.web.ts') },
        { find: 'expo-web-browser', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-web-browser.web.ts') },
        { find: 'expo-symbols', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-symbols.web.tsx') },
        { find: 'expo-blur', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-blur.web.tsx') },
        { find: 'expo-splash-screen', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-splash-screen.web.ts') },
        { find: 'expo-status-bar', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo-status-bar.web.tsx') },
        { find: 'expo', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/expo.web.ts') },
        { find: 'react-native', replacement: path.resolve(import.meta.dirname ?? '.', './src/shims/react-native.web.tsx') },
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
