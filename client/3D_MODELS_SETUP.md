# 3D Models Setup & Testing Guide

## Overview
The 3D model system is now implemented and ready to use. Models will automatically load when:
1. A building or open space has a `modelId` field
2. The `BuildingModel` record exists with a valid `modelUrl`

## How to Test

### 1. Check Console Logs
Open browser console and look for these messages:
```
🎨 3D Models Hook - Buildings: X, Open Spaces: Y
🏢 Loading 3D model for building: [Name]
⚠️ Building [Name] has modelId but no buildingModel data
```

### 2. Add a Test Building Model

#### Step 1: Add a BuildingModel record
```sql
INSERT INTO "BuildingModel" (
  id, 
  "campusId", 
  "modelUrl", 
  name, 
  "isActive",
  scale
) VALUES (
  'test-model-001',
  'your-campus-id',
  'https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf',
  'Test 3D Model',
  true,
  1.0
);
```

#### Step 2: Update a Building to use the model
```sql
UPDATE "Buildings" 
SET 
  "modelId" = 'test-model-001',
  "modelScale" = 1.0,
  "modelRotationX" = 90.0,
  "modelRotationY" = 0.0,
  "modelRotationZ" = 0.0,
  "modelOffsetX" = 0.0,
  "modelOffsetY" = 0.0,
  "modelOffsetZ" = 0.0
WHERE id = 'your-building-id';
```

### 3. Verify Data Flow

Check that the API returns buildingModel:
```bash
curl http://localhost:5000/api/v1/buildings/your-building-id
```

Should include:
```json
{
  "id": "...",
  "name": "...",
  "modelId": "test-model-001",
  "modelScale": 1.0,
  "modelRotationX": 90.0,
  ...
  "buildingModel": {
    "id": "test-model-001",
    "modelUrl": "https://...",
    "name": "Test 3D Model"
  }
}
```

## Troubleshooting

### Models Not Loading?

1. **Check console for warnings:**
   - `⚠️ Building X has modelId but no buildingModel data` 
   - → BuildingModel record missing or not fetched

2. **Verify database:**
   ```sql
   SELECT b.name, b."modelId", bm."modelUrl"
   FROM "Buildings" b
   LEFT JOIN "BuildingModel" bm ON b."modelId" = bm.id
   WHERE b."modelId" IS NOT NULL;
   ```

3. **Check repository:**
   - Ensure `buildingRepository.ts` fetches buildingModel
   - Ensure `openSpaceRepository.ts` fetches buildingModel

4. **Verify map is loaded:**
   - 3D models only load after map is initialized
   - Check: `map.current` is not null

### Model Appears But Wrong Position?

Adjust transformation parameters in database:
- `modelScale` - Size of model (default: 1.0)
- `modelRotationX/Y/Z` - Rotation in degrees
- `modelOffsetX/Y/Z` - Position offset

### Model URL Not Loading?

- Ensure URL is accessible (CORS enabled)
- Use Cloudinary or public CDN
- Test URL directly in browser
- GLB format required (not GLTF with separate files)

## File Structure

```
client/src/
├── hooks/
│   └── use3DModels.ts          # React hook to manage models
├── services/
│   ├── create3DLayer.ts        # Mapbox custom layer factory
│   └── modelLoader.ts          # GLB loading with caching
└── utils/
    ├── modelCache.ts           # Model caching system
    └── modelTransform.ts       # 3D transformations

server/src/repositories/
├── buildingRepository.ts       # Fetches buildingModel
└── openSpaceRepository.ts      # Fetches buildingModel
```

## Next Steps

1. Upload your GLB models to Cloudinary
2. Create BuildingModel records with URLs
3. Link buildings/open spaces to models via modelId
4. Adjust scale/rotation/offset as needed
5. Models will automatically appear on map!
