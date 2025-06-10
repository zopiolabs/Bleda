import * as THREE from 'three';
import { COLORS, GAME_CONFIG } from './constants';
import { UIManager } from './ui-manager';

interface Arrow {
  mesh: THREE.Group | THREE.Mesh;
  velocity: THREE.Vector3;
  active: boolean;
}

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  
  // Game objects
  private bleda!: THREE.Group;
  private wheel!: THREE.Group;
  private ball!: THREE.Mesh;
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
    
    // Ball - smaller
    const ballGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    this.ball = this.createMesh(ballGeometry, COLORS.BALL, {
      position: { x: GAME_CONFIG.WHEEL_RADIUS - 0.5 },
      castShadow: true
    });
    
    this.wheel.add(wheelMesh);
    this.wheel.add(this.ball);
    this.wheel.position.set(0, GAME_CONFIG.WHEEL_RADIUS + 2, -15);
    // No rotation needed - wheel is already vertical
    
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
    // Increment shots fired
    this.uiManager.incrementShotsFired();
    
    // Find an inactive arrow or create a new one
    let arrow = this.arrows.find(a => !a.active);
    if (!arrow) {
      arrow = this.createArrow();
      this.arrows.push(arrow);
      this.scene.add(arrow.mesh);
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
    // Get ball world position
    const ballWorldPos = new THREE.Vector3();
    this.ball.getWorldPosition(ballWorldPos);
    
    // Check each active arrow
    this.arrows.forEach(arrow => {
      if (!arrow.active) return;
      
      const distance = arrow.mesh.position.distanceTo(ballWorldPos);
      if (distance < 1.0) { // Smaller hit radius for smaller ball
        // Hit!
        arrow.active = false;
        arrow.mesh.position.y = -100; // Hide arrow
        
        this.score++;
        this.wheelSpeed *= 1.2; // Increase wheel speed
        this.uiManager.updateScore(this.score);
        this.uiManager.incrementShotsHit(); // This also shows congrats message
        
        // Flash effect
        const ballMaterial = this.ball.material as THREE.MeshLambertMaterial;
        const originalColor = ballMaterial.color.getHex();
        ballMaterial.color.setHex(0xFFFF00);
        setTimeout(() => {
          ballMaterial.color.setHex(originalColor);
        }, 200);
      }
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
  
  private createUI(): void {
    // Score and controls
    const uiContainer = this.createUIContainer({
      top: '10px',
      left: '10px',
      color: 'white',
      fontFamily: 'Arial',
      fontSize: '20px',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    });
    uiContainer.innerHTML = `
      <div id="score">Score: 0</div>
      <div style="margin-top: 20px; font-size: 14px;">
        <div>Controls:</div>
        <div>A/D: Move left/right</div>
        <div>Move mouse: Aim</div>
        <div>Click: Shoot</div>
      </div>
    `;
    document.body.appendChild(uiContainer);
    
    // Create K/D ratio display with roasts
    const kdContainer = this.createUIContainer({
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '400px',
      background: UI_STYLES.DANGER_BG,
      border: '2px solid #ff0000',
      borderRadius: '0',
      boxShadow: '0 0 30px rgba(255,0,0,0.5), inset 0 0 30px rgba(255,0,0,0.2)',
      padding: '15px',
      textAlign: 'center'
    });
    
    kdContainer.innerHTML = `
      <div style="color: #ff0000; font-size: 14px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 10px;">
        [[ K/D R4T10 ]]
      </div>
      <div style="display: flex; justify-content: space-around; margin-bottom: 10px;">
        <div style="flex: 1;">
          <div style="color: #ff6600; font-size: 11px; text-transform: uppercase;">SH0TS F1R3D</div>
          <div id="shots-fired" style="font-size: 28px; color: #ff6600; text-shadow: 0 0 10px #ff6600; font-weight: bold;">0</div>
        </div>
        <div style="flex: 1;">
          <div style="color: #00ff00; font-size: 11px; text-transform: uppercase;">H1TS</div>
          <div id="shots-hit" style="font-size: 28px; color: #00ff00; text-shadow: 0 0 10px #00ff00; font-weight: bold;">0</div>
        </div>
        <div style="flex: 1;">
          <div style="color: #ffff00; font-size: 11px; text-transform: uppercase;">4CCUR4CY</div>
          <div id="accuracy" style="font-size: 28px; color: #ffff00; text-shadow: 0 0 10px #ffff00; font-weight: bold;">0%</div>
        </div>
      </div>
      <div id="roast-message" style="color: #ff0000; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px; text-shadow: 0 0 15px #ff0000, 0 0 30px #ff0000; min-height: 30px;">
        || W41T1NG 4 U 2 M1SS ||
      </div>
    `;
    
    document.body.appendChild(kdContainer);
    
    // Add all CSS animations
    this.injectCSS();
    
    // Create l33t RPM indicator
    const rpmContainer = this.createUIContainer({
      top: '10px',
      right: '10px',
      width: '250px',
      height: '150px',
      background: UI_STYLES.CONTAINER_BG,
      border: '2px solid #00ff00',
      borderRadius: '10px',
      boxShadow: '0 0 20px rgba(0,255,0,0.5), inset 0 0 20px rgba(0,255,0,0.2)',
      padding: '15px'
    });
    
    rpmContainer.innerHTML = `
      <div style="color: #00ff00; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
        [[ WHEEL RPM ]]
      </div>
      <div id="rpm-display" style="font-size: 48px; color: #00ff00; text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00; font-weight: bold; text-align: center;">
        0000
      </div>
      <div style="margin-top: 10px;">
        <div style="background: #111; height: 10px; border-radius: 5px; overflow: hidden; border: 1px solid #00ff00;">
          <div id="rpm-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #00ff00 0%, #ffff00 50%, #ff0000 100%); transition: width 0.1s ease-out; box-shadow: 0 0 10px currentColor;"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 10px; color: #00ff00;">
        <span>0</span>
        <span style="color: #ffff00;">25</span>
        <span style="color: #ff0000;">50</span>
      </div>
    `;
    
    document.body.appendChild(rpmContainer);
    
    // Add warning text element
    const warningText = this.createUIContainer({
      top: '170px',
      right: '10px',
      width: '250px',
      textAlign: 'center',
      color: '#ff0000',
      fontSize: '14px',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      display: 'none',
      textShadow: '0 0 10px #ff0000'
    }, 'rpm-warning');
    warningText.innerHTML = '⚠️ DANGER ZONE ⚠️';
    document.body.appendChild(warningText);
    
    // Create l33t congratulatory message container
    const congratsContainer = this.createUIContainer({
      top: '30%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(0.5) rotate(-5deg)',
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#00ff00',
      textShadow: UI_STYLES.L33T_TEXT_SHADOW,
      letterSpacing: '8px',
      textAlign: 'center',
      opacity: '0',
      transition: 'none',
      zIndex: '1000',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%)',
      padding: '20px 40px',
      border: '3px solid #00ff00',
      borderRadius: '0',
      boxShadow: UI_STYLES.GLITCH_BOX_SHADOW('#00ff00'),
      textTransform: 'uppercase',
      whiteSpace: 'nowrap'
    }, 'congrats-container');
    congratsContainer.innerHTML = '<span class="congrats-text"></span>';
    document.body.appendChild(congratsContainer);
  }
  
  private updateScore(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `Score: ${this.score}`;
    }
  }
  
  private updateKDDisplay(): void {
    // Update shots fired
    const shotsFiredElement = document.getElementById('shots-fired');
    if (shotsFiredElement) {
      shotsFiredElement.textContent = this.shotsFired.toString();
    }
    
    // Update shots hit
    const shotsHitElement = document.getElementById('shots-hit');
    if (shotsHitElement) {
      shotsHitElement.textContent = this.shotsHit.toString();
    }
    
    // Calculate and update accuracy
    const accuracy = this.shotsFired > 0 ? (this.shotsHit / this.shotsFired) * 100 : 0;
    const accuracyElement = document.getElementById('accuracy');
    if (accuracyElement) {
      accuracyElement.textContent = `${accuracy.toFixed(1)}%`;
      
      // Color code accuracy
      if (accuracy >= 80) {
        accuracyElement.style.color = '#00ff00';
        accuracyElement.style.textShadow = '0 0 10px #00ff00';
      } else if (accuracy >= 60) {
        accuracyElement.style.color = '#88ff00';
        accuracyElement.style.textShadow = '0 0 10px #88ff00';
      } else if (accuracy >= 40) {
        accuracyElement.style.color = '#ffff00';
        accuracyElement.style.textShadow = '0 0 10px #ffff00';
      } else if (accuracy >= 20) {
        accuracyElement.style.color = '#ff8800';
        accuracyElement.style.textShadow = '0 0 10px #ff8800';
      } else {
        accuracyElement.style.color = '#ff0000';
        accuracyElement.style.textShadow = '0 0 10px #ff0000';
      }
    }
    
    // Update roast message based on accuracy and shots fired
    const roastElement = document.getElementById('roast-message');
    if (roastElement && this.shotsFired >= GAME_CONFIG.MIN_SHOTS_FOR_ROAST) { // Start roasting after 3 shots
      let roastMessage = '';
      
      if (accuracy < 20) {
        // Brutal roasts for terrible accuracy
        roastMessage = this.getRandomElement(this.roastMessages.slice(0, 20));
      } else if (accuracy < 40) {
        // Medium roasts
        roastMessage = this.getRandomElement(this.roastMessages.slice(20, 35));
      } else if (accuracy < 60) {
        // Light roasts
        roastMessage = this.getRandomElement(this.roastMessages.slice(35, 45));
      } else if (accuracy < 80) {
        // Mild taunts
        roastMessage = this.getRandomElement(this.roastMessages.slice(45, 50));
      } else {
        // Still roast them even if they're good
        roastMessage = '|| 2 E-Z 4 U? ||';
      }
      
      // Apply roast with animation
      roastElement.textContent = roastMessage;
      roastElement.classList.remove('new-roast');
      // Force reflow
      roastElement.offsetHeight;
      roastElement.classList.add('new-roast');
      
      // Remove animation class after it completes
      setTimeout(() => {
        roastElement.classList.remove('new-roast');
      }, 1000);
    }
  }
  
  private showCongratsMessage(): void {
    const congratsContainer = document.getElementById('congrats-container');
    if (!congratsContainer) return;
    
    const textElement = congratsContainer.querySelector('.congrats-text') as HTMLElement;
    if (!textElement) return;
    
    // Pick a random l33t message
    const randomMessage = this.getRandomElement(this.l33tMessages);
    textElement.textContent = randomMessage;
    
    // Random color scheme for retro feel
    const colorSchemes = [
      { main: '#00ff00', border: '#00ff00' }, // Classic green
      { main: '#00ffff', border: '#00ffff' }, // Cyan
      { main: '#ff00ff', border: '#ff00ff' }, // Magenta
      { main: '#ffff00', border: '#ffff00' }, // Yellow
      { main: '#ff8800', border: '#ff8800' }  // Orange
    ];
    const scheme = this.getRandomElement(colorSchemes);
    textElement.style.color = scheme.main;
    congratsContainer.style.borderColor = scheme.border;
    congratsContainer.style.boxShadow = `
      inset 0 0 50px ${scheme.main}33,
      0 0 30px ${scheme.main}80,
      0 0 60px ${scheme.main}4D
    `;
    
    // Show with animation
    congratsContainer.style.transition = 'none';
    congratsContainer.style.opacity = '0';
    congratsContainer.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(-5deg)';
    congratsContainer.classList.remove('show');
    
    // Force reflow
    congratsContainer.offsetHeight;
    
    // Animate in with retro effect
    congratsContainer.style.transition = 'all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    congratsContainer.style.opacity = '1';
    congratsContainer.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
    congratsContainer.classList.add('show');
    
    // Add screen shake effect
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.animation = 'screenShake 0.3s ease-in-out';
      setTimeout(() => {
        gameContainer.style.animation = '';
      }, 300);
    }
    
    // Hide after delay with glitch out effect
    setTimeout(() => {
      congratsContainer.style.transition = 'all 0.15s ease-in';
      congratsContainer.style.opacity = '0';
      congratsContainer.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(10deg)';
      congratsContainer.style.filter = 'blur(5px)';
      congratsContainer.classList.remove('show');
      
      // Reset filter for next time
      setTimeout(() => {
        congratsContainer.style.filter = '';
      }, 200);
    }, 1200);
  }
  
  private updateRPM(): void {
    // Calculate RPM from wheel speed (radians per second to RPM)
    // wheelSpeed is in rad/s, convert to rotations/minute: (rad/s) * (60s/min) / (2π rad/rotation)
    const actualRPM = Math.abs(this.wheelSpeed * 60 / (2 * Math.PI));
    // Display RPM rounded to nearest integer
    const displayRPM = Math.round(actualRPM);
    
    // Update RPM display
    const rpmDisplay = document.getElementById('rpm-display');
    if (rpmDisplay) {
      // Pad with zeros for l33t look
      rpmDisplay.textContent = displayRPM.toString().padStart(4, '0');
      
      // Change color based on RPM
      if (displayRPM < 10) {
        rpmDisplay.style.color = '#00ff00';
        rpmDisplay.style.textShadow = '0 0 10px #00ff00, 0 0 20px #00ff00';
        rpmDisplay.classList.remove('danger');
      } else if (displayRPM < 20) {
        rpmDisplay.style.color = '#ffff00';
        rpmDisplay.style.textShadow = '0 0 10px #ffff00, 0 0 20px #ffff00';
        rpmDisplay.classList.remove('danger');
      } else {
        rpmDisplay.style.color = '#ff0000';
        rpmDisplay.style.textShadow = '0 0 10px #ff0000, 0 0 20px #ff0000';
        rpmDisplay.classList.add('danger');
      }
      
      // Update animation speed
      rpmDisplay.style.animationDuration = displayRPM > 20 ? '0.2s' : '0.5s';
      
      // Show/hide warning text
      const warningText = document.getElementById('rpm-warning');
      if (warningText) {
        warningText.style.display = displayRPM > 30 ? 'block' : 'none';
        if (displayRPM > 30) {
          warningText.style.animation = 'pulse 0.3s ease-in-out infinite';
        }
      }
    }
    
    // Update RPM bar
    const rpmBar = document.getElementById('rpm-bar');
    if (rpmBar) {
      const percentage = Math.min(displayRPM / 50 * 100, 100);
      rpmBar.style.width = percentage + '%';
    }
  }
  
  public animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // Update Bleda movement
    if (this.keys.left) {
      this.bledaVelocity.x = -GAME_CONFIG.BLEDA_SPEED;
    } else if (this.keys.right) {
      this.bledaVelocity.x = GAME_CONFIG.BLEDA_SPEED;
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
  }
}