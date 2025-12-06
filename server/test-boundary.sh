#!/bin/bash

# Test boundary import endpoint
# Get campus ID first
CAMPUS_ID="3aa411ff-df95-41a5-bc43-c6b5e1124da7"

echo "Testing boundary import endpoint..."
echo "Campus ID: $CAMPUS_ID"
echo ""

curl -X POST http://localhost:3000/api/boundaries/import \
  -H "Content-Type: application/json" \
  -d '{
    "campusId": "'$CAMPUS_ID'",
    "geojson": {
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "properties": {
          "display name": "Test Boundary"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-7.938232, 32.221538],
            [-7.938586, 32.220822],
            [-7.938811, 32.220388],
            [-7.938232, 32.221538]
          ]]
        }
      }]
    }
  }' | jq .

echo ""
echo "Done!"
