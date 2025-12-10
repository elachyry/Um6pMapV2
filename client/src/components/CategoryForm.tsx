/**
 * CategoryForm Component
 * Purpose: Form for creating and editing categories
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface CategoryFormData {
  name: string
  description: string
  icon: string
  color: string
  type: 'building' | 'open_space'
}

interface CategoryFormProps {
  category?: any
  onSubmit: (data: CategoryFormData) => void
  onCancel: () => void
  isLoading?: boolean
  defaultType?: 'building' | 'open_space'
}

// Emoji icons for categories
const emojiIcons: Record<string, string> = {
  '🎓': 'Academic',
  '🏢': 'Building',
  '🧪': 'Research',
  '📖': 'Library',
  '🍴': 'Dining',
  '🏋️': 'Recreation',
  '🏠': 'Residence',
  '❤️': 'Health',
  '🅿️': 'Parking',
  '🚌': 'Transport',
  '🏪': 'Services',
  '⚠️': 'Emergency',
  '🎭': 'Auditorium',
  '💻': 'Technology',
  '🎨': 'Art',
  '📍': 'Location',
  '☕': 'Cafe',
  '📚': 'Archive',
  '🏫': 'School',
  '💼': 'Office',
  '👥': 'Community',
  '🏛️': 'Landmark',
  '🌲': 'Nature',
  '🌳': 'Trees',
  '🌊': 'Water',
  '⛰️': 'Outdoor',
  '🌸': 'Garden',
  '🎵': 'Music',
  '📷': 'Media',
  '🎮': 'Gaming',
  '🏆': 'Sports',
  '🎯': 'Goals',
  '🚀': 'Innovation',
  '💡': 'Ideas',
  '🔬': 'Science',
  '⚗️': 'Lab',
  '🧮': 'Math',
  '📑': 'Study',
  '📰': 'News',
  '📧': 'Mail',
  '📞': 'Contact',
  '📶': 'Network',
  '🛡️': 'Security',
  '🔒': 'Private',
  '🔑': 'Access'
}

export function CategoryForm({ category, onSubmit, onCancel, isLoading = false, defaultType = 'building' }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    type: defaultType
  })

  // Auto-fill form when editing
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '#3B82F6',
        type: category.type || defaultType
      })
    }
  }, [category, defaultType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  // Available emoji icons for selection
  const availableIcons = Object.entries(emojiIcons).map(([emoji, label]) => ({
    emoji,
    label
  }))

  const colorPresets = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Violet', value: '#7C3AED' },
    { name: 'Sky', value: '#0EA5E9' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>{category ? 'Edit Category' : 'Add Category'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  placeholder="e.g., Academic"
                  required
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-muted/50 flex-1">
                    <input
                      type="radio"
                      name="type"
                      value="building"
                      checked={formData.type === 'building'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'building' | 'open_space' }))}
                      className="w-4 h-4"
                    />
                    <span className="text-xl">🏢</span>
                    <span className="font-medium">Building</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-muted/50 flex-1">
                    <input
                      type="radio"
                      name="type"
                      value="open_space"
                      checked={formData.type === 'open_space'}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'building' | 'open_space' }))}
                      className="w-4 h-4"
                    />
                    <span className="text-xl">🌳</span>
                    <span className="font-medium">Open Space</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background min-h-[100px]"
                  placeholder="Brief description of this category..."
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 border border-border rounded-lg bg-muted/20">
                  {availableIcons.map((icon) => {
                    const isSelected = formData.icon === icon.emoji
                    
                    return (
                      <button
                        key={icon.emoji}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: icon.emoji }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all hover:bg-primary/10 ${
                          isSelected 
                            ? 'border-primary bg-primary/20 scale-110' 
                            : 'border-transparent hover:border-primary/50'
                        }`}
                        title={icon.label}
                      >
                        <span className="text-2xl">{icon.emoji}</span>
                        <span className="text-[9px] mt-1 text-center line-clamp-1">{icon.label}</span>
                      </button>
                    )
                  })}
                </div>
                {formData.icon && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {formData.icon} {emojiIcons[formData.icon]}
                  </p>
                )}
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 rounded border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background font-mono text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
                
                {/* Color Presets */}
                <div className="grid grid-cols-6 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: preset.value }))}
                      className={`h-10 rounded border-2 transition-all ${
                        formData.color === preset.value ? 'border-primary scale-110' : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="border border-border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">Preview</label>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: formData.color }}
                  >
                    {formData.icon ? (
                      <span className="text-2xl">{formData.icon}</span>
                    ) : (
                      <span className="font-semibold text-xl">
                        {formData.name.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{formData.name || 'Category Name'}</div>
                    <div className="text-sm text-muted-foreground">{formData.description || 'Description'}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Form Actions */}
          <div className="border-t p-4 flex justify-end gap-3 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                category ? 'Update Category' : 'Create Category'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
