#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p icons
cd icons

# Create 128x128 icon (highest quality)
convert -size 128x128 \
  \( -size 128x128 gradient:#1DA1F2-#FF0000 -fill white -draw 'roundrectangle 0,0 128,128 20,20' \) \
  \( -size 100x60 -background none -fill white -font Arial -pointsize 24 -gravity center label:"T→Y" \) \
  -gravity center -composite icon128.png

# Create 48x48 icon
convert -size 48x48 \
  \( -size 48x48 gradient:#1DA1F2-#FF0000 -fill white -draw 'roundrectangle 0,0 48,48 10,10' \) \
  \( -size 40x24 -background none -fill white -font Arial -pointsize 12 -gravity center label:"T→Y" \) \
  -gravity center -composite icon48.png

# Create 16x16 icon
convert -size 16x16 \
  \( -size 16x16 gradient:#1DA1F2-#FF0000 -fill white -draw 'roundrectangle 0,0 16,16 3,3' \) \
  \( -size 12x8 -background none -fill white -font Arial -pointsize 6 -gravity center label:"TY" \) \
  -gravity center -composite icon16.png

echo "Professional icons created successfully!"
