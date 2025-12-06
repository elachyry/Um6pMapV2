# Import Foreign Key Constraint Fix

## Problem
When importing buildings, open spaces, paths, or boundaries, you were getting foreign key constraint errors:
```
Foreign key constraint violated: `foreign key`
```

## Root Cause
The `campusId` being passed during import doesn't exist in the database. This happens when:
1. The database was reset/deleted
2. No campuses have been created yet
3. An invalid `campusId` is being used

## Solution Implemented

### 1. Added Campus Validation
All import services now validate that the campus exists before attempting to import:

**Files Modified:**
- `/server/src/services/buildingService.ts`
- `/server/src/services/openSpaceService.ts`
- `/server/src/services/pathService.ts`
- `/server/src/services/boundaryService.ts`

**Validation Logic:**
```typescript
// Validate campus exists if campusId is provided
if (campusId) {
  const campus = await prisma.campus.findUnique({ where: { id: campusId } })
  if (!campus) {
    throw new Error(`Campus with ID ${campusId} not found`)
  }
}
```

### 2. Regenerated Prisma Client
```bash
npx prisma generate
```

This ensures TypeScript recognizes the new `Boundary` model.

---

## How to Fix Your Database

### Step 1: Ensure Campuses Exist
```bash
cd server
npm run seed
```

This will create:
- Default campuses
- Roles and permissions
- Super admin user
- Amenities

### Step 2: Get Campus ID
You can get the campus ID in two ways:

**Option A: Using Prisma Studio**
```bash
cd server
npx prisma studio
```
- Open browser at `http://localhost:5555`
- Click on `Campus` table
- Copy the `id` of your campus

**Option B: Using the API**
```bash
curl http://localhost:3000/api/campuses
```

---

## How to Import Data Correctly

### 1. Select Campus First
In the UI, **always select a campus** from the dropdown before importing.

### 2. Import Order
Import in this order to avoid foreign key issues:
1. **Campuses** (via seed or manual creation)
2. **Buildings** (GeoJSON import)
3. **Open Spaces** (GeoJSON import)
4. **Paths** (GeoJSON import)
5. **Boundaries** (GeoJSON import)
6. **POIs** (can reference buildings/open spaces)

### 3. Valid Campus IDs
The import will now show a clear error if the campus doesn't exist:
```json
{
  "success": false,
  "error": "Campus with ID abc123 not found"
}
```

---

## Testing the Fix

### 1. Reset Database (if needed)
```bash
cd server
rm prisma/dev.db
npx prisma migrate dev
npm run seed
```

### 2. Get Campus ID
```bash
npx prisma studio
```
Copy the campus ID from the Campus table.

### 3. Test Import
- Go to Map Management
- Select the campus from dropdown
- Import your GeoJSON files
- Should work without foreign key errors!

---

## Error Messages

### Before Fix
```
Invalid `prisma.buildings.create()` invocation
Foreign key constraint violated: `foreign key`
```

### After Fix
```json
{
  "success": false,
  "error": "Campus with ID xyz789 not found"
}
```

Much clearer! Now you know the campus doesn't exist.

---

## TypeScript Errors

The TypeScript error about `prisma.boundary` will resolve automatically when:
1. Your IDE picks up the regenerated Prisma client
2. You restart the TypeScript server
3. You reload the VS Code window

**To force reload:**
- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "Reload Window"
- Press Enter

---

## Summary

✅ **Fixed:** Campus validation added to all import services  
✅ **Fixed:** Clear error messages when campus doesn't exist  
✅ **Fixed:** Prisma client regenerated with Boundary model  
✅ **Required:** Always select a campus before importing  
✅ **Required:** Ensure campuses exist in database (run `npm run seed`)  

**No more foreign key constraint errors!** 🎉
