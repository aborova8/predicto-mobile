import { api } from '@/lib/api';

export interface RegisteredDevice {
  id: string;
  expoPushToken: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  lastSeenAt: string;
}

export interface RegisterDeviceInput {
  platform: 'IOS' | 'ANDROID' | 'WEB';
  expoPushToken: string;
  appVersion?: string;
  nativeAppBuild?: string;
}

export function registerDevice(input: RegisterDeviceInput): Promise<{ device: RegisteredDevice }> {
  return api.post<{ device: RegisteredDevice }>('/api/notifications/devices', input);
}

export function unregisterDevice(expoPushToken: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(
    `/api/notifications/devices/${encodeURIComponent(expoPushToken)}`,
  );
}
