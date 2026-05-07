import { useAppState } from '@/state/AppStateContext';
import type { BackendEntitlements } from '@/lib/api/iap';

export interface UseEntitlementsResult {
  entitlements: BackendEntitlements | null;
  hasActiveSub: boolean;
  livesBalance: number;
  flags: BackendEntitlements['flags'];
  refresh: () => Promise<void>;
}

const FALLBACK_FLAGS: BackendEntitlements['flags'] = {
  hideAds: false,
  unlimitedTickets: false,
  canCreatePrivateGroup: false,
};

export function useEntitlements(): UseEntitlementsResult {
  const { entitlements, refreshEntitlements } = useAppState();
  return {
    entitlements,
    hasActiveSub: entitlements?.hasActiveSubscription ?? false,
    livesBalance: entitlements?.livesBalance ?? 0,
    flags: entitlements?.flags ?? FALLBACK_FLAGS,
    refresh: refreshEntitlements,
  };
}
