import * as THREE from 'three';
import { ObstacleType, OBSTACLE_CONFIG } from './constants';

export abstract class Obstacle {
  public mesh: THREE.Group;
  public type: ObstacleType;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public isActive: boolean = true;
  protected collisionRadius: number;
  
  constructor(type: ObstacleType, position: THREE.Vector3) {
    this.type = type;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.collisionRadius = OBSTACLE_CONFIG.COLLISION_RADIUS;
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
  }
  
  public abstract update(deltaTime: number, playerPosition: THREE.Vector3): void;
  
  public checkCollision(playerPosition: THREE.Vector3): boolean {
    if (!this.isActive) return false;
    
    const distance = this.mesh.position.distanceTo(playerPosition);
    return distance < this.collisionRadius;
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
  
  public getWarningDistance(playerPosition: THREE.Vector3): number {
    return this.mesh.position.distanceTo(playerPosition);
  }
}

export class FlyingRock extends Obstacle {
  private rotationSpeed: THREE.Vector3;
  
  constructor(position: THREE.Vector3, targetDirection: THREE.Vector3) {
    super(ObstacleType.FLYING_ROCK, position);
    
    // Set velocity towards target with some variance
    const variance = (Math.random() - 0.5) * OBSTACLE_CONFIG.FLYING_ROCK.TRAJECTORY_VARIANCE;
    this.velocity = targetDirection.clone()
      .normalize()
      .multiplyScalar(OBSTACLE_CONFIG.FLYING_ROCK.SPEED);
    this.velocity.x += variance * OBSTACLE_CONFIG.FLYING_ROCK.SPEED;
    this.velocity.z += variance * OBSTACLE_CONFIG.FLYING_ROCK.SPEED;
    
    // Random rotation
    this.rotationSpeed = new THREE.Vector3(
      Math.random() * OBSTACLE_CONFIG.FLYING_ROCK.ROTATION_SPEED,
      Math.random() * OBSTACLE_CONFIG.FLYING_ROCK.ROTATION_SPEED,
      Math.random() * OBSTACLE_CONFIG.FLYING_ROCK.ROTATION_SPEED
    );
    
    this.createMesh();
  }
  
  private createMesh(): void {
    // Create jagged rock geometry
    const geometry = new THREE.DodecahedronGeometry(OBSTACLE_CONFIG.FLYING_ROCK.SIZE, 0);
    
    // Deform vertices for more natural rock look
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      const offset = 0.1 + Math.random() * 0.2;
      vertex.multiplyScalar(offset + 0.8);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshLambertMaterial({ 
      color: OBSTACLE_CONFIG.FLYING_ROCK.COLOR 
    });
    const rock = new THREE.Mesh(geometry, material);
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    this.mesh.add(rock);
  }
  
  public update(deltaTime: number): void {
    if (!this.isActive) return;
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Apply gravity
    this.velocity.y -= 9.8 * deltaTime;
    
    // Rotate
    this.mesh.rotation.x += this.rotationSpeed.x * deltaTime;
    this.mesh.rotation.y += this.rotationSpeed.y * deltaTime;
    this.mesh.rotation.z += this.rotationSpeed.z * deltaTime;
    
    // Deactivate if out of bounds
    if (this.mesh.position.y < -5 || this.mesh.position.distanceTo(new THREE.Vector3()) > 100) {
      this.deactivate();
    }
  }
}

export class Tree extends Obstacle {
  constructor(position: THREE.Vector3) {
    super(ObstacleType.TREE, position);
    this.collisionRadius = OBSTACLE_CONFIG.TREE.TRUNK_RADIUS + 0.5;
    this.createMesh();
  }
  
  private createMesh(): void {
    // Create trunk
    const trunkGeometry = new THREE.CylinderGeometry(
      OBSTACLE_CONFIG.TREE.TRUNK_RADIUS,
      OBSTACLE_CONFIG.TREE.TRUNK_RADIUS * 1.2,
      OBSTACLE_CONFIG.TREE.TRUNK_HEIGHT,
      8
    );
    const trunkMaterial = new THREE.MeshLambertMaterial({ 
      color: OBSTACLE_CONFIG.TREE.COLOR_TRUNK 
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = OBSTACLE_CONFIG.TREE.TRUNK_HEIGHT / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    
    // Create foliage (multiple spheres for fuller look)
    const foliageGroup = new THREE.Group();
    const foliagePositions = [
      { x: 0, y: 0, z: 0, scale: 1 },
      { x: 0.5, y: 0.3, z: 0, scale: 0.8 },
      { x: -0.5, y: 0.3, z: 0, scale: 0.8 },
      { x: 0, y: 0.3, z: 0.5, scale: 0.8 },
      { x: 0, y: 0.3, z: -0.5, scale: 0.8 },
      { x: 0, y: 0.8, z: 0, scale: 0.6 }
    ];
    
    foliagePositions.forEach(pos => {
      const foliageGeometry = new THREE.SphereGeometry(
        OBSTACLE_CONFIG.TREE.FOLIAGE_RADIUS * pos.scale,
        8,
        6
      );
      const foliageMaterial = new THREE.MeshLambertMaterial({ 
        color: OBSTACLE_CONFIG.TREE.COLOR_FOLIAGE 
      });
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(pos.x, pos.y, pos.z);
      foliage.castShadow = true;
      foliage.receiveShadow = true;
      foliageGroup.add(foliage);
    });
    
    foliageGroup.position.y = OBSTACLE_CONFIG.TREE.TRUNK_HEIGHT;
    
    this.mesh.add(trunk);
    this.mesh.add(foliageGroup);
  }
  
  public update(_deltaTime: number): void {
    // Trees are static, no update needed
  }
}

export class Bird extends Obstacle {
  private waveOffset: number;
  private baseY: number;
  private wingAnimation: number = 0;
  
  constructor(position: THREE.Vector3, direction: THREE.Vector3) {
    super(ObstacleType.BIRD, position);
    this.collisionRadius = OBSTACLE_CONFIG.BIRD.SIZE;
    this.baseY = position.y;
    this.waveOffset = Math.random() * Math.PI * 2;
    
    // Set horizontal velocity
    this.velocity = direction.clone()
      .normalize()
      .multiplyScalar(OBSTACLE_CONFIG.BIRD.SPEED);
    this.velocity.y = 0; // Birds maintain altitude
    
    this.createMesh();
    
    // Face direction of travel
    this.mesh.lookAt(
      position.x + this.velocity.x,
      position.y,
      position.z + this.velocity.z
    );
  }
  
  private createMesh(): void {
    // Bird body
    const bodyGeometry = new THREE.ConeGeometry(
      OBSTACLE_CONFIG.BIRD.SIZE * 0.4,
      OBSTACLE_CONFIG.BIRD.SIZE,
      6
    );
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: OBSTACLE_CONFIG.BIRD.COLOR_BODY 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(
      OBSTACLE_CONFIG.BIRD.SIZE * 2,
      0.1,
      OBSTACLE_CONFIG.BIRD.SIZE * 0.5
    );
    const wingMaterial = new THREE.MeshLambertMaterial({ 
      color: OBSTACLE_CONFIG.BIRD.COLOR_WING 
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.z = OBSTACLE_CONFIG.BIRD.SIZE * 0.25;
    leftWing.castShadow = true;
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.z = -OBSTACLE_CONFIG.BIRD.SIZE * 0.25;
    rightWing.castShadow = true;
    
    // Group wings for animation
    const wingsGroup = new THREE.Group();
    wingsGroup.add(leftWing);
    wingsGroup.add(rightWing);
    wingsGroup.name = 'wings';
    
    this.mesh.add(body);
    this.mesh.add(wingsGroup);
  }
  
  public update(deltaTime: number, _playerPosition: THREE.Vector3): void {
    if (!this.isActive) return;
    
    const elapsedTime = Date.now() / 1000;
    
    // Update position
    this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Wave motion
    const waveY = Math.sin(elapsedTime * OBSTACLE_CONFIG.BIRD.WAVE_FREQUENCY + this.waveOffset) 
      * OBSTACLE_CONFIG.BIRD.WAVE_AMPLITUDE;
    this.mesh.position.y = this.baseY + waveY;
    
    // Wing flapping animation
    this.wingAnimation += deltaTime * 8;
    const wings = this.mesh.getObjectByName('wings');
    if (wings) {
      wings.children.forEach((wing, index) => {
        const direction = index === 0 ? 1 : -1;
        wing.rotation.z = Math.sin(this.wingAnimation) * 0.5 * direction;
      });
    }
    
    // Deactivate if too far from origin
    if (this.mesh.position.distanceTo(new THREE.Vector3()) > 100) {
      this.deactivate();
    }
  }
}