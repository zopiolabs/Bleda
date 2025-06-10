export const COLORS = {
  SKY: 0x87CEEB,
  GROUND: 0x3a5f3a,
  GRASS_DARK: 0x2d4a2d,
  GRASS_LIGHT: 0x4a6f4a,
  ROCK: 0x666666,
  HORSE_BROWN: 0x6B4423,
  HORSE_DARK: 0x3C2414,
  HOOF: 0x1C1C1C,
  LEATHER_ARMOR: 0x8B4513,
  SKIN: 0xFFDBB4,
  HELMET: 0x4A4A4A,
  PANTS: 0x4A3C28,
  QUIVER: 0x654321,
  ARROW_SHAFT: 0x8B7355,
  ARROW_HEAD: 0x2C2C2C,
  ARROW_FLETCHING: 0xE0E0E0,
  BALL: 0xFF0000,
  TAIL: 0x2C1810,
  BOWSTRING: 0xFFF8DC
} as const;

export const GAME_CONFIG = {
  CAMERA_FOV: 75,
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 1000,
  SHADOW_MAP_SIZE: 2048,
  WHEEL_RADIUS: 8,
  ARROW_SPEED: 35,
  GRAVITY: 15,
  BLEDA_SPEED: 10,
  BLEDA_BOUNDS: 15,
  MIN_SHOTS_FOR_ROAST: 3
} as const;

export const UI_STYLES = {
  RETRO_TEXT_SHADOW: '0 0 10px currentColor, 0 0 20px currentColor',
  L33T_TEXT_SHADOW: `
    0 0 10px #00ff00,
    3px 3px 0 #008800,
    6px 6px 0 #004400,
    9px 9px 0 #002200,
    12px 12px 15px rgba(0,0,0,0.8)
  `,
  GLITCH_BOX_SHADOW: (color: string) => `
    inset 0 0 50px ${color}33,
    0 0 30px ${color}80,
    0 0 60px ${color}4D
  `,
  RETRO_FONT: 'Courier New, monospace',
  CONTAINER_BG: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,20,0.8) 100%)',
  DANGER_BG: 'linear-gradient(135deg, rgba(20,0,0,0.95) 0%, rgba(40,0,0,0.9) 100%)'
} as const;

export const ANIMATION_TIMINGS = {
  PULSE: '0.5s ease-in-out infinite',
  PULSE_FAST: '0.2s ease-in-out infinite',
  SHAKE: '0.1s ease-in-out infinite',
  GLITCH: '0.3s ease-in-out infinite',
  ROAST_GLITCH: '0.5s ease-in-out infinite',
  ROAST_GLITCH_NEW: '0.2s ease-in-out 5',
  RETRO_GLITCH: '0.4s ease-in-out infinite',
  TEXT_GLITCH: '0.3s ease-in-out infinite',
  SCREEN_SHAKE: '0.3s ease-in-out',
  SCANLINES: '8s linear infinite'
} as const;