import * as THREE from 'three';

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
  
  // L33t messages
  private l33tMessages = [
    '|| H34DSH0T ||',
    '>> N0SC0P3D <<',
    '[[ ULT1M4T3 ]]',
    '** FL4WL3SS **',
    '~~ P3RF3CT10N ~~',
    '## M4ST3RFU1 ##',
    '++ G0DL1K3 ++',
    ':: 3P1C W1N ::',
    '<< L3G3ND4RY >>',
    '|| D0M1N4T3D ||',
    '-- UNST0PP4BL3 --',
    '** 3L1T3 SN1P3R **',
    '~~ M4X SK1LLZ ~~',
    '>> PWN3D 1T <<',
    '[[ H4X0R3D ]]',
    ':: N1NJ4 M0D3 ::',
    '++ SUP3R C0MB0 ++',
    '## 0V3RK1LL ##',
    '<< M3G4 STR1K3 >>',
    '|| PR0 G4M3R ||',
    '== B00M SH0T ==',
    '>> 360 N0 SC0P3 <<',
    '[[ CR1T1C4L H1T ]]',
    '~~ W1CK3D S1CK ~~',
    '** B34ST M0D3 **',
    '++ M0NST3R K1LL ++',
    ':: FR4G M4ST3R ::',
    '|| 1337 SK1LLZ ||',
    '<< T0T4L PWN4G3 >>',
    '## H34VY H1TT3R ##',
    '-- K1LLT4CUL4R --',
    '** R4MP4G3 **',
    '~~ S4V4G3 ~~',
    '[[ D34DLY 4CC ||',
    '>> F4T4L1TY <<',
    '++ H0LY SM0K3S ++',
    ':: R3KT ::',
    '|| N0 M3RCY ||',
    '<< 1NST4 K1LL >>',
    '## C4RN4G3 ##',
    '== D3V4ST4T3D ==',
    '** K1LL C0NF1RM3D **',
    '~~ 3XPL0S1V3 ~~',
    '[[ M4X1MUM P41N ]]',
    '>> T3RM1N4T3D <<',
    '++ D3M0L1SH3D ++',
    ':: 4NN1H1L4T3D ::',
    '|| SN1P3 G0D ||',
    '<< CH40S M0D3 >>',
    '## V1CT0RY ##',
    '-- 3L1M1N4T3D --',
    '** W4ST3D **',
    '~~ F1N1SH H1M ~~',
    '[[ G4M3 0V3R ]]',
    '>> Y0U W1N <<',
    '++ 3P1C F41L ++',
    ':: N00B SL4Y3R ::',
    '|| H4CK TH3 PL4N3T ||',
    '<< CYB3R W4RR10R >>',
    '## QU4D K1LL ##',
    '== P3NT4 K1LL ==',
    '** H3X4 K1LL **',
    '~~ M3G4 C0MB0 ~~',
    '[[ UNST0PP4BL3 ]]',
    '>> R4G3 QU1T <<',
    '++ TRY H4RD3R ++',
    ':: G1T GUD ::',
    '|| 2 3Z 4 U ||',
    '<< N1C3 TRY K1D >>',
    '## R3SP4WN L0L ##',
    '-- G1T R3KT --',
    '** U M4D BR0? **',
    '~~ C4NT T0UCH TH1S ~~',
    '[[ 1M 1N UR B4S3 ]]',
    '>> K1LL1N UR D00DZ <<',
    '++ 4LL UR B4S3 ++',
    ':: B3L0NG 2 US ::',
    '|| Z3R0 C00L ||',
    '<< 4C1D BURN >>',
    '## CR4SH 0V3RR1D3 ##',
    '== H4CK TH3 G1BS0N ==',
    '** M4TR1X M0D3 **',
    '~~ D1G1T4L W4RR10R ~~',
    '[[ CYB3R 3L1T3 ]]',
    '>> V1RTU4L K1LL3R <<',
    '++ P1X3L P3RF3CT ++',
    ':: R3TR0 R4MP4G3 ::',
    '|| 8-B1T B34ST ||',
    '<< GL1TCH M0B >>',
    '## L4G K1LL ##',
    '-- P1NG 0F D34TH --',
    '** N3TW0RK N1NJ4 **',
    '~~ FR4M3 P3RF3CT ~~',
    '[[ T1M3 GLITCH ]]',
    '>> BUG 3XPL01T <<',
    '++ C0D3 1NJ3CT3D ++',
    ':: SYST3M H4CK3D ::',
    '|| K3RN3L P4N1C ||',
    '<< S3GF4ULT >>',
    '## BUFF3R 0V3RFL0W ##'
  ];
  
  // Controls
  private keys = {
    left: false,
    right: false
  };
  
  constructor(container: HTMLElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 30, 150);
    
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
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Add a subtle rim light
    const rimLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
    rimLight.position.set(-5, 10, -10);
    this.scene.add(rimLight);
  }
  
  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5f3a });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
    
    // Add some grass patches for visual variety
    const grassPatchGeometry = new THREE.CircleGeometry(2, 8);
    const grassDarkMaterial = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
    const grassLightMaterial = new THREE.MeshLambertMaterial({ color: 0x4a6f4a });
    
    for (let i = 0; i < 20; i++) {
      const grassPatch = new THREE.Mesh(
        grassPatchGeometry,
        Math.random() > 0.5 ? grassDarkMaterial : grassLightMaterial
      );
      grassPatch.rotation.x = -Math.PI / 2;
      grassPatch.position.set(
        (Math.random() - 0.5) * 80,
        0.01,
        (Math.random() - 0.5) * 80
      );
      grassPatch.scale.set(
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5,
        1
      );
      grassPatch.receiveShadow = true;
      this.scene.add(grassPatch);
    }
    
    // Add some decorative rocks
    const rockGeometry = new THREE.DodecahedronGeometry(0.3, 0);
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    
    for (let i = 0; i < 10; i++) {
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        (Math.random() - 0.5) * 60,
        0.15,
        (Math.random() - 0.5) * 60
      );
      rock.scale.set(
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5,
        Math.random() * 0.5 + 0.5
      );
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }
  
  private createBleda(): void {
    this.bleda = new THREE.Group();
    
    // Horse materials
    const horseBrownMaterial = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
    const horseDarkMaterial = new THREE.MeshLambertMaterial({ color: 0x3C2414 });
    
    // Horse body - more detailed with curved geometry
    const horseBodyGeometry = new THREE.BoxGeometry(3.5, 2.2, 1.8);
    const horseBody = new THREE.Mesh(horseBodyGeometry, horseBrownMaterial);
    horseBody.castShadow = true;
    horseBody.position.set(0, 0, 0);
    
    // Horse chest - rounded front
    const horseChestGeometry = new THREE.SphereGeometry(1.2, 8, 6);
    const horseChest = new THREE.Mesh(horseChestGeometry, horseBrownMaterial);
    horseChest.scale.set(0.8, 1, 1);
    horseChest.position.set(1.5, 0, 0);
    horseChest.castShadow = true;
    
    // Horse neck
    const horseNeckGeometry = new THREE.CylinderGeometry(0.6, 0.9, 1.5, 8);
    const horseNeck = new THREE.Mesh(horseNeckGeometry, horseBrownMaterial);
    horseNeck.rotation.z = -Math.PI / 4;
    horseNeck.position.set(2, 0.8, 0);
    horseNeck.castShadow = true;
    
    // Horse head - more detailed
    const horseHeadGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.8);
    const horseHead = new THREE.Mesh(horseHeadGeometry, horseBrownMaterial);
    horseHead.position.set(2.5, 1.5, 0);
    horseHead.castShadow = true;
    
    // Horse muzzle
    const horseMuzzleGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.6);
    const horseMuzzle = new THREE.Mesh(horseMuzzleGeometry, horseDarkMaterial);
    horseMuzzle.position.set(3, 1.3, 0);
    
    // Horse ears
    const horseEarGeometry = new THREE.ConeGeometry(0.15, 0.3, 4);
    const horseEarLeft = new THREE.Mesh(horseEarGeometry, horseBrownMaterial);
    horseEarLeft.position.set(2.3, 2, 0.2);
    const horseEarRight = new THREE.Mesh(horseEarGeometry, horseBrownMaterial);
    horseEarRight.position.set(2.3, 2, -0.2);
    
    // Horse legs - more realistic
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2, 6);
    const legMaterial = horseBrownMaterial;
    
    // Front legs
    const frontLegLeft = new THREE.Mesh(legGeometry, legMaterial);
    frontLegLeft.position.set(1, -1.1, 0.5);
    frontLegLeft.castShadow = true;
    
    const frontLegRight = new THREE.Mesh(legGeometry, legMaterial);
    frontLegRight.position.set(1, -1.1, -0.5);
    frontLegRight.castShadow = true;
    
    // Back legs
    const backLegLeft = new THREE.Mesh(legGeometry, legMaterial);
    backLegLeft.position.set(-1, -1.1, 0.5);
    backLegLeft.castShadow = true;
    
    const backLegRight = new THREE.Mesh(legGeometry, legMaterial);
    backLegRight.position.set(-1, -1.1, -0.5);
    backLegRight.castShadow = true;
    
    // Horse hooves
    const hoofGeometry = new THREE.CylinderGeometry(0.25, 0.2, 0.2, 6);
    const hoofMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
    
    const hooves = [];
    for (let i = 0; i < 4; i++) {
      const hoof = new THREE.Mesh(hoofGeometry, hoofMaterial);
      hoof.position.y = -2.1;
      hooves.push(hoof);
    }
    
    // Horse tail
    const tailGeometry = new THREE.ConeGeometry(0.4, 1.5, 6);
    const tailMaterial = new THREE.MeshLambertMaterial({ color: 0x2C1810 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.rotation.z = Math.PI / 3;
    tail.position.set(-2, -0.5, 0);
    tail.castShadow = true;
    
    // Rider - more detailed Hun warrior
    const riderGroup = new THREE.Group();
    
    // Rider torso
    const torsoGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.6);
    const torsoMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Leather armor
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    torso.position.set(-0.3, 2.5, 0);
    torso.castShadow = true;
    
    // Rider head
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 6);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB4 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(-0.3, 3.3, 0);
    head.castShadow = true;
    
    // Rider helmet/hat
    const helmetGeometry = new THREE.ConeGeometry(0.35, 0.5, 8);
    const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
    helmet.position.set(-0.3, 3.6, 0);
    
    // Rider arms
    const armGeometry = new THREE.CapsuleGeometry(0.15, 0.8, 4, 6);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.rotation.z = -Math.PI / 3;
    leftArm.position.set(-0.1, 2.8, 0.4);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.rotation.z = -Math.PI / 2.5;
    rightArm.position.set(-0.5, 2.8, -0.4);
    
    // Rider legs
    const legRiderGeometry = new THREE.CapsuleGeometry(0.2, 0.8, 4, 6);
    const legRiderMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3C28 }); // Dark pants
    
    const leftLeg = new THREE.Mesh(legRiderGeometry, legRiderMaterial);
    leftLeg.rotation.x = -Math.PI / 6;
    leftLeg.position.set(0, 1.8, 0.5);
    
    const rightLeg = new THREE.Mesh(legRiderGeometry, legRiderMaterial);
    rightLeg.rotation.x = Math.PI / 6;
    rightLeg.position.set(0, 1.8, -0.5);
    
    // Quiver
    const quiverGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6);
    const quiverMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const quiver = new THREE.Mesh(quiverGeometry, quiverMaterial);
    quiver.position.set(-0.8, 2.5, 0.3);
    quiver.rotation.z = -Math.PI / 12;
    
    // Arrows in quiver
    const arrowInQuiverGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4);
    const arrowInQuiverMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    for (let i = 0; i < 5; i++) {
      const arrowInQuiver = new THREE.Mesh(arrowInQuiverGeometry, arrowInQuiverMaterial);
      const angle = (i / 5) * Math.PI * 2;
      arrowInQuiver.position.set(
        -0.8 + Math.cos(angle) * 0.08,
        2.8,
        0.3 + Math.sin(angle) * 0.08
      );
      riderGroup.add(arrowInQuiver);
    }
    
    // Bow - more detailed composite bow
    const bowGroup = new THREE.Group();
    const bowCurveGeometry = new THREE.TorusGeometry(1.5, 0.08, 6, 12, Math.PI);
    const bowMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
    const bowCurve = new THREE.Mesh(bowCurveGeometry, bowMaterial);
    
    // Bow string
    const bowStringGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3, 4);
    const bowStringMaterial = new THREE.MeshLambertMaterial({ color: 0xFFF8DC });
    const bowString = new THREE.Mesh(bowStringGeometry, bowStringMaterial);
    bowString.rotation.z = Math.PI / 2;
    
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
    this.bleda.add(frontLegLeft);
    this.bleda.add(frontLegRight);
    this.bleda.add(backLegLeft);
    this.bleda.add(backLegRight);
    
    // Add hooves to legs
    frontLegLeft.add(hooves[0]);
    frontLegRight.add(hooves[1]);
    backLegLeft.add(hooves[2]);
    backLegRight.add(hooves[3]);
    
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
    const arrowGroup = new THREE.Group();
    
    // Arrow shaft - longer and thinner
    const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
    const shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.rotation.z = Math.PI / 2;
    shaft.castShadow = true;
    
    // Arrow head - sharper point
    const headGeometry = new THREE.ConeGeometry(0.04, 0.15, 4);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.rotation.z = -Math.PI / 2;
    head.position.x = 0.475;
    head.castShadow = true;
    
    // Arrow fletching (feathers) - smaller and at the back
    const fletchingGeometry = new THREE.BoxGeometry(0.1, 0.08, 0.01);
    const fletchingMaterial = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
    
    // Three fletching feathers arranged properly
    for (let i = 0; i < 3; i++) {
      const fletching = new THREE.Mesh(fletchingGeometry, fletchingMaterial);
      fletching.position.x = -0.35;
      const angle = (i * Math.PI * 2) / 3;
      fletching.position.y = Math.sin(angle) * 0.03;
      fletching.position.z = Math.cos(angle) * 0.03;
      fletching.rotation.y = angle;
      fletching.rotation.x = -0.2; // Slight angle for realism
      arrowGroup.add(fletching);
    }
    
    // Nock (where the arrow meets the bowstring)
    const nockGeometry = new THREE.CylinderGeometry(0.025, 0.02, 0.05, 6);
    const nockMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
    const nock = new THREE.Mesh(nockGeometry, nockMaterial);
    nock.rotation.z = Math.PI / 2;
    nock.position.x = -0.425;
    
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
        this.updateScore();
        this.showCongratsMessage(); // Show l33t message
        
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
    
    // Create l33t RPM indicator
    const rpmContainer = document.createElement('div');
    rpmContainer.style.position = 'absolute';
    rpmContainer.style.top = '10px';
    rpmContainer.style.right = '10px';
    rpmContainer.style.width = '250px';
    rpmContainer.style.height = '150px';
    rpmContainer.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,20,0.8) 100%)';
    rpmContainer.style.border = '2px solid #00ff00';
    rpmContainer.style.borderRadius = '10px';
    rpmContainer.style.boxShadow = '0 0 20px rgba(0,255,0,0.5), inset 0 0 20px rgba(0,255,0,0.2)';
    rpmContainer.style.padding = '15px';
    rpmContainer.style.fontFamily = 'Courier New, monospace';
    rpmContainer.style.pointerEvents = 'none';
    
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
    
    // Add pulsing animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }
      @keyframes glitch {
        0%, 100% { 
          text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
        }
        20% { 
          text-shadow: -2px 0 #ff0000, 2px 0 #00ff00, 0 0 10px currentColor;
        }
        40% { 
          text-shadow: 2px 0 #ff0000, -2px 0 #00ff00, 0 0 10px currentColor;
        }
      }
      #rpm-display {
        animation: pulse 0.5s ease-in-out infinite;
      }
      #rpm-display.danger {
        animation: pulse 0.2s ease-in-out infinite, shake 0.1s ease-in-out infinite, glitch 0.3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    
    // Add warning text element
    const warningText = document.createElement('div');
    warningText.id = 'rpm-warning';
    warningText.style.position = 'absolute';
    warningText.style.top = '170px';
    warningText.style.right = '10px';
    warningText.style.width = '250px';
    warningText.style.textAlign = 'center';
    warningText.style.color = '#ff0000';
    warningText.style.fontFamily = 'Courier New, monospace';
    warningText.style.fontSize = '14px';
    warningText.style.textTransform = 'uppercase';
    warningText.style.letterSpacing = '2px';
    warningText.style.display = 'none';
    warningText.style.pointerEvents = 'none';
    warningText.innerHTML = '⚠️ DANGER ZONE ⚠️';
    warningText.style.textShadow = '0 0 10px #ff0000';
    document.body.appendChild(warningText);
    
    // Create l33t congratulatory message container
    const congratsContainer = document.createElement('div');
    congratsContainer.id = 'congrats-container';
    congratsContainer.style.position = 'absolute';
    congratsContainer.style.top = '30%';
    congratsContainer.style.left = '50%';
    congratsContainer.style.transform = 'translate(-50%, -50%)';
    congratsContainer.style.fontSize = '48px';
    congratsContainer.style.fontFamily = 'Courier New, monospace';
    congratsContainer.style.fontWeight = 'bold';
    congratsContainer.style.color = '#00ff00';
    congratsContainer.style.textShadow = `
      0 0 10px #00ff00,
      3px 3px 0 #008800,
      6px 6px 0 #004400,
      9px 9px 0 #002200,
      12px 12px 15px rgba(0,0,0,0.8)
    `;
    congratsContainer.style.letterSpacing = '8px';
    congratsContainer.style.textAlign = 'center';
    congratsContainer.style.pointerEvents = 'none';
    congratsContainer.style.opacity = '0';
    congratsContainer.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(-5deg)';
    congratsContainer.style.transition = 'none';
    congratsContainer.style.zIndex = '1000';
    congratsContainer.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%)';
    congratsContainer.style.padding = '20px 40px';
    congratsContainer.style.border = '3px solid #00ff00';
    congratsContainer.style.borderRadius = '0';
    congratsContainer.style.boxShadow = `
      inset 0 0 50px rgba(0,255,0,0.3),
      0 0 30px rgba(0,255,0,0.5),
      0 0 60px rgba(0,255,0,0.3)
    `;
    congratsContainer.style.textTransform = 'uppercase';
    congratsContainer.style.whiteSpace = 'nowrap';
    congratsContainer.innerHTML = '<span class="congrats-text"></span>';
    document.body.appendChild(congratsContainer);
    
    // Add additional CSS for congrats animation
    const congratsStyle = document.createElement('style');
    congratsStyle.textContent = `
      @keyframes retroGlitch {
        0% {
          transform: translate(-50%, -50%) scale(1) rotate(0deg);
          filter: hue-rotate(0deg);
        }
        10% {
          transform: translate(-48%, -50%) scale(1) rotate(-1deg);
          filter: hue-rotate(90deg) saturate(2);
        }
        20% {
          transform: translate(-52%, -50%) scale(1.02) rotate(1deg);
          filter: hue-rotate(180deg) saturate(3);
        }
        30% {
          transform: translate(-50%, -48%) scale(1) rotate(0deg);
          filter: hue-rotate(270deg) saturate(2);
        }
        40% {
          transform: translate(-50%, -52%) scale(0.98) rotate(0deg);
          filter: hue-rotate(0deg);
        }
        50% {
          transform: translate(-49%, -50%) scale(1) rotate(0deg);
          filter: hue-rotate(45deg);
        }
        60% {
          transform: translate(-51%, -50%) scale(1.01) rotate(0deg);
          filter: hue-rotate(0deg);
        }
        100% {
          transform: translate(-50%, -50%) scale(1) rotate(0deg);
          filter: hue-rotate(0deg);
        }
      }
      
      @keyframes scanlines {
        0% {
          background-position: 0 0;
        }
        100% {
          background-position: 0 10px;
        }
      }
      
      @keyframes textGlitch {
        0%, 100% {
          text-shadow: 
            0 0 10px #00ff00,
            3px 3px 0 #008800,
            6px 6px 0 #004400,
            9px 9px 0 #002200,
            12px 12px 15px rgba(0,0,0,0.8);
        }
        20% {
          text-shadow: 
            -2px 0 #ff0000,
            2px 0 #00ffff,
            0 0 10px #00ff00,
            3px 3px 0 #008800,
            6px 6px 0 #004400,
            9px 9px 0 #002200,
            12px 12px 15px rgba(0,0,0,0.8);
        }
        40% {
          text-shadow: 
            2px 0 #ff00ff,
            -2px 0 #ffff00,
            0 0 10px #00ff00,
            3px 3px 0 #008800,
            6px 6px 0 #004400,
            9px 9px 0 #002200,
            12px 12px 15px rgba(0,0,0,0.8);
        }
        60% {
          text-shadow: 
            0 0 10px #00ff00,
            3px 3px 0 #008800,
            6px 6px 0 #004400,
            9px 9px 0 #002200,
            12px 12px 15px rgba(0,0,0,0.8),
            0 0 30px #00ff00;
        }
      }
      
      #congrats-container {
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
      
      #congrats-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: repeating-linear-gradient(
          0deg,
          rgba(0, 0, 0, 0.15),
          rgba(0, 0, 0, 0.15) 1px,
          transparent 1px,
          transparent 2px
        );
        pointer-events: none;
        animation: scanlines 8s linear infinite;
      }
      
      #congrats-container.show {
        animation: retroGlitch 0.4s ease-in-out infinite;
      }
      
      #congrats-container.show .congrats-text {
        animation: textGlitch 0.3s ease-in-out infinite;
        display: inline-block;
      }
      
      #congrats-container::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, #00ff00, #00ff00 25%, transparent 25%, transparent 75%, #00ff00 75%);
        z-index: -1;
        opacity: 0.5;
        filter: blur(1px);
      }
      
      @keyframes screenShake {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-2px, -2px); }
        20% { transform: translate(2px, -2px); }
        30% { transform: translate(-2px, 2px); }
        40% { transform: translate(2px, 2px); }
        50% { transform: translate(-1px, -1px); }
        60% { transform: translate(1px, -1px); }
        70% { transform: translate(-1px, 1px); }
        80% { transform: translate(1px, 1px); }
        90% { transform: translate(0, 0); }
      }
    `;
    document.head.appendChild(congratsStyle);
  }
  
  private updateScore(): void {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `Score: ${this.score}`;
    }
  }
  
  private showCongratsMessage(): void {
    const congratsContainer = document.getElementById('congrats-container');
    if (!congratsContainer) return;
    
    const textElement = congratsContainer.querySelector('.congrats-text') as HTMLElement;
    if (!textElement) return;
    
    // Pick a random l33t message
    const randomMessage = this.l33tMessages[Math.floor(Math.random() * this.l33tMessages.length)];
    textElement.textContent = randomMessage;
    
    // Random color scheme for retro feel
    const colorSchemes = [
      { main: '#00ff00', border: '#00ff00' }, // Classic green
      { main: '#00ffff', border: '#00ffff' }, // Cyan
      { main: '#ff00ff', border: '#ff00ff' }, // Magenta
      { main: '#ffff00', border: '#ffff00' }, // Yellow
      { main: '#ff8800', border: '#ff8800' }  // Orange
    ];
    const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
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
    
    // Animate horse when moving
    if (Math.abs(this.bledaVelocity.x) > 0.1) {
      this.horseLegAnimation += deltaTime * 8;
      
      // Animate legs
      const legSwing = Math.sin(this.horseLegAnimation) * 0.3;
      const frontLeftLeg = this.bleda.children[7];
      const frontRightLeg = this.bleda.children[8];
      const backLeftLeg = this.bleda.children[9];
      const backRightLeg = this.bleda.children[10];
      
      if (frontLeftLeg) frontLeftLeg.rotation.x = legSwing;
      if (frontRightLeg) frontRightLeg.rotation.x = -legSwing;
      if (backLeftLeg) backLeftLeg.rotation.x = -legSwing * 0.8;
      if (backRightLeg) backRightLeg.rotation.x = legSwing * 0.8;
      
      // Subtle body bounce
      this.bleda.position.y = 1 + Math.abs(Math.sin(this.horseLegAnimation * 2)) * 0.1;
      
      // Tail sway
      const tail = this.bleda.children[11];
      if (tail) {
        tail.rotation.x = Math.sin(this.horseLegAnimation * 0.5) * 0.2;
      }
    }
    
    // Rotate wheel around Z-axis (like a ferris wheel or wheel of fortune)
    this.wheel.rotation.z += this.wheelSpeed * deltaTime;
    
    // Update RPM display
    this.updateRPM();
    
    // Update arrows
    this.arrows.forEach(arrow => {
      if (arrow.active) {
        // Update position
        arrow.mesh.position.add(arrow.velocity.clone().multiplyScalar(deltaTime));
        
        // Add gravity to arrows for realistic arc
        arrow.velocity.y -= 15 * deltaTime;
        
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