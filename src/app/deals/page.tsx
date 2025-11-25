'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, X, ExternalLink, Pencil, Trash2, Tag, Calendar, Percent } from 'lucide-react'
import { format } from 'date-fns'
import { CARDS } from '@/data/cards'
import { getDeals, addDeal, updateDeal, deleteDeal, type Deal } from '@/lib/storage'

const CATEGORIES = [
  'Groceries',
  'Dining',
  'Travel',
  'Gas',
  'Entertainment',
  'Shopping',
  'Electronics',
  'Home',
  'Health',
  'Other',
]

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCard, setFilterCard] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'percent' | 'expiry'>('percent')

  // Form state
  const [formData, setFormData] = useState({
    cardId: '',
    merchant: '',
    cashbackPercent: '',
    category: '',
    validFrom: '',
    validTo: '',
    link: '',
    notes: '',
  })

  useEffect(() => {
    loadDeals()
  }, [])

  const loadDeals = () => {
    const loadedDeals = getDeals()
    setDeals(loadedDeals)
    setLoading(false)
  }

  const resetForm = () => {
    setFormData({
      cardId: '',
      merchant: '',
      cashbackPercent: '',
      category: '',
      validFrom: '',
      validTo: '',
      link: '',
      notes: '',
    })
    setEditingDeal(null)
    setShowAddModal(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cardId || !formData.merchant || !formData.cashbackPercent || !formData.category) {
      alert('Please fill in all required fields')
      return
    }

    try {
      if (editingDeal) {
        updateDeal(editingDeal.id, {
          cardId: formData.cardId,
          merchant: formData.merchant,
          cashbackPercent: parseFloat(formData.cashbackPercent),
          category: formData.category,
          validFrom: formData.validFrom,
          validTo: formData.validTo,
          link: formData.link,
          notes: formData.notes,
        })
      } else {
        addDeal({
          cardId: formData.cardId,
          merchant: formData.merchant,
          cashbackPercent: parseFloat(formData.cashbackPercent),
          category: formData.category,
          validFrom: formData.validFrom,
          validTo: formData.validTo,
          link: formData.link,
          notes: formData.notes,
        })
      }

      loadDeals()
      resetForm()
    } catch (error) {
      alert('Failed to save deal')
      console.error(error)
    }
  }

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setFormData({
      cardId: deal.cardId,
      merchant: deal.merchant,
      cashbackPercent: deal.cashbackPercent.toString(),
      category: deal.category,
      validFrom: deal.validFrom,
      validTo: deal.validTo,
      link: deal.link || '',
      notes: deal.notes || '',
    })
    setShowAddModal(true)
  }

  const handleDelete = (dealId: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteDeal(dealId)
      loadDeals()
    }
  }

  const getCardName = (cardId: string) => {
    const card = CARDS.find((c) => c.id === cardId)
    return card ? `${card.issuer} ${card.productName}` : cardId
  }

  const isExpiringSoon = (validTo: string) => {
    const daysUntilExpiry = Math.ceil(
      (new Date(validTo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
  }

  const isExpired = (validTo: string) => {
    return new Date(validTo) < new Date()
  }

  // Filtered and sorted deals
  const filteredDeals = useMemo(() => {
    let filtered = deals

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (deal) =>
          deal.merchant.toLowerCase().includes(query) ||
          deal.category.toLowerCase().includes(query) ||
          getCardName(deal.cardId).toLowerCase().includes(query) ||
          deal.notes?.toLowerCase().includes(query)
      )
    }

    // Card filter
    if (filterCard !== 'all') {
      filtered = filtered.filter((deal) => deal.cardId === filterCard)
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((deal) => deal.category === filterCategory)
    }

    // Sort
    if (sortBy === 'percent') {
      filtered = [...filtered].sort((a, b) => b.cashbackPercent - a.cashbackPercent)
    } else {
      filtered = [...filtered].sort(
        (a, b) => new Date(a.validTo).getTime() - new Date(b.validTo).getTime()
      )
    }

    return filtered
  }, [deals, searchQuery, filterCard, filterCategory, sortBy])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-600">Loading deals...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Cashback Deals</h1>
          <p className="text-neutral-600 mt-2">Track special cashback offers from your credit cards</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Deal
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search deals by merchant, category, card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Filter by Card</label>
            <select
              value={filterCard}
              onChange={(e) => setFilterCard(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Cards</option>
              {CARDS.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.issuer} {card.productName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Filter by Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'percent' | 'expiry')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="percent">Cashback % (High to Low)</option>
              <option value="expiry">Expiry Date (Soonest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      {filteredDeals.length === 0 ? (
        <div className="card text-center py-12">
          <Tag className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 text-lg">No deals found</p>
          <p className="text-neutral-500 text-sm mt-1">
            {deals.length === 0
              ? 'Add your first cashback deal to get started'
              : 'Try adjusting your filters or search query'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDeals.map((deal) => {
            const expired = isExpired(deal.validTo)
            const expiringSoon = !expired && isExpiringSoon(deal.validTo)

            return (
              <div
                key={deal.id}
                className={`card hover:shadow-lg transition-shadow ${
                  expired ? 'opacity-60' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 text-lg">{deal.merchant}</h3>
                    <p className="text-sm text-neutral-600">{getCardName(deal.cardId)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(deal)}
                      className="p-1.5 rounded hover:bg-neutral-100 transition-colors"
                      title="Edit deal"
                    >
                      <Pencil className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      className="p-1.5 rounded hover:bg-danger-50 transition-colors"
                      title="Delete deal"
                    >
                      <Trash2 className="w-4 h-4 text-danger-600" />
                    </button>
                  </div>
                </div>

                {/* Cashback */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1.5 bg-success-100 rounded-lg">
                    <p className="text-2xl font-bold text-success-700">
                      {deal.cashbackPercent}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-neutral-600">
                    <Tag className="w-4 h-4" />
                    {deal.category}
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-1 mb-3">
                  {deal.validFrom && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Calendar className="w-4 h-4" />
                      Valid from: {format(new Date(deal.validFrom), 'MMM d, yyyy')}
                    </div>
                  )}
                  {deal.validTo && (
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        expired
                          ? 'text-neutral-500'
                          : expiringSoon
                          ? 'text-danger-600 font-medium'
                          : 'text-neutral-600'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      Expires: {format(new Date(deal.validTo), 'MMM d, yyyy')}
                      {expired && ' (Expired)'}
                      {expiringSoon && ' (Expiring Soon!)'}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {deal.notes && (
                  <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{deal.notes}</p>
                )}

                {/* Link */}
                {deal.link && (
                  <a
                    href={deal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Details
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">
                {editingDeal ? 'Edit Deal' : 'Add New Deal'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-2">
              {/* Card */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Credit Card <span className="text-danger-600">*</span>
                </label>
                <select
                  value={formData.cardId}
                  onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select a card</option>
                  {CARDS.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.issuer} {card.productName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Merchant */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Merchant <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="e.g., Amazon, Target, Crocs"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* Cashback % and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Cashback % <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cashbackPercent}
                    onChange={(e) =>
                      setFormData({ ...formData, cashbackPercent: e.target.value })
                    }
                    placeholder="e.g., 10"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Category <span className="text-danger-600">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Valid dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Valid To
                  </label>
                  <input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details about this deal..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingDeal ? 'Update Deal' : 'Add Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
