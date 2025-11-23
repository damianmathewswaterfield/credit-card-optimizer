import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default user
  const user = await prisma.user.create({
    data: {
      timezone: 'America/New_York',
      defaultReminderDays: 7,
      valuePerPointRules: JSON.stringify({
        UR: 0.015, // Chase Ultimate Rewards
        MR: 0.016, // Amex Membership Rewards
        VENTURE: 0.012, // Capital One Venture miles
        TY: 0.013, // Citi ThankYou Points
      }),
    },
  })

  console.log('✅ Created user')

  // Today's date for reference
  const today = new Date()
  const currentYear = today.getFullYear()

  // ============================================================================
  // 1. Chase Sapphire Reserve
  // ============================================================================
  const csrCard = await prisma.card.create({
    data: {
      userId: user.id,
      issuer: 'CHASE',
      productName: 'Chase Sapphire Reserve',
      network: 'VISA',
      annualFee: 795,
      openDate: null, // TODO: Set your actual card open date
      renewalMonthDay: '01-15',
      active: true,
    },
  })

  // CSR Benefit 1: $300 Dining Credit (Semiannual calendar windows)
  await prisma.benefit.create({
    data: {
      cardId: csrCard.id,
      name: '$300 Annual Dining Credit at Sapphire Reserve Exclusive Tables',
      type: 'RECURRING_CREDIT',
      nominalValue: 300,
      currency: 'USD',
      cycleType: 'SEMIANNUAL_CALENDAR',
      cycleDefinition: JSON.stringify({
        type: 'multiple_windows',
        windows: [
          { startMonth: 1, startDay: 1, endMonth: 6, endDay: 30 }, // Jan 1 - Jun 30: $150
          { startMonth: 7, startDay: 1, endMonth: 12, endDay: 31 }, // Jul 1 - Dec 31: $150
        ],
      }),
      usageLimitPerCycle: 150, // $150 per window
      triggerDescription:
        'Dine at participating restaurants in the Sapphire Reserve Exclusive Tables program on OpenTable. Charges must post to your card within the window.',
      exclusionsSummary:
        'Only specific restaurants in the Exclusive Tables program qualify. Not all OpenTable restaurants are eligible.',
      priorityScore: 95,
      officialUrl: 'https://account.chase.com/sapphire/reserve/benefits',
      active: true,
    },
  })

  // CSR Benefit 2: Travel earning multiplier
  await prisma.benefit.create({
    data: {
      cardId: csrCard.id,
      name: '10X Ultimate Rewards on Hotels and Car Rentals via Chase Travel',
      type: 'MULTIPLIER',
      nominalValue: null,
      currency: 'POINTS',
      program: 'UR',
      cycleType: 'ONE_TIME',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: null,
      triggerDescription:
        'Book hotels and car rentals through Chase Ultimate Rewards travel portal.',
      exclusionsSummary: 'Must book via Chase portal; third-party sites do not qualify.',
      priorityScore: 75,
      officialUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
      active: true,
    },
  })

  // CSR Benefit 3: 3X on dining and travel
  await prisma.benefit.create({
    data: {
      cardId: csrCard.id,
      name: '3X Ultimate Rewards on Dining and Travel',
      type: 'MULTIPLIER',
      nominalValue: null,
      currency: 'POINTS',
      program: 'UR',
      cycleType: 'ONE_TIME',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: null,
      triggerDescription:
        'Earn 3X points on dining (restaurants, eligible delivery services) and travel purchases (airlines, hotels, car rentals, cruises, travel agencies).',
      exclusionsSummary: 'Excludes gift cards and some third-party purchases.',
      priorityScore: 80,
      officialUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
      active: true,
    },
  })

  // CSR Welcome Bonus (User's expected terms)
  await prisma.welcomeBonus.create({
    data: {
      cardId: csrCard.id,
      requiredSpend: 6000,
      spendWindowStart: '2025-01-15',
      spendWindowEnd: '2025-04-15', // 3 months from open
      earned: false,
      expectedPoints: 125000,
      program: 'UR',
      currentSpend: 0, // YOU must enter your actual spend
    },
  })

  console.log('✅ Created Chase Sapphire Reserve with benefits')

  // ============================================================================
  // 2. Citi Custom Cash
  // ============================================================================
  const citiCard = await prisma.card.create({
    data: {
      userId: user.id,
      issuer: 'CITI',
      productName: 'Citi Custom Cash',
      network: 'MASTERCARD',
      annualFee: 0,
      openDate: null, // TODO: Set your actual card open date
      renewalMonthDay: null, // No annual fee, so no renewal concept
      active: true,
    },
  })

  // Citi Benefit 1: 5% on top category (monthly)
  await prisma.benefit.create({
    data: {
      cardId: citiCard.id,
      name: '5% Cash Back on Top Eligible Category (up to $500/month)',
      type: 'MULTIPLIER',
      nominalValue: 25, // Max $25/month
      currency: 'USD',
      cycleType: 'MONTHLY',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: 500, // $500 spend cap per month
      triggerDescription:
        'Auto-optimized: Earn 5% cash back on first $500 in your highest eligible category each billing cycle. Categories: restaurants, gas, grocery, travel, transit, streaming, drugstores, home improvement, fitness, live entertainment.',
      exclusionsSummary: 'After $500/month, purchases earn 1%. Category is auto-selected.',
      priorityScore: 85,
      officialUrl: 'https://www.citi.com/credit-cards/citi-custom-cash-credit-card',
      active: true,
    },
  })

  // Citi Benefit 2: Bonus TY points on Citi Travel (time-limited)
  await prisma.benefit.create({
    data: {
      cardId: citiCard.id,
      name: '4X ThankYou Points on Citi Travel (Hotels, Cars, Attractions)',
      type: 'MULTIPLIER',
      nominalValue: null,
      currency: 'POINTS',
      program: 'TY',
      cycleType: 'ONE_TIME',
      cycleDefinition: JSON.stringify({
        type: 'single',
        expiryDate: '2026-06-30', // Valid through June 30, 2026
      }),
      usageLimitPerCycle: null,
      triggerDescription: 'Book hotels, car rentals, and attractions via Citi Travel portal.',
      exclusionsSummary: 'Offer valid through June 30, 2026. Must book via Citi Travel.',
      priorityScore: 60,
      officialUrl: 'https://www.citi.com/credit-cards/citi-custom-cash-credit-card',
      active: true,
    },
  })

  // Citi Welcome Bonus
  await prisma.welcomeBonus.create({
    data: {
      cardId: citiCard.id,
      requiredSpend: 1500,
      spendWindowStart: '2024-06-10',
      spendWindowEnd: '2024-12-10',
      earned: true, // Assume already earned
      earnedDate: '2024-11-15',
      expectedPoints: 20000, // $200 as 20k TY points
      actualPoints: 20000,
      program: 'TY',
      currentSpend: 0, // YOU must enter your actual spend
    },
  })

  console.log('✅ Created Citi Custom Cash with benefits')

  // ============================================================================
  // 3. American Express Gold Card
  // ============================================================================
  const amexGoldCard = await prisma.card.create({
    data: {
      userId: user.id,
      issuer: 'AMEX',
      productName: 'American Express Gold Card',
      network: 'AMEX',
      annualFee: 325,
      openDate: null, // TODO: Set your actual card open date
      renewalMonthDay: '03-01',
      active: true,
    },
  })

  // Amex Gold Benefit 1: $120 Uber Cash (monthly)
  await prisma.benefit.create({
    data: {
      cardId: amexGoldCard.id,
      name: '$120 Annual Uber Cash ($10/month)',
      type: 'RECURRING_CREDIT',
      nominalValue: 120,
      currency: 'USD',
      cycleType: 'MONTHLY',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: 10,
      triggerDescription:
        'Add your Amex Gold to your Uber account. Automatically receive $10 Uber Cash each calendar month for Uber rides or Uber Eats orders in the U.S.',
      exclusionsSummary:
        'Must enroll card in Uber app. Credits reset on 1st of each month and do not roll over.',
      priorityScore: 90,
      officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
      active: true,
    },
  })

  // Amex Gold Benefit 2: $100 Resy Credit (semiannual)
  await prisma.benefit.create({
    data: {
      cardId: amexGoldCard.id,
      name: '$100 Annual Resy Credit ($50 semi-annually)',
      type: 'RECURRING_CREDIT',
      nominalValue: 100,
      currency: 'USD',
      cycleType: 'SEMIANNUAL_CALENDAR',
      cycleDefinition: JSON.stringify({
        type: 'multiple_windows',
        windows: [
          { startMonth: 1, startDay: 1, endMonth: 6, endDay: 30 }, // H1: $50
          { startMonth: 7, startDay: 1, endMonth: 12, endDay: 31 }, // H2: $50
        ],
      }),
      usageLimitPerCycle: 50,
      triggerDescription:
        'Enroll and use your Amex Gold for eligible purchases at U.S. Resy restaurants or other Resy purchases.',
      exclusionsSummary: 'Enrollment required. Credits reset semi-annually and do not roll over.',
      priorityScore: 85,
      officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
      active: true,
    },
  })

  // Amex Gold Benefit 3: $120 Dining Partners Credit (monthly)
  await prisma.benefit.create({
    data: {
      cardId: amexGoldCard.id,
      name: '$120 Annual Dining Partners Credit ($10/month)',
      type: 'RECURRING_CREDIT',
      nominalValue: 120,
      currency: 'USD',
      cycleType: 'MONTHLY',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: 10,
      triggerDescription:
        'Earn up to $10 in statement credits each month for purchases at participating dining partners: Grubhub, The Cheesecake Factory, Goldbelly, Wine.com, Five Guys.',
      exclusionsSummary: 'Credits reset monthly. Not all locations/purchases may qualify.',
      priorityScore: 80,
      officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
      active: true,
    },
  })

  // Amex Gold Benefit 4: $84 Dunkin' Credit (monthly)
  await prisma.benefit.create({
    data: {
      cardId: amexGoldCard.id,
      name: '$84 Annual Dunkin\' Credit ($7/month)',
      type: 'RECURRING_CREDIT',
      nominalValue: 84,
      currency: 'USD',
      cycleType: 'MONTHLY',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: 7,
      triggerDescription:
        'Enroll and earn up to $7 in statement credits each month for eligible purchases at U.S. Dunkin\' locations.',
      exclusionsSummary: 'Enrollment required. Credits reset monthly and do not roll over.',
      priorityScore: 70,
      officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
      active: true,
    },
  })

  // Amex Gold Benefit 5: 4X MR on dining
  await prisma.benefit.create({
    data: {
      cardId: amexGoldCard.id,
      name: '4X Membership Rewards on Restaurants (up to $50k/year)',
      type: 'MULTIPLIER',
      nominalValue: null,
      currency: 'POINTS',
      program: 'MR',
      cycleType: 'CALENDAR_YEAR',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: 50000, // $50k spend cap
      triggerDescription:
        'Earn 4X points at restaurants worldwide, plus takeout and delivery in the U.S., on up to $50,000 in purchases per calendar year.',
      exclusionsSummary: 'After $50k spend, 1X points. Some delivery services may not qualify.',
      priorityScore: 90,
      officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
      active: true,
    },
  })

  // Amex Gold Benefit 6: 4X MR on groceries
  await prisma.benefit.create({
    data: {
      cardId: amexGoldCard.id,
      name: '4X Membership Rewards on U.S. Supermarkets (up to $25k/year)',
      type: 'MULTIPLIER',
      nominalValue: null,
      currency: 'POINTS',
      program: 'MR',
      cycleType: 'CALENDAR_YEAR',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: 25000, // $25k spend cap
      triggerDescription:
        'Earn 4X points at U.S. supermarkets, on up to $25,000 in purchases per calendar year.',
      exclusionsSummary:
        'After $25k spend, 1X points. Excludes Target, Walmart Supercenters, and warehouse clubs.',
      priorityScore: 85,
      officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
      active: true,
    },
  })

  console.log('✅ Created American Express Gold Card with benefits')

  // ============================================================================
  // 4. Capital One Venture X
  // ============================================================================
  const ventureXCard = await prisma.card.create({
    data: {
      userId: user.id,
      issuer: 'CAPITAL_ONE',
      productName: 'Capital One Venture X',
      network: 'VISA',
      annualFee: 395,
      openDate: null, // TODO: Set your actual card open date
      renewalMonthDay: '08-01',
      active: true,
    },
  })

  // Venture X Benefit 1: $300 Travel Credit (cardmember year)
  await prisma.benefit.create({
    data: {
      cardId: ventureXCard.id,
      name: '$300 Annual Travel Credit',
      type: 'RECURRING_CREDIT',
      nominalValue: 300,
      currency: 'USD',
      cycleType: 'CARDMEMBER_YEAR',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: 300,
      triggerDescription:
        'Use toward purchases made through Capital One Travel. Credit expires on account anniversary.',
      exclusionsSummary:
        'Must book via Capital One Travel portal. Credit does not roll over to next year.',
      priorityScore: 95,
      officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
      active: true,
    },
  })

  // Venture X Benefit 2: 10,000 Anniversary Miles
  await prisma.benefit.create({
    data: {
      cardId: ventureXCard.id,
      name: '10,000 Anniversary Bonus Miles',
      type: 'RECURRING_CREDIT',
      nominalValue: 100, // Worth ~$100 in travel
      currency: 'MILES',
      program: 'VENTURE',
      cycleType: 'CARDMEMBER_YEAR',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: 10000,
      triggerDescription:
        'Automatically receive 10,000 bonus miles each account anniversary starting after your first year.',
      exclusionsSummary: 'First anniversary bonus arrives after 1 year of account opening.',
      priorityScore: 75,
      officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
      active: true,
    },
  })

  // Venture X Benefit 3: $120 TSA PreCheck / Global Entry
  await prisma.benefit.create({
    data: {
      cardId: ventureXCard.id,
      name: '$120 TSA PreCheck / Global Entry Credit',
      type: 'RECURRING_CREDIT',
      nominalValue: 120,
      currency: 'USD',
      cycleType: 'ONE_TIME', // Every 4-5 years when you renew
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: 120,
      triggerDescription:
        'Statement credit for TSA PreCheck or Global Entry application fee (every 4-5 years).',
      exclusionsSummary: 'Valid for renewal fees; not annual.',
      priorityScore: 60,
      officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
      active: true,
    },
  })

  // Venture X Benefit 4: 10X on hotels/cars via portal
  await prisma.benefit.create({
    data: {
      cardId: ventureXCard.id,
      name: '10X Miles on Hotels & Car Rentals via Capital One Travel',
      type: 'MULTIPLIER',
      nominalValue: null,
      currency: 'MILES',
      program: 'VENTURE',
      cycleType: 'ONE_TIME',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: null,
      triggerDescription: 'Book hotels and car rentals through Capital One Travel portal.',
      exclusionsSummary: 'Must book via Capital One Travel.',
      priorityScore: 80,
      officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
      active: true,
    },
  })

  // Venture X Benefit 5: 5X on flights
  await prisma.benefit.create({
    data: {
      cardId: ventureXCard.id,
      name: '5X Miles on Flights via Capital One Travel',
      type: 'MULTIPLIER',
      nominalValue: null,
      currency: 'MILES',
      program: 'VENTURE',
      cycleType: 'ONE_TIME',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: null,
      triggerDescription: 'Book flights through Capital One Travel portal.',
      exclusionsSummary: 'Must book via Capital One Travel.',
      priorityScore: 75,
      officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
      active: true,
    },
  })

  // Venture X Benefit 6: 2X on everything else
  await prisma.benefit.create({
    data: {
      cardId: ventureXCard.id,
      name: '2X Miles on All Other Purchases',
      type: 'MULTIPLIER',
      nominalValue: null,
      currency: 'MILES',
      program: 'VENTURE',
      cycleType: 'ONE_TIME',
      cycleDefinition: JSON.stringify({ type: 'single' }),
      usageLimitPerCycle: null,
      triggerDescription: 'Earn 2X miles on all purchases not in other bonus categories.',
      exclusionsSummary: 'No exclusions.',
      priorityScore: 70,
      officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
      active: true,
    },
  })

  // Venture X Welcome Bonus (current limited-time offer)
  await prisma.welcomeBonus.create({
    data: {
      cardId: ventureXCard.id,
      requiredSpend: 10000,
      spendWindowStart: '2024-08-01',
      spendWindowEnd: '2025-02-01', // 6 months
      earned: false,
      expectedPoints: 100000,
      program: 'VENTURE',
      currentSpend: 0, // YOU must enter your actual spend
    },
  })

  console.log('✅ Created Capital One Venture X with benefits')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
