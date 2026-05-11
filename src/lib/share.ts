import { Share } from 'react-native';

import { calculateTotalOdds } from '@/lib/format';
import type { Post } from '@/types/domain';

// Must match the `predictomobile` URL scheme registered in app.json.
const APP_URL_SCHEME = 'predictomobile';

export async function sharePost(post: Post): Promise<void> {
  const legs = post.ticket.legs.length;
  // Re-derive odds from legs rather than dividing potential / 10 — potential
  // is rounded on the server.
  const totalOdds = calculateTotalOdds(post.ticket.legs);
  const link = `${APP_URL_SCHEME}://comments?postId=${encodeURIComponent(post.id)}`;
  const summary =
    legs === 1
      ? `${post.author.username} on Predicto — single pick at ${totalOdds.toFixed(2)}×`
      : `${post.author.username} on Predicto — ${legs}-leg slip at ${totalOdds.toFixed(2)}×`;

  try {
    await Share.share({ message: `${summary}\n${link}` });
  } catch {
    // Dismissed; the share sheet already communicated success/cancel itself.
  }
}
