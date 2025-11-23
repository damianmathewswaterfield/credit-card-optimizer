import { differenceInDays } from 'date-fns'
import type { CycleType } from '@prisma/client'
import type { BenefitCycleDefinition, NextExpiryResult } from '@/types'
import { getCurrentCycleEnd, getNextResetDate, parseCycleDefinition } from './cycles'

/**
 * Calculate next expiry date and days until expiry for a benefit
 */
export function calculateNextExpiry(
  cycleType: CycleType,
  cycleDefinitionJson: string,
  today: Date = new Date(),
  cardRenewalMonthDay?: string | null
): NextExpiryResult {
  const cycleDefinition = parseCycleDefinition(cycleDefinitionJson)

  const currentCycleEnd = getCurrentCycleEnd(cycleType, cycleDefinition, today, cardRenewalMonthDay)
  const nextResetDate = getNextResetDate(cycleType, cycleDefinition, today, cardRenewalMonthDay)

  // For recurring benefits, expiry = end of current cycle
  // For one-time benefits, we might have a specific expiry date in the definition
  let expiryDate = currentCycleEnd

  // Check if there's an explicit expiry date in the definition
  const def = cycleDefinition as any
  if (def.expiryDate) {
    const explicitExpiry = new Date(def.expiryDate)
    expiryDate = explicitExpiry
  }

  const daysUntilExpiry = differenceInDays(expiryDate, today)

  return {
    nextResetDate,
    nextExpiryDate: expiryDate,
    daysUntilExpiry,
    currentCycleEnd,
  }
}

/**
 * Determine if a benefit is expiring soon (within threshold days)
 */
export function isExpiringSoon(expiryResult: NextExpiryResult, thresholdDays: number = 30): boolean {
  return expiryResult.daysUntilExpiry >= 0 && expiryResult.daysUntilExpiry <= thresholdDays
}

/**
 * Get human-readable expiry status
 */
export function getExpiryStatus(
  expiryResult: NextExpiryResult
): 'expired' | 'expiring-soon' | 'upcoming' {
  if (expiryResult.daysUntilExpiry < 0) {
    return 'expired'
  }

  if (expiryResult.daysUntilExpiry <= 30) {
    return 'expiring-soon'
  }

  return 'upcoming'
}
