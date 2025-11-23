import Link from 'next/link'
import { CreditCard, TrendingUp } from 'lucide-react'
import { prisma } from '@/lib/db'

// Force dynamic rendering - database queries run at request time, not build time
export const dynamic = 'force-dynamic'

export default async function CardsPage() {
  const cards = await prisma.card.findMany({
    where: { active: true },
    include: {
      benefits: true,
      welcomeBonuses: true,
      _count: {
        select: {
          benefits: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">My Cards</h1>
        <p className="text-neutral-600 mt-2">
          View and manage your {cards.length} active credit cards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cards.map((card) => {
          const recurringCredits = card.benefits.filter(
            (b) => b.type === 'RECURRING_CREDIT' && b.nominalValue && b.currency === 'USD'
          )

          const totalAnnualCredits = recurringCredits.reduce((sum, b) => {
            return sum + (b.nominalValue || 0)
          }, 0)

          const netValue = totalAnnualCredits - card.annualFee

          return (
            <Link key={card.id} href={`/cards/${card.id}`} className="card-hover group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-neutral-900">
                      {card.productName}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {card.network} • {card.issuer}
                    </p>
                  </div>
                </div>
                <span className="badge-success">Active</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-600 mb-1">Annual Fee</p>
                    <p className="font-semibold text-neutral-900">
                      ${card.annualFee.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 mb-1">Annual Credits</p>
                    <p className="font-semibold text-neutral-900">
                      ${totalAnnualCredits.toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Potential Net Value</span>
                    <span
                      className={`font-semibold ${
                        netValue > 0 ? 'text-success-700' : 'text-danger-700'
                      }`}
                    >
                      {netValue > 0 ? '+' : ''}${netValue.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-neutral-600">Benefits Tracked</span>
                    <span className="font-medium text-neutral-900">{card._count.benefits}</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {cards.length === 0 && (
        <div className="card text-center py-12">
          <CreditCard className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No cards yet</h3>
          <p className="text-neutral-600">
            Run <code className="px-2 py-1 bg-neutral-100 rounded">npm run db:seed</code> to add
            your cards.
          </p>
        </div>
      )}
    </div>
  )
}
