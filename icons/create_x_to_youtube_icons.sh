#!/bin/bash

# Colors
X_BLACK="#000000"
X_WHITE="#FFFFFF" 
YOUTUBE_RED="#FF0000"
YOUTUBE_WHITE="#FFFFFF"
ARROW_GRAY="#666666"

# Create 128x128 icon
convert -size 128x128 xc:white \
  \( -size 40x40 xc:"$X_BLACK" -fill white -draw "circle 20,20 20,5" -fill "$X_WHITE" -draw "text 13,28 'X'" \) \
  \( -size 40x40 xc:"$YOUTUBE_RED" -fill white -draw "polygon 8,10 32,20 8,30" \) \
  \( -size 20x10 xc:none -fill "$ARROW_GRAY" -draw "polygon 0,5 20,5 15,0 20,5 15,10" \) \
  -gravity center -geometry -25,0 -composite \
  -gravity center -geometry +25,0 -composite \
  -gravity center -geometry +0,0 -composite \
  icon128.png

# Create 48x48 icon
convert -size 48x48 xc:white \
  \( -size 20x20 xc:"$X_BLACK" -fill white -draw "circle 10,10 10,2" -fill "$X_WHITE" -draw "text 6,14 'X'" -gravity center \) \
  \( -size 20x20 xc:"$YOUTUBE_RED" -fill white -draw "polygon 4,5 16,10 4,15" -gravity center \) \
  \( -size 12x6 xc:none -fill "$ARROW_GRAY" -draw "polygon 0,3 12,3 9,0 12,3 9,6" -gravity center \) \
  -gravity center -geometry -12,0 -composite \
  -gravity center -geometry +12,0 -composite \
  -gravity center -geometry +0,0 -composite \
  icon48.png

# Create 16x16 icon (simplified)
convert -size 16x16 xc:white \
  \( -size 6x6 xc:"$X_BLACK" -fill white -draw "circle 3,3 3,1" \) \
  \( -size 6x6 xc:"$YOUTUBE_RED" -fill white -draw "polygon 1,1 5,3 1,5" \) \
  \( -size 4x2 xc:none -fill "$ARROW_GRAY" -draw "polygon 0,1 4,1 3,0 4,1 3,2" \) \
  -gravity center -geometry -4,0 -composite \
  -gravity center -geometry +4,0 -composite \
  -gravity center -geometry +0,0 -composite \
  icon16.png

echo "X to YouTube icons created successfully!"
