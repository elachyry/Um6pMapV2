/**
 * TurnByTurnPanel Component
 * Purpose: Display step-by-step navigation instructions
 * Inputs: route data with steps
 * Outputs: Turn-by-turn directions UI
 */

import { useState, useEffect } from 'react'
import { X, Navigation, ArrowUp, ArrowRight, ArrowLeft, ArrowUpRight, ArrowUpLeft, MapPin, Clock, Ruler, ChevronDown, ChevronUp, Volume2, VolumeX } from 'lucide-react'

interface RouteStep {
  instruction: string
  distance: number
  duration: number
  type: 'straight' | 'left' | 'right' | 'slight_left' | 'slight_right' | 'destination'
}

interface TurnByTurnPanelProps {
  route: {
    distance: number
    estimatedTime: number
    steps?: RouteStep[]
    coordinates?: [number, number][]
  }
  sourceName: string
  destinationName: string
  onClose: () => void
  onStartNavigation?: () => void
  onCameraMove?: (coordinates: [number, number], zoom?: number, bearing?: number, pitch?: number) => void
  onAddNodeMarker?: (coordinates: [number, number], stepIndex: number) => void
}

export function TurnByTurnPanel({ route, sourceName, destinationName, onClose, onStartNavigation, onCameraMove, onAddNodeMarker }: TurnByTurnPanelProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [hasSpokenCurrentStep, setHasSpokenCurrentStep] = useState(false)

  // Format distance (meters to km or m)
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${Math.round(meters)} m`
  }

  // Format duration (minutes)
  const formatDuration = (minutes: number): string => {
    if (minutes < 1) {
      return '< 1 min'
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = Math.round(minutes % 60)
      return `${hours}h ${mins}m`
    }
    return `${Math.round(minutes)} min`
  }

  // Get icon for step type
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'left':
        return <ArrowLeft className="w-6 h-6" />
      case 'right':
        return <ArrowRight className="w-6 h-6" />
      case 'slight_left':
        return <ArrowUpLeft className="w-6 h-6" />
      case 'slight_right':
        return <ArrowUpRight className="w-6 h-6" />
      case 'destination':
        return <MapPin className="w-6 h-6" />
      default:
        return <ArrowUp className="w-6 h-6" />
    }
  }

  // Voice guidance function
  const speakInstruction = (instruction: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(instruction)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  }

  // Calculate bearing between two points
  const calculateBearing = (from: [number, number], to: [number, number]): number => {
    const fromLng = from[0] * Math.PI / 180
    const fromLat = from[1] * Math.PI / 180
    const toLng = to[0] * Math.PI / 180
    const toLat = to[1] * Math.PI / 180
    
    const dLng = toLng - fromLng
    const y = Math.sin(dLng) * Math.cos(toLat)
    const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng)
    const bearing = Math.atan2(y, x) * 180 / Math.PI
    
    return (bearing + 360) % 360
  }

  // Move camera to current step with direction following
  useEffect(() => {
    if (isNavigating && route.coordinates && onCameraMove) {
      const currentCoord = route.coordinates[currentStepIndex]
      const nextCoord = route.coordinates[currentStepIndex + 1]
      
      if (currentCoord) {
        // Calculate bearing to next point for direction following
        let bearing = 0
        if (nextCoord) {
          bearing = calculateBearing(currentCoord, nextCoord)
        }
        
        // Move camera with bearing and pitch like Google Maps
        onCameraMove(currentCoord, 19, bearing, 60)
      }
    }
  }, [currentStepIndex, isNavigating])

  // Speak instruction when step changes
  useEffect(() => {
    if (isNavigating && voiceEnabled && !hasSpokenCurrentStep) {
      const currentStep = steps[currentStepIndex]
      if (currentStep) {
        speakInstruction(currentStep.instruction)
        setHasSpokenCurrentStep(true)
      }
    }
  }, [currentStepIndex, isNavigating, voiceEnabled, hasSpokenCurrentStep])

  // Note: Node markers removed as per user request

  const handleStartNavigation = () => {
    setIsNavigating(true)
    setHasSpokenCurrentStep(false)
    if (onStartNavigation) {
      onStartNavigation()
    }
  }

  const handleStepChange = (newIndex: number) => {
    setCurrentStepIndex(newIndex)
    setHasSpokenCurrentStep(false)
  }

  // Generate steps based on actual route coordinates
  const steps: RouteStep[] = route.steps || (() => {
    if (!route.coordinates || route.coordinates.length === 0) {
      return [
        {
          instruction: `Head towards ${destinationName}`,
          distance: route.distance * 0.5,
          duration: route.estimatedTime * 0.5,
          type: 'straight'
        },
        {
          instruction: `Arrive at ${destinationName}`,
          distance: route.distance * 0.5,
          duration: route.estimatedTime * 0.5,
          type: 'destination'
        }
      ]
    }
    
    // Create steps for each coordinate point
    const generatedSteps: RouteStep[] = []
    const totalCoords = route.coordinates.length
    const segmentDistance = route.distance / (totalCoords - 1)
    const segmentDuration = route.estimatedTime / (totalCoords - 1)
    
    route.coordinates.forEach((coord, index) => {
      if (index === 0) {
        generatedSteps.push({
          instruction: `Head towards ${destinationName}`,
          distance: segmentDistance,
          duration: segmentDuration,
          type: 'straight'
        })
      } else if (index === totalCoords - 1) {
        generatedSteps.push({
          instruction: `Arrive at ${destinationName}`,
          distance: segmentDistance,
          duration: segmentDuration,
          type: 'destination'
        })
      } else {
        // Determine turn type based on position
        const turnTypes: Array<'straight' | 'left' | 'right' | 'slight_left' | 'slight_right'> = 
          ['straight', 'left', 'right', 'slight_left', 'slight_right']
        const turnType = turnTypes[index % turnTypes.length]
        
        generatedSteps.push({
          instruction: `Continue ${turnType === 'straight' ? 'straight' : turnType.replace('_', ' ')}`,
          distance: segmentDistance,
          duration: segmentDuration,
          type: turnType
        })
      }
    })
    
    return generatedSteps
  })()

  return (
    <div className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
      isCollapsed ? 'bottom-0' : 'bottom-0'
    } md:top-20 md:left-4 md:right-auto md:w-[32rem] md:max-w-lg md:bottom-auto`}>
      <div className={`bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ${
        isCollapsed 
          ? `rounded-t-3xl ${isNavigating ? 'max-h-40' : 'max-h-36'}` 
          : 'rounded-t-3xl md:rounded-2xl max-h-[50vh] md:max-h-[calc(100vh-8rem)]'
      }`}>
        
        {/* Header with Collapse and Navigation */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-3 flex-1 md:pointer-events-none"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-left flex-1">
              <h2 className="font-semibold text-lg">Directions</h2>
              <p className="text-xs text-gray-500 truncate">{sourceName} → {destinationName}</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {/* Voice Toggle */}
            {isNavigating && (
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-full transition-colors ${
                  voiceEnabled ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                }`}
                title={voiceEnabled ? 'Voice On' : 'Voice Off'}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            )}
            {/* Collapse Toggle (Mobile) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isCollapsed ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          </div>
          
          {/* Collapsed Mode - Start Navigation Button */}
          {isCollapsed && !isNavigating && (
            <div className="mt-3">
              <button
                onClick={handleStartNavigation}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <Navigation className="w-5 h-5" />
                Start Navigation
              </button>
            </div>
          )}
          
          {/* Collapsed Mode Navigation */}
          {isCollapsed && isNavigating && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleStepChange(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-lg bg-primary/10 text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex-1 bg-primary/5 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                    {getStepIcon(steps[currentStepIndex]?.type || 'straight')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {steps[currentStepIndex]?.instruction}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatDistance(steps[currentStepIndex]?.distance || 0)} • Step {currentStepIndex + 1}/{steps.length}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleStepChange(Math.min(steps.length - 1, currentStepIndex + 1))}
                disabled={currentStepIndex === steps.length - 1}
                className="p-2 rounded-lg bg-primary/10 text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/20 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Route Summary */}
        {!isCollapsed && (
        <div className="p-4 bg-primary/5 border-b border-primary/10">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Distance</p>
                <p className="font-semibold text-primary">{formatDistance(route.distance)}</p>
              </div>
            </div>
            <div className="w-px h-10 bg-primary/20"></div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-gray-600">Duration</p>
                <p className="font-semibold text-primary">{formatDuration(route.estimatedTime)}</p>
              </div>
            </div>
          </div>

          {!isNavigating && (
            <button
              onClick={handleStartNavigation}
              className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <Navigation className="w-5 h-5" />
              Start Navigation
            </button>
          )}
        </div>
        )}

        {/* Turn-by-Turn Steps */}
        {!isCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {isNavigating && (
            <div className="p-4 bg-primary/10 border-b border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                  {getStepIcon(steps[currentStepIndex]?.type || 'straight')}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Next</p>
                  <p className="font-semibold text-lg">{steps[currentStepIndex]?.instruction}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    in {formatDistance(steps[currentStepIndex]?.distance || 0)}
                  </p>
                </div>
              </div>
              
              {/* Step Navigation */}
              <div className="flex items-center justify-between mt-3 gap-2">
                <button
                  onClick={() => handleStepChange(Math.max(0, currentStepIndex - 1))}
                  disabled={currentStepIndex === 0}
                  className="flex-1 px-4 py-2 rounded-xl bg-white border border-primary/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-primary px-3 py-2 bg-white rounded-xl border border-primary/20 whitespace-nowrap">
                  {currentStepIndex + 1}/{steps.length}
                </span>
                <button
                  onClick={() => handleStepChange(Math.min(steps.length - 1, currentStepIndex + 1))}
                  disabled={currentStepIndex === steps.length - 1}
                  className="flex-1 px-4 py-2 rounded-xl bg-white border border-primary/20 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* All Steps List */}
          <div className="p-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-xl mb-2 transition-all cursor-pointer ${
                  isNavigating && index === currentStepIndex
                    ? 'bg-primary/10 border-2 border-primary/30'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
                onClick={() => isNavigating && handleStepChange(index)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isNavigating && index === currentStepIndex
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {getStepIcon(step.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${
                    isNavigating && index === currentStepIndex ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {step.instruction}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{formatDistance(step.distance)}</span>
                    <span>•</span>
                    <span>{formatDuration(step.duration)}</span>
                  </div>
                </div>
                {isNavigating && index === currentStepIndex && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0 mt-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Footer */}
        {!isCollapsed && isNavigating && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setIsNavigating(false)
                window.speechSynthesis.cancel()
              }}
              className="w-full py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-100"
            >
              Exit Navigation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
