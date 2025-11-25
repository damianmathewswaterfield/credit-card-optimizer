'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'

interface UserPreferencesFormProps {
  initialData?: {
    timezone: string
    defaultReminderDays: number
    valuePerPointRules: string
  }
}

export function UserPreferencesForm({ initialData }: UserPreferencesFormProps = {}) {
  // Load initial data from localStorage if available
  const [prefs, setPrefs] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cardOptimizer_userPreferences')
      if (stored) {
        return JSON.parse(stored)
      }
    }
    return {
      timezone: initialData?.timezone || 'America/New_York',
      defaultReminderDays: initialData?.defaultReminderDays || 7,
      valuePerPointRules: initialData?.valuePerPointRules
        ? JSON.parse(initialData.valuePerPointRules)
        : { UR: 0.015, MR: 0.016, VENTURE: 0.012, TY: 0.013 },
    }
  })

  const [timezone, setTimezone] = useState(prefs.timezone)
  const [reminderDays, setReminderDays] = useState(prefs.defaultReminderDays)
  const [pointValues, setPointValues] = useState(prefs.valuePerPointRules)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = () => {
    setSaving(true)
    setMessage('')

    try {
      const updated = {
        timezone,
        defaultReminderDays: reminderDays,
        valuePerPointRules: pointValues,
      }
      localStorage.setItem('cardOptimizer_userPreferences', JSON.stringify(updated))
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
      // Trigger page reload to refresh all data
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Timezone */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Timezone</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="America/Anchorage">Alaska Time (AKT)</option>
          <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
        </select>
        <p className="text-xs text-neutral-600 mt-1">
          Used for calculating benefit reset times and expiry dates
        </p>
      </div>

      {/* Reminder Days */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Default Reminder Lead Time
        </label>
        <select
          value={reminderDays}
          onChange={(e) => setReminderDays(Number(e.target.value))}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value={3}>3 days before</option>
          <option value={7}>7 days before</option>
          <option value={14}>14 days before</option>
          <option value={30}>30 days before</option>
        </select>
        <p className="text-xs text-neutral-600 mt-1">
          How far in advance to show expiring benefit warnings
        </p>
      </div>

      {/* Value Per Point */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Points Value Assumptions (cents per point)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Chase Ultimate Rewards</label>
            <input
              type="number"
              step="0.001"
              value={pointValues.UR}
              onChange={(e) =>
                setPointValues({ ...pointValues, UR: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Amex Membership Rewards</label>
            <input
              type="number"
              step="0.001"
              value={pointValues.MR}
              onChange={(e) =>
                setPointValues({ ...pointValues, MR: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Capital One Venture Miles</label>
            <input
              type="number"
              step="0.001"
              value={pointValues.VENTURE}
              onChange={(e) =>
                setPointValues({ ...pointValues, VENTURE: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1">Citi ThankYou Points</label>
            <input
              type="number"
              step="0.001"
              value={pointValues.TY}
              onChange={(e) =>
                setPointValues({ ...pointValues, TY: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <p className="text-xs text-neutral-600 mt-2">
          Used to calculate estimated value of points earned. Adjust based on your redemption style.
        </p>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4 inline mr-2" />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {message && (
          <span
            className={`text-sm ${
              message.includes('success') ? 'text-success-700' : 'text-danger-700'
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  )
}
