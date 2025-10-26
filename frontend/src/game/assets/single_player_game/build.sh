#!/bin/bash

# Build script for Single Player Game Assets
# This script copies development assets to the public folder for runtime use

echo "🎮 Building Single Player Game Assets..."

# Create public directories if they don't exist
mkdir -p ../public/textures
mkdir -p ../public/environments
mkdir -p ../public/scene

# Copy textures
echo "📦 Copying textures..."
cp textures/albedo.png ../public/

# Copy environments  
echo "🌍 Copying environments..."
cp environments/42832996790_71e52a157d_b.jpg ../public/

# Copy scene files
echo "🎬 Copying scene files..."
if [ -f "single_player_formatted.babylon" ]; then
    cp single_player_formatted.babylon ../public/scene/single_player.babylon
    echo "   - Scene file copied"
fi

echo "✅ Asset build complete!"
echo "   - Textures: $(ls textures/ | wc -l | xargs) files"
echo "   - Environments: $(ls environments/ | wc -l | xargs) files"
echo "   - Scene files: $(ls ../public/scene/*.babylon 2>/dev/null | wc -l | xargs) files"
echo "   - Total size: $(du -sh . | cut -f1)"
