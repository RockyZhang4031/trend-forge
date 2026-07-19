#!/bin/bash
set -e

echo "=== Building Frontend ==="
cd frontend
npm install
npx vite build

echo "=== Copying dist to backend/public ==="
cd ..
rm -rf backend/public
mkdir -p backend/public
cp -r frontend/dist/* backend/public/

echo "=== Installing Backend Dependencies ==="
cd backend
npm install

echo "=== Build Complete ==="
ls -la public/
