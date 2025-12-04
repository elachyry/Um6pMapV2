/**
 * OperatingHoursEditor Component
 * Purpose: Manage operating hours with quick presets or custom hours
 * Inputs: hours array, onChange callback
 * Outputs: Updated hours array
 */

import { useState, useEffect } from 'react'
import { Clock, Calendar } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'

interface OperatingHour {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
  is24Hours: boolean
}

interface OperatingHoursEditorProps {
  hours: OperatingHour[]
  onChange: (hours: OperatingHour[]) => void
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const PRESETS = {
  'business': {
    label: 'Business Hours',
    description: 'Mon-Fri 9:00-17:00',
    hours: DAYS.map((_, idx) => ({
      dayOfWeek: idx,
      openTime: idx >= 1 && idx <= 5 ? '09:00' : null,
      closeTime: idx >= 1 && idx <= 5 ? '17:00' : null,
      isClosed: idx === 0 || idx === 6,
      is24Hours: false,
    })),
  },
  '24/7': {
    label: '24/7 Service',
    description: 'Open all day, every day',
    hours: DAYS.map((_, idx) => ({
      dayOfWeek: idx,
      openTime: '00:00',
      closeTime: '23:59',
      isClosed: false,
      is24Hours: true,
    })),
  },
  'extended': {
    label: 'Extended Hours',
    description: 'Mon-Sat 8:00-22:00',
    hours: DAYS.map((_, idx) => ({
      dayOfWeek: idx,
      openTime: idx >= 1 && idx <= 6 ? '08:00' : null,
      closeTime: idx >= 1 && idx <= 6 ? '22:00' : null,
      isClosed: idx === 0,
      is24Hours: false,
    })),
  },
}

export function OperatingHoursEditor({ hours, onChange }: OperatingHoursEditorProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  // Auto-switch to custom mode if hours exist (when editing)
  useEffect(() => {
    if (hours && hours.length > 0) {
      // Check if hours match any preset
      let matchesPreset = false
      for (const [key, preset] of Object.entries(PRESETS)) {
        const matches = preset.hours.every((presetHour, idx) => {
          const hour = hours[idx]
          return (
            hour &&
            hour.dayOfWeek === presetHour.dayOfWeek &&
            hour.openTime === presetHour.openTime &&
            hour.closeTime === presetHour.closeTime &&
            hour.isClosed === presetHour.isClosed &&
            hour.is24Hours === presetHour.is24Hours
          )
        })
        if (matches) {
          matchesPreset = true
          setSelectedPreset(key)
          setMode('preset')
          break
        }
      }
      
      // If doesn't match any preset, switch to custom mode
      if (!matchesPreset) {
        setMode('custom')
        setSelectedPreset(null)
      }
    }
  }, [hours])

  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey)
    onChange(PRESETS[presetKey as keyof typeof PRESETS].hours)
  }

  const switchToCustom = () => {
    setMode('custom')
    setSelectedPreset(null)
    // Initialize with default hours if empty
    if (hours.length === 0) {
      onChange(
        DAYS.map((_, idx) => ({
          dayOfWeek: idx,
          openTime: '09:00',
          closeTime: '17:00',
          isClosed: false,
          is24Hours: false,
        }))
      )
    }
  }

  const updateDay = (dayIndex: number, updates: Partial<OperatingHour>) => {
    const newHours = [...hours]
    newHours[dayIndex] = { ...newHours[dayIndex], ...updates }
    onChange(newHours)
  }

  const copyToAll = (dayIndex: number) => {
    const template = hours[dayIndex]
    onChange(
      hours.map((h) => ({
        ...h,
        openTime: template.openTime,
        closeTime: template.closeTime,
        isClosed: template.isClosed,
        is24Hours: template.is24Hours,
      }))
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'preset' ? 'default' : 'outline'}
          onClick={() => setMode('preset')}
          className="flex-1"
        >
          Quick Setup
        </Button>
        <Button
          type="button"
          variant={mode === 'custom' ? 'default' : 'outline'}
          onClick={switchToCustom}
          className="flex-1"
        >
          Custom Hours
        </Button>
      </div>

      {/* Preset Selection */}
      {mode === 'preset' && (
        <div className="grid gap-3">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                selectedPreset === key
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => applyPreset(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">{preset.label}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{preset.description}</p>
                  </div>
                  {selectedPreset === key && <Badge>Selected</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Custom Hours */}
      {mode === 'custom' && (
        <div className="space-y-2">
          {hours.map((hour, idx) => (
            <Card key={idx}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-28 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{DAYS[idx]}</span>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hour.isClosed}
                        onChange={(e) =>
                          updateDay(idx, {
                            isClosed: e.target.checked,
                            is24Hours: false,
                            openTime: null,
                            closeTime: null,
                          })
                        }
                      />
                      <span className="text-sm">Closed</span>
                    </label>

                    {!hour.isClosed && (
                      <>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={hour.is24Hours}
                            onChange={(e) =>
                              updateDay(idx, {
                                is24Hours: e.target.checked,
                                openTime: e.target.checked ? '00:00' : '09:00',
                                closeTime: e.target.checked ? '23:59' : '17:00',
                              })
                            }
                          />
                          <span className="text-sm">24 Hours</span>
                        </label>

                        {!hour.is24Hours && (
                          <>
                            <input
                              type="time"
                              value={hour.openTime || ''}
                              onChange={(e) => updateDay(idx, { openTime: e.target.value })}
                              className="px-2 py-1 text-sm border rounded"
                            />
                            <span className="text-muted-foreground">to</span>
                            <input
                              type="time"
                              value={hour.closeTime || ''}
                              onChange={(e) => updateDay(idx, { closeTime: e.target.value })}
                              className="px-2 py-1 text-sm border rounded"
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToAll(idx)}
                    title="Copy to all days"
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
