/**
 * Pixel Survivor - Refactored & Polished (Chinese Version)
 * Built with Phaser 3
 */

// ----------------------------------------------------------------------------
// Configuration Constants
// ----------------------------------------------------------------------------

const GAME_WIDTH = 480;
const GAME_HEIGHT = 270;

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;

// Colors
const COLOR_BG = 0x222222;
const COLOR_PLAYER = 0x00ff00; // Bright Green
const COLOR_BULLET = 0xffff00; // Yellow
const COLOR_ORBIT = 0x0088ff;  // Blue (Orbit weapon)
const COLOR_XP = 0x00ffff;     // Cyan
const COLOR_PARTICLE = 0xffffff; 
// Enemy Colors
const COLOR_ENEMY_NORMAL = 0xff0000; 
const COLOR_ENEMY_FAST = 0xffaa00;   
const COLOR_ENEMY_TANK = 0x880088;   
const COLOR_ENEMY_EXPLODER = 0xff5500; // Bright Red/Orange
const COLOR_ENEMY_CHARGER = 0x00ffff;  // Cyan
const COLOR_ENEMY_SPLITTER = 0x00ff00; // Green
const COLOR_ENEMY_BUFFER = 0x9900ff;   // Purple
const COLOR_ENEMY_ELITE = 0xffd700;    // Gold
const COLOR_ENEMY_SNIPER = 0x000088;   // Dark Blue
const COLOR_ENEMY_BULLET = 0xff00ff;   // Magenta

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
// Enemy Definitions
// ----------------------------------------------------------------------------
const ENEMY_TYPES = {
    normal: { id: 'normal', color: COLOR_ENEMY_NORMAL, size: 12, hp: 2, speed: 50, damage: 1, xp: 1, behavior: 'chaser' },
    fast: { id: 'fast', color: COLOR_ENEMY_FAST, size: 8, hp: 1, speed: 85, damage: 1, xp: 1, behavior: 'chaser' },
    tank: { id: 'tank', color: COLOR_ENEMY_TANK, size: 16, hp: 8, speed: 30, damage: 2, xp: 3, behavior: 'chaser' },
    exploder: { id: 'exploder', color: COLOR_ENEMY_EXPLODER, size: 10, hp: 3, speed: 60, damage: 1, xp: 2, behavior: 'exploder', explodeDamage: 2, explodeRadius: 60 },
    charger: { id: 'charger', color: COLOR_ENEMY_CHARGER, size: 12, hp: 4, speed: 40, damage: 1, chargeSpeed: 200, chargeDamage: 2, xp: 2, behavior: 'charger' },
    splitter: { id: 'splitter', color: COLOR_ENEMY_SPLITTER, size: 14, hp: 5, speed: 45, damage: 1, xp: 2, behavior: 'splitter', splitCount: 2, isBig: true },
    splitter_small: { id: 'splitter_small', color: COLOR_ENEMY_SPLITTER, size: 8, hp: 2, speed: 60, damage: 1, xp: 1, behavior: 'chaser', isBig: false },
    buffer: { id: 'buffer', color: COLOR_ENEMY_BUFFER, size: 14, hp: 6, speed: 35, damage: 1, xp: 3, behavior: 'buffer', auraRadius: 80, buffSpeed: 1.5 },
    elite: { id: 'elite', color: COLOR_ENEMY_ELITE, size: 20, hp: 20, speed: 55, damage: 2, xp: 10, behavior: 'chaser' },
    sniper: { id: 'sniper', color: COLOR_ENEMY_SNIPER, size: 12, hp: 4, speed: 40, damage: 1, xp: 3, behavior: 'sniper', range: 150, fireRate: 2000 }
};

// ----------------------------------------------------------------------------
// Scene 1: BootScene
// Preloads assets and creates procedural textures
// ----------------------------------------------------------------------------
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // 1. Player
        this.createRectTexture('player', COLOR_PLAYER, 12, 12);

        // 2. Enemies
        Object.values(ENEMY_TYPES).forEach(type => {
            this.createRectTexture(`enemy_${type.id}`, type.color, type.size, type.size);
        });

        // 3. Projectiles
        this.createRectTexture('bullet', COLOR_BULLET, 4, 4);
        this.createCircleTexture('orbit_orb', COLOR_ORBIT, 4);
        this.createRectTexture('enemy_bullet', COLOR_ENEMY_BULLET, 6, 6);

        // 4. Pickups & FX
        this.createCircleTexture('gem', COLOR_XP, 3);
        this.createRectTexture('particle', COLOR_PARTICLE, 2, 2);

        // 5. Background Grid
        let g = this.make.graphics({x:0, y:0, add:false});
        g.fillStyle(COLOR_BG, 1);
        g.fillRect(0, 0, 32, 32);
        g.lineStyle(1, 0x333333, 1);
        g.strokeRect(0, 0, 32, 32);
        g.generateTexture('bg_grid', 32, 32);

        this.scene.start('MainMenuScene');
    }

    createRectTexture(key, color, w, h) {
        let g = this.make.graphics({x:0, y:0, add:false});
        g.fillStyle(color, 1);
        g.fillRect(0, 0, w, h);
        g.generateTexture(key, w, h);
    }

    createCircleTexture(key, color, r) {
        let g = this.make.graphics({x:0, y:0, add:false});
        g.fillStyle(color, 1);
        g.fillCircle(r, r, r);
        g.generateTexture(key, r*2, r*2);
    }
}

// ----------------------------------------------------------------------------
// Scene 2: MainMenuScene
// Start Screen (Chinese)
// ----------------------------------------------------------------------------
class MainMenuScene extends Phaser.Scene {
    constructor() { super('MainMenuScene'); }

    create() {
        this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 30, 'PIXEL SURVIVOR', { ...FONT_STYLE, fontSize: '32px', strokeThickness: 4 }).setOrigin(0.5);
        let t = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 + 20, '按回车键开始游戏', { ...FONT_STYLE, fontSize: '16px', fill: '#cccccc' }).setOrigin(0.5);
        this.tweens.add({ targets: t, alpha: 0, duration: 800, yoyo: true, repeat: -1 });
        this.input.keyboard.on('keydown-ENTER', () => this.scene.start('GameScene'));
        this.input.on('pointerdown', () => this.scene.start('GameScene'));
    }
}

// ----------------------------------------------------------------------------
// Scene 3: GameScene
// Core Gameplay
// ----------------------------------------------------------------------------
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    create() {
        // --- Game State ---
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 5;
        this.kills = 0;
        this.survivalTime = 0;
        this.isGameOver = false;
        this.isChoosingUpgrade = false;
        this.isPaused = false;
        this.upgradeChoicesCount = 3;

        // Stats
        this.playerStats = {
            maxHp: PLAYER_HP_BASE,
            hp: PLAYER_HP_BASE,
            speed: PLAYER_SPEED_BASE,
            pickupRange: MAGNET_RADIUS_BASE,
            critChance: 0,
            critMultiplier: 1.5,
            damageMultiplier: 1, 
            isBerserker: false,
            hasSlowAura: false,
            hasBurningAura: false,
            hasChainLightning: false,
            shieldCharges: 0,
            dashUnlocked: false,
            dashCooldown: 0
        };

        // Weapon
        this.weapon = {
            type: 'single', 
            damage: 1,
            cooldown: 800,
            hasOrbit: false,
            orbitCount: 0,
            orbitDamage: 1,
            orbitSpeed: 2
        };

        this.initUpgradePool();

        // --- Physics World & Camera ---
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        
        // Background - Tiled across whole world
        this.add.tileSprite(WORLD_WIDTH/2, WORLD_HEIGHT/2, WORLD_WIDTH, WORLD_HEIGHT, 'bg_grid').setDepth(-10);

        // Camera Follow
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.setZoom(1.0); 

        // --- Groups ---
        this.enemies = this.physics.add.group({ runChildUpdate: false }); 
        this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 100 });
        this.enemyBullets = this.physics.add.group({ defaultKey: 'enemy_bullet', maxSize: 50 });
        this.orbitGroup = this.physics.add.group({ defaultKey: 'orbit_orb', maxSize: 20 });
        this.gems = this.physics.add.group();

        // --- Particles ---
        this.deathEmitter = this.add.particles(0, 0, 'particle', {
            lifespan: 400, speed: {min: 50, max: 150}, scale: {start: 1.5, end: 0}, quantity: 6, emitting: false
        });
        this.explodeEmitter = this.add.particles(0, 0, 'particle', {
            lifespan: 300, speed: {min: 100, max: 300}, scale: {start: 2, end: 0}, tint: 0xffaa00, quantity: 20, emitting: false
        });

        // --- Player ---
        this.player = this.physics.add.sprite(WORLD_WIDTH/2, WORLD_HEIGHT/2, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // --- Inputs ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());

        // --- Timers ---
        this.lastFired = 0;
        this.nextSpawnTime = 0;
        this.burningAuraTimer = 0;
        this.shieldTimer = 0;

        this.createUI();
        this.createUpgradeUI();

        // --- Collisions ---
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHitEnemy, null, this);
        this.physics.add.overlap(this.orbitGroup, this.enemies, this.handleOrbitHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.handleEnemyTouchPlayer, null, this);
        this.physics.add.overlap(this.player, this.gems, this.handlePickGem, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.handleEnemyBulletHitPlayer, null, this);
    }

    initUpgradePool() {
        this.upgradePool = [
            // COMMON
            { id: 'max_hp_up', rarity: 'common', name: '增加生命上限', description: '最大生命 +1，并立即回复 1 点生命。', apply: () => { this.playerStats.maxHp++; this.playerStats.hp = Math.min(this.playerStats.hp + 1, this.playerStats.maxHp); } },
            { id: 'move_speed_up', rarity: 'common', name: '提高移动速度', description: '移动速度提升 10%。', apply: () => { this.playerStats.speed *= 1.1; } },
            { id: 'cooldown_down', rarity: 'common', name: '缩短攻击冷却', description: '攻击间隔缩短 10%。', apply: () => { this.weapon.cooldown *= 0.9; } },
            { id: 'damage_up', rarity: 'common', name: '提升子弹伤害', description: '子弹伤害 +1。', apply: () => { this.weapon.damage++; } },
            { id: 'xp_gain', rarity: 'common', name: '增加经验获取', description: '经验获取效率略微提升。', apply: () => { /* Filler */ } },
            { id: 'pickup_range', rarity: 'common', name: '增加拾取范围', description: '磁铁范围扩大 20%。', apply: () => { this.playerStats.pickupRange *= 1.2; } },
            { id: 'unlock_spread', rarity: 'common', name: '解锁散射', description: '攻击变为一次发射 3 发子弹。', apply: () => { this.weapon.type = 'spread'; } },
            { id: 'unlock_orbit', rarity: 'common', name: '解锁环绕法球', description: '在身边生成旋转法球保護自己。', apply: () => { this.weapon.hasOrbit = true; this.weapon.orbitCount += 2; this.spawnOrbits(); } },

            // RARE
            { id: 'overload_fire', rarity: 'rare', name: '超载射击', description: '攻击间隔缩短 30%, 但生命上限 -1 (不会低于 1)。', apply: () => { 
                this.weapon.cooldown *= 0.7; 
                this.playerStats.maxHp = Math.max(1, this.playerStats.maxHp - 1); 
                if (this.playerStats.hp > this.playerStats.maxHp) this.playerStats.hp = this.playerStats.maxHp;
            }},
            { id: 'berserker', rarity: 'rare', name: '狂战之心', description: '生命越低, 伤害越高, 最多提升 50%。', apply: () => { this.playerStats.isBerserker = true; } },
            { id: 'time_slow_aura', rarity: 'rare', name: '时间减速场', description: '靠近你的敌人会被减速 30%。', apply: () => { this.playerStats.hasSlowAura = true; } },
            { id: 'super_magnet', rarity: 'rare', name: '超级磁场', description: '经验吸附范围翻倍。', apply: () => { this.playerStats.pickupRange *= 2; } },
            { id: 'dash_skill', rarity: 'rare', name: '闪现步', description: '解锁空格闪现: 瞬间向移动方向冲刺, 冷却 3 秒。', apply: () => { this.playerStats.dashUnlocked = true; } },
            { id: 'shield_barrier', rarity: 'rare', name: '能量护盾', description: '获得每 20 秒刷新一次的护盾。', apply: () => { this.playerStats.shieldCharges = 1; } },
            { id: 'crit_master', rarity: 'rare', name: '暴击大师', description: '获得 25% 暴击率, 暴击时伤害 x2。', apply: () => { this.playerStats.critChance = 0.25; this.playerStats.critMultiplier = 2; } },
            { id: 'chain_lightning', rarity: 'rare', name: '连锁闪电', description: '击杀敌人时, 电击附近敌人。', apply: () => { this.playerStats.hasChainLightning = true; } },
            { id: 'burning_aura', rarity: 'rare', name: '灼烧领域', description: '靠近你的敌人持续受到伤害。', apply: () => { this.playerStats.hasBurningAura = true; } },
            { id: 'lucky_god', rarity: 'rare', name: '小小欧皇', description: '每次升级额外提供一个选项。', apply: () => { this.upgradeChoicesCount++; } }
        ];
    }

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

    update(time, delta) {
        // FIX: Always align Upgrade UI to Camera to ensure Input Hit Areas match World Coordinates
        if (this.upgradeContainer.visible) {
            this.upgradeContainer.x = this.cameras.main.scrollX + GAME_WIDTH / 2;
            this.upgradeContainer.y = this.cameras.main.scrollY + GAME_HEIGHT / 2;
        }

        if (this.isGameOver || this.isPaused || this.isChoosingUpgrade) return;

        this.survivalTime += delta / 1000;
        this.timeText.setText(`时间: ${this.survivalTime.toFixed(1)} 秒`);

        // Player
        this.handlePlayerMovement(delta);
        this.handleMagnet();
        this.handleSpecialSkills(time, delta);

        // Weapons
        if (time > this.lastFired + this.weapon.cooldown) {
            this.fireWeapon();
            this.lastFired = time;
        }
        if (this.weapon.hasOrbit) this.updateOrbits();

        // Spawning
        if (time > this.nextSpawnTime) {
            this.spawnEnemy();
            const spawnDelay = Math.max(300, 2000 - this.survivalTime * 10);
            this.nextSpawnTime = time + spawnDelay;
        }

        // Entities
        this.updateEnemies(time, delta);
        this.updateProjectiles();
    }

    handleSpecialSkills(time, delta) {
        // Shield Regen
        if (this.playerStats.shieldCharges < 1) {
            this.shieldTimer += delta;
            if (this.shieldTimer >= 20000) { // 20s
                this.playerStats.shieldCharges = 1;
                this.shieldTimer = 0;
                this.add.text(this.player.x, this.player.y - 20, '护盾恢复', FONT_STYLE).destroy({from: true});
            }
        }
        // Burning Aura
        if (this.playerStats.hasBurningAura) {
            this.burningAuraTimer += delta;
            if (this.burningAuraTimer >= 1000) {
                this.burningAuraTimer = 0;
                const radius = 100;
                this.enemies.getChildren().forEach(enemy => {
                    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < radius) {
                        this.damageEnemy(enemy, 1);
                    }
                });
            }
        }
    }

    handlePlayerMovement(delta) {
        this.player.setVelocity(0);

        if (this.playerStats.dashCooldown > 0) this.playerStats.dashCooldown -= delta;

        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;
        const dash = this.cursors.space.isDown || this.wasd.space.isDown;

        let dirX = 0, dirY = 0;
        if (left) dirX = -1; else if (right) dirX = 1;
        if (up) dirY = -1; else if (down) dirY = 1;

        if (dirX !== 0 || dirY !== 0) {
            const len = Math.sqrt(dirX*dirX + dirY*dirY);
            dirX /= len;
            dirY /= len;
        }

        if (dash && this.playerStats.dashUnlocked && this.playerStats.dashCooldown <= 0 && (dirX !== 0 || dirY !== 0)) {
            const dashDist = 100;
            this.player.x += dirX * dashDist;
            this.player.y += dirY * dashDist;
            this.playerStats.dashCooldown = 3000; 
            this.player.x = Phaser.Math.Clamp(this.player.x, 0, WORLD_WIDTH);
            this.player.y = Phaser.Math.Clamp(this.player.y, 0, WORLD_HEIGHT);
            this.deathEmitter.emitParticleAt(this.player.x, this.player.y);
        } else {
            const speed = this.playerStats.speed;
            this.player.setVelocity(dirX * speed, dirY * speed);
        }
    }

    // --- Enemy Logic ---

    getSpawnWeights(t) {
        let w = { normal: 0, fast: 0, tank: 0, exploder: 0, charger: 0, splitter: 0, buffer: 0, elite: 0, sniper: 0 };
        if (t < 30) { w.normal = 80; w.fast = 20; } 
        else if (t < 60) { w.normal = 40; w.fast = 30; w.charger = 15; w.splitter = 15; } 
        else if (t < 90) { w.normal = 20; w.fast = 20; w.tank = 20; w.buffer = 10; w.charger = 15; w.splitter = 15; } 
        else { w.normal = 10; w.fast = 15; w.tank = 15; w.buffer = 10; w.charger = 10; w.splitter = 10; w.exploder = 10; w.elite = 5; w.sniper = 15; }
        return w;
    }

    spawnEnemy() {
        const weights = this.getSpawnWeights(this.survivalTime);
        const pool = [];
        for (const [type, weight] of Object.entries(weights)) {
            for (let i = 0; i < weight; i++) pool.push(type);
        }
        const typeId = Phaser.Utils.Array.GetRandom(pool) || 'normal';
        
        // Radial Spawn Logic (off-screen)
        // Spawn between 300 and 500 px away from player
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(300, 450);
        const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * dist, 20, WORLD_WIDTH - 20);
        const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * dist, 20, WORLD_HEIGHT - 20);

        this.createEnemy(typeId, x, y);
    }

    createEnemy(typeId, x, y, overrideProps = {}) {
        const def = ENEMY_TYPES[typeId];
        if (!def) return;
        const enemy = this.enemies.create(x, y, `enemy_${def.id}`);
        enemy.def = def;
        enemy.hp = def.hp + Math.floor(this.survivalTime / 60);
        enemy.speed = def.speed;
        enemy.typeId = def.id;
        enemy.isBuffed = false;
        if (def.behavior === 'charger') { enemy.chargeState = 'idle'; enemy.chargeTimer = 0; }
        else if (def.behavior === 'sniper') { enemy.fireTimer = 0; }
        Object.assign(enemy, overrideProps);
        enemy.setCollideWorldBounds(true); // Collide with world bounds
        return enemy;
    }

    updateEnemies(time, delta) {
        const buffers = this.enemies.getChildren().filter(e => e.typeId === 'buffer');
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            let speedMult = 1;
            if (this.playerStats.hasSlowAura) {
                if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < 150) speedMult *= 0.7;
            }
            enemy.isBuffed = false;
            buffers.forEach(buffer => {
                if (buffer !== enemy) {
                    if (Phaser.Math.Distance.Between(buffer.x, buffer.y, enemy.x, enemy.y) < buffer.def.auraRadius) {
                        enemy.isBuffed = true;
                        speedMult *= buffer.def.buffSpeed;
                    }
                }
            });

            const finalSpeed = enemy.speed * speedMult;
            if (enemy.def.behavior === 'chaser' || enemy.def.behavior === 'splitter' || enemy.def.behavior === 'buffer' || enemy.def.behavior === 'exploder' || enemy.def.behavior === 'elite') {
                this.physics.moveToObject(enemy, this.player, finalSpeed);
            } 
            else if (enemy.def.behavior === 'charger') {
                enemy.chargeTimer += delta;
                if (enemy.chargeState === 'idle') {
                    this.physics.moveToObject(enemy, this.player, finalSpeed * 0.5);
                    if (enemy.chargeTimer > 3000) {
                        enemy.chargeState = 'charging';
                        enemy.chargeTimer = 0;
                        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                        enemy.chargeVelX = Math.cos(angle) * enemy.def.chargeSpeed;
                        enemy.chargeVelY = Math.sin(angle) * enemy.def.chargeSpeed;
                    }
                } else {
                    enemy.setVelocity(enemy.chargeVelX, enemy.chargeVelY);
                    if (enemy.chargeTimer > 1000) { enemy.chargeState = 'idle'; enemy.chargeTimer = 0; }
                }
            }
            else if (enemy.def.behavior === 'sniper') {
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (dist > enemy.def.range) { this.physics.moveToObject(enemy, this.player, finalSpeed); } 
                else {
                    enemy.setVelocity(0);
                    enemy.fireTimer += delta;
                    if (enemy.fireTimer > enemy.def.fireRate) {
                        enemy.fireTimer = 0;
                        this.fireEnemyBullet(enemy);
                    }
                }
            }
        });
    }

    fireEnemyBullet(source) {
        const bullet = this.enemyBullets.create(source.x, source.y, 'enemy_bullet');
        this.physics.moveToObject(bullet, this.player, 150);
    }

    updateProjectiles() {
        this.bullets.getChildren().forEach(b => { if (!this.physics.world.bounds.contains(b.x, b.y)) b.destroy(); });
        this.enemyBullets.getChildren().forEach(b => { if (!this.physics.world.bounds.contains(b.x, b.y)) b.destroy(); });
    }

    // --- Combat ---

    fireWeapon() {
        let nearest = null;
        let minDist = Infinity;
        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < minDist) { minDist = dist; nearest = enemy; }
        });

        if (!nearest) return;
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y);

        if (this.weapon.type === 'spread') {
            this.fireBullet(angle);
            this.fireBullet(angle - 0.26);
            this.fireBullet(angle + 0.26);
        } else {
            this.fireBullet(angle);
        }
    }

    fireBullet(angle) {
        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
        const speed = 350;
        bullet.setRotation(angle);
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        
        let damage = this.weapon.damage * this.playerStats.damageMultiplier;
        if (this.playerStats.isBerserker) {
            const missingHpPct = 1 - (this.playerStats.hp / this.playerStats.maxHp);
            damage *= (1 + 0.5 * missingHpPct);
        }
        bullet.damage = damage;
    }

    handleBulletHitEnemy(bullet, enemy) {
        bullet.destroy();
        let dmg = bullet.damage || 1;
        if (Math.random() < this.playerStats.critChance) dmg *= this.playerStats.critMultiplier;
        this.damageEnemy(enemy, dmg);
    }

    handleOrbitHitEnemy(orb, enemy) {
        if (enemy.invulnOrbit > 0) return;
        enemy.invulnOrbit = 20; 
        this.damageEnemy(enemy, this.weapon.orbitDamage);
    }

    damageEnemy(enemy, amount) {
        enemy.hp -= amount;
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => { if (enemy.active) enemy.clearTint(); });
        if (enemy.hp <= 0) this.killEnemy(enemy);
    }

    killEnemy(enemy) {
        this.deathEmitter.emitParticleAt(enemy.x, enemy.y);
        if (enemy.def.behavior === 'exploder') this.explodeEnemy(enemy);
        else if (enemy.def.behavior === 'splitter' && enemy.def.isBig) {
            for(let i=0; i<enemy.def.splitCount; i++) {
                this.createEnemy('splitter_small', enemy.x + Phaser.Math.Between(-10,10), enemy.y + Phaser.Math.Between(-10,10));
            }
        }
        if (this.playerStats.hasChainLightning) {
            const targets = this.enemies.getChildren().filter(e => e !== enemy && e.active && Phaser.Math.Distance.Between(e.x, e.y, enemy.x, enemy.y) < 100).slice(0, 3);
            targets.forEach(t => this.damageEnemy(t, 1));
        }
        const gem = this.gems.create(enemy.x, enemy.y, 'gem');
        gem.setCircle(3);
        enemy.destroy();
        this.kills++;
        this.updateUI();
    }

    explodeEnemy(enemy) {
        this.explodeEmitter.emitParticleAt(enemy.x, enemy.y);
        if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < enemy.def.explodeRadius) {
            this.takePlayerDamage(enemy.def.explodeDamage);
        }
    }

    handleEnemyBulletHitPlayer(player, bullet) {
        bullet.destroy();
        this.takePlayerDamage(1);
    }

    handleEnemyTouchPlayer(player, enemy) {
        let damage = enemy.def.damage;
        if (enemy.def.behavior === 'charger' && enemy.chargeState === 'charging') damage = enemy.def.chargeDamage;
        if (enemy.def.behavior === 'exploder') { this.killEnemy(enemy); return; }
        this.takePlayerDamage(damage);
    }

    takePlayerDamage(amount) {
        if (this.player.alpha < 1) return; 
        if (this.playerStats.shieldCharges > 0) {
            this.playerStats.shieldCharges--;
            this.add.text(this.player.x, this.player.y - 20, '格挡!', FONT_STYLE).destroy(); 
            return;
        }
        this.playerStats.hp -= amount;
        this.updateUI();
        this.cameras.main.shake(100, 0.005);
        this.player.setTint(0xff0000);
        this.player.setAlpha(0.5);
        this.time.delayedCall(500, () => { if (this.player.active) { this.player.clearTint(); this.player.setAlpha(1); } });

        if (this.playerStats.hp <= 0) {
            this.isGameOver = true;
            this.physics.pause();
            this.time.delayedCall(1000, () => this.scene.start('GameOverScene', { time: this.survivalTime, kills: this.kills, level: this.level }));
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
    
    handlePickGem(player, gem) {
        gem.destroy();
        this.xp++;
        if (this.xp >= this.xpToNextLevel) this.levelUp();
        this.updateUI();
    }

    spawnOrbits() {
        this.orbitGroup.clear(true, true);
        const radius = 40;
        for (let i = 0; i < this.weapon.orbitCount; i++) {
            const orb = this.orbitGroup.create(this.player.x, this.player.y, 'orbit_orb');
            orb.setCircle(4);
            orb.orbitAngle = (i / this.weapon.orbitCount) * Math.PI * 2;
            orb.orbitRadius = radius;
        }
    }

    updateOrbits() {
        const speed = this.weapon.orbitSpeed * 0.02; 
        this.orbitGroup.getChildren().forEach(orb => {
            orb.orbitAngle += speed;
            orb.x = this.player.x + Math.cos(orb.orbitAngle) * orb.orbitRadius;
            orb.y = this.player.y + Math.sin(orb.orbitAngle) * orb.orbitRadius;
        });
    }

    // --- UI & Level Up ---

    createUI() {
        this.hpText = this.add.text(10, 10, '', FONT_STYLE).setScrollFactor(0).setDepth(100);
        this.timeText = this.add.text(GAME_WIDTH / 2, 10, '', FONT_STYLE).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        this.killText = this.add.text(GAME_WIDTH - 10, 10, '', FONT_STYLE).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

        this.xpBarBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 10, GAME_WIDTH - 40, 10, 0x000000).setScrollFactor(0).setDepth(100);
        this.xpBarBg.setStrokeStyle(1, 0xffffff);
        this.xpBarFill = this.add.rectangle((GAME_WIDTH - (GAME_WIDTH - 40)) / 2, GAME_HEIGHT - 10, 0, 8, COLOR_XP).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
        this.levelText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, '', FONT_STYLE).setOrigin(0.5).setScrollFactor(0).setDepth(102);

        this.pauseText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, '暂停中 - 按 ESC 继续', { ...FONT_STYLE, fontSize: '24px' }).setOrigin(0.5).setDepth(300).setScrollFactor(0).setVisible(false);
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

    createUpgradeUI() {
        // FIX: Remove setScrollFactor(0) from container so we can position it manually in World Space to match Camera
        this.upgradeContainer = this.add.container(GAME_WIDTH/2, GAME_HEIGHT/2).setDepth(500).setVisible(false);
        
        const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.95);
        const title = this.add.text(0, -100, '升级！请选择一个加点', { ...FONT_STYLE, fontSize: '20px', fill: '#ffff00' }).setOrigin(0.5);
        this.upgradeContainer.add([bg, title]);

        this.upgradeSlots = [];
        for (let i = 0; i < 4; i++) {
            const y = -60 + i * 50;
            const card = this.add.rectangle(0, y, 360, 40, 0x333333).setInteractive();
            const nameText = this.add.text(0, y - 8, '', { ...FONT_STYLE, fontSize: '14px', fill: '#ffff00' }).setOrigin(0.5);
            const descText = this.add.text(0, y + 8, '', { ...FONT_STYLE, fontSize: '10px', fill: '#cccccc' }).setOrigin(0.5);
            
            this.upgradeContainer.add([card, nameText, descText]);
            this.upgradeSlots.push({ card, nameText, descText, upgradeData: null });

            card.on('pointerover', () => card.setFillStyle(0x555555));
            card.on('pointerout', () => card.setFillStyle(0x333333));
            card.on('pointerdown', () => {
                if (this.isChoosingUpgrade && this.upgradeSlots[i].upgradeData) {
                    this.selectUpgrade(this.upgradeSlots[i].upgradeData);
                }
            });
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.4);
        this.updateUI();

        this.isChoosingUpgrade = true;
        this.physics.pause();
        this.showUpgradePanel();
    }

    showUpgradePanel() {
        let pool = [];
        this.upgradePool.forEach(up => {
            const w = up.rarity === 'rare' ? 1 : 5;
            for (let k = 0; k < w; k++) pool.push(up);
        });

        const choices = [];
        for (let i = 0; i < this.upgradeChoicesCount; i++) {
            if (pool.length === 0) break;
            const pick = Phaser.Utils.Array.GetRandom(pool);
            choices.push(pick);
            pool = pool.filter(p => p.id !== pick.id);
        }

        this.upgradeSlots.forEach(s => s.card.setVisible(false)); 
        for (let i = 0; i < choices.length; i++) {
            const slot = this.upgradeSlots[i];
            const up = choices[i];
            
            slot.nameText.setText(up.name + (up.rarity === 'rare' ? ' [稀有]' : ''));
            slot.nameText.setColor(up.rarity === 'rare' ? '#ff00ff' : '#ffff00');
            slot.descText.setText(up.description);
            slot.upgradeData = up;
            slot.card.setVisible(true);
            slot.nameText.setVisible(true);
            slot.descText.setVisible(true);
        }
        
        this.upgradeContainer.setVisible(true);
        
        // Set initial position immediately
        this.upgradeContainer.x = this.cameras.main.scrollX + GAME_WIDTH / 2;
        this.upgradeContainer.y = this.cameras.main.scrollY + GAME_HEIGHT / 2;
    }

    selectUpgrade(upgrade) {
        if (!upgrade) return;
        upgrade.apply();
        this.upgradeContainer.setVisible(false);
        this.isChoosingUpgrade = false;
        this.physics.resume();
        this.updateUI();
    }
}

// ----------------------------------------------------------------------------
// Scene 4: GameOverScene
// ----------------------------------------------------------------------------
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    init(data) { this.stats = data; }
    create() {
        this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9);
        this.add.text(GAME_WIDTH/2, 60, '游戏结束', { ...FONT_STYLE, fontSize: '32px', fill: '#ff0000' }).setOrigin(0.5);
        const info = `生存时间: ${this.stats.time.toFixed(1)} 秒\n总击杀: ${this.stats.kills}\n最终等级: ${this.stats.level}`;
        this.add.text(GAME_WIDTH/2, 140, info, { ...FONT_STYLE, fontSize: '16px', align: 'center', lineHeight: 24 }).setOrigin(0.5);
        
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
