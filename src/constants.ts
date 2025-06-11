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

export enum ObstacleType {
  FLYING_ROCK = 'FLYING_ROCK',
  TREE = 'TREE',
  BIRD = 'BIRD'
}

export const OBSTACLE_CONFIG = {
  // Spawn configuration
  SPAWN_INTERVAL: 8000, // 8 seconds between obstacle waves
  SPAWN_CHANCE: 0.6, // 60% chance to spawn when interval is reached
  MAX_ACTIVE_OBSTACLES: 5,
  MIN_SPAWN_DISTANCE: 25, // Minimum distance from Bleda for spawning
  MAX_SPAWN_DISTANCE: 40,
  
  // General obstacle properties
  COLLISION_RADIUS: 1.5,
  WARNING_DISTANCE: 15, // Distance at which to show warning indicator
  
  // Stun mechanics
  STUN_DURATION: 2000, // 2 seconds stun
  STUN_MOVEMENT_MULTIPLIER: 0.3, // 70% movement speed reduction
  SCORE_PENALTY: 5,
  
  // Obstacle specific configurations
  FLYING_ROCK: {
    SIZE: 1.2,
    SPEED: 15,
    ROTATION_SPEED: 3,
    COLOR: 0x666666,
    SPAWN_HEIGHT_MIN: 2,
    SPAWN_HEIGHT_MAX: 6,
    TRAJECTORY_VARIANCE: 0.2, // Random variance in trajectory
    ICON: '🪨',
    NAME: 'FLYING ROCK'
  },
  
  TREE: {
    TRUNK_HEIGHT: 4,
    TRUNK_RADIUS: 0.5,
    FOLIAGE_RADIUS: 2,
    COLOR_TRUNK: 0x654321,
    COLOR_FOLIAGE: 0x228B22,
    SPAWN_RADIUS: 20, // Spawns in a circle around player
    ICON: '🌲',
    NAME: 'TREE'
  },
  
  BIRD: {
    SIZE: 0.8,
    SPEED: 12,
    WAVE_AMPLITUDE: 2,
    WAVE_FREQUENCY: 2,
    COLOR_BODY: 0x2C1810,
    COLOR_WING: 0x4A3C28,
    FLOCK_SIZE_MIN: 1,
    FLOCK_SIZE_MAX: 3,
    ICON: '🦅',
    NAME: 'BIRD'
  }
} as const;

export const OBSTACLE_MESSAGES = {
  COLLISION: {
    [ObstacleType.FLYING_ROCK]: '|| R0CK H1T! STUNN3D ||',
    [ObstacleType.TREE]: '|| TR33 CR4SH! 0UCH ||',
    [ObstacleType.BIRD]: '|| B1RD STR1K3! ||'
  },
  WARNING: {
    [ObstacleType.FLYING_ROCK]: '|| 1NC0M1NG R0CK! ||',
    [ObstacleType.TREE]: '|| W4TCH 0UT! TR33 4H34D ||',
    [ObstacleType.BIRD]: '|| B1RDS 4PPR04CH1NG! ||'
  }
} as const;

export enum TargetType {
  STANDARD = 'STANDARD',
  GOLD = 'GOLD',
  SPEED = 'SPEED',
  BONUS = 'BONUS',
  SHRINKING = 'SHRINKING',
  SPLIT = 'SPLIT',
  MYSTERY = 'MYSTERY',
  GHOST = 'GHOST',
  MAGNETIC = 'MAGNETIC',
  EXPLOSIVE = 'EXPLOSIVE'
}

export const TARGET_CONFIG = {
  // General target settings
  MAX_TARGETS_ON_WHEEL: 5,
  SPAWN_CHECK_INTERVAL: 3000, // Check for new target spawns every 3 seconds
  
  // Combo system
  COMBO_TIME_WINDOW: 2000, // 2 seconds to maintain combo
  COMBO_MULTIPLIER_INCREMENT: 0.5,
  MAX_COMBO_MULTIPLIER: 5,
  
  // Target type configurations
  STANDARD: {
    POINTS: 10,
    SIZE: 0.4,
    COLOR: 0xFF0000,
    SPAWN_CHANCE: 1, // Always spawns
    LIFETIME: null, // Permanent
    ICON: '🎯',
    NAME: 'STANDARD'
  },
  
  GOLD: {
    POINTS: 50,
    SIZE: 0.32, // 80% of standard
    COLOR: 0xFFD700,
    SPAWN_CHANCE: 0.3,
    LIFETIME: 15000, // 15 seconds
    GLOW_INTENSITY: 2,
    PARTICLE_COUNT: 10,
    ICON: '⭐',
    NAME: 'GOLD TARGET'
  },
  
  SPEED: {
    POINTS: 25,
    SIZE: 0.24, // 60% of standard
    COLOR: 0x00BFFF,
    SPAWN_CHANCE: 0.4,
    LIFETIME: 20000,
    SPEED_MULTIPLIER: 2.5,
    TRAIL_LENGTH: 5,
    ICON: '💨',
    NAME: 'SPEED DEMON'
  },
  
  BONUS: {
    POINTS: 100,
    SIZE: 0.48, // 120% of standard
    COLOR: 0xFF1493,
    SPAWN_CHANCE: 0.1,
    LIFETIME: 5000, // 5 seconds only!
    PULSE_SPEED: 2,
    RAINBOW_SPEED: 3,
    ICON: '💎',
    NAME: 'BONUS TARGET'
  },
  
  SHRINKING: {
    POINTS_MAX: 75,
    POINTS_MIN: 10,
    SIZE_START: 0.6,
    SIZE_MIN: 0.2,
    SHRINK_RATE: 0.85, // Shrinks to 85% on each miss
    MAX_MISSES: 3,
    COLOR_START: 0xFF0000,
    COLOR_END: 0xFFFF00,
    SPAWN_CHANCE: 0.25,
    ICON: '🎈',
    NAME: 'SHRINKING TARGET'
  },
  
  SPLIT: {
    POINTS: 30,
    SIZE: 0.5,
    COLOR: 0x00FF00,
    SPAWN_CHANCE: 0.2,
    MAX_SPLITS: 2,
    SPLIT_SIZE_MULTIPLIER: 0.7,
    SPLIT_ANGLE: Math.PI / 6, // 30 degrees
    ICON: '🧬',
    NAME: 'SPLIT TARGET'
  },
  
  MYSTERY: {
    POINTS: 0, // Determined on hit
    SIZE: 0.4,
    COLOR: 0x9400D3,
    SPAWN_CHANCE: 0.15,
    LIFETIME: 10000,
    TRANSFORM_EFFECT_DURATION: 500,
    QUESTION_MARK_SPIN_SPEED: 2,
    ICON: '❓',
    NAME: 'MYSTERY BOX'
  },
  
  GHOST: {
    POINTS: 40,
    SIZE: 0.35,
    COLOR: 0xE6E6FA,
    SPAWN_CHANCE: 0.2,
    LIFETIME: 25000,
    PHASE_DURATION: 3000, // 3 seconds visible, 3 seconds invisible
    FADE_SPEED: 0.5,
    ICON: '👻',
    NAME: 'GHOST TARGET'
  },
  
  MAGNETIC: {
    POINTS: 35,
    SIZE: 0.4,
    COLOR: 0xFF6347,
    SPAWN_CHANCE: 0.25,
    LIFETIME: 20000,
    MAGNETIC_RANGE: 3,
    MAGNETIC_FORCE: 0.3,
    ELECTRIC_ARC_COLOR: 0x00FFFF,
    ICON: '🧲',
    NAME: 'MAGNETIC TARGET'
  },
  
  EXPLOSIVE: {
    POINTS: 20,
    SIZE: 0.45,
    COLOR: 0xFF4500,
    SPAWN_CHANCE: 0.2,
    LIFETIME: 15000,
    EXPLOSION_RADIUS: 2,
    CHAIN_EXPLOSION_CHANCE: 0.3,
    SHRAPNEL_COUNT: 8,
    ICON: '💣',
    NAME: 'EXPLOSIVE TARGET'
  }
} as const;

export const TARGET_MESSAGES = {
  HIT: {
    [TargetType.STANDARD]: '|| N1C3 SH0T! ||',
    [TargetType.GOLD]: '|| G0LD STR1K3! ++B0NUS++ ||',
    [TargetType.SPEED]: '|| SP33D D3M0N D0WN! ||',
    [TargetType.BONUS]: '|| J4CKP0T! 100 P01NTS! ||',
    [TargetType.SHRINKING]: '|| SHR1NK3R H1T! ||',
    [TargetType.SPLIT]: '|| SPL1T T4RG3T! ||',
    [TargetType.MYSTERY]: '|| MYST3RY R3V34L3D! ||',
    [TargetType.GHOST]: '|| GH0ST BUST3D! ||',
    [TargetType.MAGNETIC]: '|| M4GN3T1C STR1K3! ||',
    [TargetType.EXPLOSIVE]: '|| B00M! 3XPL0S1V3 H1T! ||'
  },
  SPAWN: {
    [TargetType.GOLD]: '|| G0LD T4RG3T 4PP34R3D! ||',
    [TargetType.BONUS]: '|| B0NUS T4RG3T! HURRY! ||',
    [TargetType.MYSTERY]: '|| MYST3RY B0X SP4WN3D! ||'
  },
  COMBO: [
    '|| D0UBL3 K1LL! ||',
    '|| TR1PL3 STR1K3! ||',
    '|| QU4D D4M4G3! ||',
    '|| P3NT4 SH0T! ||',
    '|| M3G4 C0MB0! ||',
    '|| ULTR4 K1LL! ||',
    '|| G0DL1K3! ||'
  ]
} as const;