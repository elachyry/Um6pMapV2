# Boundary Import Guide

## ✅ Boundary Import is Working!

The test confirmed that boundary import functionality works perfectly. If the button isn't responding, follow these steps:

---

## Step-by-Step Guide

### 1. **Select a Campus First** ⚠️
The import button is **disabled** until you select a campus.

**How to select:**
1. Look for the campus dropdown at the top of the page
2. Click it and select a campus (e.g., "UM6P Benguerir")
3. The import button will become enabled

### 2. **Clear Browser Storage** (If using old campus ID)
If you previously selected a campus but it doesn't exist anymore:

1. Press **F12** to open Developer Tools
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → `http://localhost:5173`
4. Find and delete campus-related entries OR click **Clear All**
5. **Refresh the page** (F5)
6. Select campus again

### 3. **Get Current Campus IDs**
```bash
cd server
npm run get-campus-ids
```

This shows:
```
📍 Campus IDs:

1. UM6P Benguerir
   ID: 3aa411ff-df95-41a5-bc43-c6b5e1124da7
   
2. UM6P Laayoune
   ID: 845a815f-f6d5-4ce2-935a-381a9a60e0c4
   
3. UM6P Rabat
   ID: 0c45452a-2e81-4d42-bcae-e0d65f9edc34
```

### 4. **Import Your Boundary**
1. Ensure campus is selected (dropdown shows campus name)
2. Go to **Boundaries** section
3. Click **"Import GeoJSON"** button
4. Select your `boundary.json` file
5. ✅ Import will process!

---

## Troubleshooting

### Button is Grayed Out / Disabled
**Cause:** No campus selected  
**Solution:** Select a campus from the dropdown at the top

### "Campus with ID xxx not found" Error
**Cause:** Browser has old campus ID stored  
**Solution:** Clear browser local storage and re-select campus

### File Dialog Doesn't Open
**Cause:** Button might be disabled or browser security  
**Solution:** 
1. Check if campus is selected
2. Check browser console for errors (F12)
3. Try refreshing the page

### Import Fails with 500 Error
**Cause:** Campus doesn't exist in database  
**Solution:** 
```bash
cd server
npm run seed  # Creates campuses
npm run get-campus-ids  # Shows IDs
```

---

## Test Boundary Import (Backend)

To verify the backend is working:

```bash
cd server
npm run test-boundary
```

Expected output:
```
✅ Import Result:
   Total: 1
   Imported: 1
   Duplicates: 0
   Errors: 0
```

---

## Debug Mode

The button now logs debug information. Check browser console (F12) when clicking:

```
Boundary import button clicked
selectedCampusId: 3aa411ff-df95-41a5-bc43-c6b5e1124da7
boundaryFileInputRef.current: <input>
```

If you see:
- `selectedCampusId: undefined` → **Select a campus!**
- `boundaryFileInputRef.current: null` → **Refresh the page**

---

## Your Boundary GeoJSON Format

```json
{
  "type": "FeatureCollection",
  "name": "boundary",
  "features": [{
    "type": "Feature",
    "properties": {
      "display name": "UM6P Benguerir"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [-7.938232, 32.221538],
        [-7.938586, 32.220822],
        ...
      ]]
    }
  }]
}
```

---

## Quick Checklist

- [ ] Database seeded (`npm run seed`)
- [ ] Campus selected in UI dropdown
- [ ] Browser storage cleared (if needed)
- [ ] Boundaries section active
- [ ] Import button enabled (not grayed out)
- [ ] GeoJSON file ready

**Everything working? Click Import GeoJSON!** 🎉
