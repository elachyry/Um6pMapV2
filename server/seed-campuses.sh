#!/bin/bash
# Quick script to seed UM6P campuses

echo "🌱 Seeding UM6P Campuses..."
echo ""
cd "$(dirname "$0")"
npm run prisma:seed
