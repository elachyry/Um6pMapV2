# Map Cache Invalidation Guide

## Overview
The map cache system ensures that when admins update map-related data, the cached map data is invalidated and fresh data is fetched on the next map load.

## How It Works

### 1. Cache Version System
- Each cache entry has a `version` number
- Global cache version is stored in `localStorage`
- When data is updated, the global version increments
- Map checks if cached version matches current version
- If versions don't match, cache is invalidated and fresh data is fetched

### 2. Cache Invalidation Utility
Location: `/client/src/utils/mapCache.ts`

```typescript
import { invalidateCacheOnUpdate } from '@/utils/mapCache'

// After successful create/update/delete
invalidateCacheOnUpdate('entityType', campusId)
```

## Where to Add Cache Invalidation

Add `invalidateCacheOnUpdate()` after successful operations in `MapManagement.tsx`:

### ✅ Buildings (IMPLEMENTED)
**Location:** `handleBuildingFormSubmit` (line ~1442)
```typescript
invalidateCacheOnUpdate('building', selectedCampusId || undefined)
```

**Also add to:**
- `handleDeleteBuilding` - After successful deletion
- `handleToggleBuilding` - After toggling active status
- `handleImportBuildings` - After successful import

### 📝 Open Spaces (TODO)
**Add to:**
- `handleOpenSpaceFormSubmit` - After create/update
- `handleDeleteOpenSpace` - After deletion
- `toggleOpenSpaceActive` - After toggle
- `handleImportOpenSpaces` - After import

```typescript
invalidateCacheOnUpdate('openSpace', selectedCampusId || undefined)
```

### 📝 POIs (TODO)
**Add to:**
- `handlePOIFormSubmit` - After create/update
- `handleDeletePOI` - After deletion
- `togglePOIActive` - After toggle
- `handleImportPOIs` - After import

```typescript
invalidateCacheOnUpdate('poi', selectedCampusId || undefined)
```

### 📝 Paths (TODO)
**Add to:**
- `handlePathFormSubmit` - After create/update
- `handleDeletePath` - After deletion
- `togglePathActive` - After toggle
- `handleImportPaths` - After import

```typescript
invalidateCacheOnUpdate('path', selectedCampusId || undefined)
```

### 📝 Boundaries (TODO)
**Add to:**
- `handleBoundaryFormSubmit` - After create/update
- `handleDeleteBoundary` - After deletion
- `toggleBoundaryActive` - After toggle
- `handleImportBoundaries` - After import

```typescript
invalidateCacheOnUpdate('boundary', selectedCampusId || undefined)
```

### 📝 Categories (TODO)
**Add to:**
- `handleCategoryFormSubmit` - After create/update
- `handleDeleteCategory` - After deletion

```typescript
invalidateCacheOnUpdate('category') // No campusId needed - affects all
```

### 📝 Emergency Contacts (TODO)
**Add to:**
- `handleEmergencyContactFormSubmit` - After create/update
- `handleDeleteEmergencyContact` - After deletion
- `toggleEmergencyContactActive` - After toggle

```typescript
invalidateCacheOnUpdate('emergencyContact', selectedCampusId || undefined)
```

### 📝 Locations (TODO)
**Add to:**
- `handleLocationFormSubmit` - After create/update
- `handleDeleteLocation` - After deletion
- `toggleLocationReservable` - After toggle

```typescript
invalidateCacheOnUpdate('location', selectedCampusId || undefined)
```

### 📝 Map Settings (TODO)
**Location:** `MapSettings.tsx`
**Add to:**
- After successful campus settings update

```typescript
invalidateCacheOnUpdate('mapSettings', campusId)
```

## Implementation Pattern

```typescript
// Example for any entity
const handleEntityFormSubmit = async (data: any) => {
  setIsSubmitting(true)
  try {
    // ... create/update logic ...
    
    if (isUpdate) {
      await updateEntity(entityId, data)
      toast.success('Entity updated successfully')
    } else {
      await createEntity(data)
      toast.success('Entity created successfully')
    }
    
    // ✅ Invalidate cache
    invalidateCacheOnUpdate('entityType', selectedCampusId || undefined)
    
    // ... cleanup and refresh ...
  } catch (error) {
    toast.error('Failed to save entity')
  } finally {
    setIsSubmitting(false)
  }
}
```

## Testing Cache Invalidation

1. Open map page - data loads and caches
2. Open admin panel - update a building
3. Return to map page - should see "🔄 Cache invalidated - fetching fresh data"
4. Map displays updated data

## Cache Behavior

### First Load
```
🔄 Fetching fresh map data
- Buildings
- Open Spaces  
- Categories
- Campus Settings
✅ Data cached (version: 1)
```

### Subsequent Load (No Updates)
```
📦 Using cached map data (version: 1)
```

### After Admin Update
```
🗑️ Invalidated map cache for campus: xxx
Cache version: 1 → 2
```

### Next Map Load
```
🔄 Cache invalidated - fetching fresh data
✅ Data cached (version: 2)
```

## Benefits

✅ **Automatic** - No manual cache clearing needed
✅ **Efficient** - Only invalidates when data changes
✅ **Per-Campus** - Can invalidate specific campus or all
✅ **Time-Based** - Still expires after 5 minutes
✅ **Version-Based** - Invalidates immediately on update

## Files Modified

1. `/client/src/utils/mapCache.ts` - Cache utility (NEW)
2. `/client/src/pages/Map.tsx` - Version checking
3. `/client/src/pages/MapManagement.tsx` - Invalidation calls
4. `/client/src/pages/MapSettings.tsx` - Settings invalidation (TODO)
