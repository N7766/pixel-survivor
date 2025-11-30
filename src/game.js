/**
 * Pixel Survivor - Refactored & Polished (Chinese Version)
 * Built with Phaser 3
 */

// ----------------------------------------------------------------------------
// Configuration Constants
// ----------------------------------------------------------------------------

const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;

// Colors
const COLOR_BG = 0x222222;
const COLOR_PLAYER = 0x00ff00; // Bright Green
const COLOR_ENEMY_NORMAL = 0xff0000; // Red
const COLOR_ENEMY_FAST = 0xffaa00;   // Orange
const COLOR_ENEMY_TANK = 0x880088;   // Purple
const COLOR_BULLET = 0xffff00; // Yellow
const COLOR_ORBIT = 0x0088ff;  // Blue (Orbit weapon)
const COLOR_XP = 0x00ffff;     // Cyan
const COLOR_PARTICLE = 0xffffff; 

// Base Stats
const PLAYER_SPEED_BASE = 160;
const PLAYER_HP_BASE = 5;
const MAGNET_RADIUS_BASE = 100;

// Font style for Chinese text
const FONT_STYLE = { 
    fontFamily: '"Microsoft YaHei", "SimHei", sans-serif', 
    fontSize: '12px', 
    fill: '#ffffff', 
    stroke: '#000000', 
    strokeThickness: 2 
};

// ----------------------------------------------------------------------------
// Scene 1: BootScene
// Preloads assets and creates procedural textures
// ----------------------------------------------------------------------------
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        // 1. Player (Green Box)
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(COLOR_PLAYER, 1);
        graphics.fillRect(0, 0, 12, 12);
        graphics.generateTexture('player', 12, 12);

        // 2. Enemy Types
        // Normal (Red Box)
        graphics.clear();
        graphics.fillStyle(COLOR_ENEMY_NORMAL, 1);
        graphics.fillRect(0, 0, 12, 12);
        graphics.generateTexture('enemy_normal', 12, 12);

        // Fast (Orange Small Box)
        graphics.clear();
        graphics.fillStyle(COLOR_ENEMY_FAST, 1);
        graphics.fillRect(0, 0, 8, 8);
        graphics.generateTexture('enemy_fast', 8, 8);

        // Tank (Purple Big Box)
        graphics.clear();
        graphics.fillStyle(COLOR_ENEMY_TANK, 1);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('enemy_tank', 16, 16);

        // 3. Projectiles
        // Basic Bullet
        graphics.clear();
        graphics.fillStyle(COLOR_BULLET, 1);
        graphics.fillRect(0, 0, 4, 4);
        graphics.generateTexture('bullet', 4, 4);

        // Orbit Orb
        graphics.clear();
        graphics.fillStyle(COLOR_ORBIT, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('orbit_orb', 8, 8);

        // 4. Pickups & FX
        // XP Gem
        graphics.clear();
        graphics.fillStyle(COLOR_XP, 1);
        graphics.fillCircle(3, 3, 3);
        graphics.generateTexture('gem', 6, 6);

        // Particle
        graphics.clear();
        graphics.fillStyle(COLOR_PARTICLE, 1);
        graphics.fillRect(0, 0, 2, 2);
        graphics.generateTexture('particle', 2, 2);

        this.scene.start('MainMenuScene');
    }
}

// ----------------------------------------------------------------------------
// Scene 2: MainMenuScene
// Start Screen (Chinese)
// ----------------------------------------------------------------------------
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        // Title
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'PIXEL SURVIVOR', {
            ...FONT_STYLE,
            fontSize: '32px',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Start Prompt
        let startText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '按回车键开始游戏', {
            ...FONT_STYLE,
            fontSize: '16px',
            fill: '#cccccc'
        }).setOrigin(0.5);

        // Blinking
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Inputs
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('GameScene'));
        this.input.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// ----------------------------------------------------------------------------
// Scene 3: GameScene
// Core Gameplay
// ----------------------------------------------------------------------------
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // --- Game State ---
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 5; // Low for testing/first level
        this.kills = 0;
        this.survivalTime = 0;
        this.isGameOver = false;
        this.isChoosingUpgrade = false; // Flag for upgrade UI state
        this.isPaused = false;          // Flag for manual pause

        // Player Stats
        this.playerStats = {
            maxHp: PLAYER_HP_BASE,
            hp: PLAYER_HP_BASE,
            speed: PLAYER_SPEED_BASE,
            pickupRange: MAGNET_RADIUS_BASE
        };

        // Weapon System
        this.weapon = {
            type: 'single', // 'single', 'spread'
            damage: 1,
            cooldown: 800,  // ms
            hasOrbit: false,
            orbitCount: 0,
            orbitDamage: 1,
            orbitSpeed: 2   // Rotation speed
        };

        // Upgrade Definitions (Chinese)
        this.initUpgradePool();

        // --- World & Physics ---
        this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.add.grid(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 32, 32, 0x222222, 1, 0x333333, 1);

        // --- Groups ---
        this.enemies = this.physics.add.group();
        this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 100 });
        this.orbitGroup = this.physics.add.group({ defaultKey: 'orbit_orb', maxSize: 10 });
        this.gems = this.physics.add.group();

        // --- Particles ---
        this.deathEmitter = this.add.particles(0, 0, 'particle', {
            lifespan: 400,
            speed: { min: 50, max: 150 },
            scale: { start: 1.5, end: 0 },
            quantity: 6,
            emitting: false
        });

        // --- Player ---
        this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // --- Inputs ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());

        // --- Timers ---
        this.lastFired = 0;
        this.nextSpawnTime = 0;
        
        // Difficulty Manager
        this.difficulty = {
            spawnInterval: 2000,
            enemySpeedBase: 50,
            enemyHpBase: 2,
            weightNormal: 100,
            weightFast: 0,
            weightTank: 0
        };

        // --- UI & Overlay ---
        this.createUI();
        this.createUpgradeUI(); // Initialize the container but hide it

        // --- Collisions ---
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHitEnemy, null, this);
        this.physics.add.overlap(this.orbitGroup, this.enemies, this.handleOrbitHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.handleEnemyTouchPlayer, null, this);
        this.physics.add.overlap(this.player, this.gems, this.handlePickGem, null, this);
    }

    initUpgradePool() {
        // Define all possible upgrades here
        this.upgradePool = [
            {
                id: 'max_hp_up',
                name: '增加生命上限',
                description: '最大生命 +1，并立即回复 1 点生命。',
                apply: () => {
                    this.playerStats.maxHp++;
                    this.playerStats.hp = Math.min(this.playerStats.hp + 1, this.playerStats.maxHp);
                }
            },
            {
                id: 'move_speed_up',
                name: '提高移动速度',
                description: '移动速度提升 10%。',
                apply: () => { this.playerStats.speed *= 1.1; }
            },
            {
                id: 'cooldown_down',
                name: '缩短攻击冷却',
                description: '攻击间隔缩短 10%。',
                apply: () => { this.weapon.cooldown *= 0.9; }
            },
            {
                id: 'damage_up',
                name: '提升子弹伤害',
                description: '子弹伤害 +1。',
                apply: () => { this.weapon.damage++; }
            },
            {
                id: 'xp_gain',
                name: '增加经验获取',
                description: '经验获取效率略微提升 (模拟)。', 
                // Simulating XP gain by lowering requirement slightly for next levels or just filler
                apply: () => { /* Logic simplified: just a stat boost or filler for now */ }
            },
            {
                id: 'pickup_range',
                name: '增加拾取范围',
                description: '磁铁范围扩大 20%。',
                apply: () => { this.playerStats.pickupRange *= 1.2; }
            },
            {
                id: 'unlock_spread',
                name: '解锁散射',
                description: '攻击变为一次发射 3 发子弹。',
                apply: () => { this.weapon.type = 'spread'; }
            },
            {
                id: 'unlock_orbit',
                name: '解锁环绕法球',
                description: '在身边生成旋转法球保护自己。',
                apply: () => { 
                    this.weapon.hasOrbit = true; 
                    this.weapon.orbitCount += 2; // Add 2 orbs
                    this.spawnOrbits();
                }
            }
        ];
    }

    // --- Pause System ---
    togglePause() {
        if (this.isGameOver || this.isChoosingUpgrade) return;

        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.physics.pause();
            this.pauseText.setVisible(true);
        } else {
            this.physics.resume();
            this.pauseText.setVisible(false);
        }
    }

    // --- Main Loop ---
    update(time, delta) {
        // Stop updates if game over, paused manually, or choosing upgrade
        if (this.isGameOver || this.isPaused || this.isChoosingUpgrade) return;

        // 1. Time & Difficulty
        this.survivalTime += delta / 1000;
        this.timeText.setText(`时间: ${this.survivalTime.toFixed(1)} 秒`);
        this.updateDifficulty(this.survivalTime);

        // 2. Player Logic
        this.handlePlayerMovement(delta);
        this.handleMagnet();

        // 3. Weapon Logic (Auto Attack)
        if (time > this.lastFired + this.weapon.cooldown) {
            this.fireWeapon();
            this.lastFired = time;
        }
        // Update Orbits (always rotate if active)
        if (this.weapon.hasOrbit) {
            this.updateOrbits();
        }

        // 4. Spawning
        if (time > this.nextSpawnTime) {
            this.spawnEnemy();
            this.nextSpawnTime = time + this.difficulty.spawnInterval;
        }

        // 5. Enemy AI
        this.enemies.getChildren().forEach(enemy => {
            this.physics.moveToObject(enemy, this.player, enemy.speed);
        });

        // 6. Cleanup Bullets
        this.bullets.getChildren().forEach(bullet => {
            if (!this.physics.world.bounds.contains(bullet.x, bullet.y)) {
                bullet.destroy();
            }
        });
    }

    // --- Difficulty Scaling ---
    updateDifficulty(t) {
        // t is time in seconds
        if (t < 30) {
            // Early game: Only Normal enemies
            this.difficulty.spawnInterval = 1500;
            this.difficulty.weightNormal = 100;
            this.difficulty.weightFast = 0;
            this.difficulty.weightTank = 0;
        } else if (t < 60) {
            // Mid game: Add Fast enemies
            this.difficulty.spawnInterval = 1000;
            this.difficulty.weightNormal = 70;
            this.difficulty.weightFast = 30;
            this.difficulty.weightTank = 0;
        } else {
            // Late game: Add Tanks, faster spawns
            const ramp = Math.min((t - 60) / 120, 1); // 0 to 1 ramping over 2 mins
            this.difficulty.spawnInterval = Math.max(400, 1000 - ramp * 600);
            
            this.difficulty.weightNormal = 50;
            this.difficulty.weightFast = 30;
            this.difficulty.weightTank = 20;
        }
    }

    // --- Weapon Systems ---
    fireWeapon() {
        // Find nearest enemy
        let nearest = null;
        let minDist = Infinity;
        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        if (!nearest) return;

        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y);

        if (this.weapon.type === 'spread') {
            // Fire 3 bullets: -15, 0, +15 degrees
            this.fireBullet(angle);
            this.fireBullet(angle - 0.26); // ~15 deg
            this.fireBullet(angle + 0.26);
        } else {
            // Single shot
            this.fireBullet(angle);
        }
    }

    fireBullet(angle) {
        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
        const speed = 350; // Fixed bullet speed for now
        bullet.setRotation(angle);
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        // Store damage on bullet
        bullet.damage = this.weapon.damage;
    }

    spawnOrbits() {
        this.orbitGroup.clear(true, true); // Reset existing
        const radius = 40;
        for (let i = 0; i < this.weapon.orbitCount; i++) {
            const orb = this.orbitGroup.create(this.player.x, this.player.y, 'orbit_orb');
            orb.setCircle(4);
            orb.orbitAngle = (i / this.weapon.orbitCount) * Math.PI * 2; // Distribute evenly
            orb.orbitRadius = radius;
        }
    }

    updateOrbits() {
        const speed = this.weapon.orbitSpeed * 0.02; // Rotation speed factor
        this.orbitGroup.getChildren().forEach(orb => {
            orb.orbitAngle += speed;
            orb.x = this.player.x + Math.cos(orb.orbitAngle) * orb.orbitRadius;
            orb.y = this.player.y + Math.sin(orb.orbitAngle) * orb.orbitRadius;
        });
    }

    // --- Spawning Logic ---
    spawnEnemy() {
        // Pick position at edge
        let x, y;
        const edge = Phaser.Math.Between(0, 3);
        switch(edge) {
            case 0: x = Phaser.Math.Between(0, GAME_WIDTH); y = -20; break;
            case 1: x = GAME_WIDTH + 20; y = Phaser.Math.Between(0, GAME_HEIGHT); break;
            case 2: x = Phaser.Math.Between(0, GAME_WIDTH); y = GAME_HEIGHT + 20; break;
            case 3: x = -20; y = Phaser.Math.Between(0, GAME_HEIGHT); break;
        }

        // Weighted Random Type
        const roll = Phaser.Math.Between(0, 100);
        let type = 'normal';
        let wN = this.difficulty.weightNormal;
        let wF = this.difficulty.weightFast;
        
        if (roll < wN) type = 'normal';
        else if (roll < wN + wF) type = 'fast';
        else type = 'tank';

        // Create Enemy based on type
        let texture = 'enemy_normal';
        let hp = this.difficulty.enemyHpBase;
        let speed = this.difficulty.enemySpeedBase;

        if (type === 'fast') {
            texture = 'enemy_fast';
            hp = Math.max(1, Math.floor(hp * 0.6));
            speed *= 1.5;
        } else if (type === 'tank') {
            texture = 'enemy_tank';
            hp *= 3;
            speed *= 0.6;
        }

        // Scale HP with time slightly
        hp += Math.floor(this.survivalTime / 45); 

        const enemy = this.enemies.create(x, y, texture);
        enemy.hp = hp;
        enemy.speed = speed;
        enemy.type = type;
        enemy.setCollideWorldBounds(false);
    }

    // --- Movement & Magnet ---
    handlePlayerMovement(delta) {
        this.player.setVelocity(0);

        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;

        let dirX = 0, dirY = 0;
        if (left) dirX = -1; else if (right) dirX = 1;
        if (up) dirY = -1; else if (down) dirY = 1;

        if (dirX !== 0 || dirY !== 0) {
            const len = Math.sqrt(dirX*dirX + dirY*dirY);
            const speed = this.playerStats.speed;
            this.player.setVelocity((dirX/len)*speed, (dirY/len)*speed);
        }
    }

    handleMagnet() {
        this.gems.getChildren().forEach(gem => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, gem.x, gem.y);
            if (dist < this.playerStats.pickupRange) {
                this.physics.moveToObject(gem, this.player, 250 + (this.playerStats.pickupRange - dist)*5);
            } else {
                gem.setVelocity(0);
            }
        });
    }

    // --- Collisions ---
    handleBulletHitEnemy(bullet, enemy) {
        bullet.destroy();
        this.damageEnemy(enemy, bullet.damage || 1);
    }

    handleOrbitHitEnemy(orb, enemy) {
        // Simple cooldown for orbit hit via a property on enemy
        if (enemy.invulnOrbit > 0) return;

        this.damageEnemy(enemy, this.weapon.orbitDamage);
        
        // Knockback
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        enemy.x += Math.cos(angle) * 20;
        enemy.y += Math.sin(angle) * 20;

        // Set short immunity to orbit
        enemy.invulnOrbit = 20; // frames (approx 300ms)
    }

    damageEnemy(enemy, amount) {
        enemy.hp -= amount;
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => { if (enemy.active) enemy.clearTint(); });

        if (enemy.hp <= 0) {
            this.deathEmitter.emitParticleAt(enemy.x, enemy.y);
            
            // Drop XP
            const gem = this.gems.create(enemy.x, enemy.y, 'gem');
            gem.setCircle(3);

            enemy.destroy();
            this.kills++;
            this.updateUI();
        }
    }

    handleEnemyTouchPlayer(player, enemy) {
        if (player.alpha < 1) return; // I-frames

        this.playerStats.hp -= 1;
        this.updateUI();

        // Feedback
        this.cameras.main.shake(100, 0.005);
        player.setTint(0xff0000);
        player.setAlpha(0.5);
        this.time.delayedCall(500, () => {
            if (player.active) {
                player.clearTint();
                player.setAlpha(1);
            }
        });

        // Knockback
        const angle = Phaser.Math.Angle.Between(player.x, player.y, enemy.x, enemy.y);
        enemy.x += Math.cos(angle) * 40;
        enemy.y += Math.sin(angle) * 40;

        if (this.playerStats.hp <= 0) {
            this.isGameOver = true;
            this.physics.pause();
            this.player.setTint(0x555555);
            this.time.delayedCall(1000, () => {
                this.scene.start('GameOverScene', { 
                    time: this.survivalTime, 
                    kills: this.kills, 
                    level: this.level 
                });
            });
        }
    }

    handlePickGem(player, gem) {
        gem.destroy();
        this.xp++;
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
        this.updateUI();
    }

    // --- Level Up & UI ---
    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.4);
        this.updateUI();

        // Trigger Upgrade State
        this.isChoosingUpgrade = true;
        this.physics.pause();
        this.showUpgradePanel();
    }

    createUI() {
        // Stats UI
        this.hpText = this.add.text(10, 10, '', FONT_STYLE).setScrollFactor(0).setDepth(100);
        this.timeText = this.add.text(GAME_WIDTH / 2, 10, '', FONT_STYLE).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        this.killText = this.add.text(GAME_WIDTH - 10, 10, '', FONT_STYLE).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

        // XP Bar
        this.xpBarBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 10, GAME_WIDTH - 40, 10, 0x000000).setScrollFactor(0).setDepth(100);
        this.xpBarBg.setStrokeStyle(1, 0xffffff);
        this.xpBarFill = this.add.rectangle((GAME_WIDTH - (GAME_WIDTH - 40)) / 2, GAME_HEIGHT - 10, 0, 8, COLOR_XP).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
        this.levelText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, '', FONT_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(102);

        // Pause Text (Hidden)
        this.pauseText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, '暂停中 - 按 ESC 继续', {
            ...FONT_STYLE, fontSize: '24px'
        }).setOrigin(0.5).setDepth(300).setVisible(false);

        this.updateUI();
    }

    updateUI() {
        this.hpText.setText(`生命: ${Math.ceil(this.playerStats.hp)}/${this.playerStats.maxHp}`);
        this.killText.setText(`击杀: ${this.kills}`);
        this.levelText.setText(`等级 ${this.level}`);
        
        const maxWidth = GAME_WIDTH - 42;
        const ratio = Math.min(this.xp / this.xpToNextLevel, 1);
        this.xpBarFill.width = maxWidth * ratio;
    }

    // --- Upgrade System Implementation ---
    createUpgradeUI() {
        // Create container for all upgrade elements
        this.upgradeContainer = this.add.container(0, 0).setDepth(500).setVisible(false);

        // Background
        const bg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85);
        this.upgradeContainer.add(bg);

        // Title
        const title = this.add.text(GAME_WIDTH/2, 40, '升级！请选择一个加点', {
            ...FONT_STYLE, fontSize: '20px', fill: '#ffff00'
        }).setOrigin(0.5);
        this.upgradeContainer.add(title);

        // We will create card objects dynamically in showUpgradePanel, 
        // or reuse fixed slots. Let's use fixed slots for simplicity.
        this.upgradeSlots = [];
        for (let i = 0; i < 3; i++) {
            const y = 90 + i * 55;
            
            // Card Background (Interactive)
            const card = this.add.rectangle(GAME_WIDTH/2, y, 360, 45, 0x333333).setInteractive();
            
            // Text
            const nameText = this.add.text(GAME_WIDTH/2, y - 10, '', { ...FONT_STYLE, fontSize: '14px', fill: '#ffff00' }).setOrigin(0.5);
            const descText = this.add.text(GAME_WIDTH/2, y + 10, '', { ...FONT_STYLE, fontSize: '10px', fill: '#cccccc' }).setOrigin(0.5);
            
            this.upgradeContainer.add([card, nameText, descText]);
            this.upgradeSlots.push({ card, nameText, descText, upgradeData: null });

            // Events
            card.on('pointerover', () => card.setFillStyle(0x555555));
            card.on('pointerout', () => card.setFillStyle(0x333333));
            card.on('pointerdown', () => {
                if (this.isChoosingUpgrade && this.upgradeSlots[i].upgradeData) {
                    this.selectUpgrade(this.upgradeSlots[i].upgradeData);
                }
            });
        }
    }

    showUpgradePanel() {
        // 1. Pick 3 random upgrades
        const choices = Phaser.Utils.Array.Shuffle([...this.upgradePool]).slice(0, 3);

        // 2. Populate UI
        for (let i = 0; i < 3; i++) {
            const slot = this.upgradeSlots[i];
            const upgrade = choices[i];
            
            if (upgrade) {
                slot.nameText.setText(`${i+1}. ${upgrade.name}`);
                slot.descText.setText(upgrade.description);
                slot.upgradeData = upgrade;
                slot.card.setVisible(true);
                slot.nameText.setVisible(true);
                slot.descText.setVisible(true);
            } else {
                // Should not happen unless pool is empty
                slot.card.setVisible(false);
            }
        }

        // 3. Show Container
        this.upgradeContainer.setVisible(true);

        // 4. Key Listeners
        this.input.keyboard.once('keydown-ONE', () => this.selectUpgrade(choices[0]));
        this.input.keyboard.once('keydown-TWO', () => this.selectUpgrade(choices[1]));
        this.input.keyboard.once('keydown-THREE', () => this.selectUpgrade(choices[2]));
    }

    selectUpgrade(upgrade) {
        if (!upgrade) return;

        // Apply effect
        upgrade.apply();

        // Hide UI
        this.upgradeContainer.setVisible(false);
        this.isChoosingUpgrade = false;
        
        // Resume game
        this.physics.resume();
        this.updateUI();

        // Cleanup unused listeners if clicked instead of pressed
        this.input.keyboard.off('keydown-ONE');
        this.input.keyboard.off('keydown-TWO');
        this.input.keyboard.off('keydown-THREE');
    }
}

// ----------------------------------------------------------------------------
// Scene 4: GameOverScene
// Chinese End Screen
// ----------------------------------------------------------------------------
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.stats = data;
    }

    create() {
        this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9);
        
        this.add.text(GAME_WIDTH/2, 60, '游戏结束', { 
            ...FONT_STYLE, fontSize: '32px', fill: '#ff0000' 
        }).setOrigin(0.5);
        
        const info = `生存时间: ${this.stats.time.toFixed(1)} 秒\n总击杀: ${this.stats.kills}\n最终等级: ${this.stats.level}`;
        this.add.text(GAME_WIDTH/2, 140, info, { 
            ...FONT_STYLE, fontSize: '16px', align: 'center', lineHeight: 24
        }).setOrigin(0.5);

        const btnRetry = this.add.text(GAME_WIDTH/2, 220, '[ 按 R 重新开始 ]', { ...FONT_STYLE, fontSize: '18px' }).setOrigin(0.5).setInteractive();
        const btnMenu = this.add.text(GAME_WIDTH/2, 250, '[ 按 M 返回菜单 ]', { ...FONT_STYLE, fontSize: '18px' }).setOrigin(0.5).setInteractive();

        btnRetry.on('pointerdown', () => this.scene.start('GameScene'));
        btnMenu.on('pointerdown', () => this.scene.start('MainMenuScene'));

        this.input.keyboard.on('keydown-R', () => this.scene.start('GameScene'));
        this.input.keyboard.on('keydown-M', () => this.scene.start('MainMenuScene'));
    }
}

// ----------------------------------------------------------------------------
// Game Configuration
// ----------------------------------------------------------------------------
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: COLOR_BG,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { debug: false, gravity: { x: 0, y: 0 } } },
    scene: [BootScene, MainMenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
