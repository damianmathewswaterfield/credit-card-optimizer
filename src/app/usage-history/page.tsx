'use client'

import { useState, useEffect } from 'react'
import { History, Edit, Trash2, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { format } from 'date-fns'
import { CARDS } from '@/data/cards'
import {
  getAllBenefitUsage,
  updateBenefitUsageEntry,
  deleteBenefitUsageEntry,
  type BenefitUsage,
  type BenefitUsageEntry,
} from '@/lib/storage'
import { Toast } from '@/components/ui/Toast'

type SortField = 'date' | 'benefit' | 'card' | 'amount'
type SortOrder = 'asc' | 'desc'

interface UsageRowData {
  entry: BenefitUsageEntry
  benefitId: string
  benefitName: string
  cardId: string
  cardName: string
  cycleStart: string
  cycleEnd: string
}

export default function UsageHistoryPage() {
  const [allUsage, setAllUsage] = useState<BenefitUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filterCard, setFilterCard] = useState<string>('all')
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(
    null
  )

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = () => {
    const usage = getAllBenefitUsage()
    setAllUsage(usage)
    setLoading(false)
  }

  const refreshUsage = () => {
    loadUsage()
  }

  // Build flattened rows
  const rows: UsageRowData[] = []
  for (const usage of allUsage) {
    const card = CARDS.find((c) => c.id === usage.cardId)
    if (!card) continue

    const benefit = card.benefits.find((b: any) => b.id === usage.benefitId)
    if (!benefit) continue

    for (const entry of usage.usages) {
      rows.push({
        entry,
        benefitId: usage.benefitId,
        benefitName: benefit.name,
        cardId: usage.cardId,
        cardName: card.productName,
        cycleStart: usage.cycleStart,
        cycleEnd: usage.cycleEnd,
      })
    }
  }

  // Apply filters
  const filteredRows = rows.filter((row) => {
    if (filterCard !== 'all' && row.cardId !== filterCard) return false
    return true
  })

  // Apply sorting
  const sortedRows = [...filteredRows].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case 'date':
        comparison = new Date(a.entry.date).getTime() - new Date(b.entry.date).getTime()
        break
      case 'benefit':
        comparison = a.benefitName.localeCompare(b.benefitName)
        break
      case 'card':
        comparison = a.cardName.localeCompare(b.cardName)
        break
      case 'amount':
        comparison = a.entry.amount - b.entry.amount
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleEditStart = (row: UsageRowData) => {
    setEditingEntryId(row.entry.id)
    setEditAmount(row.entry.amount.toString())
    setEditNotes(row.entry.notes || '')
  }

  const handleEditCancel = () => {
    setEditingEntryId(null)
    setEditAmount('')
    setEditNotes('')
  }

  const handleEditSave = (row: UsageRowData) => {
    try {
      const amount = parseFloat(editAmount)
      if (isNaN(amount) || amount <= 0) {
        setToast({ message: 'Please enter a valid amount', type: 'error' })
        return
      }

      updateBenefitUsageEntry(row.benefitId, row.entry.id, {
        amount,
        notes: editNotes.trim() || undefined,
      })

      setToast({ message: 'Usage updated successfully', type: 'success' })
      setEditingEntryId(null)
      setEditAmount('')
      setEditNotes('')
      refreshUsage()
    } catch (error) {
      setToast({ message: 'Failed to update usage', type: 'error' })
    }
  }

  const handleDelete = (row: UsageRowData) => {
    const confirmed = window.confirm(
      `Delete this ${row.entry.amount.toFixed(2)} usage from ${row.benefitName}?`
    )

    if (!confirmed) return

    try {
      deleteBenefitUsageEntry(row.benefitId, row.entry.id)
      setToast({ message: 'Usage deleted successfully', type: 'success' })
      refreshUsage()
    } catch (error) {
      setToast({ message: 'Failed to delete usage', type: 'error' })
    }
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Benefit', 'Card', 'Amount', 'Notes']
    const csvRows = [headers.join(',')]

    sortedRows.forEach((row) => {
      const csvRow = [
        row.entry.date,
        `"${row.benefitName.replace(/"/g, '""')}"`,
        `"${row.cardName.replace(/"/g, '""')}"`,
        row.entry.amount.toFixed(2),
        row.entry.notes ? `"${row.entry.notes.replace(/"/g, '""')}"` : '',
      ]
      csvRows.push(csvRow.join(','))
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `usage-history-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setToast({ message: 'Exported to CSV successfully', type: 'success' })
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline-block ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline-block ml-1" />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-6 h-6 text-primary-600" />
            <h1 className="text-3xl font-bold text-neutral-900">Usage History</h1>
          </div>
          <p className="text-neutral-600">View and manage all your logged benefit usage</p>
        </div>
        {sortedRows.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-neutral-700 mr-2">Filter by card:</label>
            <select
              value={filterCard}
              onChange={(e) => setFilterCard(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Cards</option>
              {CARDS.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.productName}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-neutral-600">
            Showing {sortedRows.length} {sortedRows.length === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      </div>

      {/* Usage Table */}
      {sortedRows.length === 0 ? (
        <div className="card text-center py-12">
          <History className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-600">No usage entries found</p>
          <p className="text-sm text-neutral-500 mt-1">
            Start logging your benefit usage to see it here
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th
                    className="text-left px-4 py-3 text-sm font-semibold text-neutral-700 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    Date <SortIcon field="date" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-semibold text-neutral-700 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort('benefit')}
                  >
                    Benefit <SortIcon field="benefit" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-sm font-semibold text-neutral-700 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort('card')}
                  >
                    Card <SortIcon field="card" />
                  </th>
                  <th
                    className="text-right px-4 py-3 text-sm font-semibold text-neutral-700 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    Amount <SortIcon field="amount" />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-neutral-700">
                    Notes
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-neutral-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {sortedRows.map((row) => {
                  const isEditing = editingEntryId === row.entry.id

                  return (
                    <tr key={row.entry.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-neutral-900">
                        {format(new Date(row.entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-900">
                        {row.benefitName.replace(/\$\d+\s*(Annual|Yearly|Year)/gi, '').trim()}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{row.cardName}</td>
                      <td className="px-4 py-3 text-sm text-neutral-900 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 px-2 py-1 border border-primary-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-primary-500"
                            step="0.01"
                            min="0"
                          />
                        ) : (
                          `$${row.entry.amount.toFixed(2)}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="w-full px-2 py-1 border border-primary-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        ) : (
                          row.entry.notes || <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditSave(row)}
                              className="px-3 py-1 bg-primary-600 text-white rounded text-sm font-medium hover:bg-primary-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="px-3 py-1 bg-neutral-200 text-neutral-700 rounded text-sm font-medium hover:bg-neutral-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditStart(row)}
                              className="p-2 rounded hover:bg-neutral-200 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-neutral-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="p-2 rounded hover:bg-danger-100 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-danger-600" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
