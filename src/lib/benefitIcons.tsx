import {
  Plane,
  Utensils,
  Hotel,
  Ticket,
  Car,
  Apple,
  CreditCard,
  DollarSign,
  Shield,
  Sparkles,
  Star,
  Gem,
  PlaneTakeoff,
  Clock,
  Luggage,
  Package,
  Lock,
  TrendingUp,
  ShoppingCart,
  UtensilsCrossed,
  Coffee,
  Pizza,
  Ban,
  type LucideIcon,
} from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  TRAVEL: Plane,
  DINING: Utensils,
  EARNING: DollarSign,
  PROTECTION: Shield,
  LIFESTYLE: Sparkles,
  OTHER: CreditCard,
}

export const BENEFIT_TYPE_ICONS: Record<string, LucideIcon> = {
  RECURRING_CREDIT: DollarSign,
  MULTIPLIER: TrendingUp,
  INSURANCE: Shield,
  SUBSCRIPTION: Star,
  STATUS: Sparkles,
  THRESHOLD_CREDIT: Gem,
  PER_BOOKING: Hotel,
  ROADSIDE: Car,
  INFORMATIONAL: CreditCard,
}

// Specific benefit icons (by benefit ID or common names)
export const SPECIFIC_BENEFIT_ICONS: Record<string, LucideIcon> = {
  // Travel
  'travel': Plane,
  'flight': Plane,
  'hotel': Hotel,
  'lounge': PlaneTakeoff,
  'car': Car,

  // Dining
  'dining': Utensils,
  'restaurant': UtensilsCrossed,
  'food': Utensils,
  'doordash': Pizza,
  'uber': Car,
  'resy': UtensilsCrossed,
  'dunkin': Coffee,

  // Lifestyle
  'stubhub': Ticket,
  'apple': Apple,
  'lyft': Car,

  // Protection
  'insurance': Shield,
  'protection': Shield,
  'delay': Clock,
  'baggage': Luggage,
  'luggage': Luggage,
  'rental': Car,
  'purchase': Package,
  'warranty': Package,
  'roadside': Car,

  // Other
  'fraud': Lock,
  'security': Lock,
  'fico': TrendingUp,
  'virtual': CreditCard,

  // Earning
  'multiplier': TrendingUp,
  'points': Star,
  'cashback': DollarSign,

  // Avoidance
  'avoidance': Ban,
  'detox': Ban,
}

/**
 * Get the appropriate icon for a benefit
 */
export function getBenefitIcon(benefit: {
  id?: string
  name?: string
  category?: string
  type?: string
}): LucideIcon {
  // Check for specific benefit icons by ID
  if (benefit.id) {
    const idLower = benefit.id.toLowerCase()
    for (const [key, icon] of Object.entries(SPECIFIC_BENEFIT_ICONS)) {
      if (idLower.includes(key)) {
        return icon
      }
    }
  }

  // Check by name
  if (benefit.name) {
    const nameLower = benefit.name.toLowerCase()
    for (const [key, icon] of Object.entries(SPECIFIC_BENEFIT_ICONS)) {
      if (nameLower.includes(key)) {
        return icon
      }
    }
  }

  // Fall back to category icon
  if (benefit.category && CATEGORY_ICONS[benefit.category]) {
    return CATEGORY_ICONS[benefit.category]
  }

  // Fall back to type icon
  if (benefit.type && BENEFIT_TYPE_ICONS[benefit.type]) {
    return BENEFIT_TYPE_ICONS[benefit.type]
  }

  // Default
  return CreditCard
}
