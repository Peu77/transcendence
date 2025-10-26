# Single Player Game Assets

This folder contains all assets used by the single player table tennis game.

## Structure

### `/textures/`
- `albedo.png` - Wood floor texture for the game table

### `/environments/`
- `42832996790_71e52a157d_b.jpg` - 360° photodome background environment

## Usage

These assets are referenced from the single player script at:
`src/scripts/single_player.ts`

The assets are served from the `/public/` folder at runtime, so make sure they are copied there during build.

## Asset Sources

- Floor texture: Wood texture for realistic table surface
- Environment: 360° photodome for immersive background

## Notes

- All textures should be optimized for web delivery
- Environment images should be high resolution for better immersion
- Consider adding normal maps for enhanced floor realism in future updates
