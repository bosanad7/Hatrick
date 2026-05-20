/**
 * Hattrick Heroes — Smart Pricing Engine
 *
 * Pricing tiers:
 *  - 1 player:   72 KWD (normal rate)
 *  - 2-3 players: 60 KWD each (+ free clothing set)
 *  - 4+ players:  50 KWD each (+ free clothing set included)
 *
 * Single session: 10 KWD
 * Trial session:  0 KWD (free)
 */

export type PricingTier = "STANDARD" | "FAMILY" | "LARGE_FAMILY";

export interface PricingInput {
  /** Total players this parent is registering (across all subs) */
  playerCount: number;
  /** Subscription type for each line */
  type: "NEW_MEMBERSHIP" | "RENEWAL" | "SINGLE_SESSION" | "TRIAL_SESSION";
  /** Coupon discount (already validated, flat KWD amount off per player) */
  couponDiscount?: number;
}

export interface PricingResult {
  tier: PricingTier;
  basePrice: number;
  discount: number;
  couponDiscount: number;
  finalPrice: number;
  freeClothing: boolean;
  currency: "KWD";
}

const TIER_PRICES = {
  STANDARD: 72,
  FAMILY: 60,
  LARGE_FAMILY: 50,
} as const;

const SINGLE_SESSION_PRICE = 10;
const TRIAL_SESSION_PRICE = 0;

/** Determine pricing tier based on total players the parent has */
export function getTier(playerCount: number): PricingTier {
  if (playerCount >= 4) return "LARGE_FAMILY";
  if (playerCount >= 2) return "FAMILY";
  return "STANDARD";
}

/** Get the base price per player for a given tier */
export function getTierPrice(tier: PricingTier): number {
  return TIER_PRICES[tier];
}

/** Check if the tier qualifies for free clothing */
export function hasFreeClothing(tier: PricingTier): boolean {
  return tier === "FAMILY" || tier === "LARGE_FAMILY";
}

/** Calculate price for a single player subscription */
export function calculatePlayerPrice(input: PricingInput): PricingResult {
  const { playerCount, type, couponDiscount = 0 } = input;

  // Special subscription types
  if (type === "SINGLE_SESSION") {
    return {
      tier: "STANDARD",
      basePrice: SINGLE_SESSION_PRICE,
      discount: 0,
      couponDiscount: Math.min(couponDiscount, SINGLE_SESSION_PRICE),
      finalPrice: Math.max(0, SINGLE_SESSION_PRICE - couponDiscount),
      freeClothing: false,
      currency: "KWD",
    };
  }

  if (type === "TRIAL_SESSION") {
    return {
      tier: "STANDARD",
      basePrice: TRIAL_SESSION_PRICE,
      discount: 0,
      couponDiscount: 0,
      finalPrice: 0,
      freeClothing: false,
      currency: "KWD",
    };
  }

  // Regular membership pricing
  const tier = getTier(playerCount);
  const basePrice = TIER_PRICES.STANDARD; // Always show standard as "base"
  const tierPrice = getTierPrice(tier);
  const tierDiscount = basePrice - tierPrice;
  const effectiveCoupon = Math.min(couponDiscount, tierPrice);
  const finalPrice = Math.max(0, tierPrice - effectiveCoupon);

  return {
    tier,
    basePrice,
    discount: tierDiscount,
    couponDiscount: effectiveCoupon,
    finalPrice,
    freeClothing: hasFreeClothing(tier),
    currency: "KWD",
  };
}

/** Calculate total for multiple players under the same parent */
export function calculateBatchPricing(
  players: Array<{ type: PricingInput["type"] }>,
  couponDiscountPerPlayer = 0
): {
  items: PricingResult[];
  subtotal: number;
  totalDiscount: number;
  totalCouponDiscount: number;
  grandTotal: number;
  freeClothing: boolean;
} {
  const membershipPlayers = players.filter(
    (p) => p.type === "NEW_MEMBERSHIP" || p.type === "RENEWAL"
  );
  const totalMembership = membershipPlayers.length;

  const items = players.map((p) =>
    calculatePlayerPrice({
      playerCount: totalMembership,
      type: p.type,
      couponDiscount: couponDiscountPerPlayer,
    })
  );

  const subtotal = items.reduce((sum, i) => sum + i.basePrice, 0);
  const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0);
  const totalCouponDiscount = items.reduce((sum, i) => sum + i.couponDiscount, 0);
  const grandTotal = items.reduce((sum, i) => sum + i.finalPrice, 0);
  const freeClothing = items.some((i) => i.freeClothing);

  return { items, subtotal, totalDiscount, totalCouponDiscount, grandTotal, freeClothing };
}

/** Validate a coupon and return the per-player discount amount */
export function applyCoupon(
  coupon: {
    type: "PERCENTAGE" | "FIXED";
    value: number;
    maxUses: number | null;
    usedCount: number;
    minPlayers: number;
    validFrom: Date;
    validUntil: Date;
    isActive: boolean;
  },
  playerCount: number,
  now = new Date()
): { valid: boolean; discountPerPlayer: number; error?: string } {
  if (!coupon.isActive) {
    return { valid: false, discountPerPlayer: 0, error: "Coupon is not active" };
  }

  if (now < coupon.validFrom || now > coupon.validUntil) {
    return { valid: false, discountPerPlayer: 0, error: "Coupon has expired or is not yet valid" };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discountPerPlayer: 0, error: "Coupon has reached its maximum usage" };
  }

  if (playerCount < coupon.minPlayers) {
    return {
      valid: false,
      discountPerPlayer: 0,
      error: `Minimum ${coupon.minPlayers} player(s) required for this coupon`,
    };
  }

  const tier = getTier(playerCount);
  const tierPrice = getTierPrice(tier);

  let discountPerPlayer: number;
  if (coupon.type === "PERCENTAGE") {
    discountPerPlayer = Math.round((tierPrice * coupon.value) / 100 * 100) / 100;
  } else {
    // FIXED: total discount split per player
    discountPerPlayer = Math.round((coupon.value / playerCount) * 100) / 100;
  }

  return { valid: true, discountPerPlayer };
}

/** Human-readable tier label */
export function tierLabel(tier: PricingTier): string {
  switch (tier) {
    case "STANDARD":
      return "Standard";
    case "FAMILY":
      return "Family (2-3 players)";
    case "LARGE_FAMILY":
      return "Large Family (4+)";
  }
}

/** Format KWD amount */
export function formatKWD(amount: number): string {
  return `${amount.toFixed(amount % 1 === 0 ? 0 : 2)} KWD`;
}
