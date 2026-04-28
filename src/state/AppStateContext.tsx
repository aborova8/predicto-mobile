import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { POSTS } from '@/data/posts';
import { calculateTotalOdds } from '@/lib/format';
import type { FeedLayout, Pick, Post, TicketVariant } from '@/types/domain';

type Picks = Record<string, Pick | null>;
type FeedFilter = 'global' | 'friends';

interface AppStateCtx {
  authed: boolean;
  setAuthed: (v: boolean) => void;

  posts: Post[];
  setPosts: (p: Post[]) => void;
  likePost: (postId: string) => void;

  picks: Picks;
  setPick: (matchId: string, pick: Pick | null) => void;
  clearPicks: () => void;
  pickCount: number;

  ticketsLeft: number;
  setTicketsLeft: (n: number) => void;
  buyTickets: (n: number) => void;

  filter: FeedFilter;
  setFilter: (f: FeedFilter) => void;

  ticketVariant: TicketVariant;
  setTicketVariant: (v: TicketVariant) => void;

  feedLayout: FeedLayout;
  setFeedLayout: (v: FeedLayout) => void;

  submitSlip: () => void;
}

const AppStateContext = createContext<AppStateCtx | null>(null);

const TICKET_VARIANT_KEY = 'predicto.ticketVariant';
const FEED_LAYOUT_KEY = 'predicto.feedLayout';

export function AppStateProvider({ children }: PropsWithChildren) {
  const [authed, setAuthed] = useState(false);
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [picks, setPicks] = useState<Picks>({});
  const [ticketsLeft, setTicketsLeft] = useState(1);
  const [filter, setFilter] = useState<FeedFilter>('global');
  const [ticketVariant, setTicketVariantState] = useState<TicketVariant>('slip');
  const [feedLayout, setFeedLayoutState] = useState<FeedLayout>('card');

  useEffect(() => {
    AsyncStorage.multiGet([TICKET_VARIANT_KEY, FEED_LAYOUT_KEY]).then((entries) => {
      const map = Object.fromEntries(entries);
      const tv = map[TICKET_VARIANT_KEY];
      const fl = map[FEED_LAYOUT_KEY];
      if (tv === 'slip' || tv === 'card') setTicketVariantState(tv);
      if (fl === 'card' || fl === 'compact') setFeedLayoutState(fl);
    });
  }, []);

  const setTicketVariant = useCallback((v: TicketVariant) => {
    setTicketVariantState(v);
    AsyncStorage.setItem(TICKET_VARIANT_KEY, v).catch(() => {});
  }, []);

  const setFeedLayout = useCallback((v: FeedLayout) => {
    setFeedLayoutState(v);
    AsyncStorage.setItem(FEED_LAYOUT_KEY, v).catch(() => {});
  }, []);

  const likePost = useCallback((postId: string) => {
    setPosts((prev) => {
      const idx = prev.findIndex((p) => p.id === postId);
      if (idx === -1) return prev;
      const target = prev[idx];
      const next = prev.slice();
      next[idx] = {
        ...target,
        liked: !target.liked,
        likes: target.liked ? target.likes - 1 : target.likes + 1,
      };
      return next;
    });
  }, []);

  const setPick = useCallback((matchId: string, pick: Pick | null) => {
    setPicks((prev) => {
      if ((prev[matchId] ?? null) === pick) return prev;
      return { ...prev, [matchId]: pick };
    });
  }, []);

  const clearPicks = useCallback(() => setPicks({}), []);

  const buyTickets = useCallback((n: number) => {
    setTicketsLeft((prev) => prev + n);
  }, []);

  const submitSlip = useCallback(() => {
    setTicketsLeft(0);
    const legs = Object.entries(picks)
      .filter((entry): entry is [string, Pick] => entry[1] !== null && entry[1] !== undefined)
      .map(([matchId, pick]) => ({ matchId, pick }));
    if (legs.length === 0) return;
    const totalOdds = calculateTotalOdds(legs);
    const newPost: Post = {
      id: `p_new_${Date.now()}`,
      userId: 'u1',
      timeAgo: 'now',
      likes: 0,
      liked: false,
      comments: 0,
      caption: "Just locked it in. Let's ride.",
      ticket: {
        id: `tnew_${Date.now()}`,
        stake: 10,
        status: 'pending',
        potential: Math.round(10 * totalOdds),
        legs,
      },
    };
    setPosts((prev) => [newPost, ...prev]);
    setPicks({});
  }, [picks]);

  const pickCount = useMemo(
    () => Object.values(picks).filter((p) => p !== null && p !== undefined).length,
    [picks],
  );

  const value = useMemo<AppStateCtx>(
    () => ({
      authed, setAuthed,
      posts, setPosts, likePost,
      picks, setPick, clearPicks, pickCount,
      ticketsLeft, setTicketsLeft, buyTickets,
      filter, setFilter,
      ticketVariant, setTicketVariant,
      feedLayout, setFeedLayout,
      submitSlip,
    }),
    [
      authed, posts, likePost, picks, setPick, clearPicks, pickCount,
      ticketsLeft, buyTickets, filter, ticketVariant, setTicketVariant,
      feedLayout, setFeedLayout, submitSlip,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateCtx {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
