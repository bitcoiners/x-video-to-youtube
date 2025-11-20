#!/bin/bash

echo "=== Icon Verification ==="
echo "File sizes and dimensions:"
identify *.png

echo ""
echo "File list:"
ls -la *.png

echo ""
echo "Colors used in icons:"
for icon in *.png; do
  echo "=== $icon ==="
  identify -format "Dimensions: %wx%h\nColors: %k\n" "$icon"
done

echo ""
echo "Icons should be:"
echo "icon16.png: 16x16 pixels"
echo "icon48.png: 48x48 pixels" 
echo "icon128.png: 128x128 pixels"
