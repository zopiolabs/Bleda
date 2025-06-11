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

export enum PowerUpType {
  RAPID_FIRE = 'RAPID_FIRE',
  EXPLOSIVE_ARROWS = 'EXPLOSIVE_ARROWS',
  SCORE_MULTIPLIER = 'SCORE_MULTIPLIER'
}

export const POWERUP_CONFIG = {
  // Spawn configuration
  SPAWN_INTERVAL: 15000, // 15 seconds between spawns
  SPAWN_CHANCE: 0.7, // 70% chance to spawn when interval is reached
  MAX_ACTIVE_POWERUPS: 3,
  SPAWN_HEIGHT: 3,
  SPAWN_RADIUS: 12,
  
  // Visual configuration
  SIZE: 1,
  ROTATION_SPEED: 2,
  FLOAT_AMPLITUDE: 0.5,
  FLOAT_SPEED: 2,
  GLOW_INTENSITY: 2,
  
  // Collision detection
  PICKUP_RADIUS: 2,
  
  // Power-up specific configurations
  RAPID_FIRE: {
    DURATION: 8000, // 8 seconds
    ARROW_COOLDOWN_MULTIPLIER: 0.3, // 70% faster firing
    COLOR: 0xFFFF00, // Yellow
    ICON: '⚡',
    NAME: 'RAPID FIRE'
  },
  
  EXPLOSIVE_ARROWS: {
    DURATION: 10000, // 10 seconds
    EXPLOSION_RADIUS: 3,
    EXPLOSION_DAMAGE_MULTIPLIER: 2,
    COLOR: 0xFF4500, // Orange-red
    ICON: '💥',
    NAME: 'EXPLOSIVE ARROWS'
  },
  
  SCORE_MULTIPLIER: {
    DURATION: 12000, // 12 seconds
    MULTIPLIER: 3,
    COLOR: 0x00FF00, // Green
    ICON: '×3',
    NAME: 'TRIPLE SCORE'
  }
} as const;

export const POWERUP_MESSAGES = {
  PICKUP: {
    [PowerUpType.RAPID_FIRE]: '|| R4P1D F1R3 4CT1V4T3D ||',
    [PowerUpType.EXPLOSIVE_ARROWS]: '|| 3XPL0S1V3 4RR0WS L04D3D ||',
    [PowerUpType.SCORE_MULTIPLIER]: '|| TR1PL3 SC0R3 3N4BL3D ||'
  },
  EXPIRE: {
    [PowerUpType.RAPID_FIRE]: '|| R4P1D F1R3 3XP1R3D ||',
    [PowerUpType.EXPLOSIVE_ARROWS]: '|| 3XPL0S1V3S D3PL3T3D ||',
    [PowerUpType.SCORE_MULTIPLIER]: '|| SC0R3 B00ST 3ND3D ||'
  }
} as const;