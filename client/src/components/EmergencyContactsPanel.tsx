/**
 * EmergencyContactsPanel Component
 * Purpose: Display emergency contacts with tips and quick actions
 * Inputs: emergency contacts list
 * Outputs: Contact list with call functionality
 */

import { useState } from 'react'
import { X, Phone, AlertTriangle, Info, MapPin, Clock, Shield } from 'lucide-react'

interface EmergencyContact {
  id: string
  name: string
  phone: string
  type: string
  description?: string
  location?: string
  availability?: string
}

interface EmergencyContactsPanelProps {
  contacts: EmergencyContact[]
  onClose: () => void
}

export function EmergencyContactsPanel({ contacts, onClose }: EmergencyContactsPanelProps) {
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null)

  const handleCall = (phone: string, name: string) => {
    if (window.confirm(`Call ${name} at ${phone}?`)) {
      window.location.href = `tel:${phone}`
    }
  }

  const getContactIcon = (type?: string) => {
    if (!type) return '📞'
    
    switch (type.toLowerCase()) {
      case 'police':
        return '🚓'
      case 'fire':
        return '🚒'
      case 'medical':
      case 'ambulance':
        return '🚑'
      case 'security':
        return '🛡️'
      default:
        return '📞'
    }
  }

  const getContactColor = (type?: string) => {
    if (!type) return 'bg-gray-500'
    
    switch (type.toLowerCase()) {
      case 'police':
        return 'bg-blue-500'
      case 'fire':
        return 'bg-red-500'
      case 'medical':
      case 'ambulance':
        return 'bg-green-500'
      case 'security':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const emergencyTips = [
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      title: "Stay Calm",
      description: "Take a deep breath and speak clearly when calling"
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Know Your Location",
      description: "Be ready to provide your exact location on campus"
    },
    {
      icon: <Info className="w-5 h-5" />,
      title: "Provide Details",
      description: "Describe the emergency clearly and follow instructions"
    }
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Emergency Contacts</h2>
                <p className="text-red-100 text-sm">Quick access to help when you need it</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Emergency Banner */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">In case of emergency</span>
            </div>
            <p className="text-sm text-red-50">
              Call the appropriate number below. Help is available 24/7.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Emergency Tips */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Emergency Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {emergencyTips.map((tip, index) => (
                <div
                  key={index}
                  className="bg-primary/5 rounded-xl p-4 border border-primary/10"
                >
                  <div className="text-primary mb-2">{tip.icon}</div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">{tip.title}</h4>
                  <p className="text-xs text-gray-600">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contacts List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Contacts</h3>
            
            {contacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No emergency contacts available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`bg-white rounded-xl border-2 transition-all duration-200 ${
                      selectedContact?.id === contact.id
                        ? 'border-primary shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-full ${getContactColor(contact.type)} flex items-center justify-center text-2xl flex-shrink-0`}>
                          {getContactIcon(contact.type)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">{contact.name}</h4>
                              {contact.type && (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mt-1">
                                  {contact.type}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleCall(contact.phone, contact.name)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg flex-shrink-0"
                            >
                              <Phone className="w-4 h-4" />
                              Call Now
                            </button>
                          </div>

                          {/* Phone Number */}
                          <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <Phone className="w-4 h-4" />
                            <a 
                              href={`tel:${contact.phone}`}
                              className="font-mono text-lg font-semibold hover:text-primary transition-colors"
                            >
                              {contact.phone}
                            </a>
                          </div>

                          {/* Additional Info */}
                          {(contact.description || contact.location || contact.availability) && (
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                              {contact.description && (
                                <p className="text-sm text-gray-600">{contact.description}</p>
                              )}
                              {contact.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  <span>{contact.location}</span>
                                </div>
                              )}
                              {contact.availability && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{contact.availability}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {selectedContact?.id === contact.id && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={() => setSelectedContact(null)}
                          className="text-sm text-primary hover:text-primary/80 font-medium"
                        >
                          Show less
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Your safety is our priority</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
