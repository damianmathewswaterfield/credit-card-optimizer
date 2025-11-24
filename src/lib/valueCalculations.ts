import type { Benefit, Card } from '@/data/cards'
import { getAllBenefitUsage, getUserPreferences } from './storage'

export interface BenefitValue {
  benefitId: string
  benefitName: string
  benefitType: string
  category: string
  valueExtracted: number
  potentialValue: number
  utilizationRate: number
}

export interface CardValue {
  cardId: string
  cardName: string
  annualFee: number
  totalValueExtracted: number
  totalPotentialValue: number
  netValue: number // value - annual fee
  roi: number // (value - fee) / fee * 100
  benefitValues: BenefitValue[]
  valueByCategory: Record<string, number>
  valueByType: Record<string, number>
}

/**
 * Calculate the value extracted from a specific benefit
 */
export function calculateBenefitValue(
  benefit: Benefit,
  cardId: string,
  cycleStart: string,
  cycleEnd: string
): BenefitValue {
  const allUsage = getAllBenefitUsage()
  const prefs = getUserPreferences()

  let valueExtracted = 0
  let potentialValue = benefit.nominalValue || 0

  if (benefit.trackingType === 'SPENDING') {
    // For spending-based benefits, value = amount spent (up to limit)
    const usage = allUsage.find(
      (u) => u.benefitId === benefit.id && u.cycleStart === cycleStart && u.cycleEnd === cycleEnd
    )
    valueExtracted = usage?.totalUsed || 0
  } else if (benefit.trackingType === 'COUNTER') {
    // For counter-based benefits, estimate value per event
    const usage = allUsage.find(
      (u) => u.benefitId === benefit.id && u.cycleStart === cycleStart && u.cycleEnd === cycleEnd
    )
    const eventsUsed = usage?.usages.reduce((sum, u) => sum + (u.count || 0), 0) || 0
    const valuePerEvent = benefit.nominalValue && benefit.eventLimit
      ? benefit.nominalValue / benefit.eventLimit
      : 0
    valueExtracted = eventsUsed * valuePerEvent
  } else if (benefit.trackingType === 'BOOLEAN') {
    // For boolean benefits (subscriptions), value = nominal value if activated
    const usage = allUsage.find((u) => u.benefitId === benefit.id)
    valueExtracted = usage?.activated ? (benefit.nominalValue || 0) : 0
  } else if (benefit.trackingType === 'NONE') {
    // For passive benefits (insurance, multipliers), estimate value differently
    if (benefit.type === 'MULTIPLIER') {
      // Multipliers: hard to quantify without transaction data, so we'll leave at 0
      // Unless we add spending tracking per multiplier category
      valueExtracted = 0
      potentialValue = 0
    } else if (benefit.type === 'INSURANCE' || benefit.type === 'INFORMATIONAL') {
      // Insurance/info benefits: hard to quantify, we'll count as potential value but not extracted
      valueExtracted = 0
      potentialValue = benefit.nominalValue || 0
    }
  }

  // Convert points to cash value for multipliers
  if (benefit.currency === 'POINTS' && benefit.program) {
    const pointValue = prefs.valuePerPointRules[benefit.program as keyof typeof prefs.valuePerPointRules] || 0.01
    valueExtracted *= pointValue
    potentialValue *= pointValue
  }

  const utilizationRate = potentialValue > 0 ? (valueExtracted / potentialValue) * 100 : 0

  return {
    benefitId: benefit.id,
    benefitName: benefit.name,
    benefitType: benefit.type,
    category: benefit.category || 'OTHER',
    valueExtracted,
    potentialValue,
    utilizationRate,
  }
}

/**
 * Calculate total value extracted from a card
 */
export function calculateCardValue(
  card: Card,
  cycleStart: string,
  cycleEnd: string
): CardValue {
  const benefitValues = card.benefits.map((benefit) =>
    calculateBenefitValue(benefit, card.id, cycleStart, cycleEnd)
  )

  const totalValueExtracted = benefitValues.reduce((sum, bv) => sum + bv.valueExtracted, 0)
  const totalPotentialValue = benefitValues.reduce((sum, bv) => sum + bv.potentialValue, 0)
  const netValue = totalValueExtracted - card.annualFee
  const roi = card.annualFee > 0 ? ((netValue / card.annualFee) * 100) : 0

  // Group by category
  const valueByCategory = benefitValues.reduce((acc, bv) => {
    acc[bv.category] = (acc[bv.category] || 0) + bv.valueExtracted
    return acc
  }, {} as Record<string, number>)

  // Group by type
  const valueByType = benefitValues.reduce((acc, bv) => {
    acc[bv.benefitType] = (acc[bv.benefitType] || 0) + bv.valueExtracted
    return acc
  }, {} as Record<string, number>)

  return {
    cardId: card.id,
    cardName: card.productName,
    annualFee: card.annualFee,
    totalValueExtracted,
    totalPotentialValue,
    netValue,
    roi,
    benefitValues,
    valueByCategory,
    valueByType,
  }
}

/**
 * Calculate value for all cards
 */
export function calculateAllCardsValue(
  cards: Card[],
  cycleStart: string,
  cycleEnd: string
): CardValue[] {
  return cards.map((card) => calculateCardValue(card, cycleStart, cycleEnd))
}

/**
 * Get cycle dates for current calendar year
 */
export function getCurrentYearCycleDates() {
  const year = new Date().getFullYear()
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  }
}
