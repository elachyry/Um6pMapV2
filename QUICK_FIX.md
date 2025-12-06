# Quick Fix: Campus ID Mismatch

## Problem
You're getting this error when importing:
```
Campus with ID 9c5c3056-d8d9-444a-a213-01ce005d7f7b not found
```

## Root Cause
The campus ID stored in your browser/frontend doesn't match the actual campus IDs in the database.

## Current Campus IDs

Run this command to see your campus IDs:
```bash
cd server
npm run get-campus-ids
```

**Current IDs:**
- **UM6P Benguerir**: `3aa411ff-df95-41a5-bc43-c6b5e1124da7`
- **UM6P Laayoune**: `845a815f-f6d5-4ce2-935a-381a9a60e0c4`
- **UM6P Rabat**: `0c45452a-2e81-4d42-bcae-e0d65f9edc34`

---

## Solution

### Option 1: Clear Browser Storage (Recommended)
1. Open your browser's Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → `http://localhost:5173`
4. Click **Clear All** or delete the campus-related entries
5. **Refresh the page** (F5)
6. **Select the campus again** from the dropdown

### Option 2: Re-select Campus in UI
1. Go to Map Management page
2. Click the campus dropdown
3. Select a campus (e.g., "UM6P Benguerir")
4. Try importing again

### Option 3: Use Correct Campus ID Directly
If you're testing with API directly, use one of these IDs:
```bash
curl -X POST http://localhost:3000/api/buildings/import \
  -H "Content-Type: application/json" \
  -d '{
    "campusId": "3aa411ff-df95-41a5-bc43-c6b5e1124da7",
    "geojson": {...}
  }'
```

---

## Why This Happened

When you reset the database, new UUIDs are generated for campuses. The old campus ID (`9c5c3056...`) was from a previous database state.

---

## Prevention

After resetting the database:
1. Always run `npm run seed`
2. Clear browser local storage
3. Re-select campus in UI

---

## Verify It Works

1. Clear browser storage
2. Refresh the page
3. Select "UM6P Benguerir" from dropdown
4. Import your GeoJSON file
5. ✅ Should work now!

---

## Helper Commands

```bash
# Get current campus IDs
npm run get-campus-ids

# Reset database and seed
rm prisma/dev.db
npx prisma migrate dev
npm run seed

# Open Prisma Studio to view data
npx prisma studio
```
