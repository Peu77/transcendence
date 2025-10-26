# Creating Scene Files with Babylon.js Editor

## 🎬 Scene File Structure

A Babylon.js scene file (`.babylon`) contains the complete scene description including:
- Meshes, lights, cameras
- Materials and textures
- Physics settings
- Animation data
- Script attachments

## 📁 Current Scene Setup

Your single player game now has:

```
assets/single_player_game/
├── single_player_formatted.babylon    # Main scene file
├── scene/
│   └── config.json                   # Scene configuration
└── SCENE_CREATION_GUIDE.md          # This guide
```

## 🛠️ Method 1: Manual Scene Creation

**File**: `single_player_formatted.babylon`

This is a JSON file with the scene structure:

```json
{
  "autoClear": true,
  "clearColor": [0.2, 0.2, 0.3, 1],
  "metadata": {
    "scripts": {
      "scene": [
        {
          "script": "scripts/single_player.ts",
          "class": "SinglePlayerScript"
        }
      ]
    }
  },
  "meshes": [],
  "lights": [],
  "cameras": []
}
```

## 🎮 Method 2: Using Babylon.js Editor

### Installation
```bash
# Install Babylon.js Editor globally
npm install -g babylonjs-editor

# Or use online version
# https://editor.babylonjs.com/
```

### Steps:
1. **Open Editor**: `babylonjs-editor` or visit https://editor.babylonjs.com/
2. **Create Project**: File → New Project
3. **Add Script**: 
   - Assets Panel → Right-click → Add → Script
   - Name: "single_player.ts"
   - Paste your script code
4. **Attach Script**: 
   - Select Scene root in hierarchy
   - Inspector Panel → Scripts → Add Script
   - Choose "single_player.ts"
5. **Export**: File → Export → Scene (.babylon)

## 🔧 Method 3: Using the Current Setup

Your current setup automatically handles scene creation:

1. **Development**: Edit `single_player_formatted.babylon`
2. **Build**: Run `npm run build:assets`
3. **Deploy**: Scene copied to `public/scene/single_player.babylon`
4. **Load**: Page.tsx loads with fallback to direct script

## 📝 Script Integration

Your script needs these methods for editor compatibility:

```typescript
export default class SinglePlayerScript {
    public onStart(): void {
        // Called when scene loads
        const scene = (this as any).getScene();
        // Initialize your game
    }
    
    public onUpdate(): void {
        // Called every frame
        // Game loop logic
    }
}
```

## 🔄 Build Process

The build system automatically:

1. **Copies scene file**: `single_player_formatted.babylon` → `public/scene/single_player.babylon`
2. **Copies assets**: Textures and environments to public folder
3. **Updates manifest**: Tracks all assets and their usage

```bash
# Build assets only
npm run build:assets

# Full build (includes assets)
npm run build
```

## 🎯 Current Status

✅ **Scene file created**: `single_player_formatted.babylon`
✅ **Script attached**: SinglePlayerScript attached to scene
✅ **Build system**: Automated copying to public folder
✅ **Fallback system**: Direct script creation if scene load fails
✅ **Asset management**: All textures and environments organized

## 🚀 Next Steps

1. **Test the scene**: Run `npm run dev` and check console
2. **Add objects**: Use editor to add meshes, lights, cameras to scene
3. **Enhanced scripting**: Add more complex game logic
4. **Visual assets**: Replace placeholder textures with real ones
