/**
 * Service Worker 등록 유틸리티
 *
 * PWA를 위한 Service Worker를 등록하고 관리합니다.
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registered:', registration.scope);

      // 업데이트 확인
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 새로운 버전이 사용 가능
              console.log('🔄 New Service Worker available');

              // 사용자에게 새로고침 권장 (선택사항)
              if (confirm('새로운 버전이 있습니다. 업데이트하시겠습니까?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return null;
    }
  }

  console.warn('⚠️ Service Workers are not supported');
  return null;
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const result = await registration.unregister();
        console.log('🗑️ Service Worker unregistered:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ Service Worker unregistration failed:', error);
    }
  }
  return false;
}

/**
 * PWA 설치 가능 여부 확인 및 설치 프롬프트
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function initPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('💾 PWA install prompt ready');
    // Optionally dispatch a custom event so UI can show an install banner
    window.dispatchEvent(new CustomEvent('pwa:install-ready'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    deferredPrompt = null;
  });
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('⚠️ PWA install prompt not available');
    return false;
  }

  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  console.log(`PWA install ${outcome}`);
  deferredPrompt = null;

  return outcome === 'accepted';
}

export function isPWAInstallable(): boolean {
  return deferredPrompt !== null;
}
