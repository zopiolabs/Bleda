import * as THREE from 'three';

interface Arrow {
  mesh: THREE.Mesh;
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
  private bow!: THREE.Mesh;
  
  // Game state
  private mousePosition = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();
  private wheelSpeed = 0.5;
  private score = 0;
  private bledaPosition = { x: 0, z: 15 };
  private bledaVelocity = { x: 0 };
  
  // Controls
  private keys = {
    left: false,
    right: false
  };
  
  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
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
    this.createUI();
  }
  
  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    this.scene.add(directionalLight);
  }
  
  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5f3a });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }
  
  private createBleda(): void {
    this.bleda = new THREE.Group();
    
    // Horse body (simplified)
    const horseBodyGeometry = new THREE.BoxGeometry(3, 2, 1.5);
    const horseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const horseBody = new THREE.Mesh(horseBodyGeometry, horseMaterial);
    horseBody.castShadow = true;
    
    // Horse head
    const horseHeadGeometry = new THREE.BoxGeometry(1, 1, 1);
    const horseHead = new THREE.Mesh(horseHeadGeometry, horseMaterial);
    horseHead.position.set(1.5, 0.5, 0);
    horseHead.castShadow = true;
    
    // Rider (simplified)
    const riderGeometry = new THREE.CapsuleGeometry(0.4, 1.5, 4, 8);
    const riderMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    const rider = new THREE.Mesh(riderGeometry, riderMaterial);
    rider.position.set(-0.5, 2, 0);
    rider.castShadow = true;
    
    // Bow
    const bowGeometry = new THREE.TorusGeometry(1.5, 0.1, 4, 8, Math.PI);
    const bowMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    this.bow = new THREE.Mesh(bowGeometry, bowMaterial);
    this.bow.position.set(-0.5, 2.5, 0);
    this.bow.rotation.z = -Math.PI / 2;
    
    this.bleda.add(horseBody);
    this.bleda.add(horseHead);
    this.bleda.add(rider);
    this.bleda.add(this.bow);
    
    // Position Bleda
    this.bleda.position.set(this.bledaPosition.x, 1, this.bledaPosition.z);
    this.scene.add(this.bleda);
  }
  
  private createWheel(): void {
    this.wheel = new THREE.Group();
    
    // Wheel structure - larger and vertical
    const wheelRadius = 8;
    const wheelGeometry = new THREE.TorusGeometry(wheelRadius, 0.4, 8, 30);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelMesh.castShadow = true;
    
    // Wheel spokes
    for (let i = 0; i < 8; i++) {
      const spokeGeometry = new THREE.BoxGeometry(0.3, wheelRadius * 2, 0.3);
      const spoke = new THREE.Mesh(spokeGeometry, wheelMaterial);
      spoke.rotation.z = (i * Math.PI) / 4;
      spoke.castShadow = true;
      this.wheel.add(spoke);
    }
    
    // Ball - smaller
    const ballGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const ballMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
    this.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    this.ball.position.set(wheelRadius - 0.5, 0, 0);
    this.ball.castShadow = true;
    
    this.wheel.add(wheelMesh);
    this.wheel.add(this.ball);
    this.wheel.position.set(0, wheelRadius + 2, -15);
    // No rotation needed - wheel is already vertical
    
    this.scene.add(this.wheel);
  }
  
  private createArrow(): Arrow {
    const arrowGeometry = new THREE.BoxGeometry(2.5, 0.1, 0.1);
    const arrowMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.castShadow = true;
    
    return {
      mesh: arrow,
      velocity: new THREE.Vector3(),
      active: false
    };
  }
  
  private shoot(): void {
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
    const speed = 35;
    arrow.velocity.copy(direction).multiplyScalar(speed);
    
    // Orient arrow to face direction
    arrow.mesh.lookAt(targetPoint);
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
        this.updateScore();
        
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
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '10px';
    uiContainer.style.left = '10px';
    uiContainer.style.color = 'white';
    uiContainer.style.fontFamily = 'Arial';
    uiContainer.style.fontSize = '20px';
    uiContainer.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    uiContainer.style.pointerEvents = 'none';
    
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
  }
  
  private updateScore(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `Score: ${this.score}`;
    }
  }
  
  public animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // Update Bleda movement
    if (this.keys.left) {
      this.bledaVelocity.x = -10;
    } else if (this.keys.right) {
      this.bledaVelocity.x = 10;
    } else {
      this.bledaVelocity.x *= 0.8; // Friction
    }
    
    // Update Bleda position
    this.bledaPosition.x += this.bledaVelocity.x * deltaTime;
    this.bledaPosition.x = Math.max(-15, Math.min(15, this.bledaPosition.x)); // Keep within bounds
    this.bleda.position.x = this.bledaPosition.x;
    
    // Rotate wheel around Z-axis (like a ferris wheel or wheel of fortune)
    this.wheel.rotation.z += this.wheelSpeed * deltaTime;
    
    // Update arrows
    this.arrows.forEach(arrow => {
      if (arrow.active) {
        arrow.mesh.position.add(arrow.velocity.clone().multiplyScalar(deltaTime));
        
        // Add slight gravity to arrows for realism
        arrow.velocity.y -= 10 * deltaTime;
        
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