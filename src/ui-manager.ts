import { UI_STYLES, ANIMATION_TIMINGS, GAME_CONFIG, PowerUpType, POWERUP_CONFIG, ObstacleType, TargetType } from './constants';
import { ROAST_MESSAGES, L33T_MESSAGES } from './messages';

export class UIManager {
  private score = 0;
  private shotsFired = 0;
  private shotsHit = 0;

  constructor() {
    this.createUI();
    this.injectCSS();
  }

  // Helper method to apply common DOM styles
  private applyDOMStyles(
    element: HTMLElement,
    styles: Partial<CSSStyleDeclaration>
  ): void {
    Object.assign(element.style, styles);
  }

  // Helper method to create styled DOM element
  private createStyledElement(
    tag: string,
    styles: Partial<CSSStyleDeclaration>,
    innerHTML?: string
  ): HTMLElement {
    const element = document.createElement(tag);
    this.applyDOMStyles(element, styles);
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  }

  // Helper to create UI container with common styles
  private createUIContainer(
    styles: Partial<CSSStyleDeclaration>,
    id?: string
  ): HTMLElement {
    const defaultStyles: Partial<CSSStyleDeclaration> = {
      position: 'absolute',
      fontFamily: UI_STYLES.RETRO_FONT,
      pointerEvents: 'none'
    };
    const container = this.createStyledElement('div', { ...defaultStyles, ...styles });
    if (id) container.id = id;
    return container;
  }

  // Helper to create multiple similar objects
  private createMultiple<T>(
    count: number,
    creator: (index: number) => T
  ): T[] {
    return Array.from({ length: count }, (_, i) => creator(i));
  }

  // Helper method to get random array element
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // CSS Animation definitions
  private readonly CSS_ANIMATIONS = {
    keyframes: [
      {
        name: 'pulse',
        frames: [
          { at: '0%, 100%', style: 'opacity: 1;' },
          { at: '50%', style: 'opacity: 0.7;' }
        ]
      },
      {
        name: 'shake',
        frames: [
          { at: '0%, 100%', style: 'transform: translateX(0);' },
          { at: '25%', style: 'transform: translateX(-2px);' },
          { at: '75%', style: 'transform: translateX(2px);' }
        ]
      },
      {
        name: 'glitch',
        frames: [
          { at: '0%, 100%', style: 'text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;' },
          { at: '20%', style: 'text-shadow: -2px 0 #ff0000, 2px 0 #00ff00, 0 0 10px currentColor;' },
          { at: '40%', style: 'text-shadow: 2px 0 #ff0000, -2px 0 #00ff00, 0 0 10px currentColor;' }
        ]
      },
      {
        name: 'roastGlitch',
        frames: [
          { at: '0%, 100%', style: 'transform: translateX(0); filter: hue-rotate(0deg);' },
          { at: '10%', style: 'transform: translateX(-1px); filter: hue-rotate(10deg);' },
          { at: '20%', style: 'transform: translateX(1px); filter: hue-rotate(-10deg);' },
          { at: '30%', style: 'transform: translateX(-1px); filter: hue-rotate(5deg);' },
          { at: '40%', style: 'transform: translateX(1px); filter: hue-rotate(-5deg);' },
          { at: '50%', style: 'transform: translateX(0); filter: hue-rotate(0deg);' }
        ]
      },
      {
        name: 'retroGlitch',
        frames: [
          { at: '0%', style: 'transform: translate(-50%, -50%) scale(1) rotate(0deg); filter: hue-rotate(0deg);' },
          { at: '10%', style: 'transform: translate(-48%, -50%) scale(1) rotate(-1deg); filter: hue-rotate(90deg) saturate(2);' },
          { at: '20%', style: 'transform: translate(-52%, -50%) scale(1.02) rotate(1deg); filter: hue-rotate(180deg) saturate(3);' },
          { at: '30%', style: 'transform: translate(-50%, -48%) scale(1) rotate(0deg); filter: hue-rotate(270deg) saturate(2);' },
          { at: '40%', style: 'transform: translate(-50%, -52%) scale(0.98) rotate(0deg); filter: hue-rotate(0deg);' },
          { at: '50%', style: 'transform: translate(-49%, -50%) scale(1) rotate(0deg); filter: hue-rotate(45deg);' },
          { at: '60%', style: 'transform: translate(-51%, -50%) scale(1.01) rotate(0deg); filter: hue-rotate(0deg);' },
          { at: '100%', style: 'transform: translate(-50%, -50%) scale(1) rotate(0deg); filter: hue-rotate(0deg);' }
        ]
      },
      {
        name: 'scanlines',
        frames: [
          { at: '0%', style: 'background-position: 0 0;' },
          { at: '100%', style: 'background-position: 0 10px;' }
        ]
      },
      {
        name: 'textGlitch',
        frames: [
          { at: '0%, 100%', style: `text-shadow: ${UI_STYLES.L33T_TEXT_SHADOW};` },
          { at: '20%', style: `text-shadow: -2px 0 #ff0000, 2px 0 #00ffff, ${UI_STYLES.L33T_TEXT_SHADOW};` },
          { at: '40%', style: `text-shadow: 2px 0 #ff00ff, -2px 0 #ffff00, ${UI_STYLES.L33T_TEXT_SHADOW};` },
          { at: '60%', style: `text-shadow: ${UI_STYLES.L33T_TEXT_SHADOW}, 0 0 30px #00ff00;` }
        ]
      },
      {
        name: 'screenShake',
        frames: this.createMultiple(10, (i) => {
          const positions = [
            '0, 0', '-2px, -2px', '2px, -2px', '-2px, 2px', '2px, 2px',
            '-1px, -1px', '1px, -1px', '-1px, 1px', '1px, 1px', '0, 0'
          ];
          return { at: `${i * 10}%`, style: `transform: translate(${positions[i]});` };
        })
      },
      {
        name: 'stunPulse',
        frames: [
          { at: '0%, 100%', style: 'background: radial-gradient(ellipse at center, transparent 0%, rgba(255,0,0,0.3) 100%);' },
          { at: '50%', style: 'background: radial-gradient(ellipse at center, transparent 0%, rgba(255,0,0,0.5) 100%);' }
        ]
      },
      {
        name: 'warningFlash',
        frames: [
          { at: '0%, 100%', style: 'opacity: 1; transform: translateX(-50%) scale(1);' },
          { at: '50%', style: 'opacity: 0.3; transform: translateX(-50%) scale(0.95);' }
        ]
      },
      {
        name: 'collisionShake',
        frames: [
          { at: '0%, 100%', style: 'transform: translateX(-50%) rotate(0deg);' },
          { at: '25%', style: 'transform: translateX(-48%) rotate(-2deg);' },
          { at: '75%', style: 'transform: translateX(-52%) rotate(2deg);' }
        ]
      },
      {
        name: 'comboShake',
        frames: [
          { at: '0%, 100%', style: 'transform: translateX(0) scale(1) rotate(0deg);' },
          { at: '25%', style: 'transform: translateX(-5px) scale(1.1) rotate(-5deg);' },
          { at: '75%', style: 'transform: translateX(5px) scale(1.1) rotate(5deg);' }
        ]
      },
      {
        name: 'spawnPulse',
        frames: [
          { at: '0%', style: 'box-shadow: 0 0 0 0 currentColor;' },
          { at: '100%', style: 'box-shadow: 0 0 20px 10px transparent;' }
        ]
      },
      {
        name: 'mysteryParticle',
        frames: [
          { at: '0%', style: 'transform: translate(0, 0) scale(1); opacity: 1;' },
          { at: '100%', style: 'transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0;' }
        ]
      }
    ],
    rules: [
      { selector: '#roast-message', rule: `animation: ${ANIMATION_TIMINGS.ROAST_GLITCH};` },
      { selector: '#roast-message.new-roast', rule: `animation: ${ANIMATION_TIMINGS.ROAST_GLITCH_NEW};` },
      { selector: '#rpm-display', rule: `animation: ${ANIMATION_TIMINGS.PULSE};` },
      { selector: '#rpm-display.danger', rule: `animation: ${ANIMATION_TIMINGS.PULSE_FAST}, ${ANIMATION_TIMINGS.SHAKE}, ${ANIMATION_TIMINGS.GLITCH};` },
      { selector: '#congrats-container', rule: 'image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;' },
      { selector: '#congrats-container.show', rule: `animation: ${ANIMATION_TIMINGS.RETRO_GLITCH};` },
      { selector: '#congrats-container.show .congrats-text', rule: `animation: ${ANIMATION_TIMINGS.TEXT_GLITCH}; display: inline-block;` }
    ],
    pseudoElements: [
      {
        selector: '#congrats-container::before',
        rule: `content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px);
        pointer-events: none; animation: ${ANIMATION_TIMINGS.SCANLINES};`
      },
      {
        selector: '#congrats-container::after',
        rule: `content: ''; position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px;
        background: linear-gradient(45deg, #00ff00, #00ff00 25%, transparent 25%, transparent 75%, #00ff00 75%);
        z-index: -1; opacity: 0.5; filter: blur(1px);`
      }
    ]
  };

  // Generate CSS from animation definitions
  private generateCSS(): string {
    const keyframesCSS = this.CSS_ANIMATIONS.keyframes.map(anim => {
      const frames = anim.frames.map(frame => `${frame.at} { ${frame.style} }`).join('\n');
      return `@keyframes ${anim.name} {\n${frames}\n}`;
    }).join('\n\n');

    const rulesCSS = this.CSS_ANIMATIONS.rules.map(rule => 
      `${rule.selector} { ${rule.rule} }`
    ).join('\n');

    const pseudoCSS = this.CSS_ANIMATIONS.pseudoElements.map(elem => 
      `${elem.selector} { ${elem.rule} }`
    ).join('\n');

    return `${keyframesCSS}\n\n${rulesCSS}\n\n${pseudoCSS}`;
  }

  // Inject all CSS animations at once
  private injectCSS(): void {
    const style = document.createElement('style');
    style.textContent = this.generateCSS();
    document.head.appendChild(style);
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

  updateScore(score: number): void {
    this.score = score;
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = `Score: ${this.score}`;
    }
  }

  incrementShotsFired(): void {
    this.shotsFired++;
    this.updateKDDisplay();
  }

  incrementShotsHit(): void {
    this.shotsHit++;
    this.updateKDDisplay();
    this.showCongratsMessage();
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
        roastMessage = this.getRandomElement(ROAST_MESSAGES.slice(0, 20));
      } else if (accuracy < 40) {
        // Medium roasts
        roastMessage = this.getRandomElement(ROAST_MESSAGES.slice(20, 35));
      } else if (accuracy < 60) {
        // Light roasts
        roastMessage = this.getRandomElement(ROAST_MESSAGES.slice(35, 45));
      } else if (accuracy < 80) {
        // Mild taunts
        roastMessage = this.getRandomElement(ROAST_MESSAGES.slice(45, 50));
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

  updateRPM(wheelSpeed: number): void {
    // Calculate RPM from wheel speed (radians per second to RPM)
    // wheelSpeed is in rad/s, convert to rotations/minute: (rad/s) * (60s/min) / (2π rad/rotation)
    const actualRPM = Math.abs(wheelSpeed * 60 / (2 * Math.PI));
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

  private showCongratsMessage(): void {
    const congratsContainer = document.getElementById('congrats-container');
    if (!congratsContainer) return;
    
    const textElement = congratsContainer.querySelector('.congrats-text') as HTMLElement;
    if (!textElement) return;
    
    // Pick a random l33t message
    const randomMessage = this.getRandomElement(L33T_MESSAGES);
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
  
  public showPowerUpMessage(message: string, type: PowerUpType): void {
    // Create or get power-up message container
    let messageContainer = document.getElementById('powerup-message');
    if (!messageContainer) {
      messageContainer = this.createUIContainer({
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '24px',
        fontWeight: 'bold',
        textShadow: '0 0 20px currentColor',
        letterSpacing: '3px',
        textAlign: 'center',
        zIndex: '1000',
        opacity: '0',
        transition: 'all 0.3s ease-out',
        pointerEvents: 'none'
      }, 'powerup-message');
      document.body.appendChild(messageContainer);
    }
    
    // Set color based on power-up type
    const config = this.getPowerUpConfig(type);
    messageContainer.style.color = `#${config.COLOR.toString(16).padStart(6, '0')}`;
    messageContainer.textContent = message;
    
    // Animate in
    messageContainer.style.opacity = '0';
    messageContainer.style.transform = 'translateX(-50%) translateY(20px)';
    
    // Force reflow
    messageContainer.offsetHeight;
    
    messageContainer.style.opacity = '1';
    messageContainer.style.transform = 'translateX(-50%) translateY(0)';
    
    // Hide after delay
    setTimeout(() => {
      messageContainer.style.opacity = '0';
      messageContainer.style.transform = 'translateX(-50%) translateY(-20px)';
    }, 2000);
  }
  
  private getPowerUpConfig(type: PowerUpType) {
    switch (type) {
      case PowerUpType.RAPID_FIRE:
        return POWERUP_CONFIG.RAPID_FIRE;
      case PowerUpType.EXPLOSIVE_ARROWS:
        return POWERUP_CONFIG.EXPLOSIVE_ARROWS;
      case PowerUpType.SCORE_MULTIPLIER:
        return POWERUP_CONFIG.SCORE_MULTIPLIER;
    }
  }
  
  public updateActivePowerUps(activePowerUps: Array<{type: PowerUpType, remaining: number}>): void {
    // Create or get active power-ups display
    let powerUpsDisplay = document.getElementById('active-powerups');
    if (!powerUpsDisplay) {
      powerUpsDisplay = this.createUIContainer({
        top: '200px',
        left: '10px',
        width: '250px',
        background: UI_STYLES.CONTAINER_BG,
        border: '2px solid #00ff00',
        borderRadius: '10px',
        padding: '15px',
        display: activePowerUps.length > 0 ? 'block' : 'none'
      }, 'active-powerups');
      document.body.appendChild(powerUpsDisplay);
    }
    
    if (activePowerUps.length === 0) {
      powerUpsDisplay.style.display = 'none';
      return;
    }
    
    powerUpsDisplay.style.display = 'block';
    powerUpsDisplay.innerHTML = `
      <div style="color: #00ff00; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
        [[ 4CT1V3 P0W3R-UPS ]]
      </div>
      ${activePowerUps.map(powerUp => {
        const config = this.getPowerUpConfig(powerUp.type);
        const color = `#${config.COLOR.toString(16).padStart(6, '0')}`;
        const seconds = Math.ceil(powerUp.remaining / 1000);
        return `
          <div style="margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <span style="color: ${color}; font-size: 16px;">${config.ICON} ${config.NAME}</span>
            <span style="color: ${color}; font-size: 14px; font-weight: bold;">${seconds}s</span>
          </div>
        `;
      }).join('')}
    `;
  }
  
  public showStunEffect(): void {
    // Create or get stun overlay
    let stunOverlay = document.getElementById('stun-overlay');
    if (!stunOverlay) {
      stunOverlay = this.createUIContainer({
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(255,0,0,0.3) 100%)',
        pointerEvents: 'none',
        zIndex: '999',
        display: 'none'
      }, 'stun-overlay');
      
      // Add animated stars/dizzy effect
      const starsHTML = Array.from({ length: 5 }, (_, i) => `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: 30px;
          height: 30px;
          font-size: 30px;
          transform: translate(-50%, -50%) rotate(${i * 72}deg) translateY(-100px);
          animation: dizzyStars 2s linear infinite;
        ">⭐</div>
      `).join('');
      
      stunOverlay.innerHTML = `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 72px;
          color: #ff0000;
          text-shadow: 0 0 20px #ff0000;
          animation: pulse 0.5s ease-in-out infinite;
        ">💫</div>
        ${starsHTML}
        <style>
          @keyframes dizzyStars {
            0% { transform: translate(-50%, -50%) rotate(0deg) translateY(-100px); }
            100% { transform: translate(-50%, -50%) rotate(360deg) translateY(-100px); }
          }
        </style>
      `;
      
      document.body.appendChild(stunOverlay);
    }
    
    stunOverlay.style.display = 'block';
    stunOverlay.style.animation = 'stunPulse 0.5s ease-in-out infinite';
  }
  
  public hideStunEffect(): void {
    const stunOverlay = document.getElementById('stun-overlay');
    if (stunOverlay) {
      stunOverlay.style.display = 'none';
    }
  }
  
  public showObstacleWarning(message: string, _type: ObstacleType): void {
    // Create or get warning display
    let warningDisplay = document.getElementById('obstacle-warning');
    if (!warningDisplay) {
      warningDisplay = this.createUIContainer({
        top: '60%',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#FF0000',
        textShadow: '0 0 20px #FF0000, 0 0 40px #FF0000',
        letterSpacing: '4px',
        textAlign: 'center',
        zIndex: '1000',
        opacity: '0',
        transition: 'all 0.2s ease-out',
        pointerEvents: 'none',
        textTransform: 'uppercase'
      }, 'obstacle-warning');
      document.body.appendChild(warningDisplay);
    }
    
    warningDisplay.textContent = message;
    warningDisplay.style.animation = 'warningFlash 0.5s ease-in-out infinite';
    
    // Show warning
    warningDisplay.style.opacity = '0';
    warningDisplay.style.transform = 'translateX(-50%) scale(0.8)';
    
    // Force reflow
    warningDisplay.offsetHeight;
    
    warningDisplay.style.opacity = '1';
    warningDisplay.style.transform = 'translateX(-50%) scale(1)';
    
    // Hide after short duration
    setTimeout(() => {
      warningDisplay.style.opacity = '0';
      warningDisplay.style.transform = 'translateX(-50%) scale(1.2)';
      warningDisplay.style.animation = '';
    }, 1500);
  }
  
  public showObstacleCollision(message: string, _type: ObstacleType): void {
    // Create or get collision message display
    let collisionDisplay = document.getElementById('obstacle-collision');
    if (!collisionDisplay) {
      collisionDisplay = this.createUIContainer({
        top: '40%',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#FF0000',
        textShadow: '0 0 30px #FF0000, 0 0 60px #FF0000',
        letterSpacing: '6px',
        textAlign: 'center',
        zIndex: '1001',
        opacity: '0',
        transition: 'all 0.3s ease-out',
        pointerEvents: 'none',
        textTransform: 'uppercase',
        background: 'rgba(0,0,0,0.8)',
        padding: '20px 40px',
        border: '3px solid #FF0000',
        borderRadius: '10px'
      }, 'obstacle-collision');
      document.body.appendChild(collisionDisplay);
    }
    
    collisionDisplay.textContent = message;
    
    // Animate in with impact effect
    collisionDisplay.style.opacity = '0';
    collisionDisplay.style.transform = 'translateX(-50%) scale(2)';
    
    // Force reflow
    collisionDisplay.offsetHeight;
    
    collisionDisplay.style.opacity = '1';
    collisionDisplay.style.transform = 'translateX(-50%) scale(1)';
    collisionDisplay.style.animation = 'collisionShake 0.3s ease-in-out';
    
    // Flash red border on game container
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
      gameContainer.style.boxShadow = 'inset 0 0 100px rgba(255,0,0,0.5)';
      setTimeout(() => {
        gameContainer.style.boxShadow = '';
      }, 500);
    }
    
    // Hide after duration
    setTimeout(() => {
      collisionDisplay.style.opacity = '0';
      collisionDisplay.style.transform = 'translateX(-50%) scale(0.8)';
      collisionDisplay.style.animation = '';
    }, 2000);
  }
  
  public showTargetHit(message: string, type: TargetType, points: number): void {
    // Create or get target hit display
    let hitDisplay = document.getElementById('target-hit');
    if (!hitDisplay) {
      hitDisplay = this.createUIContainer({
        bottom: '60%',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '28px',
        fontWeight: 'bold',
        textShadow: '0 0 20px currentColor',
        letterSpacing: '3px',
        textAlign: 'center',
        zIndex: '1000',
        opacity: '0',
        transition: 'all 0.3s ease-out',
        pointerEvents: 'none',
        textTransform: 'uppercase'
      }, 'target-hit');
      document.body.appendChild(hitDisplay);
    }
    
    // Get target color
    const targetColor = this.getTargetColor(type);
    hitDisplay.style.color = targetColor;
    hitDisplay.innerHTML = `${message}<br><span style="font-size: 20px;">+${points} P01NTS</span>`;
    
    // Animate in
    hitDisplay.style.opacity = '0';
    hitDisplay.style.transform = 'translateX(-50%) translateY(20px) scale(0.8)';
    
    // Force reflow
    hitDisplay.offsetHeight;
    
    hitDisplay.style.opacity = '1';
    hitDisplay.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    
    // Hide after delay
    setTimeout(() => {
      hitDisplay.style.opacity = '0';
      hitDisplay.style.transform = 'translateX(-50%) translateY(-20px) scale(1.2)';
    }, 1500);
  }
  
  private getTargetColor(type: TargetType): string {
    const colors: Record<TargetType, string> = {
      [TargetType.STANDARD]: '#FF0000',
      [TargetType.GOLD]: '#FFD700',
      [TargetType.SPEED]: '#00BFFF',
      [TargetType.BONUS]: '#FF1493',
      [TargetType.SHRINKING]: '#FF0000',
      [TargetType.SPLIT]: '#00FF00',
      [TargetType.MYSTERY]: '#9400D3',
      [TargetType.GHOST]: '#E6E6FA',
      [TargetType.MAGNETIC]: '#FF6347',
      [TargetType.EXPLOSIVE]: '#FF4500'
    };
    return colors[type] || '#FFFFFF';
  }
  
  public showComboMessage(message: string, comboCount: number): void {
    // Create or get combo display
    let comboDisplay = document.getElementById('combo-display');
    if (!comboDisplay) {
      comboDisplay = this.createUIContainer({
        top: '30%',
        right: '20px',
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#FFD700',
        textShadow: '0 0 30px #FFD700, 0 0 60px #FFD700',
        letterSpacing: '4px',
        textAlign: 'right',
        zIndex: '1000',
        opacity: '0',
        transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        pointerEvents: 'none',
        textTransform: 'uppercase'
      }, 'combo-display');
      document.body.appendChild(comboDisplay);
    }
    
    comboDisplay.textContent = message;
    
    // Animate with impact
    comboDisplay.style.opacity = '0';
    comboDisplay.style.transform = 'translateX(50px) scale(0.5) rotate(-10deg)';
    
    // Force reflow
    comboDisplay.offsetHeight;
    
    comboDisplay.style.opacity = '1';
    comboDisplay.style.transform = 'translateX(0) scale(1) rotate(0deg)';
    
    // Add shake effect for high combos
    if (comboCount >= 5) {
      comboDisplay.style.animation = 'comboShake 0.5s ease-out';
    }
    
    // Hide after delay
    setTimeout(() => {
      comboDisplay.style.opacity = '0';
      comboDisplay.style.transform = 'translateX(-50px) scale(0.8) rotate(10deg)';
      comboDisplay.style.animation = '';
    }, 2000);
  }
  
  public updateComboDisplay(comboCount: number, comboMultiplier: number): void {
    // Create or get combo counter
    let comboCounter = document.getElementById('combo-counter');
    if (!comboCounter) {
      comboCounter = this.createUIContainer({
        top: '150px',
        right: '270px',
        width: '200px',
        background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,140,0,0.2) 100%)',
        border: '2px solid #FFD700',
        borderRadius: '10px',
        padding: '15px',
        display: 'none'
      }, 'combo-counter');
      document.body.appendChild(comboCounter);
    }
    
    if (comboCount > 1) {
      comboCounter.style.display = 'block';
      comboCounter.innerHTML = `
        <div style="color: #FFD700; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
          [[ C0MB0 ]]
        </div>
        <div style="font-size: 32px; color: #FFD700; text-shadow: 0 0 10px #FFD700; font-weight: bold; text-align: center;">
          x${comboCount}
        </div>
        <div style="font-size: 18px; color: #FFA500; text-align: center; margin-top: 5px;">
          ${comboMultiplier.toFixed(1)}x MULT1PL13R
        </div>
      `;
    } else {
      comboCounter.style.display = 'none';
    }
  }
  
  public showMysteryReveal(message: string): void {
    // Create mystery reveal effect
    let mysteryReveal = document.getElementById('mystery-reveal');
    if (!mysteryReveal) {
      mysteryReveal = this.createUIContainer({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '42px',
        fontWeight: 'bold',
        color: '#9400D3',
        textShadow: '0 0 40px #9400D3, 0 0 80px #9400D3',
        letterSpacing: '6px',
        textAlign: 'center',
        zIndex: '1001',
        opacity: '0',
        transition: 'none',
        pointerEvents: 'none',
        textTransform: 'uppercase',
        background: 'radial-gradient(ellipse at center, rgba(148,0,211,0.3) 0%, transparent 70%)',
        padding: '40px 60px',
        borderRadius: '20px'
      }, 'mystery-reveal');
      document.body.appendChild(mysteryReveal);
    }
    
    mysteryReveal.textContent = message;
    
    // Epic reveal animation
    mysteryReveal.style.opacity = '0';
    mysteryReveal.style.transform = 'translate(-50%, -50%) scale(0) rotate(720deg)';
    mysteryReveal.style.filter = 'blur(10px)';
    
    // Force reflow
    mysteryReveal.offsetHeight;
    
    mysteryReveal.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    mysteryReveal.style.opacity = '1';
    mysteryReveal.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
    mysteryReveal.style.filter = 'blur(0px)';
    
    // Add particle burst effect
    this.createMysteryParticles();
    
    // Hide after delay
    setTimeout(() => {
      mysteryReveal.style.transition = 'all 0.3s ease-in';
      mysteryReveal.style.opacity = '0';
      mysteryReveal.style.transform = 'translate(-50%, -50%) scale(1.5)';
      mysteryReveal.style.filter = 'blur(5px)';
    }, 2500);
  }
  
  private createMysteryParticles(): void {
    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 1px;
      height: 1px;
      pointer-events: none;
      z-index: 1000;
    `;
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      const angle = (i / 20) * Math.PI * 2;
      const speed = 200 + Math.random() * 200;
      
      particle.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: #9400D3;
        border-radius: 50%;
        box-shadow: 0 0 10px #9400D3;
        animation: mysteryParticle 1s ease-out forwards;
      `;
      
      particle.style.setProperty('--dx', `${Math.cos(angle) * speed}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * speed}px`);
      
      particleContainer.appendChild(particle);
    }
    
    document.body.appendChild(particleContainer);
    
    // Remove after animation
    setTimeout(() => {
      document.body.removeChild(particleContainer);
    }, 1000);
  }
  
  public showTargetSpawn(message: string, type: TargetType): void {
    // Create or get spawn notification
    let spawnNotify = document.getElementById('target-spawn');
    if (!spawnNotify) {
      spawnNotify = this.createUIContainer({
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '24px',
        fontWeight: 'bold',
        textShadow: '0 0 20px currentColor',
        letterSpacing: '3px',
        textAlign: 'center',
        zIndex: '999',
        opacity: '0',
        transition: 'all 0.4s ease-out',
        pointerEvents: 'none',
        textTransform: 'uppercase',
        background: 'rgba(0,0,0,0.7)',
        padding: '15px 30px',
        borderRadius: '10px',
        border: '2px solid currentColor'
      }, 'target-spawn');
      document.body.appendChild(spawnNotify);
    }
    
    const color = this.getTargetColor(type);
    spawnNotify.style.color = color;
    spawnNotify.style.borderColor = color;
    spawnNotify.textContent = message;
    
    // Animate in from top
    spawnNotify.style.opacity = '0';
    spawnNotify.style.transform = 'translateX(-50%) translateY(-50px)';
    
    // Force reflow
    spawnNotify.offsetHeight;
    
    spawnNotify.style.opacity = '1';
    spawnNotify.style.transform = 'translateX(-50%) translateY(0)';
    
    // Add glow pulse
    spawnNotify.style.animation = 'spawnPulse 0.6s ease-out';
    
    // Hide after delay
    setTimeout(() => {
      spawnNotify.style.opacity = '0';
      spawnNotify.style.transform = 'translateX(-50%) translateY(50px)';
      spawnNotify.style.animation = '';
    }, 2000);
  }
}