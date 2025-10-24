import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      provider: 'v8',
      reportsDirectory: './coverage',
      exclude: [...configDefaults.coverage.exclude!, 'src/**/__tests__/helpers/**']
    },
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  build: {
    // 코드 분할 최적화
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 라이브러리 분리
          'react-vendor': ['react', 'react-dom'],
          // MediaPipe 관련 라이브러리 분리
          'mediapipe-vendor': ['@mediapipe/face_mesh', '@mediapipe/camera_utils'],
          // API 및 유틸리티 분리
          'utils': ['axios', 'zustand']
        }
      }
    },
    // 청크 크기 경고 임계값 (500KB)
    chunkSizeWarningLimit: 500,
    // 압축 최적화 (esbuild 사용 - 더 빠름)
    minify: 'esbuild',
    // Source map 비활성화 (프로덕션)
    sourcemap: false
  }
})
