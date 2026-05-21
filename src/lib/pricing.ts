/**
 * Hattrick Heroes — Smart Pricing Engine
 *
 * Subscription Plans:
 *  - TRAINING_ONLY:     60 KWD (training only)
 *  - TRAINING_WITH_KIT: 72 KWD (training + shorts, socks, T-shirt)
 *
 * Training days: Saturday, Monday, Wednesday
 *
 * Single session: 10 KWD
 * Trial session:  0 KWD (free, one-time per player)
 */

export type SubscriptionPlan = "TRAINING_ONLY" | "TRAINING_WITH_KIT";

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  TRAINING_ONLY: 60,
  TRAINING_WITH_KIT: 72,
} as const;

export const PLAN_LABELS: Record<SubscriptionPlan, { en: string; ar: string }> = {
  TRAINING_ONLY: { en: "Training Only", ar: "تدريب فقط" },
  TRAINING_WITH_KIT: { en: "Training + Kit", ar: "تدريب + طقم" },
};

export const KIT_ITEMS = ["T-shirt", "Shorts", "Socks"] as const;

export const TRAINING_DAYS = ["Saturday", "Monday", "Wednesday"] as const;
export const TRAINING_DAYS_AR = ["السبت", "الإثنين", "الأربعاء"] as const;

export const SINGLE_SESSION_PRICE = 10;
export const TRIAL_SESSION_PRICE = 0;

export type PricingTier = "STANDARD" | "FAMILY" | "LARGE_FAMILY";

export interface PricingInput {
  /** Total players this parent is registering (across all subs) */
  playerCount: number;
  /** Subscription type for each line */
  type: "NEW_MEMBERSHIP" | "RENEWAL" | "SINGLE_SESSION" | "TRIAL_SESSION" | "FREE_TRIAL";
  /** Subscription plan */
  plan?: SubscriptionPlan;
  /** Coupon discount (already validated, flat KWD amount off per player) */
  couponDiscount?: number;
}

export interface PricingResult {
  tier: PricingTier;
  plan: SubscriptionPlan | null;
  basePrice: number;
  discount: number;
  couponDiscount: number;
  finalPrice: number;
  includesKit: boolean;
  currency: "KWD";
}

/** Determine pricing tier based on total players the parent has */
export function getTier(playerCount: number): PricingTier {
  if (playerCount >= 4) return "LARGE_FAMILY";
  if (playerCount >= 2) return "FAMILY";
  return "STANDARD";
}

/** Get the base price for a plan */
export function getPlanPrice(plan: SubscriptionPlan): number {
  return PLAN_PRICES[plan];
}

/** Calculate price for a single player subscription */
export function calculatePlayerPrice(input: PricingInput): PricingResult {
  const { type, plan = "TRAINING_ONLY", couponDiscount = 0 } = input;

  // Special subscription types
  if (type === "SINGLE_SESSION") {
    return {
      tier: "STANDARD",
      plan: null,
      basePrice: SINGLE_SESSION_PRICE,
      discount: 0,
      couponDiscount: Math.min(couponDiscount, SINGLE_SESSION_PRICE),
      finalPrice: Math.max(0, SINGLE_SESSION_PRICE - couponDiscount),
      includesKit: false,
      currency: "KWD",
    };
  }

  if (type === "TRIAL_SESSION" || type === "FREE_TRIAL") {
    return {
      tier: "STANDARD",
      plan: null,
      basePrice: TRIAL_SESSION_PRICE,
      discount: 0,
      couponDiscount: 0,
      finalPrice: 0,
      includesKit: false,
      currency: "KWD",
    };
  }

  // Regular membership pricing — based on plan selection
  const basePrice = getPlanPrice(plan);
  const effectiveCoupon = Math.min(couponDiscount, basePrice);
  const finalPrice = Math.max(0, basePrice - effectiveCoupon);

  return {
    tier: "STANDARD",
    plan,
    basePrice,
    discount: 0,
    couponDiscount: effectiveCoupon,
    finalPrice,
    includesKit: plan === "TRAINING_WITH_KIT",
    currency: "KWD",
  };
}

/** Calculate total for multiple players under the same parent */
export function calculateBatchPricing(
  players: Array<{ type: PricingInput["type"]; plan?: SubscriptionPlan }>,
  couponDiscountPerPlayer = 0
): {
  items: PricingResult[];
  subtotal: number;
  totalDiscount: number;
  totalCouponDiscount: number;
  grandTotal: number;
} {
  const items = players.map((p) =>
    calculatePlayerPrice({
      playerCount: players.length,
      type: p.type,
      plan: p.plan,
      couponDiscount: couponDiscountPerPlayer,
    })
  );

  const subtotal = items.reduce((sum, i) => sum + i.basePrice, 0);
  const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0);
  const totalCouponDiscount = items.reduce((sum, i) => sum + i.couponDiscount, 0);
  const grandTotal = items.reduce((sum, i) => sum + i.finalPrice, 0);

  return { items, subtotal, totalDiscount, totalCouponDiscount, grandTotal };
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
  planPrice: number,
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

  let discountPerPlayer: number;
  if (coupon.type === "PERCENTAGE") {
    discountPerPlayer = Math.round((planPrice * coupon.value) / 100 * 100) / 100;
  } else {
    discountPerPlayer = Math.round((coupon.value / playerCount) * 100) / 100;
  }

  return { valid: true, discountPerPlayer };
}

/** Human-readable plan label */
export function planLabel(plan: SubscriptionPlan | null | undefined, locale: "en" | "ar" = "en"): string {
  if (!plan) return locale === "ar" ? "—" : "—";
  return PLAN_LABELS[plan][locale];
}

/** Format KWD amount */
export function formatKWD(amount: number): string {
  return `${amount.toFixed(amount % 1 === 0 ? 0 : 2)} KWD`;
}

/** Get auto age group based on date of birth — Hattrick groups: U6, U8, U11, U14 */
export function getAutoAgeGroup(dob: string | Date): string {
  const birth = typeof dob === "string" ? new Date(dob) : dob;
  if (isNaN(birth.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  if (age < 6) return "U6";
  if (age < 8) return "U8";
  if (age < 11) return "U11";
  if (age < 14) return "U14";
  return "U14"; // oldest group
}

/** Training days for the week (0=Sun, 6=Sat) */
export const TRAINING_DAY_NUMBERS = [6, 1, 3] as const; // Sat, Mon, Wed
