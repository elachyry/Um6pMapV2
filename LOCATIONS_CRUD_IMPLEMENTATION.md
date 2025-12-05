# Locations CRUD Implementation

## Complete code to replace the locations section in MapManagement.tsx

Replace lines 1155-1165 in `/client/src/pages/MapManagement.tsx` with this complete implementation:

```typescript
{activeSection === 'locations' && (
  <>
    {/* Search and Filter Bar */}
    <Card className="mb-3 md:mb-6">
      <CardContent className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search locations by name or room number..."
              value={locationSearchQuery}
              onChange={(e) => {
                setLocationSearchQuery(e.target.value)
                setLocationPage(1)
              }}
              className="pl-10"
            />
          </div>

          {/* Building Filter */}
          <select
            value={selectedBuildingFilter}
            onChange={(e) => {
              setSelectedBuildingFilter(e.target.value)
              setLocationPage(1)
            }}
            className="px-3 py-2 rounded-md border border-border bg-background text-sm min-w-[150px]"
          >
            <option value="">All Buildings</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          Showing {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>

    {isLoadingLocations ? (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading locations...</p>
          </div>
        </CardContent>
      </Card>
    ) : filteredLocations.length === 0 ? (
      <Card>
        <CardContent className="p-12 text-center">
          <MapPin className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Locations Found</h3>
          <p className="text-muted-foreground mb-6">
            {locationSearchQuery || selectedBuildingFilter
              ? 'No locations match your search criteria.'
              : 'Get started by adding your first location.'}
          </p>
          <Button onClick={() => {
            setEditingLocation(null)
            setShowLocationForm(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Location
          </Button>
        </CardContent>
      </Card>
    ) : (
      <>
        {/* Locations Cards Grid */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredLocations.map((location: any) => (
            <Card 
              key={location.id} 
              className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => setSelectedLocation(location)}
            >
              {/* Location Header */}
              <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 relative">
                {/* Status Dot */}
                <div className="absolute top-3 left-3">
                  <div className={`w-2 h-2 rounded-full shadow-sm ${location.isReservable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`} title={location.isReservable ? 'Reservable' : 'Not Reservable'} />
                </div>

                {/* Action Buttons Overlay - Always visible on mobile */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                  <Button 
                    variant="secondary" 
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleLocationReservable(location.id, location.name, location.isReservable)
                    }}
                    title={location.isReservable ? 'Make Not Reservable' : 'Make Reservable'}
                  >
                    <Power className={`w-4 h-4 ${location.isReservable ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditLocation(location)
                    }}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteLocation(location.id, location.name)
                    }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{location.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {location.building?.name || 'No building'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <CardContent className="p-3 md:p-4">
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mt-1">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{location.locationType}</Badge>
                    {location.floor !== null && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">Floor: {location.floor}</Badge>
                    )}
                    {location.roomNumber && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">Room: {location.roomNumber}</Badge>
                    )}
                    {location.capacity && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 whitespace-nowrap">Cap: {location.capacity}</Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2 min-h-[2.5rem]">
                  {location.description || 'No description available'}
                </p>
                {location.facilities && JSON.parse(location.facilities).length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {JSON.parse(location.facilities).slice(0, 3).map((facility: string, idx: number) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-secondary/50 rounded-md truncate">
                        {facility}
                      </span>
                    ))}
                    {JSON.parse(location.facilities).length > 3 && (
                      <span className="text-xs px-2 py-0.5 bg-secondary/50 rounded-md">
                        +{JSON.parse(location.facilities).length - 3}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Location Detail Modal */}
        {selectedLocation && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4" onClick={() => setSelectedLocation(null)}>
            <Card className="w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="sticky top-0 bg-background border-b z-10 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-2xl truncate">{selectedLocation.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm truncate">
                      {selectedLocation.building?.name || 'No building assigned'}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLocation(null)} className="flex-shrink-0">
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Location Details */}
                <div className="grid gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {selectedLocation.description || 'No description available'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Status</h3>
                      <Badge variant={selectedLocation.isReservable ? 'success' : 'secondary'}>
                        {selectedLocation.isReservable ? 'Reservable' : 'Not Reservable'}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Type</h3>
                      <Badge variant="outline">{selectedLocation.locationType}</Badge>
                    </div>

                    {selectedLocation.floor !== null && (
                      <div>
                        <h3 className="font-semibold mb-2">Floor</h3>
                        <p className="text-muted-foreground">{selectedLocation.floor}</p>
                      </div>
                    )}

                    {selectedLocation.roomNumber && (
                      <div>
                        <h3 className="font-semibold mb-2">Room Number</h3>
                        <p className="text-muted-foreground">{selectedLocation.roomNumber}</p>
                      </div>
                    )}

                    {selectedLocation.capacity && (
                      <div>
                        <h3 className="font-semibold mb-2">Capacity</h3>
                        <p className="text-muted-foreground">{selectedLocation.capacity} people</p>
                      </div>
                    )}
                  </div>

                  {selectedLocation.facilities && JSON.parse(selectedLocation.facilities).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Facilities & Equipment</h3>
                      <div className="flex flex-wrap gap-2">
                        {JSON.parse(selectedLocation.facilities).map((facility: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{facility}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h3 className="font-semibold mb-1">Created</h3>
                      <p className="text-muted-foreground">
                        {new Date(selectedLocation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Last Updated</h3>
                      <p className="text-muted-foreground">
                        {new Date(selectedLocation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Icon Only */}
                <div className="flex gap-2 pt-4 border-t justify-center">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => {
                      setSelectedLocation(null)
                      handleEditLocation(selectedLocation)
                    }}
                    title="Edit Location"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => {
                      handleToggleLocationReservable(selectedLocation.id, selectedLocation.name, selectedLocation.isReservable)
                      setSelectedLocation(null)
                    }}
                    title={selectedLocation.isReservable ? 'Make Not Reservable' : 'Make Reservable'}
                  >
                    <Power className={`w-4 h-4 ${selectedLocation.isReservable ? 'text-green-600' : 'text-gray-400'}`} />
                  </Button>
                  <Button 
                    variant="destructive"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => {
                      handleDeleteLocation(selectedLocation.id, selectedLocation.name)
                      setSelectedLocation(null)
                    }}
                    title="Delete Location"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pagination */}
        {locationTotalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {locationPage} of {locationTotalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocationPage(locationPage - 1)}
                    disabled={locationPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocationPage(locationPage + 1)}
                    disabled={locationPage === locationTotalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </>
    )}

    {/* Location Form Modal */}
    {showLocationForm && (
      <LocationForm
        location={editingLocation}
        buildings={buildings}
        onSubmit={handleLocationFormSubmit}
        onCancel={() => {
          setShowLocationForm(false)
          setEditingLocation(null)
        }}
      />
    )}
  </>
)}
```

## Add these handler functions before the return statement (around line 480):

```typescript
// Load locations
const loadLocations = async () => {
  if (!selectedCampusId) return
  setIsLoadingLocations(true)
  try {
    const response = await getLocations(locationPage, LOCATIONS_PER_PAGE)
    setLocations(response.data || [])
    setLocationTotalPages(response.pagination?.totalPages || 1)
  } catch (error) {
    console.error('Failed to load locations:', error)
    toast.error('Failed to load locations')
  } finally {
    setIsLoadingLocations(false)
  }
}

// Filter locations
const filteredLocations = locations.filter((location) => {
  const matchesSearch = !locationSearchQuery || 
    location.name.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
    location.roomNumber?.toLowerCase().includes(locationSearchQuery.toLowerCase())
  
  const matchesBuilding = !selectedBuildingFilter || location.buildingId === selectedBuildingFilter
  
  return matchesSearch && matchesBuilding
})

// Location CRUD handlers
const handleEditLocation = (location: any) => {
  setEditingLocation(location)
  setShowLocationForm(true)
}

const handleDeleteLocation = (id: string, name: string) => {
  setConfirmDialog({
    isOpen: true,
    title: 'Delete Location',
    message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
    variant: 'danger',
    onConfirm: async () => {
      try {
        await deleteLocation(id)
        toast.success('Location deleted successfully')
        loadLocations()
      } catch (error) {
        console.error('Failed to delete location:', error)
        toast.error('Failed to delete location')
      }
    }
  })
}

const handleToggleLocationReservable = (id: string, name: string, currentStatus: boolean) => {
  setConfirmDialog({
    isOpen: true,
    title: currentStatus ? 'Deactivate Location' : 'Activate Location',
    message: `Are you sure you want to ${currentStatus ? 'disable' : 'enable'} reservations for "${name}"?`,
    variant: 'warning',
    onConfirm: async () => {
      try {
        await toggleLocationReservable(id)
        toast.success(`Location ${currentStatus ? 'disabled' : 'enabled'} successfully`)
        loadLocations()
      } catch (error) {
        console.error('Failed to toggle location status:', error)
        toast.error('Failed to update location status')
      }
    }
  })
}

const handleLocationFormSubmit = async (formData: any) => {
  setIsSubmitting(true)
  try {
    const locationData = {
      ...formData,
      facilities: JSON.stringify(formData.facilities),
    }

    if (editingLocation) {
      await updateLocation(editingLocation.id, locationData)
      toast.success('Location updated successfully')
    } else {
      await createLocation(locationData)
      toast.success('Location created successfully')
    }

    setShowLocationForm(false)
    setEditingLocation(null)
    loadLocations()
  } catch (error: any) {
    console.error('Failed to save location:', error)
    toast.error(error.message || 'Failed to save location')
  } finally {
    setIsSubmitting(false)
  }
}
```

## Add useEffect to load locations when section changes (around line 100):

```typescript
// Load locations when section changes
useEffect(() => {
  if (activeSection === 'locations' && selectedCampusId) {
    loadLocations()
  }
}, [activeSection, selectedCampusId, locationPage])
```

## That's it! The complete CRUD implementation for locations is ready.
