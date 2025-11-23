import type { Benefit, BenefitUsage } from '@prisma/client'
import type { ValueAtRisk } from '@/types'
import { calculateNextExpiry } from './expiry'

/**
 * Calculate total value used in current cycle
 */
export function calculateUsedValue(
  benefit: Benefit,
  usageRecords: BenefitUsage[],
  cycleStartDate: Date,
  cycleEndDate: Date
): number {
  return usageRecords
    .filter((usage) => {
      const usageDate = new Date(usage.dateUsed)
      return usageDate >= cycleStartDate && usageDate <= cycleEndDate
    })
    .reduce((sum, usage) => sum + usage.amountUsed, 0)
}

/**
 * Calculate value at risk (remaining unused value) for a benefit
 */
export function calculateValueAtRisk(
  benefit: Benefit,
  usageRecords: BenefitUsage[],
  today: Date = new Date(),
  cardRenewalMonthDay?: string | null
): ValueAtRisk | null {
  // Only applicable for benefits with nominal value
  if (!benefit.nominalValue || benefit.currency !== 'USD') {
    return null
  }

  const expiryInfo = calculateNextExpiry(
    benefit.cycleType,
    benefit.cycleDefinition,
    today,
    cardRenewalMonthDay
  )

  // Calculate cycle start (for usage filtering)
  // This is a simplified approach; you may need more sophisticated logic
  const cycleStart = new Date(today)
  cycleStart.setMonth(cycleStart.getMonth() - 1) // Rough estimate

  const usedValue = calculateUsedValue(benefit, usageRecords, cycleStart, expiryInfo.currentCycleEnd)

  const totalValue = benefit.usageLimitPerCycle || benefit.nominalValue
  const remainingValue = Math.max(0, totalValue - usedValue)

  return {
    benefitId: benefit.id,
    benefitName: benefit.name,
    totalValue,
    usedValue,
    remainingValue,
    expiryDate: expiryInfo.nextExpiryDate,
    daysUntilExpiry: expiryInfo.daysUntilExpiry,
  }
}

/**
 * Convert points/miles to estimated cash value
 */
export function convertPointsToValue(
  points: number,
  program: string,
  valuePerPointRules: Record<string, number>
): number {
  const rate = valuePerPointRules[program] || 0.01 // Default 1 cent per point
  return points * rate
}

/**
 * Calculate total realized value from usage records
 */
export function calculateRealizedValue(
  usageRecords: BenefitUsage[]
): number {
  return usageRecords.reduce((sum, usage) => sum + usage.amountUsed, 0)
}
