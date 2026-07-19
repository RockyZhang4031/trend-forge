#!/bin/bash
set -e

echo "=== Installing Backend Dependencies ==="
cd backend
npm install

echo "=== Build Complete ==="
ls -la public/
