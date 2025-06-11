import * as THREE from 'three';
import { TargetType, TARGET_CONFIG } from './constants';

export interface TargetEffect {
  update(deltaTime: number, elapsedTime: number): void;
  dispose(): void;
}

export abstract class Target {
  public mesh: THREE.Group;
  public type: TargetType;
  public isActive: boolean = true;
  public points: number;
  protected size: number;
  public wheelAngle: number = 0;
  protected wheelRadius: number;
  protected spawnTime: number;
  protected lifetime: number | null;
  protected effects: TargetEffect[] = [];
  
  constructor(type: TargetType, wheelRadius: number, angle: number = 0) {
    this.type = type;
    this.wheelRadius = wheelRadius;
    this.wheelAngle = angle;
    this.spawnTime = Date.now();
    this.mesh = new THREE.Group();
    
    const config = this.getConfig();
    this.size = config.SIZE;
    this.points = config.POINTS || 0;
    this.lifetime = config.LIFETIME || null;
  }
  
  protected abstract getConfig(): any;
  protected abstract createMesh(): void;
  
  public update(deltaTime: number, wheelRotation: number, elapsedTime: number): void {
    if (!this.isActive) return;
    
    // Update position based on wheel rotation
    const totalAngle = this.wheelAngle + wheelRotation;
    this.mesh.position.x = Math.cos(totalAngle) * this.wheelRadius;
    this.mesh.position.y = Math.sin(totalAngle) * this.wheelRadius;
    
    // Check lifetime
    if (this.lifetime !== null) {
      const age = Date.now() - this.spawnTime;
      if (age >= this.lifetime) {
        this.deactivate();
        return;
      }
    }
    
    // Update effects
    this.effects.forEach(effect => effect.update(deltaTime, elapsedTime));
    
    // Target-specific updates
    this.updateSpecific(deltaTime, elapsedTime);
  }
  
  protected abstract updateSpecific(deltaTime: number, elapsedTime: number): void;
  
  public checkCollision(arrowPosition: THREE.Vector3): boolean {
    if (!this.isActive) return false;
    
    const targetWorldPos = new THREE.Vector3();
    this.mesh.getWorldPosition(targetWorldPos);
    const distance = arrowPosition.distanceTo(targetWorldPos);
    
    return distance < this.size + 0.2; // Add small buffer for better hit detection
  }
  
  public onHit(): { points: number, special?: any } {
    this.deactivate();
    return { points: this.points };
  }
  
  public onMiss(): void {
    // Override in subclasses that react to misses
  }
  
  public deactivate(): void {
    this.isActive = false;
    this.mesh.visible = false;
  }
  
  public dispose(): void {
    this.effects.forEach(effect => effect.dispose());
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}

// Standard Target
export class StandardTarget extends Target {
  constructor(wheelRadius: number, angle: number) {
    super(TargetType.STANDARD, wheelRadius, angle);
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.STANDARD;
  }
  
  protected createMesh(): void {
    const geometry = new THREE.SphereGeometry(this.size, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.STANDARD.COLOR 
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    this.mesh.add(sphere);
  }
  
  protected updateSpecific(_deltaTime: number, _elapsedTime: number): void {
    // Standard target has no special behavior
  }
}

// Gold Target with glow effect
export class GoldTarget extends Target {
  private glowLight!: THREE.PointLight;
  private particles!: THREE.Points;
  
  constructor(wheelRadius: number, angle: number) {
    super(TargetType.GOLD, wheelRadius, angle);
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.GOLD;
  }
  
  protected createMesh(): void {
    // Main sphere
    const geometry = new THREE.SphereGeometry(this.size, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.GOLD.COLOR,
      emissive: TARGET_CONFIG.GOLD.COLOR,
      emissiveIntensity: 0.3
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    
    // Glow effect
    this.glowLight = new THREE.PointLight(TARGET_CONFIG.GOLD.COLOR, TARGET_CONFIG.GOLD.GLOW_INTENSITY, 3);
    
    // Particle effect
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = TARGET_CONFIG.GOLD.PARTICLE_COUNT;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * this.size * 1.5;
      positions[i * 3 + 1] = Math.sin(angle) * this.size * 1.5;
      positions[i * 3 + 2] = 0;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: TARGET_CONFIG.GOLD.COLOR,
      size: 0.05,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    
    this.mesh.add(sphere);
    this.mesh.add(this.glowLight);
    this.mesh.add(this.particles);
  }
  
  protected updateSpecific(deltaTime: number, elapsedTime: number): void {
    // Rotate particles
    this.particles.rotation.z += deltaTime;
    
    // Pulse glow
    this.glowLight.intensity = TARGET_CONFIG.GOLD.GLOW_INTENSITY + 
      Math.sin(elapsedTime * 3) * 0.5;
  }
}

// Speed Target with trail effect
export class SpeedTarget extends Target {
  private speedMultiplier: number;
  private trail: THREE.Mesh[] = [];
  
  constructor(wheelRadius: number, angle: number) {
    super(TargetType.SPEED, wheelRadius, angle);
    this.speedMultiplier = TARGET_CONFIG.SPEED.SPEED_MULTIPLIER;
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.SPEED;
  }
  
  protected createMesh(): void {
    const geometry = new THREE.ConeGeometry(this.size, this.size * 2, 8);
    const material = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.SPEED.COLOR 
    });
    const cone = new THREE.Mesh(geometry, material);
    cone.rotation.z = -Math.PI / 2;
    cone.castShadow = true;
    
    // Create trail
    for (let i = 0; i < TARGET_CONFIG.SPEED.TRAIL_LENGTH; i++) {
      const trailGeometry = new THREE.SphereGeometry(this.size * (1 - i * 0.15), 8, 8);
      const trailMaterial = new THREE.MeshBasicMaterial({ 
        color: TARGET_CONFIG.SPEED.COLOR,
        transparent: true,
        opacity: 0.3 - i * 0.05
      });
      const trailPiece = new THREE.Mesh(trailGeometry, trailMaterial);
      this.trail.push(trailPiece);
      this.mesh.add(trailPiece);
    }
    
    this.mesh.add(cone);
  }
  
  public update(deltaTime: number, wheelRotation: number, elapsedTime: number): void {
    if (!this.isActive) return;
    
    // Update position with speed multiplier
    const totalAngle = this.wheelAngle + wheelRotation * this.speedMultiplier;
    this.mesh.position.x = Math.cos(totalAngle) * this.wheelRadius;
    this.mesh.position.y = Math.sin(totalAngle) * this.wheelRadius;
    
    // Update trail positions
    for (let i = 0; i < this.trail.length; i++) {
      const trailAngle = totalAngle - (i + 1) * 0.1;
      this.trail[i].position.x = Math.cos(trailAngle) * this.wheelRadius - this.mesh.position.x;
      this.trail[i].position.y = Math.sin(trailAngle) * this.wheelRadius - this.mesh.position.y;
    }
    
    this.wheelAngle += deltaTime * (this.speedMultiplier - 1);
    
    // Check lifetime
    if (this.lifetime !== null) {
      const age = Date.now() - this.spawnTime;
      if (age >= this.lifetime) {
        this.deactivate();
        return;
      }
    }
    
    this.updateSpecific(deltaTime, elapsedTime);
  }
  
  protected updateSpecific(_deltaTime: number, _elapsedTime: number): void {
    // Trail is updated in main update method
  }
}

// Bonus Target with rainbow effect
export class BonusTarget extends Target {
  private pulseScale: number = 1;
  
  constructor(wheelRadius: number, angle: number) {
    super(TargetType.BONUS, wheelRadius, angle);
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.BONUS;
  }
  
  protected createMesh(): void {
    const geometry = new THREE.OctahedronGeometry(this.size, 0);
    const material = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.BONUS.COLOR 
    });
    const octahedron = new THREE.Mesh(geometry, material);
    octahedron.castShadow = true;
    
    // Add inner glow sphere
    const glowGeometry = new THREE.SphereGeometry(this.size * 0.8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.5
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    
    this.mesh.add(octahedron);
    this.mesh.add(glowSphere);
  }
  
  protected updateSpecific(deltaTime: number, elapsedTime: number): void {
    // Pulse effect
    this.pulseScale = 1 + Math.sin(elapsedTime * TARGET_CONFIG.BONUS.PULSE_SPEED) * 0.2;
    this.mesh.scale.setScalar(this.pulseScale);
    
    // Rainbow color effect
    const hue = (elapsedTime * TARGET_CONFIG.BONUS.RAINBOW_SPEED) % 1;
    const color = new THREE.Color().setHSL(hue, 1, 0.5);
    if (this.mesh.children[0] instanceof THREE.Mesh) {
      (this.mesh.children[0].material as THREE.MeshLambertMaterial).color = color;
    }
    
    // Rotation
    this.mesh.rotation.x += deltaTime * 2;
    this.mesh.rotation.y += deltaTime * 3;
  }
}

// Shrinking Target
export class ShrinkingTarget extends Target {
  private currentSize: number;
  private missCount: number = 0;
  
  constructor(wheelRadius: number, angle: number) {
    super(TargetType.SHRINKING, wheelRadius, angle);
    this.currentSize = TARGET_CONFIG.SHRINKING.SIZE_START;
    this.size = this.currentSize;
    this.updatePoints();
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.SHRINKING;
  }
  
  protected createMesh(): void {
    const geometry = new THREE.SphereGeometry(this.currentSize, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.SHRINKING.COLOR_START 
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    this.mesh.add(sphere);
  }
  
  protected updateSpecific(_deltaTime: number, _elapsedTime: number): void {
    // Update color based on size
    const sizeRatio = (this.currentSize - TARGET_CONFIG.SHRINKING.SIZE_MIN) / 
                     (TARGET_CONFIG.SHRINKING.SIZE_START - TARGET_CONFIG.SHRINKING.SIZE_MIN);
    const color = new THREE.Color(TARGET_CONFIG.SHRINKING.COLOR_START).lerp(
      new THREE.Color(TARGET_CONFIG.SHRINKING.COLOR_END),
      1 - sizeRatio
    );
    
    if (this.mesh.children[0] instanceof THREE.Mesh) {
      (this.mesh.children[0].material as THREE.MeshLambertMaterial).color = color;
    }
  }
  
  public onMiss(): void {
    this.missCount++;
    if (this.missCount >= TARGET_CONFIG.SHRINKING.MAX_MISSES) {
      this.deactivate();
      return;
    }
    
    // Shrink the target
    this.currentSize *= TARGET_CONFIG.SHRINKING.SHRINK_RATE;
    if (this.currentSize < TARGET_CONFIG.SHRINKING.SIZE_MIN) {
      this.currentSize = TARGET_CONFIG.SHRINKING.SIZE_MIN;
    }
    
    this.size = this.currentSize;
    this.mesh.scale.setScalar(this.currentSize / TARGET_CONFIG.SHRINKING.SIZE_START);
    this.updatePoints();
  }
  
  private updatePoints(): void {
    const sizeRatio = (this.currentSize - TARGET_CONFIG.SHRINKING.SIZE_MIN) / 
                     (TARGET_CONFIG.SHRINKING.SIZE_START - TARGET_CONFIG.SHRINKING.SIZE_MIN);
    this.points = Math.round(
      TARGET_CONFIG.SHRINKING.POINTS_MIN + 
      sizeRatio * (TARGET_CONFIG.SHRINKING.POINTS_MAX - TARGET_CONFIG.SHRINKING.POINTS_MIN)
    );
  }
}

// Split Target
export class SplitTarget extends Target {
  private splitCount: number = 0;
  
  constructor(wheelRadius: number, angle: number, splitCount: number = 0) {
    super(TargetType.SPLIT, wheelRadius, angle);
    this.splitCount = splitCount;
    this.size = TARGET_CONFIG.SPLIT.SIZE * Math.pow(TARGET_CONFIG.SPLIT.SPLIT_SIZE_MULTIPLIER, splitCount);
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.SPLIT;
  }
  
  protected createMesh(): void {
    const geometry = new THREE.TetrahedronGeometry(this.size, 0);
    const material = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.SPLIT.COLOR 
    });
    const tetrahedron = new THREE.Mesh(geometry, material);
    tetrahedron.castShadow = true;
    this.mesh.add(tetrahedron);
  }
  
  protected updateSpecific(deltaTime: number, _elapsedTime: number): void {
    this.mesh.rotation.x += deltaTime;
    this.mesh.rotation.y += deltaTime * 1.5;
  }
  
  public onHit(): { points: number, special?: any } {
    this.deactivate();
    
    if (this.splitCount < TARGET_CONFIG.SPLIT.MAX_SPLITS) {
      // Return split information
      return {
        points: this.points,
        special: {
          type: 'split',
          count: 2,
          splitLevel: this.splitCount + 1,
          angles: [
            this.wheelAngle - TARGET_CONFIG.SPLIT.SPLIT_ANGLE,
            this.wheelAngle + TARGET_CONFIG.SPLIT.SPLIT_ANGLE
          ]
        }
      };
    }
    
    return { points: this.points };
  }
}

// Mystery Target
export class MysteryTarget extends Target {
  private questionMark!: THREE.Sprite;
  
  constructor(wheelRadius: number, angle: number) {
    super(TargetType.MYSTERY, wheelRadius, angle);
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.MYSTERY;
  }
  
  protected createMesh(): void {
    // Create box
    const geometry = new THREE.BoxGeometry(this.size, this.size, this.size);
    const material = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.MYSTERY.COLOR 
    });
    const box = new THREE.Mesh(geometry, material);
    box.castShadow = true;
    
    // Create question mark
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      color: 0xFFFFFF
    });
    this.questionMark = new THREE.Sprite(spriteMaterial) as THREE.Sprite;
    this.questionMark.scale.set(this.size * 2, this.size * 2, 1);
    
    this.mesh.add(box);
    this.mesh.add(this.questionMark);
  }
  
  protected updateSpecific(deltaTime: number, _elapsedTime: number): void {
    // Spin the box
    this.mesh.rotation.x += deltaTime * TARGET_CONFIG.MYSTERY.QUESTION_MARK_SPIN_SPEED;
    this.mesh.rotation.y += deltaTime * TARGET_CONFIG.MYSTERY.QUESTION_MARK_SPIN_SPEED * 1.3;
    
    // Keep question mark facing camera
    this.questionMark.rotation.z -= deltaTime * 2;
  }
  
  public onHit(): { points: number, special?: any } {
    this.deactivate();
    
    // Random reward!
    const rewards = [
      { points: 25, message: '|| 25 P01NTS! ||' },
      { points: 50, message: '|| 50 P01NTS! N1C3! ||' },
      { points: 100, message: '|| 100 P01NTS! J4CKP0T! ||' },
      { points: 10, powerUp: true, message: '|| P0W3R-UP DR0P! ||' },
      { points: 0, multiball: true, message: '|| MULT1-B4LL M0D3! ||' }
    ];
    
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    
    return {
      points: reward.points,
      special: {
        type: 'mystery',
        reward: reward
      }
    };
  }
}

// Ghost Target
export class GhostTarget extends Target {
  private phaseTime: number = 0;
  private isVisible: boolean = true;
  
  constructor(wheelRadius: number, angle: number) {
    super(TargetType.GHOST, wheelRadius, angle);
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.GHOST;
  }
  
  protected createMesh(): void {
    const geometry = new THREE.SphereGeometry(this.size, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.GHOST.COLOR,
      transparent: true,
      opacity: 0.7
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    
    // Add spooky eyes
    const eyeGeometry = new THREE.SphereGeometry(this.size * 0.1, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-this.size * 0.3, this.size * 0.2, this.size * 0.8);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(this.size * 0.3, this.size * 0.2, this.size * 0.8);
    
    this.mesh.add(sphere);
    this.mesh.add(leftEye);
    this.mesh.add(rightEye);
  }
  
  protected updateSpecific(deltaTime: number, elapsedTime: number): void {
    this.phaseTime += deltaTime * 1000;
    
    // Phase in and out
    if (this.phaseTime >= TARGET_CONFIG.GHOST.PHASE_DURATION) {
      this.phaseTime = 0;
      this.isVisible = !this.isVisible;
    }
    
    // Smooth fade
    const targetOpacity = this.isVisible ? 0.7 : 0.1;
    const currentOpacity = ((this.mesh.children[0] as THREE.Mesh).material as THREE.MeshLambertMaterial).opacity;
    const newOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, deltaTime * TARGET_CONFIG.GHOST.FADE_SPEED);
    
    this.mesh.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.Material && child.material.transparent) {
        child.material.opacity = newOpacity;
      }
    });
    
    // Spooky floating motion
    this.mesh.position.z = Math.sin(elapsedTime * 2) * 0.2;
  }
  
  public checkCollision(arrowPosition: THREE.Vector3): boolean {
    // Can only be hit when visible
    if (!this.isVisible) return false;
    return super.checkCollision(arrowPosition);
  }
}

// Magnetic Target
export class MagneticTarget extends Target {
  private magneticField!: THREE.Mesh;
  
  constructor(wheelRadius: number, angle: number) {
    super(TargetType.MAGNETIC, wheelRadius, angle);
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.MAGNETIC;
  }
  
  protected createMesh(): void {
    // Main target
    const geometry = new THREE.TorusGeometry(this.size, this.size * 0.3, 8, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.MAGNETIC.COLOR,
      emissive: TARGET_CONFIG.MAGNETIC.COLOR,
      emissiveIntensity: 0.2
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.castShadow = true;
    
    // Magnetic field visualization
    const fieldGeometry = new THREE.RingGeometry(
      this.size * 0.5,
      TARGET_CONFIG.MAGNETIC.MAGNETIC_RANGE,
      32,
      1
    );
    const fieldMaterial = new THREE.MeshBasicMaterial({ 
      color: TARGET_CONFIG.MAGNETIC.ELECTRIC_ARC_COLOR,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    this.magneticField = new THREE.Mesh(fieldGeometry, fieldMaterial);
    
    this.mesh.add(torus);
    this.mesh.add(this.magneticField);
  }
  
  protected updateSpecific(deltaTime: number, elapsedTime: number): void {
    // Rotate magnetic field
    this.magneticField.rotation.z += deltaTime * 2;
    
    // Pulse magnetic field
    const scale = 1 + Math.sin(elapsedTime * 4) * 0.1;
    this.magneticField.scale.setScalar(scale);
    
    // Electric arc effect
    (this.magneticField.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.random() * 0.1;
  }
  
  public getMagneticForce(arrowPosition: THREE.Vector3): THREE.Vector3 | null {
    if (!this.isActive) return null;
    
    const targetWorldPos = new THREE.Vector3();
    this.mesh.getWorldPosition(targetWorldPos);
    const distance = arrowPosition.distanceTo(targetWorldPos);
    
    if (distance < TARGET_CONFIG.MAGNETIC.MAGNETIC_RANGE && distance > this.size) {
      // Calculate magnetic force
      const force = new THREE.Vector3()
        .subVectors(targetWorldPos, arrowPosition)
        .normalize()
        .multiplyScalar(TARGET_CONFIG.MAGNETIC.MAGNETIC_FORCE * (1 - distance / TARGET_CONFIG.MAGNETIC.MAGNETIC_RANGE));
      
      return force;
    }
    
    return null;
  }
}

// Explosive Target
export class ExplosiveTarget extends Target {
  private fuseParticles!: THREE.Points;
  
  constructor(wheelRadius: number, angle: number) {
    super(TargetType.EXPLOSIVE, wheelRadius, angle);
    this.createMesh();
  }
  
  protected getConfig() {
    return TARGET_CONFIG.EXPLOSIVE;
  }
  
  protected createMesh(): void {
    // Bomb shape
    const bodyGeometry = new THREE.SphereGeometry(this.size, 16, 16);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: TARGET_CONFIG.EXPLOSIVE.COLOR 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    
    // Fuse
    const fuseGeometry = new THREE.CylinderGeometry(this.size * 0.1, this.size * 0.1, this.size * 0.5, 8);
    const fuseMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const fuse = new THREE.Mesh(fuseGeometry, fuseMaterial);
    fuse.position.y = this.size + this.size * 0.25;
    
    // Fuse sparks
    const sparkGeometry = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(3 * 3);
    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    
    const sparkMaterial = new THREE.PointsMaterial({
      color: 0xFFFF00,
      size: 0.1,
      blending: THREE.AdditiveBlending
    });
    
    this.fuseParticles = new THREE.Points(sparkGeometry, sparkMaterial);
    this.fuseParticles.position.y = this.size + this.size * 0.5;
    
    this.mesh.add(body);
    this.mesh.add(fuse);
    this.mesh.add(this.fuseParticles);
  }
  
  protected updateSpecific(_deltaTime: number, elapsedTime: number): void {
    // Update fuse sparks
    const positions = this.fuseParticles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < 3; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = Math.random() * 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    this.fuseParticles.geometry.attributes.position.needsUpdate = true;
    
    // Warning pulse
    const pulse = Math.sin(elapsedTime * 10) * 0.5 + 0.5;
    if (this.mesh.children[0] instanceof THREE.Mesh) {
      (this.mesh.children[0].material as THREE.MeshLambertMaterial).emissive = new THREE.Color(0xFF0000);
      (this.mesh.children[0].material as THREE.MeshLambertMaterial).emissiveIntensity = pulse * 0.3;
    }
  }
  
  public onHit(): { points: number, special?: any } {
    this.deactivate();
    
    return {
      points: this.points,
      special: {
        type: 'explosive',
        explosionRadius: TARGET_CONFIG.EXPLOSIVE.EXPLOSION_RADIUS,
        chainChance: TARGET_CONFIG.EXPLOSIVE.CHAIN_EXPLOSION_CHANCE
      }
    };
  }
}