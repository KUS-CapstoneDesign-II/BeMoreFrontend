import api from '../services/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const reg = await getServiceWorkerRegistration();
  if (!reg || !('pushManager' in reg)) return null;

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!publicKey) {
    console.warn('VAPID public key missing (VITE_VAPID_PUBLIC_KEY)');
    return null;
  }

  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Send to backend
    try {
      await api.post('/api/notifications/subscribe', sub.toJSON());
    } catch (e) {
      console.warn('Failed to register subscription on backend', e);
    }

    return sub;
  } catch (e) {
    console.error('Push subscribe failed', e);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const reg = await getServiceWorkerRegistration();
  if (!reg || !('pushManager' in reg)) return false;
  const existing = await reg.pushManager.getSubscription();
  if (!existing) return true;
  try {
    const info = existing.toJSON();
    await existing.unsubscribe();
    try {
      await api.post('/api/notifications/unsubscribe', { endpoint: info.endpoint });
    } catch {}
    return true;
  } catch (e) {
    console.error('Unsubscribe failed', e);
    return false;
  }
}
