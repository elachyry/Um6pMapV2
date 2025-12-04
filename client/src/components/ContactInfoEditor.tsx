/**
 * ContactInfoEditor Component
 * Purpose: Manage contact information (phones, emails, websites, social media)
 * Inputs: contacts array, onChange callback
 * Outputs: Updated contacts array
 */

import { useState } from 'react'
import { Plus, Trash2, Phone, Mail, Globe, Star } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'

interface ContactInfo {
  type: string
  value: string
  label: string
  isPrimary: boolean
}

interface ContactInfoEditorProps {
  contacts: ContactInfo[]
  onChange: (contacts: ContactInfo[]) => void
}

const CONTACT_TYPES = [
  { value: 'phone', label: 'Phone', icon: Phone, placeholder: '+1 (555) 123-4567' },
  { value: 'email', label: 'Email', icon: Mail, placeholder: 'contact@example.com' },
  { value: 'website', label: 'Website', icon: Globe, placeholder: 'https://example.com' },
  { value: 'facebook', label: 'Facebook', icon: Globe, placeholder: 'https://facebook.com/...' },
  { value: 'twitter', label: 'Twitter/X', icon: Globe, placeholder: 'https://twitter.com/...' },
  { value: 'instagram', label: 'Instagram', icon: Globe, placeholder: 'https://instagram.com/...' },
  { value: 'linkedin', label: 'LinkedIn', icon: Globe, placeholder: 'https://linkedin.com/...' },
]

export function ContactInfoEditor({ contacts, onChange }: ContactInfoEditorProps) {
  const [newContact, setNewContact] = useState<ContactInfo>({
    type: 'phone',
    value: '',
    label: '',
    isPrimary: false,
  })

  const addContact = () => {
    if (!newContact.value.trim()) return

    onChange([...contacts, newContact])
    setNewContact({
      type: 'phone',
      value: '',
      label: '',
      isPrimary: false,
    })
  }

  const removeContact = (index: number) => {
    onChange(contacts.filter((_, i) => i !== index))
  }

  const updateContact = (index: number, updates: Partial<ContactInfo>) => {
    const newContacts = [...contacts]
    newContacts[index] = { ...newContacts[index], ...updates }
    
    // If setting as primary, unset others of same type
    if (updates.isPrimary) {
      newContacts.forEach((c, i) => {
        if (i !== index && c.type === newContacts[index].type) {
          c.isPrimary = false
        }
      })
    }
    
    onChange(newContacts)
  }

  const getTypeInfo = (type: string) => {
    return CONTACT_TYPES.find((t) => t.value === type) || CONTACT_TYPES[0]
  }

  const groupedContacts = contacts.reduce((acc, contact, idx) => {
    if (!acc[contact.type]) acc[contact.type] = []
    acc[contact.type].push({ ...contact, index: idx })
    return acc
  }, {} as Record<string, Array<ContactInfo & { index: number }>>)

  return (
    <div className="space-y-4">
      {/* Add New Contact */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={newContact.type}
                  onChange={(e) => setNewContact({ ...newContact, type: e.target.value })}
                >
                  {CONTACT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Label (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Main Office, Support"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newContact.label}
                  onChange={(e) => setNewContact({ ...newContact, label: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={getTypeInfo(newContact.type).placeholder}
                  className="flex-1 px-3 py-2 border rounded-md"
                  value={newContact.value}
                  onChange={(e) => setNewContact({ ...newContact, value: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContact())}
                />
                <Button type="button" onClick={addContact}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Contacts */}
      {Object.keys(groupedContacts).length > 0 && (
        <div className="space-y-3">
          {Object.entries(groupedContacts).map(([type, items]) => {
            const typeInfo = getTypeInfo(type)
            const Icon = typeInfo.icon

            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-semibold text-sm">{typeInfo.label}</h4>
                  <Badge variant="outline" className="text-xs">
                    {items.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {items.map((contact) => (
                    <Card key={contact.index}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                className="flex-1 px-2 py-1 text-sm border rounded"
                                value={contact.value}
                                onChange={(e) =>
                                  updateContact(contact.index, { value: e.target.value })
                                }
                              />
                              <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={contact.isPrimary}
                                  onChange={(e) =>
                                    updateContact(contact.index, { isPrimary: e.target.checked })
                                  }
                                />
                                <Star
                                  className={`w-3 h-3 ${
                                    contact.isPrimary ? 'fill-yellow-500 text-yellow-500' : ''
                                  }`}
                                />
                                Primary
                              </label>
                            </div>
                            <input
                              type="text"
                              placeholder="Label (optional)"
                              className="w-full px-2 py-1 text-xs border rounded"
                              value={contact.label}
                              onChange={(e) =>
                                updateContact(contact.index, { label: e.target.value })
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContact(contact.index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {contacts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No contact information added yet. Add phones, emails, websites, or social media above.
        </div>
      )}
    </div>
  )
}
