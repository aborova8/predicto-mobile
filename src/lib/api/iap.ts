import { Platform } from 'react-native';

import { api } from '@/lib/api';

export const IAP_PLATFORM = { APPLE: 'APPLE', GOOGLE: 'GOOGLE' } as const;
export type IapPlatform = (typeof IAP_PLATFORM)[keyof typeof IAP_PLATFORM];
export const IAP_PLATFORM_FOR_OS: IapPlatform =
  Platform.OS === 'ios' ? IAP_PLATFORM.APPLE : IAP_PLATFORM.GOOGLE;

export type IapKind = 'SUBSCRIPTION' | 'LIVES';
export type IapSubscriptionStatus = 'ACTIVE' | 'IN_GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED';

export interface BackendProduct {
  id: string;
  kind: IapKind;
  lives?: number;
  displayName: string;
  description: string;
}

export interface BackendSubscription {
  productId: string;
  platform: IapPlatform;
  status: IapSubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  autoRenewing: boolean;
}

export interface BackendEntitlements {
  hasActiveSubscription: boolean;
  subscription: BackendSubscription | null;
  livesBalance: number;
  flags: {
    hideAds: boolean;
    unlimitedTickets: boolean;
    canCreatePrivateGroup: boolean;
  };
}

export interface PurchaseInput {
  platform: IapPlatform;
  productId: string;
  // iOS sends the JWS receipt; Android sends the purchase token. Backend
  // accepts both fields and picks the right one based on `platform`.
  receipt?: string;
  purchaseToken?: string;
}

// expo-iap exposes a unified `purchaseToken` (iOS JWS or Android purchase token)
// on the Purchase object. The backend keeps separate fields for historical
// reasons; this helper packs the token under the right key for the platform.
export function purchaseInputFrom(productId: string, token: string | null | undefined): PurchaseInput {
  return {
    platform: IAP_PLATFORM_FOR_OS,
    productId,
    receipt: IAP_PLATFORM_FOR_OS === IAP_PLATFORM.APPLE ? token ?? undefined : undefined,
    purchaseToken: IAP_PLATFORM_FOR_OS === IAP_PLATFORM.GOOGLE ? token ?? undefined : undefined,
  };
}

export interface BackendIapTransaction {
  id: string;
  platform: IapPlatform;
  kind: IapKind;
  productId: string;
  transactionId: string;
  livesGranted: number | null;
  createdAt: string;
}

export function listIapProducts(): Promise<{ items: BackendProduct[] }> {
  return api.get<{ items: BackendProduct[] }>('/api/iap/products');
}

export function getEntitlements(): Promise<{ entitlements: BackendEntitlements }> {
  return api.get<{ entitlements: BackendEntitlements }>('/api/iap/entitlements');
}

export function postSubscriptionPurchase(
  input: PurchaseInput,
): Promise<{ subscription: BackendSubscription; entitlements: BackendEntitlements }> {
  return api.post('/api/iap/subscription', input);
}

export function cancelSubscription(): Promise<{ subscription: BackendSubscription }> {
  return api.post<{ subscription: BackendSubscription }>('/api/iap/subscription/cancel');
}

export function postLivesPurchase(input: PurchaseInput): Promise<{
  livesGranted: number;
  livesBalance: number;
  alreadyApplied: boolean;
  entitlements: BackendEntitlements;
}> {
  return api.post('/api/iap/lives', input);
}

export function listIapTransactions(): Promise<{ items: BackendIapTransaction[] }> {
  return api.get<{ items: BackendIapTransaction[] }>('/api/iap/transactions');
}
