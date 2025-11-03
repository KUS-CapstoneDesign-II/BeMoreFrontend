import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // vitest config lives in separate vitest.config.ts during dev/CI; not used in Vercel build
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
    sourcemap: false,
    // 이미지 최적화: 8KB 이하의 이미지는 base64로 인라인
    assetsInlineLimit: 8192,
    // CSS 최소화
    cssMinify: true,
    // 출력 파일명 최적화
    assetsDir: 'assets'
  },
  // 정적 파일 처리
  publicDir: 'public',
  // 이미지 포맷 최적화: 모던 포맷 지원
  assetsInclude: ['**/*.webp', '**/*.avif']
})
