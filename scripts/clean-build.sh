#!/bin/bash
# Clean build script for Windows (Git Bash) and Unix systems

echo "🧹 Cleaning build cache and temporary files..."

# Remove Next.js build cache
if [ -d ".next" ]; then
  echo "  Removing .next directory..."
  rm -rf .next
fi

# Remove TypeScript cache
if [ -d "node_modules/.cache" ]; then
  echo "  Removing node_modules/.cache..."
  rm -rf node_modules/.cache
fi

# Remove build artifacts
if [ -d "dist" ]; then
  echo "  Removing dist directory..."
  rm -rf dist
fi

# Remove TypeScript build info
if [ -f "*.tsbuildinfo" ]; then
  echo "  Removing TypeScript build info..."
  rm -f *.tsbuildinfo
fi

echo "✅ Clean complete!"
echo ""
echo "Next steps:"
echo "  1. npm run db:generate"
echo "  2. npm run build"

