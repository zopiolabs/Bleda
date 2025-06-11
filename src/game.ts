import * as THREE from 'three';
import { COLORS, GAME_CONFIG, PowerUpType, POWERUP_CONFIG, POWERUP_MESSAGES, ObstacleType, OBSTACLE_CONFIG, OBSTACLE_MESSAGES, TargetType, TARGET_CONFIG, TARGET_MESSAGES } from './constants';
import { UIManager } from './ui-manager';
import { PowerUp, PowerUpEffect } from './powerup';
import { Obstacle, FlyingRock, Tree, Bird } from './obstacle';
import { Target, StandardTarget, GoldTarget, SpeedTarget, BonusTarget, ShrinkingTarget, SplitTarget, MysteryTarget, GhostTarget, MagneticTarget, ExplosiveTarget } from './target';

interface Arrow {
  mesh: THREE.Group | THREE.Mesh;
  velocity: THREE.Vector3;
  active: boolean;
  isExplosive?: boolean;
}

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  
  // Game objects
  private bleda!: THREE.Group;
  private wheel!: THREE.Group;
  private targets: Target[] = [];
  private arrows: Arrow[] = [];
  private ground!: THREE.Mesh;
  private bow!: THREE.Group;
  private horseLegAnimation = 0;
  
  // Game state
  private mousePosition = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();
  private wheelSpeed = 0.5;
  private score = 0;
  private bledaPosition = { x: 0, z: 15 };
  private bledaVelocity = { x: 0 };
  
  // Material cache
  private materials: Map<string, THREE.Material> = new Map();
  
  // UI Manager
  private uiManager: UIManager;
  
  // Power-ups
  private powerUps: PowerUp[] = [];
  private activePowerUps: PowerUpEffect[] = [];
  private lastPowerUpSpawn = 0;
  private arrowCooldown = 500; // Default cooldown in ms
  private lastArrowShot = 0;
  private scoreMultiplier = 1;
  
  // Obstacles
  private obstacles: Obstacle[] = [];
  private lastObstacleSpawn = 0;
  private isStunned = false;
  private stunnedUntil = 0;
  
  // Targets
  private lastTargetCheck = 0;
  
  // Combo system
  private comboCount = 0;
  private lastHitTime = 0;
  private comboMultiplier = 1;
  
  // Controls
  private keys = {
    left: false,
    right: false
  };
  
  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.SKY);
    this.scene.fog = new THREE.Fog(COLORS.SKY, 30, 150);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      GAME_CONFIG.CAMERA_NEAR,
      GAME_CONFIG.CAMERA_FAR
    );
    this.camera.position.set(0, 10, 25);
    this.camera.lookAt(0, 5, 0);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    
    this.clock = new THREE.Clock();
    
    this.setupLighting();
    this.createGround();
    this.createBleda();
    this.createWheel();
    this.setupControls();
    
    // Initialize UI Manager
    this.uiManager = new UIManager();
  }
  
  // Helper method to get or create material
  private getMaterial(color: number, type: 'lambert' | 'basic' = 'lambert'): THREE.Material {
    const key = `${type}_${color}`;
    if (!this.materials.has(key)) {
      const material = type === 'lambert' 
        ? new THREE.MeshLambertMaterial({ color })
        : new THREE.MeshBasicMaterial({ color });
      this.materials.set(key, material);
    }
    return this.materials.get(key)!;
  }
  
  // Helper to create multiple similar objects
  private createMultiple<T>(
    count: number,
    creator: (index: number) => T
  ): T[] {
    return Array.from({ length: count }, (_, i) => creator(i));
  }
  
  // Helper to create positioned mesh with common defaults
  private createPositionedMesh(
    geometry: THREE.BufferGeometry,
    color: number,
    position: { x: number; y: number; z: number }
  ): THREE.Mesh {
    return this.createMesh(geometry, color, {
      position,
      castShadow: true
    });
  }
  
  // Helper method to create mesh with common properties
  private createMesh(
    geometry: THREE.BufferGeometry, 
    color: number, 
    options: {
      position?: THREE.Vector3 | { x?: number; y?: number; z?: number };
      rotation?: THREE.Euler | { x?: number; y?: number; z?: number };
      scale?: THREE.Vector3 | { x?: number; y?: number; z?: number } | number;
      castShadow?: boolean;
      receiveShadow?: boolean;
      materialType?: 'lambert' | 'basic';
    } = {}
  ): THREE.Mesh {
    const material = this.getMaterial(color, options.materialType || 'lambert');
    const mesh = new THREE.Mesh(geometry, material);
    
    if (options.position) {
      if (options.position instanceof THREE.Vector3) {
        mesh.position.copy(options.position);
      } else {
        mesh.position.set(
          options.position.x || 0,
          options.position.y || 0,
          options.position.z || 0
        );
      }
    }
    
    if (options.rotation) {
      if (options.rotation instanceof THREE.Euler) {
        mesh.rotation.copy(options.rotation);
      } else {
        mesh.rotation.set(
          options.rotation.x || 0,
          options.rotation.y || 0,
          options.rotation.z || 0
        );
      }
    }
    
    if (options.scale) {
      if (typeof options.scale === 'number') {
        mesh.scale.setScalar(options.scale);
      } else if (options.scale instanceof THREE.Vector3) {
        mesh.scale.copy(options.scale);
      } else {
        mesh.scale.set(
          options.scale.x || 1,
          options.scale.y || 1,
          options.scale.z || 1
        );
      }
    }
    
    if (options.castShadow !== undefined) mesh.castShadow = options.castShadow;
    if (options.receiveShadow !== undefined) mesh.receiveShadow = options.receiveShadow;
    
    return mesh;
  }
  
  
  // Helper to create geometry with common patterns
  private createGeometry(type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'capsule', ...args: number[]): THREE.BufferGeometry {
    switch (type) {
      case 'box': return new THREE.BoxGeometry(...args);
      case 'sphere': return new THREE.SphereGeometry(...args);
      case 'cylinder': return new THREE.CylinderGeometry(...args);
      case 'cone': return new THREE.ConeGeometry(...args);
      case 'capsule': return new THREE.CapsuleGeometry(...args);
      default: throw new Error(`Unknown geometry type: ${type}`);
    }
  }
  
  
  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffd700, 0.7);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.mapSize.width = GAME_CONFIG.SHADOW_MAP_SIZE;
    directionalLight.shadow.mapSize.height = GAME_CONFIG.SHADOW_MAP_SIZE;
    this.scene.add(directionalLight);
    
    // Add a subtle rim light
    const rimLight = new THREE.DirectionalLight(COLORS.SKY, 0.3);
    rimLight.position.set(-5, 10, -10);
    this.scene.add(rimLight);
  }
  
  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    this.ground = this.createMesh(groundGeometry, COLORS.GROUND, {
      rotation: { x: -Math.PI / 2 },
      receiveShadow: true
    });
    this.scene.add(this.ground);
    
    // Add grass patches using array-based creation
    const grassPatchGeometry = new THREE.CircleGeometry(2, 8);
    const grassPatches = this.createMultiple(20, () => {
      const grassColor = Math.random() > 0.5 ? COLORS.GRASS_DARK : COLORS.GRASS_LIGHT;
      const randomScale = Math.random() * 0.5 + 0.5;
      return this.createMesh(grassPatchGeometry, grassColor, {
        position: {
          x: (Math.random() - 0.5) * 80,
          y: 0.01,
          z: (Math.random() - 0.5) * 80
        },
        rotation: { x: -Math.PI / 2 },
        scale: { x: randomScale, y: randomScale, z: 1 },
        receiveShadow: true
      });
    });
    grassPatches.forEach(patch => this.scene.add(patch));
    
    // Add decorative rocks using array-based creation
    const rockGeometry = new THREE.DodecahedronGeometry(0.3, 0);
    const rocks = this.createMultiple(10, () => {
      const randomScale = Math.random() * 0.5 + 0.5;
      return this.createMesh(rockGeometry, COLORS.ROCK, {
        position: {
          x: (Math.random() - 0.5) * 60,
          y: 0.15,
          z: (Math.random() - 0.5) * 60
        },
        rotation: {
          x: Math.random() * Math.PI,
          y: Math.random() * Math.PI,
          z: Math.random() * Math.PI
        },
        scale: randomScale,
        castShadow: true,
        receiveShadow: true
      });
    });
    rocks.forEach(rock => this.scene.add(rock));
  }
  
  private createBleda(): void {
    this.bleda = new THREE.Group();
    
    // Horse body parts
    const horseBody = this.createPositionedMesh(
      this.createGeometry('box', 3.5, 2.2, 1.8),
      COLORS.HORSE_BROWN,
      { x: 0, y: 0, z: 0 }
    );
    
    const horseChest = this.createMesh(
      this.createGeometry('sphere', 1.2, 8, 6),
      COLORS.HORSE_BROWN,
      {
        position: { x: 1.5 },
        scale: { x: 0.8, y: 1, z: 1 },
        castShadow: true
      }
    );
    
    const horseNeck = this.createMesh(
      this.createGeometry('cylinder', 0.6, 0.9, 1.5, 8),
      COLORS.HORSE_BROWN,
      {
        position: { x: 2, y: 0.8 },
        rotation: { z: -Math.PI / 4 },
        castShadow: true
      }
    );
    
    const horseHead = this.createPositionedMesh(
      this.createGeometry('box', 1.2, 0.8, 0.8),
      COLORS.HORSE_BROWN,
      { x: 2.5, y: 1.5, z: 0 }
    );
    
    const horseMuzzle = this.createMesh(
      this.createGeometry('box', 0.6, 0.5, 0.6),
      COLORS.HORSE_DARK,
      { position: { x: 3, y: 1.3 } }
    );
    
    // Horse ears - create two ears
    const horseEarGeometry = this.createGeometry('cone', 0.15, 0.3, 4);
    const [horseEarLeft, horseEarRight] = [
      { x: 2.3, y: 2, z: 0.2 },
      { x: 2.3, y: 2, z: -0.2 }
    ].map(pos => this.createMesh(horseEarGeometry, COLORS.HORSE_BROWN, { position: pos }));
    
    // Horse legs and hooves configuration
    const legConfig = [
      { name: 'frontLegLeft', x: 1, z: 0.5 },
      { name: 'frontLegRight', x: 1, z: -0.5 },
      { name: 'backLegLeft', x: -1, z: 0.5 },
      { name: 'backLegRight', x: -1, z: -0.5 }
    ];
    
    // Create legs with hooves
    const horseLegGeometry = this.createGeometry('cylinder', 0.2, 0.25, 2, 6);
    const hoofGeometry = this.createGeometry('cylinder', 0.25, 0.2, 0.2, 6);
    
    const legsWithHooves = legConfig.map(config => {
      const leg = this.createPositionedMesh(horseLegGeometry, COLORS.HORSE_BROWN, 
        { x: config.x, y: -1.1, z: config.z }
      );
      const hoof = this.createMesh(hoofGeometry, COLORS.HOOF, { position: { y: -2.1 } });
      leg.add(hoof);
      return { name: config.name, mesh: leg };
    });
    
    // Horse tail
    const tail = this.createMesh(
      this.createGeometry('cone', 0.4, 1.5, 6),
      COLORS.TAIL,
      {
        position: { x: -2, y: -0.5 },
        rotation: { z: Math.PI / 3 },
        castShadow: true
      }
    );
    
    // Rider - more detailed Hun warrior
    const riderGroup = new THREE.Group();
    
    // Rider body parts
    const torso = this.createPositionedMesh(
      this.createGeometry('box', 0.8, 1.2, 0.6),
      COLORS.LEATHER_ARMOR,
      { x: -0.3, y: 2.5, z: 0 }
    );
    
    const head = this.createPositionedMesh(
      this.createGeometry('sphere', 0.3, 8, 6),
      COLORS.SKIN,
      { x: -0.3, y: 3.3, z: 0 }
    );
    
    const helmet = this.createMesh(
      this.createGeometry('cone', 0.35, 0.5, 8),
      COLORS.HELMET,
      { position: { x: -0.3, y: 3.6 } }
    );
    
    // Rider arms and legs
    const armGeometry = this.createGeometry('capsule', 0.15, 0.8, 4, 6);
    const [leftArm, rightArm] = [
      { pos: { x: -0.1, y: 2.8, z: 0.4 }, rot: { z: -Math.PI / 3 } },
      { pos: { x: -0.5, y: 2.8, z: -0.4 }, rot: { z: -Math.PI / 2.5 } }
    ].map(config => 
      this.createMesh(armGeometry, COLORS.LEATHER_ARMOR, {
        position: config.pos,
        rotation: config.rot
      })
    );
    
    const riderLegGeometry = this.createGeometry('capsule', 0.2, 0.8, 4, 6);
    const [leftLeg, rightLeg] = [
      { pos: { x: 0, y: 1.8, z: 0.5 }, rot: { x: -Math.PI / 6 } },
      { pos: { x: 0, y: 1.8, z: -0.5 }, rot: { x: Math.PI / 6 } }
    ].map(config => 
      this.createMesh(riderLegGeometry, COLORS.PANTS, {
        position: config.pos,
        rotation: config.rot
      })
    );
    
    // Quiver
    const quiver = this.createMesh(
      this.createGeometry('cylinder', 0.15, 0.15, 0.8, 6),
      COLORS.QUIVER,
      {
        position: { x: -0.8, y: 2.5, z: 0.3 },
        rotation: { z: -Math.PI / 12 }
      }
    );
    
    // Arrows in quiver - create five arranged in circle
    const arrowInQuiverGeometry = this.createGeometry('cylinder', 0.02, 0.02, 0.9, 4);
    const arrowsInQuiver = this.createMultiple(5, (i) => {
      const angle = (i / 5) * Math.PI * 2;
      return this.createMesh(arrowInQuiverGeometry, COLORS.ARROW_SHAFT, {
        position: {
          x: -0.8 + Math.cos(angle) * 0.08,
          y: 2.8,
          z: 0.3 + Math.sin(angle) * 0.08
        }
      });
    });
    arrowsInQuiver.forEach(arrow => riderGroup.add(arrow));
    
    // Bow - more detailed composite bow
    const bowGroup = new THREE.Group();
    const bowCurve = this.createMesh(
      new THREE.TorusGeometry(1.5, 0.08, 6, 12, Math.PI),
      COLORS.QUIVER
    );
    
    const bowString = this.createMesh(
      this.createGeometry('cylinder', 0.02, 0.02, 3, 4),
      COLORS.BOWSTRING,
      { rotation: { z: Math.PI / 2 } }
    );
    
    bowGroup.add(bowCurve);
    bowGroup.add(bowString);
    
    this.bow = bowGroup;
    this.bow.position.set(-0.5, 2.8, 0);
    this.bow.rotation.z = -Math.PI / 2;
    
    // Add rider parts to rider group
    riderGroup.add(torso);
    riderGroup.add(head);
    riderGroup.add(helmet);
    riderGroup.add(leftArm);
    riderGroup.add(rightArm);
    riderGroup.add(leftLeg);
    riderGroup.add(rightLeg);
    riderGroup.add(quiver);
    
    // Add all horse parts
    this.bleda.add(horseBody);
    this.bleda.add(horseChest);
    this.bleda.add(horseNeck);
    this.bleda.add(horseHead);
    this.bleda.add(horseMuzzle);
    this.bleda.add(horseEarLeft);
    this.bleda.add(horseEarRight);
    
    // Add legs (hooves already attached)
    legsWithHooves.forEach(leg => this.bleda.add(leg.mesh));
    
    this.bleda.add(tail);
    
    // Add rider and bow
    this.bleda.add(riderGroup);
    this.bleda.add(this.bow);
    
    // Position Bleda
    this.bleda.position.set(this.bledaPosition.x, 1, this.bledaPosition.z);
    this.scene.add(this.bleda);
  }
  
  private createWheel(): void {
    this.wheel = new THREE.Group();
    
    // Wheel structure - larger and vertical
    const wheelGeometry = new THREE.TorusGeometry(GAME_CONFIG.WHEEL_RADIUS, 0.4, 8, 30);
    const wheelMesh = this.createMesh(wheelGeometry, COLORS.ARROW_SHAFT, {
      castShadow: true
    });
    
    // Wheel spokes - create 8 spokes arranged radially
    const spokeGeometry = this.createGeometry('box', 0.3, GAME_CONFIG.WHEEL_RADIUS * 2, 0.3);
    const spokes = this.createMultiple(8, (i) => 
      this.createMesh(spokeGeometry, COLORS.ARROW_SHAFT, {
        rotation: { z: (i * Math.PI) / 4 },
        castShadow: true
      })
    );
    spokes.forEach(spoke => this.wheel.add(spoke));
    
    this.wheel.add(wheelMesh);
    this.wheel.position.set(0, GAME_CONFIG.WHEEL_RADIUS + 2, -15);
    
    // Create initial standard target
    const standardTarget = new StandardTarget(GAME_CONFIG.WHEEL_RADIUS - 0.5, 0);
    this.targets.push(standardTarget);
    this.wheel.add(standardTarget.mesh);
    
    this.scene.add(this.wheel);
  }
  
  private createArrow(): Arrow {
    const arrowGroup = new THREE.Group();
    
    // Arrow components
    const shaft = this.createMesh(
      this.createGeometry('cylinder', 0.02, 0.02, 0.8, 6),
      COLORS.ARROW_SHAFT,
      {
        rotation: { z: Math.PI / 2 },
        castShadow: true
      }
    );
    
    const head = this.createMesh(
      this.createGeometry('cone', 0.04, 0.15, 4),
      COLORS.ARROW_HEAD,
      {
        position: { x: 0.475 },
        rotation: { z: -Math.PI / 2 },
        castShadow: true
      }
    );
    head.userData.isHead = true;
    
    // Arrow fletching (feathers) - create three arranged in circle
    const fletchingGeometry = this.createGeometry('box', 0.1, 0.08, 0.01);
    const fletchings = this.createMultiple(3, (i) => {
      const angle = (i * Math.PI * 2) / 3;
      return this.createMesh(fletchingGeometry, COLORS.ARROW_FLETCHING, {
        position: {
          x: -0.35,
          y: Math.sin(angle) * 0.03,
          z: Math.cos(angle) * 0.03
        },
        rotation: { y: angle, x: -0.2 }
      });
    });
    fletchings.forEach(fletching => arrowGroup.add(fletching));
    
    // Nock (where the arrow meets the bowstring)
    const nock = this.createMesh(
      this.createGeometry('cylinder', 0.025, 0.02, 0.05, 6),
      COLORS.HOOF,
      {
        position: { x: -0.425 },
        rotation: { z: Math.PI / 2 }
      }
    );
    
    arrowGroup.add(shaft);
    arrowGroup.add(head);
    arrowGroup.add(nock);
    
    return {
      mesh: arrowGroup,
      velocity: new THREE.Vector3(),
      active: false
    };
  }
  
  private shoot(): void {
    // Check cooldown
    const currentTime = Date.now();
    const actualCooldown = this.hasActivePowerUp(PowerUpType.RAPID_FIRE) 
      ? this.arrowCooldown * POWERUP_CONFIG.RAPID_FIRE.ARROW_COOLDOWN_MULTIPLIER
      : this.arrowCooldown;
      
    if (currentTime - this.lastArrowShot < actualCooldown) {
      return;
    }
    this.lastArrowShot = currentTime;
    
    // Increment shots fired
    this.uiManager.incrementShotsFired();
    
    // Find an inactive arrow or create a new one
    let arrow = this.arrows.find(a => !a.active);
    if (!arrow) {
      arrow = this.createArrow();
      this.arrows.push(arrow);
      this.scene.add(arrow.mesh);
    }
    
    // Check if explosive arrows are active
    arrow.isExplosive = this.hasActivePowerUp(PowerUpType.EXPLOSIVE_ARROWS);
    
    // Make explosive arrows glow
    if (arrow.isExplosive && arrow.mesh instanceof THREE.Group) {
      const arrowHead = arrow.mesh.children.find(child => child.userData.isHead);
      if (arrowHead && arrowHead instanceof THREE.Mesh) {
        const material = arrowHead.material as THREE.MeshLambertMaterial;
        material.emissive = new THREE.Color(0xFF4500);
        material.emissiveIntensity = 0.5;
      }
    }
    
    // Position arrow at bow location
    const bowWorldPos = new THREE.Vector3();
    this.bow.getWorldPosition(bowWorldPos);
    arrow.mesh.position.copy(bowWorldPos);
    
    // Calculate shooting direction based on mouse position
    this.raycaster.setFromCamera(this.mousePosition, this.camera);
    
    // Create a plane at the wheel's position for intersection
    const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 15); // Adjusted for new wheel position
    const targetPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(targetPlane, targetPoint);
    
    // Calculate direction from bow to target point
    const direction = new THREE.Vector3();
    direction.subVectors(targetPoint, bowWorldPos).normalize();
    
    // Set arrow velocity
    arrow.velocity.copy(direction).multiplyScalar(GAME_CONFIG.ARROW_SPEED);
    
    // Orient arrow to face direction
    arrow.mesh.lookAt(targetPoint);
    arrow.mesh.rotateY(Math.PI / 2); // Rotate 90 degrees since arrow is modeled along X axis
    arrow.active = true;
  }
  
  private checkCollisions(): void {
    // Check each active arrow
    this.arrows.forEach(arrow => {
      if (!arrow.active) return;
      
      // Check collision with targets
      let hitAnyTarget = false;
      const targetsToRemove: Target[] = [];
      const newTargetsToAdd: Target[] = [];
      
      this.targets.forEach(target => {
        if (!target.isActive || !arrow.active) return;
        
        // Apply magnetic force if applicable
        if (target instanceof MagneticTarget) {
          const magneticForce = target.getMagneticForce(arrow.mesh.position);
          if (magneticForce) {
            arrow.velocity.add(magneticForce);
          }
        }
        
        if (target.checkCollision(arrow.mesh.position)) {
          // Hit!
          hitAnyTarget = true;
          arrow.active = false;
          arrow.mesh.position.y = -100; // Hide arrow
          
          const hitResult = target.onHit();
          
          // Calculate score with multipliers
          const baseScore = hitResult.points;
          const totalMultiplier = this.scoreMultiplier * this.comboMultiplier;
          const scoreGain = Math.round(baseScore * totalMultiplier);
          this.score += scoreGain;
          
          // Update combo
          this.updateCombo();
          
          this.wheelSpeed *= 1.1; // Increase wheel speed slightly
          this.uiManager.updateScore(this.score);
          this.uiManager.incrementShotsHit();
          
          // Show target hit message
          this.uiManager.showTargetHit(TARGET_MESSAGES.HIT[target.type], target.type, scoreGain);
          
          // Handle special effects
          if (hitResult.special) {
            this.handleSpecialTargetEffect(hitResult.special, target);
          }
          
          // Create hit effect
          this.createTargetHitEffect(target);
          
          // Mark for removal if not already deactivated
          if (!target.isActive) {
            targetsToRemove.push(target);
          }
          
          // Handle split targets
          if (hitResult.special?.type === 'split') {
            const splitAngles = hitResult.special.angles;
            splitAngles.forEach((angle: number) => {
              const splitTarget = new SplitTarget(
                GAME_CONFIG.WHEEL_RADIUS - 0.5,
                angle,
                hitResult.special.splitLevel
              );
              newTargetsToAdd.push(splitTarget);
            });
          }
        }
      });
      
      // Update missed targets
      if (!hitAnyTarget && arrow.active) {
        // Check if arrow passed through wheel area
        if (arrow.mesh.position.z < -20 && arrow.mesh.position.z > -10) {
          this.targets.forEach(target => {
            if (target.isActive) {
              target.onMiss();
            }
          });
        }
      }
      
      // Remove hit targets
      targetsToRemove.forEach(target => {
        const index = this.targets.indexOf(target);
        if (index > -1) {
          this.targets.splice(index, 1);
          this.wheel.remove(target.mesh);
          target.dispose();
        }
      });
      
      // Add new targets (like splits)
      newTargetsToAdd.forEach(newTarget => {
        this.targets.push(newTarget);
        this.wheel.add(newTarget.mesh);
      });
      
      // Check collision with power-ups
      this.powerUps.forEach(powerUp => {
        if (!powerUp.isActive || !arrow.active) return;
        
        const powerUpDistance = arrow.mesh.position.distanceTo(powerUp.mesh.position);
        if (powerUpDistance < POWERUP_CONFIG.PICKUP_RADIUS) {
          // Arrow hit power-up!
          arrow.active = false;
          arrow.mesh.position.y = -100; // Hide arrow
          this.activatePowerUp(powerUp);
        }
      });
    });
  }
  
  private setupControls(): void {
    // Keyboard controls for movement
    window.addEventListener('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case 'a':
          this.keys.left = true;
          break;
        case 'd':
          this.keys.right = true;
          break;
      }
    });
    
    window.addEventListener('keyup', (e) => {
      switch (e.key.toLowerCase()) {
        case 'a':
          this.keys.left = false;
          break;
        case 'd':
          this.keys.right = false;
          break;
      }
    });
    
    // Mouse movement for aiming
    window.addEventListener('mousemove', (e) => {
      this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      // Update bow rotation to follow mouse
      this.updateBowAim();
    });
    
    // Mouse click for shooting
    window.addEventListener('click', () => {
      this.shoot();
    });
    
    // Add crosshair cursor
    this.renderer.domElement.style.cursor = 'crosshair';
  }
  
  private updateBowAim(): void {
    // Calculate world position where mouse ray intersects with a plane
    this.raycaster.setFromCamera(this.mousePosition, this.camera);
    const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 15); // Adjusted for new wheel position
    const targetPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(targetPlane, targetPoint);
    
    // Make bow look at target point
    const bowWorldPos = new THREE.Vector3();
    this.bow.getWorldPosition(bowWorldPos);
    
    // Calculate angle for bow rotation
    const dx = targetPoint.x - bowWorldPos.x;
    const dy = targetPoint.y - bowWorldPos.y;
    const angle = Math.atan2(dy, dx);
    
    // Apply rotation to bow (adjust for bow's initial rotation)
    this.bow.rotation.z = angle - Math.PI / 2;
  }
  
  
  
  
  
  
  public animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // Update Bleda movement (affected by stun)
    const movementMultiplier = this.isStunned ? OBSTACLE_CONFIG.STUN_MOVEMENT_MULTIPLIER : 1;
    
    if (this.keys.left) {
      this.bledaVelocity.x = -GAME_CONFIG.BLEDA_SPEED * movementMultiplier;
    } else if (this.keys.right) {
      this.bledaVelocity.x = GAME_CONFIG.BLEDA_SPEED * movementMultiplier;
    } else {
      this.bledaVelocity.x *= 0.8; // Friction
    }
    
    // Update Bleda position
    this.bledaPosition.x += this.bledaVelocity.x * deltaTime;
    this.bledaPosition.x = Math.max(-GAME_CONFIG.BLEDA_BOUNDS, Math.min(GAME_CONFIG.BLEDA_BOUNDS, this.bledaPosition.x)); // Keep within bounds
    this.bleda.position.x = this.bledaPosition.x;
    
    // Animate horse when moving
    if (Math.abs(this.bledaVelocity.x) > 0.1) {
      this.horseLegAnimation += deltaTime * 8;
      
      // Animate legs - find them by traversing children
      const legSwing = Math.sin(this.horseLegAnimation) * 0.3;
      const horseMeshes = this.bleda.children;
      
      // Find legs in the bleda group (they should be children 7-10 based on order added)
      // But let's be defensive and check if they exist
      if (horseMeshes[7]) horseMeshes[7].rotation.x = legSwing;
      if (horseMeshes[8]) horseMeshes[8].rotation.x = -legSwing;
      if (horseMeshes[9]) horseMeshes[9].rotation.x = -legSwing * 0.8;
      if (horseMeshes[10]) horseMeshes[10].rotation.x = legSwing * 0.8;
      
      // Subtle body bounce
      this.bleda.position.y = 1 + Math.abs(Math.sin(this.horseLegAnimation * 2)) * 0.1;
      
      // Tail sway - find tail in children
      const tailMesh = horseMeshes[11];
      if (tailMesh) {
        tailMesh.rotation.x = Math.sin(this.horseLegAnimation * 0.5) * 0.2;
      }
    }
    
    // Rotate wheel around Z-axis (like a ferris wheel or wheel of fortune)
    this.wheel.rotation.z += this.wheelSpeed * deltaTime;
    
    // Update RPM display
    this.uiManager.updateRPM(this.wheelSpeed);
    
    // Update arrows
    this.arrows.forEach(arrow => {
      if (arrow.active) {
        // Update position
        arrow.mesh.position.add(arrow.velocity.clone().multiplyScalar(deltaTime));
        
        // Add gravity to arrows for realistic arc
        arrow.velocity.y -= GAME_CONFIG.GRAVITY * deltaTime;
        
        // Rotate arrow to follow its trajectory
        const direction = arrow.velocity.clone().normalize();
        arrow.mesh.lookAt(
          arrow.mesh.position.x + direction.x,
          arrow.mesh.position.y + direction.y,
          arrow.mesh.position.z + direction.z
        );
        arrow.mesh.rotateY(Math.PI / 2); // Maintain rotation since arrow is modeled along X axis
        
        // Deactivate if too far or too low
        if (arrow.mesh.position.z < -30 || arrow.mesh.position.y < -5 || 
            arrow.mesh.position.distanceTo(this.bleda.position) > 50) {
          arrow.active = false;
          arrow.mesh.position.y = -100;
        }
      }
    });
    
    // Update power-ups
    this.updatePowerUps(deltaTime);
    
    // Update obstacles
    this.updateObstacles(deltaTime);
    
    // Update targets
    const elapsedTime = Date.now() / 1000;
    this.updateTargets(deltaTime, elapsedTime);
    
    // Update active power-ups display
    const currentTime = Date.now();
    const activePowerUpsDisplay = this.activePowerUps.map(effect => ({
      type: effect.type,
      remaining: effect.duration - (currentTime - effect.startTime)
    }));
    this.uiManager.updateActivePowerUps(activePowerUpsDisplay);
    
    // Check collisions
    this.checkCollisions();
    
    this.renderer.render(this.scene, this.camera);
  }
  
  public handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  public dispose(): void {
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    
    // Dispose power-ups
    this.powerUps.forEach(powerUp => powerUp.dispose());
    
    // Dispose obstacles
    this.obstacles.forEach(obstacle => {
      this.scene.remove(obstacle.mesh);
      obstacle.dispose();
    });
    
    // Dispose targets
    this.targets.forEach(target => {
      this.wheel.remove(target.mesh);
      target.dispose();
    });
  }
  
  private hasActivePowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.some(effect => effect.type === type);
  }
  
  private spawnPowerUp(): void {
    if (this.powerUps.filter(p => p.isActive).length >= POWERUP_CONFIG.MAX_ACTIVE_POWERUPS) {
      return;
    }
    
    // Random chance to spawn
    if (Math.random() > POWERUP_CONFIG.SPAWN_CHANCE) {
      return;
    }
    
    // Choose random power-up type
    const types = Object.values(PowerUpType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Random position in front of Bleda
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * POWERUP_CONFIG.SPAWN_RADIUS + 5;
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      POWERUP_CONFIG.SPAWN_HEIGHT,
      Math.sin(angle) * radius
    );
    
    const powerUp = new PowerUp(randomType, position);
    this.powerUps.push(powerUp);
    this.scene.add(powerUp.mesh);
  }
  
  private activatePowerUp(powerUp: PowerUp): void {
    const effect: PowerUpEffect = {
      type: powerUp.type,
      startTime: Date.now(),
      duration: this.getPowerUpDuration(powerUp.type)
    };
    
    this.activePowerUps.push(effect);
    powerUp.deactivate();
    
    // Apply immediate effects
    switch (powerUp.type) {
      case PowerUpType.SCORE_MULTIPLIER:
        this.scoreMultiplier = POWERUP_CONFIG.SCORE_MULTIPLIER.MULTIPLIER;
        break;
    }
    
    // Show pickup message
    this.uiManager.showPowerUpMessage(POWERUP_MESSAGES.PICKUP[powerUp.type], powerUp.type);
  }
  
  private getPowerUpDuration(type: PowerUpType): number {
    switch (type) {
      case PowerUpType.RAPID_FIRE:
        return POWERUP_CONFIG.RAPID_FIRE.DURATION;
      case PowerUpType.EXPLOSIVE_ARROWS:
        return POWERUP_CONFIG.EXPLOSIVE_ARROWS.DURATION;
      case PowerUpType.SCORE_MULTIPLIER:
        return POWERUP_CONFIG.SCORE_MULTIPLIER.DURATION;
    }
  }
  
  private updatePowerUps(deltaTime: number): void {
    const currentTime = Date.now();
    const elapsedTime = currentTime / 1000;
    
    // Update power-up animations
    this.powerUps.forEach(powerUp => {
      if (powerUp.isActive) {
        powerUp.update(deltaTime, elapsedTime);
        
        // Check collision with Bleda
        if (powerUp.checkCollision(this.bleda.position)) {
          this.activatePowerUp(powerUp);
        }
      }
    });
    
    // Check for expired power-ups
    this.activePowerUps = this.activePowerUps.filter(effect => {
      const elapsed = currentTime - effect.startTime;
      if (elapsed >= effect.duration) {
        // Remove expired effects
        switch (effect.type) {
          case PowerUpType.SCORE_MULTIPLIER:
            this.scoreMultiplier = 1;
            break;
        }
        
        // Show expiration message
        this.uiManager.showPowerUpMessage(POWERUP_MESSAGES.EXPIRE[effect.type], effect.type);
        return false;
      }
      return true;
    });
    
    // Check if it's time to spawn a new power-up
    if (currentTime - this.lastPowerUpSpawn >= POWERUP_CONFIG.SPAWN_INTERVAL) {
      this.spawnPowerUp();
      this.lastPowerUpSpawn = currentTime;
    }
  }
  
  private spawnObstacle(): void {
    if (this.obstacles.filter(o => o.isActive).length >= OBSTACLE_CONFIG.MAX_ACTIVE_OBSTACLES) {
      return;
    }
    
    // Random chance to spawn
    if (Math.random() > OBSTACLE_CONFIG.SPAWN_CHANCE) {
      return;
    }
    
    // Choose random obstacle type
    const types = Object.values(ObstacleType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    let obstacle: Obstacle | null = null;
    
    switch (randomType) {
      case ObstacleType.FLYING_ROCK:
        // Spawn rock from a random direction aimed at player area
        const angle = Math.random() * Math.PI * 2;
        const distance = OBSTACLE_CONFIG.MIN_SPAWN_DISTANCE + 
          Math.random() * (OBSTACLE_CONFIG.MAX_SPAWN_DISTANCE - OBSTACLE_CONFIG.MIN_SPAWN_DISTANCE);
        const height = OBSTACLE_CONFIG.FLYING_ROCK.SPAWN_HEIGHT_MIN + 
          Math.random() * (OBSTACLE_CONFIG.FLYING_ROCK.SPAWN_HEIGHT_MAX - OBSTACLE_CONFIG.FLYING_ROCK.SPAWN_HEIGHT_MIN);
        
        const rockPosition = new THREE.Vector3(
          Math.cos(angle) * distance,
          height,
          Math.sin(angle) * distance
        );
        
        // Aim towards player area with some variance
        const targetDirection = new THREE.Vector3(
          this.bledaPosition.x - rockPosition.x,
          0,
          this.bledaPosition.z - rockPosition.z
        );
        
        obstacle = new FlyingRock(rockPosition, targetDirection);
        break;
        
      case ObstacleType.TREE:
        // Place tree at random position on ground
        const treeAngle = Math.random() * Math.PI * 2;
        const treeDistance = 5 + Math.random() * OBSTACLE_CONFIG.TREE.SPAWN_RADIUS;
        const treePosition = new THREE.Vector3(
          this.bledaPosition.x + Math.cos(treeAngle) * treeDistance,
          0,
          this.bledaPosition.z + Math.sin(treeAngle) * treeDistance
        );
        
        obstacle = new Tree(treePosition);
        break;
        
      case ObstacleType.BIRD:
        // Spawn bird(s) from side of screen
        const flockSize = OBSTACLE_CONFIG.BIRD.FLOCK_SIZE_MIN + 
          Math.floor(Math.random() * (OBSTACLE_CONFIG.BIRD.FLOCK_SIZE_MAX - OBSTACLE_CONFIG.BIRD.FLOCK_SIZE_MIN + 1));
        
        const side = Math.random() < 0.5 ? -1 : 1;
        const birdHeight = 3 + Math.random() * 3;
        
        for (let i = 0; i < flockSize; i++) {
          const birdPosition = new THREE.Vector3(
            side * OBSTACLE_CONFIG.MAX_SPAWN_DISTANCE,
            birdHeight + i * 0.5,
            this.bledaPosition.z + (Math.random() - 0.5) * 10
          );
          
          const birdDirection = new THREE.Vector3(-side, 0, 0);
          const bird = new Bird(birdPosition, birdDirection);
          
          if (i === 0) {
            obstacle = bird;
          } else {
            // Add additional birds directly to scene
            this.obstacles.push(bird);
            this.scene.add(bird.mesh);
          }
        }
        break;
    }
    
    if (obstacle) {
      this.obstacles.push(obstacle);
      this.scene.add(obstacle.mesh);
    }
  }
  
  private updateObstacles(deltaTime: number): void {
    const currentTime = Date.now();
    
    // Update stun status
    if (this.isStunned && currentTime >= this.stunnedUntil) {
      this.isStunned = false;
      this.uiManager.hideStunEffect();
    }
    
    // Update obstacles
    this.obstacles.forEach(obstacle => {
      if (obstacle.isActive) {
        obstacle.update(deltaTime, this.bleda.position);
        
        // Check for collision with player
        if (obstacle.checkCollision(this.bleda.position)) {
          this.handleObstacleCollision(obstacle);
        }
        
        // Check if obstacle is approaching for warning
        const warningDistance = obstacle.getWarningDistance(this.bleda.position);
        if (warningDistance < OBSTACLE_CONFIG.WARNING_DISTANCE && warningDistance > OBSTACLE_CONFIG.COLLISION_RADIUS) {
          // Show warning (implement in UI manager)
          if (obstacle.type === ObstacleType.FLYING_ROCK || obstacle.type === ObstacleType.BIRD) {
            this.uiManager.showObstacleWarning(OBSTACLE_MESSAGES.WARNING[obstacle.type], obstacle.type);
          }
        }
      }
    });
    
    // Remove inactive obstacles
    this.obstacles = this.obstacles.filter(obstacle => {
      if (!obstacle.isActive) {
        this.scene.remove(obstacle.mesh);
        obstacle.dispose();
        return false;
      }
      return true;
    });
    
    // Check if it's time to spawn new obstacles
    if (currentTime - this.lastObstacleSpawn >= OBSTACLE_CONFIG.SPAWN_INTERVAL) {
      this.spawnObstacle();
      this.lastObstacleSpawn = currentTime;
    }
  }
  
  private handleObstacleCollision(obstacle: Obstacle): void {
    // Deactivate obstacle
    obstacle.deactivate();
    
    // Apply stun effect
    this.isStunned = true;
    this.stunnedUntil = Date.now() + OBSTACLE_CONFIG.STUN_DURATION;
    
    // Apply score penalty
    this.score = Math.max(0, this.score - OBSTACLE_CONFIG.SCORE_PENALTY);
    this.uiManager.updateScore(this.score);
    
    // Show collision message
    this.uiManager.showObstacleCollision(OBSTACLE_MESSAGES.COLLISION[obstacle.type], obstacle.type);
    
    // Visual stun effect
    this.uiManager.showStunEffect();
    
    // Camera shake effect
    const originalCameraPosition = this.camera.position.clone();
    let shakeTime = 0;
    const shakeAnimation = () => {
      shakeTime += 16; // ~60fps
      if (shakeTime < 300) {
        const intensity = (1 - shakeTime / 300) * 0.5;
        this.camera.position.x = originalCameraPosition.x + (Math.random() - 0.5) * intensity;
        this.camera.position.y = originalCameraPosition.y + (Math.random() - 0.5) * intensity;
        requestAnimationFrame(shakeAnimation);
      } else {
        this.camera.position.copy(originalCameraPosition);
      }
    };
    shakeAnimation();
  }
  
  private updateCombo(): void {
    const currentTime = Date.now();
    
    if (currentTime - this.lastHitTime <= TARGET_CONFIG.COMBO_TIME_WINDOW) {
      this.comboCount++;
      this.comboMultiplier = Math.min(
        1 + this.comboCount * TARGET_CONFIG.COMBO_MULTIPLIER_INCREMENT,
        TARGET_CONFIG.MAX_COMBO_MULTIPLIER
      );
      
      // Show combo message
      if (this.comboCount > 1 && this.comboCount <= TARGET_MESSAGES.COMBO.length) {
        this.uiManager.showComboMessage(
          TARGET_MESSAGES.COMBO[this.comboCount - 2],
          this.comboCount
        );
      }
    } else {
      this.comboCount = 1;
      this.comboMultiplier = 1;
    }
    
    this.lastHitTime = currentTime;
    this.uiManager.updateComboDisplay(this.comboCount, this.comboMultiplier);
  }
  
  private handleSpecialTargetEffect(special: any, target: Target): void {
    switch (special.type) {
      case 'explosive':
        this.createExplosionEffect(target.mesh.position.clone());
        
        // Check for chain explosions
        this.targets.forEach(otherTarget => {
          if (otherTarget !== target && otherTarget.isActive) {
            const distance = target.mesh.position.distanceTo(otherTarget.mesh.position);
            if (distance < special.explosionRadius) {
              // Chain explosion
              if (Math.random() < special.chainChance) {
                const hitResult = otherTarget.onHit();
                const scoreGain = Math.round(hitResult.points * this.scoreMultiplier * this.comboMultiplier);
                this.score += scoreGain;
                this.uiManager.updateScore(this.score);
                this.createTargetHitEffect(otherTarget);
              }
            }
          }
        });
        break;
        
      case 'mystery':
        const reward = special.reward;
        this.uiManager.showMysteryReveal(reward.message);
        
        if (reward.powerUp) {
          // Spawn random power-up
          this.spawnPowerUp();
        } else if (reward.multiball) {
          // Add extra targets
          this.spawnSpecialTargets(3);
        }
        break;
    }
  }
  
  private createTargetHitEffect(target: Target): void {
    const worldPos = new THREE.Vector3();
    target.mesh.getWorldPosition(worldPos);
    
    // Create hit particles based on target type
    const particleCount = 15;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const targetColor = new THREE.Color(this.getTargetConfig(target.type).COLOR);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = worldPos.x + (Math.random() - 0.5) * 1;
      positions[i3 + 1] = worldPos.y + (Math.random() - 0.5) * 1;
      positions[i3 + 2] = worldPos.z + (Math.random() - 0.5) * 1;
      
      colors[i3] = targetColor.r;
      colors[i3 + 1] = targetColor.g;
      colors[i3 + 2] = targetColor.b;
      
      sizes[i] = Math.random() * 0.3 + 0.2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    // Animate particles
    let opacity = 1;
    const animateParticles = () => {
      opacity -= 0.02;
      material.opacity = opacity;
      
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += (Math.random() - 0.5) * 0.1;
        positions[i + 1] += Math.random() * 0.1;
        positions[i + 2] += (Math.random() - 0.5) * 0.1;
      }
      geometry.attributes.position.needsUpdate = true;
      
      if (opacity > 0) {
        requestAnimationFrame(animateParticles);
      } else {
        this.scene.remove(particles);
        geometry.dispose();
        material.dispose();
      }
    };
    
    animateParticles();
  }
  
  private getTargetConfig(type: TargetType): any {
    switch (type) {
      case TargetType.STANDARD: return TARGET_CONFIG.STANDARD;
      case TargetType.GOLD: return TARGET_CONFIG.GOLD;
      case TargetType.SPEED: return TARGET_CONFIG.SPEED;
      case TargetType.BONUS: return TARGET_CONFIG.BONUS;
      case TargetType.SHRINKING: return TARGET_CONFIG.SHRINKING;
      case TargetType.SPLIT: return TARGET_CONFIG.SPLIT;
      case TargetType.MYSTERY: return TARGET_CONFIG.MYSTERY;
      case TargetType.GHOST: return TARGET_CONFIG.GHOST;
      case TargetType.MAGNETIC: return TARGET_CONFIG.MAGNETIC;
      case TargetType.EXPLOSIVE: return TARGET_CONFIG.EXPLOSIVE;
      default: return TARGET_CONFIG.STANDARD;
    }
  }
  
  private spawnTarget(): void {
    if (this.targets.length >= TARGET_CONFIG.MAX_TARGETS_ON_WHEEL) {
      return;
    }
    
    // Get available spawn positions
    const occupiedAngles = this.targets.map(t => t.wheelAngle);
    const minAngleDistance = Math.PI / 4; // Minimum 45 degrees between targets
    
    // Find valid spawn angle
    let validAngle: number | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const testAngle = Math.random() * Math.PI * 2;
      let isValid = true;
      
      for (const occupiedAngle of occupiedAngles) {
        const angleDiff = Math.abs(testAngle - occupiedAngle);
        if (angleDiff < minAngleDistance || angleDiff > Math.PI * 2 - minAngleDistance) {
          isValid = false;
          break;
        }
      }
      
      if (isValid) {
        validAngle = testAngle;
        break;
      }
    }
    
    if (validAngle === null) return;
    
    // Choose target type based on spawn chances
    const targetTypes = [
      { type: TargetType.GOLD, chance: TARGET_CONFIG.GOLD.SPAWN_CHANCE },
      { type: TargetType.SPEED, chance: TARGET_CONFIG.SPEED.SPAWN_CHANCE },
      { type: TargetType.BONUS, chance: TARGET_CONFIG.BONUS.SPAWN_CHANCE },
      { type: TargetType.SHRINKING, chance: TARGET_CONFIG.SHRINKING.SPAWN_CHANCE },
      { type: TargetType.SPLIT, chance: TARGET_CONFIG.SPLIT.SPAWN_CHANCE },
      { type: TargetType.MYSTERY, chance: TARGET_CONFIG.MYSTERY.SPAWN_CHANCE },
      { type: TargetType.GHOST, chance: TARGET_CONFIG.GHOST.SPAWN_CHANCE },
      { type: TargetType.MAGNETIC, chance: TARGET_CONFIG.MAGNETIC.SPAWN_CHANCE },
      { type: TargetType.EXPLOSIVE, chance: TARGET_CONFIG.EXPLOSIVE.SPAWN_CHANCE }
    ];
    
    const random = Math.random();
    let cumulativeChance = 0;
    let selectedType: TargetType | null = null;
    
    for (const targetType of targetTypes) {
      cumulativeChance += targetType.chance;
      if (random <= cumulativeChance) {
        selectedType = targetType.type;
        break;
      }
    }
    
    if (!selectedType) return;
    
    // Create target
    let newTarget: Target | null = null;
    const radius = GAME_CONFIG.WHEEL_RADIUS - 0.5;
    
    switch (selectedType) {
      case TargetType.GOLD:
        newTarget = new GoldTarget(radius, validAngle);
        break;
      case TargetType.SPEED:
        newTarget = new SpeedTarget(radius, validAngle);
        break;
      case TargetType.BONUS:
        newTarget = new BonusTarget(radius, validAngle);
        break;
      case TargetType.SHRINKING:
        newTarget = new ShrinkingTarget(radius, validAngle);
        break;
      case TargetType.SPLIT:
        newTarget = new SplitTarget(radius, validAngle);
        break;
      case TargetType.MYSTERY:
        newTarget = new MysteryTarget(radius, validAngle);
        break;
      case TargetType.GHOST:
        newTarget = new GhostTarget(radius, validAngle);
        break;
      case TargetType.MAGNETIC:
        newTarget = new MagneticTarget(radius, validAngle);
        break;
      case TargetType.EXPLOSIVE:
        newTarget = new ExplosiveTarget(radius, validAngle);
        break;
    }
    
    if (newTarget) {
      this.targets.push(newTarget);
      this.wheel.add(newTarget.mesh);
      
      // Show spawn message for special targets
      if (selectedType in TARGET_MESSAGES.SPAWN) {
        this.uiManager.showTargetSpawn(TARGET_MESSAGES.SPAWN[selectedType as keyof typeof TARGET_MESSAGES.SPAWN], selectedType);
      }
    }
  }
  
  private spawnSpecialTargets(count: number): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.spawnTarget();
      }, i * 500); // Stagger spawns
    }
  }
  
  private updateTargets(deltaTime: number, elapsedTime: number): void {
    const currentTime = Date.now();
    
    // Update all targets
    this.targets.forEach(target => {
      if (target.isActive) {
        target.update(deltaTime, this.wheel.rotation.z, elapsedTime);
      }
    });
    
    // Remove inactive targets
    this.targets = this.targets.filter(target => {
      if (!target.isActive) {
        this.wheel.remove(target.mesh);
        target.dispose();
        return false;
      }
      return true;
    });
    
    // Check if we need to spawn new targets
    if (currentTime - this.lastTargetCheck >= TARGET_CONFIG.SPAWN_CHECK_INTERVAL) {
      this.spawnTarget();
      this.lastTargetCheck = currentTime;
    }
    
    // Ensure at least one standard target exists
    if (this.targets.length === 0) {
      const standardTarget = new StandardTarget(GAME_CONFIG.WHEEL_RADIUS - 0.5, 0);
      this.targets.push(standardTarget);
      this.wheel.add(standardTarget.mesh);
    }
  }
  
  private createExplosionEffect(position: THREE.Vector3): void {
    // Create explosion particles
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = position.x + (Math.random() - 0.5) * 2;
      positions[i3 + 1] = position.y + (Math.random() - 0.5) * 2;
      positions[i3 + 2] = position.z + (Math.random() - 0.5) * 2;
      
      // Orange to red colors
      colors[i3] = 1;
      colors[i3 + 1] = Math.random() * 0.5 + 0.3;
      colors[i3 + 2] = 0;
      
      sizes[i] = Math.random() * 0.5 + 0.3;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    // Animate and remove particles
    let opacity = 1;
    const animateExplosion = () => {
      opacity -= 0.05;
      material.opacity = opacity;
      
      // Expand particles
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - position.x;
        const dy = positions[i + 1] - position.y;
        const dz = positions[i + 2] - position.z;
        positions[i] += dx * 0.1;
        positions[i + 1] += dy * 0.1;
        positions[i + 2] += dz * 0.1;
      }
      geometry.attributes.position.needsUpdate = true;
      
      if (opacity > 0) {
        requestAnimationFrame(animateExplosion);
      } else {
        this.scene.remove(particles);
        geometry.dispose();
        material.dispose();
      }
    };
    
    animateExplosion();
  }
}