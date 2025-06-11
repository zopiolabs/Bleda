import * as THREE from 'three';
import { PowerUpType, POWERUP_CONFIG } from './constants';

export interface PowerUpEffect {
  type: PowerUpType;
  startTime: number;
  duration: number;
}

export class PowerUp {
  public mesh: THREE.Group;
  public type: PowerUpType;
  public position: THREE.Vector3;
  public isActive: boolean = true;
  private floatOffset: number;
  
  constructor(type: PowerUpType, position: THREE.Vector3) {
    this.type = type;
    this.position = position.clone();
    this.floatOffset = Math.random() * Math.PI * 2;
    this.mesh = this.createMesh();
    this.mesh.position.copy(position);
  }
  
  private createMesh(): THREE.Group {
    const group = new THREE.Group();
    const config = this.getPowerUpConfig();
    
    // Create outer rotating cube
    const outerGeometry = new THREE.BoxGeometry(POWERUP_CONFIG.SIZE, POWERUP_CONFIG.SIZE, POWERUP_CONFIG.SIZE);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: config.COLOR,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const outerCube = new THREE.Mesh(outerGeometry, outerMaterial);
    group.add(outerCube);
    
    // Create inner glowing sphere
    const innerGeometry = new THREE.SphereGeometry(POWERUP_CONFIG.SIZE * 0.6, 16, 16);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: config.COLOR
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    group.add(innerSphere);
    
    // Add point light for glow effect
    const light = new THREE.PointLight(config.COLOR, 1, 10);
    light.position.set(0, 0, 0);
    group.add(light);
    
    return group;
  }
  
  private getPowerUpConfig() {
    switch (this.type) {
      case PowerUpType.RAPID_FIRE:
        return POWERUP_CONFIG.RAPID_FIRE;
      case PowerUpType.EXPLOSIVE_ARROWS:
        return POWERUP_CONFIG.EXPLOSIVE_ARROWS;
      case PowerUpType.SCORE_MULTIPLIER:
        return POWERUP_CONFIG.SCORE_MULTIPLIER;
    }
  }
  
  public update(deltaTime: number, elapsedTime: number): void {
    if (!this.isActive) return;
    
    // Rotate the power-up
    this.mesh.rotation.y += POWERUP_CONFIG.ROTATION_SPEED * deltaTime;
    this.mesh.rotation.x += POWERUP_CONFIG.ROTATION_SPEED * 0.5 * deltaTime;
    
    // Float up and down
    const floatY = Math.sin(elapsedTime * POWERUP_CONFIG.FLOAT_SPEED + this.floatOffset) * POWERUP_CONFIG.FLOAT_AMPLITUDE;
    this.mesh.position.y = this.position.y + floatY;
  }
  
  public checkCollision(playerPosition: THREE.Vector3): boolean {
    if (!this.isActive) return false;
    
    const distance = this.mesh.position.distanceTo(playerPosition);
    return distance < POWERUP_CONFIG.PICKUP_RADIUS;
  }
  
  public deactivate(): void {
    this.isActive = false;
    this.mesh.visible = false;
  }
  
  public dispose(): void {
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