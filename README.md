# 🏹 BLEDA: The Epic Horse Archery Game

<div align="center">

```ascii
    ____  __    __________  ___ 
   / __ )/ /   / ____/ __ \/   |
  / __  / /   / __/ / / / / /| |
 / /_/ / /___/ /___/ /_/ / ___ |
/_____/_____/_____/_____/_/  |_|
                                
🐎 Ride. 🎯 Aim. 🏹 Conquer.
```

[![Version](https://img.shields.io/npm/v/bleda?style=for-the-badge&color=ff6b6b)](https://github.com/zopiolabs/Bleda/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/zopiolabs/Bleda/audit-protection.yml?style=for-the-badge&label=Protection%20Audit)](https://github.com/zopiolabs/Bleda/actions)
[![License](https://img.shields.io/badge/license-ISC-blue.svg?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r160-black?style=for-the-badge&logo=three.js)](https://threejs.org/)

**Experience the thrill of mounted archery in this fast-paced 3D browser game!**

[🎮 Play Now](https://zopiolabs.github.io/Bleda/) | [📖 Documentation](#documentation) | [🤝 Contribute](#contributing)

</div>

---

## 📖 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🎮 How to Play](#-how-to-play)
- [🏆 Game Mechanics](#-game-mechanics)
- [💻 Development](#-development)
- [🛠️ Tech Stack](#️-tech-stack)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## 🎯 Overview

**Bleda** is an immersive 3D horse archery game built with Three.js and TypeScript. Inspired by ancient mounted archery traditions, players control a skilled archer riding a galloping horse, shooting arrows at various targets while dodging obstacles and collecting power-ups.

### 🎨 Key Highlights

- **🏇 Dynamic Movement**: Realistic horse galloping with smooth animations
- **🎯 Precision Aiming**: Mouse-controlled bow aiming system
- **💥 Explosive Action**: Special arrows and power-ups for maximum destruction
- **🎪 Varied Challenges**: 10 unique target types with special behaviors
- **🚧 Strategic Obstacles**: Dodge rocks, trees, and birds while maintaining your aim
- **📊 Performance Tracking**: Real-time K/D ratio with dynamic feedback

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎮 Core Gameplay
- **Smooth 3D Graphics** powered by Three.js
- **Responsive Controls** for precise aiming
- **Dynamic Difficulty** that scales with your score
- **Combo System** for chaining hits

</td>
<td width="50%">

### 🎯 Target Variety
- **Standard** - Classic red targets
- **Gold** - High-value targets
- **Speed** - Fast-moving challenges
- **Mystery** - Random point values
- **Explosive** - Chain reaction targets
- *And 5 more unique types!*

</td>
</tr>
<tr>
<td width="50%">

### 💪 Power-Ups
- **🔥 Rapid Fire** - Unleash arrow barrages
- **💥 Explosive Arrows** - Area damage
- **✨ Score Multiplier** - Double your points

</td>
<td width="50%">

### 🚧 Obstacles
- **🪨 Flying Rocks** - Dodge or get stunned
- **🌳 Trees** - Static hazards
- **🦅 Birds** - Moving aerial threats

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/zopiolabs/Bleda.git
cd Bleda

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### 🎯 One-Click Deploy

Deploy your own instance:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zopiolabs/Bleda)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/zopiolabs/Bleda)

---

## 🎮 How to Play

<div align="center">

### 🕹️ Controls

| Action | Control |
|--------|---------|
| **Move Horse** | ⬅️ `A` / `←` or ➡️ `D` / `→` |
| **Aim Bow** | 🖱️ Move Mouse |
| **Shoot Arrow** | 🖱️ Left Click |

### 🎯 Objective
Score as many points as possible by hitting targets while avoiding obstacles!

</div>

---

## 🏆 Game Mechanics

### 📊 Scoring System

| Target Type | Base Points | Special Effect |
|-------------|-------------|----------------|
| 🔴 Standard | 10 | None |
| 🟡 Gold | 50 | Bonus points |
| ⚡ Speed | 30 | Moves quickly |
| ❓ Mystery | 5-100 | Random value |
| 💥 Explosive | 25 | Chain reaction |
| 🔄 Split | 15 | Splits into 3 |
| 📉 Shrinking | 20 | Gets smaller |
| 👻 Ghost | 40 | Phases in/out |
| 🧲 Magnetic | 35 | Attracts arrows |
| 🎁 Bonus | 5-75 | Time-based value |

### 🔥 Combo System

Chain successful hits to multiply your score:
- **2-4 hits**: 1.5x multiplier
- **5-9 hits**: 2x multiplier  
- **10+ hits**: 3x multiplier

### 💫 Power-Up Effects

<details>
<summary>Click to expand power-up details</summary>

| Power-Up | Duration | Effect |
|----------|----------|--------|
| 🔥 Rapid Fire | 5 seconds | 3x faster shooting |
| 💥 Explosive | 3 shots | Area damage on impact |
| ✨ Multiplier | 10 seconds | 2x score bonus |

</details>

### 😵 Stun Mechanics

Getting hit by obstacles stuns you for 2 seconds:
- 🚫 Cannot move
- 🚫 Cannot shoot
- ⚠️ Screen shakes
- 📢 Warning message appears

---

## 💻 Development

### 📦 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run type-check # Run TypeScript type checking
npm run release  # Create new release
```

### 🏗️ Project Structure

```
bleda/
├── src/
│   ├── main.ts          # Entry point
│   ├── game.ts          # Core game logic
│   ├── constants.ts     # Game configuration
│   ├── ui-manager.ts    # UI handling
│   ├── powerup.ts       # Power-up system
│   ├── obstacle.ts      # Obstacle mechanics
│   ├── target.ts        # Target variations
│   └── messages.ts      # Game messages
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript config
```

### 🧪 Architecture Highlights

- **Component-based** design with clear separation of concerns
- **Type-safe** implementation with TypeScript
- **Performance-optimized** with object pooling and efficient rendering
- **Modular systems** for easy extension and maintenance

---

## 🛠️ Tech Stack

<div align="center">

| Technology | Purpose |
|------------|---------|
| ![Three.js](https://img.shields.io/badge/Three.js-black?style=flat-square&logo=three.js&logoColor=white) | 3D Graphics Engine |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Type-Safe Development |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Build Tool & Dev Server |
| ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white) | CI/CD Pipeline |

</div>

---

## 🗺️ Roadmap

### 🎯 Upcoming Features

- [ ] 🏆 Global leaderboard system
- [ ] 🎵 Dynamic soundtrack and SFX
- [ ] 🌍 Multiple environments/levels
- [ ] 🏹 Weapon upgrades and customization


### 🐛 Known Issues

- Performance may vary on older devices
- Occasional collision detection edge cases
- UI scaling on ultra-wide displays

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### 💡 Ways to Contribute

- 🐛 Report bugs and issues
- 💡 Suggest new features
- 🎨 Improve graphics and animations
- 📝 Enhance documentation
- 🌐 Add translations

### 🙏 Contributors

<a href="https://github.com/zopiolabs/Bleda/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=zopiolabs/Bleda" />
</a>

---

## 📜 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 🌟 Star us on GitHub!

If you enjoy playing Bleda, please consider giving us a star ⭐

[**Play Bleda Now! 🎮**](https://zopiolabs.github.io/Bleda/)

Made with ❤️ by the Bleda Team

</div>
