/**
 * @file vite.config.ts
 * Vite configuration for QuickBihar user-web.
 *
 * - React 19 + React Compiler via `@vitejs/plugin-react` + `@rolldown/plugin-babel`
 * - Tailwind CSS v4 via `@tailwindcss/vite`
 * - SSG via `vite-prerender-plugin` (entry: `src/seo/prerender.tsx`)
 * - Gzip via `vite-plugin-compression` + Brotli via native `node:zlib`
 * - Event-loop cleanup so SSG builds never hang on sockets/ports
 * - Vendor chunk splitting for a lean initial bundle
 */

import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import compression from 'vite-plugin-compression'
import { vitePrerenderPlugin } from 'vite-prerender-plugin'
import path from 'node:path'
import http from 'node:http'
import https from 'node:https'
import { MessagePort } from 'node:worker_threads'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'


// React 18/19 scheduler keeps a Node MessagePort open → unref it so
// `vite build` can exit after prerendering finishes.
if (MessagePort && MessagePort.prototype) {
  const origOn = Object.getOwnPropertyDescriptor(MessagePort.prototype, 'onmessage')
  if (origOn && origOn.set) {
    Object.defineProperty(MessagePort.prototype, 'onmessage', {
      set(fn) {
        origOn.set!.call(this, fn)
        const port = this as MessagePort & { unref?: () => void }
        if (fn && typeof port.unref === 'function') port.unref()
      },
      get() {
        return origOn.get?.call(this)
      },
      configurable: true,
      enumerable: true,
    })
  }
}

/**
 * Pre-compress text assets with Brotli level 11 (served directly by Nginx/CF).
 * A dedicated pass (not a second vite-plugin-compression instance) because the
 * plugin keeps a module-level mtime cache — the second instance sees every
 * file as already compressed and silently emits zero .br files (verified in
 * dist). Runs after the gzip plugin; skips its .gz outputs via the filter.
 */
function brotliStatic(threshold = 1024): Plugin {
  const filter = /\.(js|css|html|svg|json)$/i
  return {
    name: 'brotli-static',
    apply: 'build',
    closeBundle() {
      const walk = (dir: string): void => {
        for (const entry of readdirSync(dir)) {
          const full = join(dir, entry)
          if (statSync(full).isDirectory()) {
            walk(full)
            continue
          }
          if (!filter.test(full) || full.endsWith('.br')) continue
          const size = statSync(full).size
          if (size < threshold) continue
          const compressed = brotliCompressSync(readFileSync(full), {
            params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
          })
          writeFileSync(`${full}.br`, compressed)
        }
      }
      walk('dist')
    },
  }
}

/** Destroy pooled keep-alive sockets + unref lingering handles after build. */
function eventLoopCleanup(): Plugin {
  return {
    name: 'event-loop-cleanup',
    apply: 'build',
    closeBundle() {
      http.globalAgent.destroy()
      https.globalAgent.destroy()
      // @ts-expect-error internal node handle inspector
      const handles = process._getActiveHandles?.() ?? []
      for (const h of handles) {
        if (typeof h?.destroy === 'function') h.destroy()
        else if (typeof h?.unref === 'function') h.unref()
      }
      setTimeout(() => process.exit(0), 100)
    },
  }
}

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
      babel({ presets: [reactCompilerPreset()] }),
      // SSG: prerenders static + product/mall/category routes with per-route
      // head + JSON-LD. Entry stays inside src/seo (no extra folder).
      vitePrerenderPlugin({
        prerenderScript: path.resolve(import.meta.dirname ?? '.', 'src/seo/prerender.tsx'),
        renderTarget: '#root',
      }),
      // @ts-expect-error vite-plugin-compression ships CJS-style types; callable at runtime
      compression({ algorithm: 'gzip', threshold: 1024 }),
      brotliStatic(),
      eventLoopCleanup(),
    ],
    resolve: {
      alias: [
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
    build: {
      minify: 'esbuild',
      cssMinify: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 500,
      reportCompressedSize: false,
      rollupOptions: {
        // Silence only warnings we cannot fix in our own code:
        // - EVAL inside lottie-web (third-party, ships direct eval)
        // - SOURCEMAP_BROKEN from @tailwindcss/vite (benign upstream chain gap;
        //   this build emits no sourcemaps)
        onwarn(warning: any, defaultHandler: any) {
          const code = warning?.code as string | undefined;
          const id = (warning?.id as string | undefined) || '';
          if (code === 'EVAL' && id.includes('lottie')) return;
          if (code === 'SOURCEMAP_BROKEN') return;
          defaultHandler(warning);
        },
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            const p = id.replace(/\\/g, '/')
            if (/motion|framer-motion/.test(p)) return 'motion'
            if (/lenis/.test(p)) return 'lenis'
            if (/react-helmet-async/.test(p)) return 'helmet'
            // NOTE: no manual chunk for lottie/embla — both are imported by
            // first-paint code (hero carousel needs embla; LazyLottie is only
            // ever reached via React.lazy dynamic import). Forcing them into
            // named chunks made Rolldown park the shared react/jsx-runtime
            // CJS wrapper inside the lottie chunk, so the entry statically
            // imported a 323 KB "lazy" chunk (measured in dist). Default
            // code-splitting keeps shared runtime with the entry and emits
            // lottie-react as a true async chunk.
            if (/\/leaflet\//.test(p)) return 'leaflet'
            if (/date-fns|dayjs|react-day-picker/.test(p)) return 'date'
            // NOTE: no manual chunk for react-hook-form/zod — same mixed
            // CJS/ESM interop trap as query/axios (see below): forcing them
            // into their own chunk duplicated the full React CJS runtime
            // (~130 KB) into it, which the entry then statically imported
            // for ErrorBoundary. Default chunking keeps a single React copy
            // and emits the form libs as true async chunks (lazy routes only).
            if (/socket\.io-client|engine\.io/.test(p)) return 'socket'
            if (/@tanstack\//.test(p)) return 'query'
            if (/lucide-react|@radix-ui|radix-ui/.test(p)) return 'ui-vendor'
            if (/react-router/.test(p)) return 'router'
            if (/\/react\/|\/react-dom\/|\/scheduler\//.test(p)) return 'react'
            // NOTE: no manual chunk for @tanstack/react-query/axios/socket.io —
            // forcing them into their own chunk duplicates the React CJS runtime
            // into it (mixed CJS/ESM interop), which the entry then statically
            // imports. Default code-splitting keeps a single React copy.
            return undefined
          },
        },
      },
    },
  }
})
