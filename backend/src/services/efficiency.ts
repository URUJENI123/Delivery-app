/**
 * Courier Efficiency Scoring
 * ──────────────────────────
 * Computes a 0–100 efficiency score for a courier based on four weighted signals
 * and persists it to couriers.reliability_score.
 *
 * Score breakdown:
 *   40% — Average star rating  (avgRating / 5.0)
 *   30% — Completion rate      (delivered / (delivered + cancelled + failed))
 *   20% — On-time rate         (delivered within agreedDeliveryTime minutes)
 *   10% — Volume bonus         (min(totalDeliveries, 200) / 200)
 *
 * This score is recalculated every time a delivery is completed or cancelled,
 * so it always reflects the courier's most recent performance.
 *
 * The score is used to:
 *   1. Sort available-job broadcasts — highest-score couriers get notified first
 *   2. Sort the available-jobs list returned to senders
 *   3. Power the admin "top couriers" dashboard widget
 */

import prisma from '../lib/prisma';
import { withCache, cacheDel } from '../lib/cache';

const WEIGHTS = {
  rating:     0.40,
  completion: 0.30,
  onTime:     0.20,
  volume:     0.10,
} as const;

const MAX_VOLUME_DELIVERIES = 500; // volume bonus caps at 500 — realistic for an experienced Kigali courier

// On-time buffer: 25% grace period accounts for Kigali hills, traffic and rain
const ONTIME_BUFFER = 1.25;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Recalculate and persist the efficiency score for a single courier.
 * Call this after every delivery completion or cancellation.
 */
export async function recalculate(courierUserId: string): Promise<number> {
  const courier = await prisma.courier.findUnique({
    where: { userId: courierUserId },
    select: { id: true, avgRating: true, totalDeliveries: true },
  });
  if (!courier) return 0;

  // ── Pull delivery stats directly from DB ─────────────────────────────────
  const [delivered, cancelled, failed, onTimeCount] = await Promise.all([
    prisma.delivery.count({
      where: { courierId: courier.id, status: 'DELIVERED' },
    }),
    prisma.delivery.count({
      where: { courierId: courier.id, status: 'CANCELLED' },
    }),
    prisma.delivery.count({
      where: { courierId: courier.id, status: { in: ['FAILED', 'DISPUTED'] } },
    }),
    // On-time: delivered AND completed within agreed time window
    // We compare deliveredAt − deliveryStartedAt against agreedDeliveryTime (minutes)
    prisma.delivery.count({
      where: {
        courierId: courier.id,
        status:    'DELIVERED',
        agreedDeliveryTime: { not: null },
        AND: [
          { deliveredAt:      { not: null } },
          { deliveryStartedAt: { not: null } },
          // Prisma doesn't support column-to-column comparison in count directly,
          // so we use a raw filter via a whereRaw workaround with a subquery below.
          // This is handled by the onTimeRaw query instead.
        ],
      },
    }),
  ]);

  // More accurate on-time count using raw SQL (column comparison)
  let onTime = 0;
  try {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count
      FROM deliveries
      WHERE courier_id   = ${courier.id}
        AND status        = 'DELIVERED'
        AND delivered_at  IS NOT NULL
        AND delivery_started_at IS NOT NULL
        AND agreed_delivery_time IS NOT NULL
        AND EXTRACT(EPOCH FROM (delivered_at - delivery_started_at)) / 60
            <= agreed_delivery_time * ${ONTIME_BUFFER}
    `;
    onTime = Number(rows[0]?.count ?? 0);
  } catch {
    // Fallback: use the approximate count from Prisma if raw query fails
    onTime = onTimeCount;
  }

  // ── Compute each component (0–1) ─────────────────────────────────────────

  // 1. Rating component
  const ratingScore = Math.min(Math.max((courier.avgRating ?? 0) / 5.0, 0), 1);

  // 2. Completion rate component
  const totalAttempted = delivered + cancelled + failed;
  const completionScore = totalAttempted > 0 ? delivered / totalAttempted : 0;

  // 3. On-time rate component (only meaningful once there are delivered orders)
  const onTimeScore = delivered > 0 ? Math.min(onTime / delivered, 1) : 0;

  // 4. Volume bonus component (capped)
  const volumeScore = Math.min((courier.totalDeliveries ?? 0) / MAX_VOLUME_DELIVERIES, 1);

  // ── Weighted sum → 0–100 ─────────────────────────────────────────────────
  const raw =
    ratingScore     * WEIGHTS.rating     +
    completionScore * WEIGHTS.completion +
    onTimeScore     * WEIGHTS.onTime     +
    volumeScore     * WEIGHTS.volume;

  const score = Math.round(raw * 100);

  // ── Persist ──────────────────────────────────────────────────────────────
  await prisma.courier.update({
    where: { userId: courierUserId },
    data:  { reliabilityScore: score },
  });

  console.log(
    `[Efficiency] Courier ${courierUserId} → score ${score} ` +
    `(rating=${(ratingScore * 100).toFixed(0)}% ` +
    `completion=${(completionScore * 100).toFixed(0)}% ` +
    `onTime=${(onTimeScore * 100).toFixed(0)}% ` +
    `volume=${(volumeScore * 100).toFixed(0)}%)`,
  );

  // Invalidate the cached stats + ranked list so they reflect the new score
  cacheDel(`efficiency:stats:${courierUserId}`).catch(() => {});
  cacheDel('efficiency:ranked').catch(() => {});

  return score;
}

/**
 * Returns couriers sorted by efficiency score descending.
 * Used when broadcasting a new job — best couriers get notified first.
 */
export async function getRankedOnlineCouriers(): Promise<{
  id: string;
  userId: string;
  currentLat: number | null;
  currentLng: number | null;
  reliabilityScore: number;
  user: { phone: string | null; fullName: string | null } | null;
}[]> {
  // 5s TTL — courier online/GPS state is near-real-time; a few seconds of
  // staleness is invisible but removes a DB query per broadcast.
  return withCache(
    'efficiency:ranked',
    5,
    () => prisma.courier.findMany({
      where: {
        isOnline:          true,
        isApprovedByAdmin: true,
        currentLat:        { not: null },
        currentLng:        { not: null },
      },
      include: {
        user: { select: { phone: true, fullName: true } },
      },
      orderBy: { reliabilityScore: 'desc' },
    }) as any,
  );
}

/**
 * Returns a ranking summary for a single courier.
 * Shown on the courier's own profile and admin courier list.
 */
export async function getCourierStats(courierUserId: string) {
  // 30s TTL — the score only changes when a delivery completes/cancels/rates,
  // and recalculate() invalidates this key immediately when that happens.
  return withCache(`efficiency:stats:${courierUserId}`, 30, async () => {
    const courier = await prisma.courier.findUnique({
      where: { userId: courierUserId },
      select: {
        id:               true,
        avgRating:        true,
        totalDeliveries:  true,
        completionRate:   true,
        reliabilityScore: true,
      },
    });
    if (!courier) return null;

    const [delivered, cancelled, failed] = await Promise.all([
      prisma.delivery.count({ where: { courierId: courier.id, status: 'DELIVERED' } }),
      prisma.delivery.count({ where: { courierId: courier.id, status: 'CANCELLED' } }),
      prisma.delivery.count({ where: { courierId: courier.id, status: { in: ['FAILED', 'DISPUTED'] } } }),
    ]);

    const totalAttempted  = delivered + cancelled + failed;
    const completionRate  = totalAttempted > 0 ? Math.round((delivered / totalAttempted) * 100) : 0;

    // Tier label based on score
    const score = courier.reliabilityScore ?? 0;
    const tier =
      score >= 85 ? 'Premier'   :
      score >= 70 ? 'Trusted'   :
      score >= 50 ? 'Active'    :
      score >= 30 ? 'Learning'  : 'New';

    return {
      reliabilityScore: score,
      tier,
      avgRating:        courier.avgRating,
      totalDeliveries:  delivered,
      completionRate,
      cancelled,
      failed,
    };
  });
}
