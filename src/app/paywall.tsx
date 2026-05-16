import Constants from 'expo-constants';
import {
  ErrorCode,
  type Product,
  type ProductSubscription,
  type Purchase,
  type ExpoPurchaseError,
  useIAP,
} from 'expo-iap';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Icon } from '@/components/atoms/Icon';
import { NeonButton } from '@/components/atoms/NeonButton';
import { Pill } from '@/components/atoms/Pill';
import { BottomSheet } from '@/components/sheets/BottomSheet';
import { useEntitlements } from '@/hooks/useEntitlements';
import { ApiError } from '@/lib/api';
import {
  cancelSubscription,
  listIapProducts,
  postLivesPurchase,
  postSubscriptionPurchase,
  purchaseInputFrom,
  type BackendProduct,
} from '@/lib/api/iap';
import { PRIVACY_URL, TERMS_URL } from '@/data/legal';
import { Fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeContext';

const isExpoGo = Constants.appOwnership === 'expo';

interface UnifiedProduct {
  backend: BackendProduct;
  store: Product | ProductSubscription | null;
  available: boolean;
  localizedPrice: string | null;
}

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { entitlements, refresh: refreshEntitlements } = useEntitlements();

  const [backendProducts, setBackendProducts] = useState<BackendProduct[]>([]);
  const [productsError, setProductsError] = useState<Error | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const onPurchaseSuccess = useCallback(
    async (purchase: Purchase) => {
      const productId = purchase.productId;
      const backend = backendProducts.find((p) => p.id === productId);
      try {
        const input = purchaseInputFrom(productId, purchase.purchaseToken);
        if (backend?.kind === 'SUBSCRIPTION') {
          await postSubscriptionPurchase(input);
          await finishTransaction({ purchase, isConsumable: false });
        } else {
          await postLivesPurchase(input);
          await finishTransaction({ purchase, isConsumable: true });
        }
        await refreshEntitlements();
        router.back();
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Purchase verification failed';
        Alert.alert('Purchase failed', msg);
      } finally {
        setPurchasing(false);
      }
    },
    // finishTransaction comes from useIAP further down — TS sees the hoisted
    // const at the call site, but the lint rule can't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [backendProducts, refreshEntitlements, router],
  );

  const onPurchaseError = useCallback((error: ExpoPurchaseError) => {
    setPurchasing(false);
    if (error.code === ErrorCode.UserCancelled) return;
    Alert.alert('Purchase failed', error.message ?? 'Something went wrong.');
  }, []);

  const {
    connected,
    products: iapProducts,
    subscriptions: iapSubs,
    fetchProducts,
    requestPurchase,
    restorePurchases,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: (p) => void onPurchaseSuccess(p),
    onPurchaseError,
  });

  // Load backend product catalog once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const { items } = await listIapProducts();
        if (!cancelled) setBackendProducts(items);
      } catch (err) {
        if (!cancelled) setProductsError(err instanceof Error ? err : new Error('Failed'));
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch store info for the catalog as soon as both are available.
  useEffect(() => {
    if (!connected || backendProducts.length === 0 || isExpoGo) return;
    const subSkus = backendProducts.filter((p) => p.kind === 'SUBSCRIPTION').map((p) => p.id);
    const inAppSkus = backendProducts.filter((p) => p.kind === 'LIVES').map((p) => p.id);
    if (inAppSkus.length > 0) void fetchProducts({ skus: inAppSkus, type: 'in-app' });
    if (subSkus.length > 0) void fetchProducts({ skus: subSkus, type: 'subs' });
  }, [connected, backendProducts, fetchProducts]);

  const merged: UnifiedProduct[] = useMemo(() => {
    const byId = new Map<string, Product | ProductSubscription>();
    for (const p of iapProducts) byId.set(p.id, p);
    for (const p of iapSubs) byId.set(p.id, p);
    return backendProducts.map((b) => {
      const store = byId.get(b.id) ?? null;
      return {
        backend: b,
        store,
        available: !!store,
        localizedPrice: store?.displayPrice ?? null,
      };
    });
  }, [backendProducts, iapProducts, iapSubs]);

  const subProducts = merged.filter((p) => p.backend.kind === 'SUBSCRIPTION');
  const liveProducts = merged.filter((p) => p.backend.kind === 'LIVES');

  // Default selection: first available subscription, then first available lives.
  useEffect(() => {
    if (selectedId) return;
    const firstAvail = merged.find((p) => p.available);
    if (firstAvail) setSelectedId(firstAvail.backend.id);
  }, [merged, selectedId]);

  const onBuy = async () => {
    if (!selectedId || purchasing) return;
    const target = merged.find((m) => m.backend.id === selectedId);
    if (!target?.available) return;
    setPurchasing(true);
    try {
      if (target.backend.kind === 'SUBSCRIPTION') {
        await requestPurchase({
          request: { ios: { sku: selectedId }, android: { skus: [selectedId] } },
          type: 'subs',
        });
      } else {
        await requestPurchase({
          request: { ios: { sku: selectedId }, android: { skus: [selectedId] } },
          type: 'in-app',
        });
      }
    } catch (err) {
      // A throw here means we couldn't even open the store sheet — the success
      // path resolves via onPurchaseSuccess/onPurchaseError, not here.
      setPurchasing(false);
      const msg = err instanceof Error ? err.message : 'Could not start purchase';
      Alert.alert('Purchase failed', msg);
    }
  };

  const onRestore = async () => {
    try {
      await restorePurchases();
      await refreshEntitlements();
      Alert.alert('Restore complete', 'Eligible purchases have been restored.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Restore failed';
      Alert.alert('Restore failed', msg);
    }
  };

  const onCancel = async () => {
    try {
      await cancelSubscription();
      await refreshEntitlements();
      // Send the user to platform settings to actually cancel.
      const url =
        Platform.OS === 'ios'
          ? 'https://apps.apple.com/account/subscriptions'
          : 'https://play.google.com/store/account/subscriptions';
      Linking.openURL(url).catch(() => {});
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not cancel';
      Alert.alert('Cancel failed', msg);
    }
  };

  if (entitlements?.hasActiveSubscription) {
    return (
      <BottomSheet showHandle={false} title={<Pill color={theme.neon}>PREDICTO PRO</Pill>}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
          <ActiveSubPanel
            expiresAt={entitlements.subscription?.expiresAt}
            autoRenewing={entitlements.subscription?.autoRenewing ?? false}
            onCancel={onCancel}
          />
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet showHandle={false} title={<Pill color={theme.neon}>UPGRADE</Pill>}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <Text style={[styles.h2, { color: theme.text }]}>Want more action?</Text>
        <Text style={[styles.sub, { color: theme.text2 }]}>
          You get one free slip a day. Subscribe for unlimited, or buy lives to stack more.
        </Text>

        {isExpoGo ? <ExpoGoBanner /> : null}
        {productsLoading ? (
          <ActivityIndicator color={theme.text3} style={{ marginVertical: 32 }} />
        ) : null}
        {productsError ? (
          <Text style={{ color: theme.loss, fontFamily: Fonts.uiRegular, fontSize: 13 }}>
            {productsError.message}
          </Text>
        ) : null}

        <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 8 }}>
          {subProducts.length > 0 ? (
            <>
              <SectionLabel title="Subscriptions" />
              {subProducts.map((p) => (
                <ProductRow
                  key={p.backend.id}
                  product={p}
                  selected={selectedId === p.backend.id}
                  onSelect={() => setSelectedId(p.backend.id)}
                />
              ))}
            </>
          ) : null}
          {liveProducts.length > 0 ? (
            <>
              <SectionLabel title="Lives" />
              {liveProducts.map((p) => (
                <ProductRow
                  key={p.backend.id}
                  product={p}
                  selected={selectedId === p.backend.id}
                  onSelect={() => setSelectedId(p.backend.id)}
                />
              ))}
            </>
          ) : null}
        </ScrollView>

        <View style={{ marginTop: 16 }}>
          <Text style={[styles.terms, { color: theme.text3 }]}>
            Subscriptions auto-renew until cancelled. Manage or cancel in your{' '}
            {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} account settings at any time.
            One-time purchases (Lives) are non-refundable.
          </Text>
          <View style={styles.termsLinks}>
            <Pressable onPress={() => void Linking.openURL(TERMS_URL)}>
              <Text style={[styles.termsLink, { color: theme.text2 }]}>Terms of Service</Text>
            </Pressable>
            <Text style={[styles.termsDot, { color: theme.text3 }]}>·</Text>
            <Pressable onPress={() => void Linking.openURL(PRIVACY_URL)}>
              <Text style={[styles.termsLink, { color: theme.text2 }]}>Privacy Policy</Text>
            </Pressable>
          </View>
          <NeonButton onPress={onBuy}>{purchasing ? 'Processing…' : 'Buy now →'}</NeonButton>
        </View>

        <Pressable onPress={onRestore} style={{ paddingVertical: 12 }}>
          <Text style={[styles.restoreTxt, { color: theme.text2 }]}>Restore purchases</Text>
        </Pressable>

        <Text style={[styles.hint, { color: theme.text3 }]}>
          {entitlements
            ? `LIVES BALANCE: ${entitlements.livesBalance} · CANCEL ANYTIME`
            : 'PURCHASES VIA APP STORE · CANCEL ANYTIME'}
        </Text>
      </View>
    </BottomSheet>
  );
}

function ExpoGoBanner() {
  const theme = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.bannerTxt, { color: theme.text2 }]}>
        Real purchases require a custom dev build. The flow is wired but disabled in Expo Go.
      </Text>
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontFamily: Fonts.monoMedium,
        fontSize: 10,
        letterSpacing: 0.8,
        color: theme.text3,
        marginTop: 6,
        marginBottom: 2,
      }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function ActiveSubPanel({
  expiresAt,
  autoRenewing,
  onCancel,
}: {
  expiresAt: string | undefined;
  autoRenewing: boolean;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const date = expiresAt ? new Date(expiresAt) : null;
  return (
    <View style={{ paddingTop: 8 }}>
      <Text style={[styles.h2, { color: theme.text }]}>You&apos;re a Pro 🎉</Text>
      <Text style={[styles.sub, { color: theme.text2 }]}>
        Unlimited tickets, private groups, no ads.
      </Text>
      {date ? (
        <Text style={{ color: theme.text2, fontFamily: Fonts.uiRegular, fontSize: 13, marginBottom: 16 }}>
          {autoRenewing ? 'Renews' : 'Expires'} {date.toLocaleDateString()}
        </Text>
      ) : null}
      <Pressable
        onPress={onCancel}
        style={[styles.cancelBtn, { borderColor: theme.line }]}
      >
        <Text style={[styles.cancelTxt, { color: theme.text }]}>Manage subscription</Text>
      </Pressable>
    </View>
  );
}

function ProductRow({
  product,
  selected,
  onSelect,
}: {
  product: UnifiedProduct;
  selected: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const sub = product.backend.lives ? `${product.backend.lives} lives` : product.backend.description;
  const disabled = !product.available;
  return (
    <Pressable
      onPress={disabled ? undefined : onSelect}
      style={[
        styles.pack,
        {
          backgroundColor: selected ? theme.neonDim : theme.surface,
          borderColor: selected ? theme.neon : theme.line,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? theme.neon : theme.line,
            backgroundColor: selected ? theme.neon : 'transparent',
          },
        ]}
      >
        {selected ? <Icon name="check" size={14} color="#06091A" stroke={3} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.packLabel, { color: theme.text }]}>{product.backend.displayName}</Text>
        <Text style={[styles.packSub, { color: theme.text2 }]}>{sub}</Text>
        {disabled ? (
          <Text style={[styles.packSub, { color: theme.text3 }]}>Unavailable in your region</Text>
        ) : null}
      </View>
      <Text style={[styles.packPrice, { color: theme.text }]}>
        {product.localizedPrice ?? '—'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h2: {
    fontFamily: Fonts.dispBlack,
    fontSize: 26,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontFamily: Fonts.uiRegular,
    fontSize: 13.5,
    marginBottom: 18,
  },
  pack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packLabel: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
  packSub: {
    fontFamily: Fonts.monoRegular,
    fontSize: 11,
    marginTop: 2,
  },
  packPrice: {
    fontFamily: Fonts.dispBlack,
    fontSize: 16,
  },
  hint: {
    textAlign: 'center',
    fontFamily: Fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 10,
  },
  terms: {
    fontFamily: Fonts.uiRegular,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  termsLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  termsLink: {
    fontFamily: Fonts.dispBold,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  termsDot: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
  },
  banner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
  },
  bannerTxt: {
    fontFamily: Fonts.uiRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  restoreTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 13,
    textAlign: 'center',
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelTxt: {
    fontFamily: Fonts.dispBold,
    fontSize: 14,
  },
});
