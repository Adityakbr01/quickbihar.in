/**
 * Vitest configuration for QuickBihar user-web.
 *
 * Kept separate from vite.config.ts so the heavy build plugins (React
 * Compiler, Tailwind, SSG prerender, compression) never run in tests.
 * Aliases + extension order mirror vite.config.ts exactly.
 */
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      { find: '@/src', replacement: path.resolve(import.meta.dirname ?? '.', './src') },
      { find: '@', replacement: path.resolve(import.meta.dirname ?? '.', './src') },
    ],
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  define: {
    // Same textual replacement vite.config.ts performs for the browser
    // bundle; points at a non-listening local origin so accidental real
    // requests fail fast instead of hitting production.
    'process.env.EXPO_PUBLIC_API_ORIGIN': JSON.stringify('http://localhost:4000'),
    'process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID': JSON.stringify(''),
    'process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID': JSON.stringify(''),
    'process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID': JSON.stringify(''),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    globals: false,
    testTimeout: 15000,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/seo/**',
        'src/**/*.d.ts',
      ],
    },
  },
})
