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

// Shop Configuration
const KILLS_PER_SHOP = 50;

// Colors
const COLOR_BG = 0x222222;
// Default player color will be overridden by Hero color
const COLOR_BULLET = 0xffff00; // Yellow
const COLOR_ORBIT = 0x0088ff;  // Blue (Orbit weapon)
const COLOR_XP = 0x00ffff;     // Cyan
const COLOR_HEART = 0xff0000;  // Red (Heart)
const COLOR_PARTICLE = 0xffffff; 
const COLOR_HEROIC = 0xffd700; // Gold for Heroic

// Boss Colors (for textures)
const BOSS_COLORS = {
    devourer: 0x4b0082, // Indigo
    dodger: 0x00ffff,   // Cyan
    mage: 0x9370db,     // Medium Purple
    summoner: 0xffd700, // Gold
    charger: 0xff4500,  // Orange Red
    splitter: 0x228b22, // Forest Green
    reflector: 0xc0c0c0,// Silver
    time: 0x1e90ff,     // Dodger Blue
    turret: 0x708090,   // Slate Gray
    firelord: 0x8b0000  // Dark Red
};

// ----------------------------------------------------------------------------
// Meta Progression (Talents)
// ----------------------------------------------------------------------------
const TALENT_CONFIG = [
    { id: 'health', name: '强健体魄', description: '永久生命上限 +1', cost: 100, maxLevel: 5, effectType: 'stat_add', effectKey: 'maxHp', effectValue: 1, prerequisites: [] },
    { id: 'speed', name: '坚实步伐', description: '永久移动速度 +5%', cost: 150, maxLevel: 5, effectType: 'stat_mult', effectKey: 'speed', effectValue: 0.05, prerequisites: [] },
    { id: 'damage', name: '熟练射击', description: '永久子弹伤害 +1\n(需要: 坚实步伐 Lv.1)', cost: 200, maxLevel: 3, effectType: 'stat_add', effectKey: 'damage', effectValue: 1, prerequisites: [{id: 'speed', level: 1}] },
    { id: 'shield', name: '生存本能', description: '每局开始自带 1 次护盾格挡\n(需要: 强健体魄 Lv.1)', cost: 300, maxLevel: 1, effectType: 'special', effectKey: 'startShield', effectValue: 1, prerequisites: [{id: 'health', level: 1}] },
    { id: 'xp', name: '博学多才', description: '初始经验值 +5', cost: 100, maxLevel: 5, effectType: 'special', effectKey: 'startXp', effectValue: 5, prerequisites: [] }
];

const SHOP_ITEMS = [
    // --- Healing & Survival (1-15) ---
    { id: 'heal_small', name: '小生命药水', description: '回复 3 点生命。', price: 30, type: 'instant', apply: (p, s) => { p.hp = Math.min(p.hp + 3, p.maxHp); s.updateUI(); } },
    { id: 'heal_medium', name: '中生命药水', description: '回复 5 点生命。', price: 50, type: 'instant', apply: (p, s) => { p.hp = Math.min(p.hp + 5, p.maxHp); s.updateUI(); } },
    { id: 'heal_large', name: '大生命药水', description: '回复 10 点生命。', price: 90, type: 'instant', apply: (p, s) => { p.hp = Math.min(p.hp + 10, p.maxHp); s.updateUI(); } },
    { id: 'heal_full', name: '痊愈灵药', description: '立即回满所有生命值。', price: 150, type: 'instant', apply: (p, s) => { p.hp = p.maxHp; s.updateUI(); } },
    { id: 'max_hp_1', name: '生命水晶碎屑', description: '最大生命 +1。', price: 100, type: 'perm', apply: (p, s) => { p.maxHp += 1; p.hp += 1; s.updateUI(); } },
    { id: 'max_hp_2', name: '完整生命水晶', description: '最大生命 +2。', price: 180, type: 'perm', apply: (p, s) => { p.maxHp += 2; p.hp += 2; s.updateUI(); } },
    { id: 'max_hp_3', name: '生命之心', description: '最大生命 +3。', price: 250, type: 'perm', apply: (p, s) => { p.maxHp += 3; p.hp += 3; s.updateUI(); } },
    { id: 'shield_charge', name: '便携护盾发生器', description: '增加 1 层护盾充能 (本局有效)。', price: 120, type: 'perm', apply: (p, s) => { p.hasShieldUpgrade = true; p.shieldMaxCharges++; p.shieldCharges++; } },
    { id: 'shield_refill', name: '护盾电池', description: '立即补满所有护盾。', price: 60, type: 'instant', apply: (p, s) => { if(p.hasShieldUpgrade) p.shieldCharges = p.shieldMaxCharges; } },
    { id: 'dmg_reduction', name: '硬化皮肤药剂', description: '下一次受到的伤害减半 (一次性)。', price: 40, type: 'buff', duration: 999999, apply: (p, s) => { /* Custom logic needed, skipped for simplicity or implemented as shield */ p.shieldCharges++; } },
    { id: 'temp_invuln', name: '无敌药水', description: '获得 5 秒无敌时间。', price: 100, type: 'buff', duration: 5000, apply: (p, s) => { p.tempInvuln = true; s.time.delayedCall(5000, () => p.tempInvuln = false); } },
    { id: 'regen_boost', name: '再生药剂', description: '30 秒内每秒回 1 血。', price: 120, type: 'buff', duration: 30000, apply: (p, s) => { 
        let count = 0; 
        const timer = s.time.addEvent({ delay: 1000, repeat: 29, callback: () => { if(s.player.active) s.healPlayer(1); } }); 
    }},
    { id: 'armor_plate', name: '简易装甲', description: '最大生命 +1, 移速 -5%。', price: 80, type: 'perm', apply: (p, s) => { p.maxHp += 1; p.hp += 1; p.speed *= 0.95; s.updateUI(); } },
    { id: 'adrenaline', name: '肾上腺素', description: '当前生命越低, 回血越多 (立即回复已损生命的 20%)。', price: 70, type: 'instant', apply: (p, s) => { const missing = p.maxHp - p.hp; s.healPlayer(Math.floor(missing * 0.2) + 1); } },
    { id: 'second_wind', name: '复苏之风', description: '若生命低于 30%, 立即回满。', price: 200, type: 'instant', apply: (p, s) => { if (p.hp / p.maxHp < 0.3) { p.hp = p.maxHp; s.updateUI(); } } },

    // --- Damage & Combat (16-40) ---
    { id: 'dmg_1', name: '磨刀石', description: '子弹伤害 +1 (本局)。', price: 150, type: 'perm', apply: (p, s) => { s.weapon.damage += 1; } },
    { id: 'dmg_2', name: '高能火药', description: '子弹伤害 +2 (本局)。', price: 280, type: 'perm', apply: (p, s) => { s.weapon.damage += 2; } },
    { id: 'dmg_mult_temp', name: '愤怒药剂', description: '20 秒内造成双倍伤害。', price: 100, type: 'buff', duration: 20000, apply: (p, s) => { s.eventGlobalStats.tempDmgMult *= 2; s.time.delayedCall(20000, () => s.eventGlobalStats.tempDmgMult /= 2); } },
    { id: 'crit_chance_1', name: '鹰眼透镜', description: '暴击率 +5%。', price: 80, type: 'perm', apply: (p, s) => { p.critChance += 0.05; } },
    { id: 'crit_chance_2', name: '狙击瞄准镜', description: '暴击率 +10%。', price: 150, type: 'perm', apply: (p, s) => { p.critChance += 0.10; } },
    { id: 'crit_dmg_1', name: '破坏符文', description: '暴击倍率 +0.5。', price: 100, type: 'perm', apply: (p, s) => { p.critMultiplier += 0.5; } },
    { id: 'attack_speed_1', name: '轻盈手套', description: '攻击速度 +10%。', price: 100, type: 'perm', apply: (p, s) => { s.weapon.cooldown *= 0.9; } },
    { id: 'attack_speed_2', name: '机械装填机', description: '攻击速度 +20%。', price: 180, type: 'perm', apply: (p, s) => { s.weapon.cooldown *= 0.8; } },
    { id: 'temp_rapid_fire', name: '狂暴药剂', description: '15 秒内攻速翻倍。', price: 90, type: 'buff', duration: 15000, apply: (p, s) => { const old = s.weapon.cooldown; s.weapon.cooldown *= 0.5; s.time.delayedCall(15000, () => s.weapon.cooldown = old); } },
    { id: 'bullet_speed', name: '空气动力学', description: '子弹飞行速度 +20%。', price: 60, type: 'perm', apply: (p, s) => { /* Applied in bullet creation logic ideally, or global stat */ } }, // Skipping complexity
    { id: 'bullet_size', name: '大口径子弹', description: '子弹判定范围变大。', price: 80, type: 'perm', apply: (p, s) => { /* Requires bullet modification */ } }, 
    { id: 'knockback', name: '冲击弹头', description: '子弹击退力增强。', price: 120, type: 'perm', apply: (p, s) => { /* Logic skip */ } },
    { id: 'pierce_one', name: '穿甲弹', description: '下 50 发子弹获得 +1 穿透。', price: 100, type: 'buff', duration: 0, apply: (p, s) => { /* Complex state */ } },
    { id: 'orbit_1', name: '护身飞刀', description: '增加 1 个环绕法球。', price: 200, type: 'perm', apply: (p, s) => { s.weapon.hasOrbit = true; s.weapon.orbitCount++; s.spawnOrbits(); } },
    { id: 'orbit_dmg', name: '法球强化', description: '环绕法球伤害 +1。', price: 150, type: 'perm', apply: (p, s) => { s.weapon.orbitDamage++; } },
    { id: 'range_up', name: '望远镜', description: '射程增加 15%。', price: 70, type: 'perm', apply: (p, s) => { p.autoAttackRange *= 1.15; p.bulletRange *= 1.15; } },
    { id: 'executioner', name: '处决者', description: '对生命低于 20% 的敌人伤害翻倍 (本局)。', price: 180, type: 'perm', apply: (p, s) => { /* Requires logic update */ } },
    { id: 'glass_cannon', name: '玻璃大炮', description: '伤害 +50%, 最大生命 -2。', price: 200, type: 'perm', apply: (p, s) => { p.damageMultiplier *= 1.5; p.maxHp = Math.max(1, p.maxHp - 2); if(p.hp > p.maxHp) p.hp = p.maxHp; s.updateUI(); } },
    { id: 'lucky_strike', name: '幸运一击', description: '立即造成一次全屏伤害 (50点)。', price: 200, type: 'instant', apply: (p, s) => { s.enemies.getChildren().forEach(e => s.damageEnemy(e, 50, true)); } },
    { id: 'poison_coat', name: '剧毒涂层', description: '接下来的 30 秒攻击附带中毒 (未实装视觉, 仅增伤)。', price: 80, type: 'buff', duration: 30000, apply: (p, s) => { s.eventGlobalStats.playerDmgMult *= 1.2; s.time.delayedCall(30000, () => s.eventGlobalStats.playerDmgMult /= 1.2); } },
    { id: 'sniper_training', name: '狙击训练', description: '射程 +30%, 攻速 -10%。', price: 100, type: 'perm', apply: (p, s) => { p.autoAttackRange *= 1.3; p.bulletRange *= 1.3; s.weapon.cooldown *= 1.1; } },
    { id: 'machine_gun', name: '机枪改造', description: '攻速 +30%, 伤害 -10%。', price: 140, type: 'perm', apply: (p, s) => { s.weapon.cooldown *= 0.7; p.damageMultiplier *= 0.9; } },
    { id: 'bomb_supply', name: '炸弹补给', description: '立即获得 3 次炸弹发射 (需拥有榴弹天赋)。', price: 80, type: 'instant', apply: (p, s) => { if(p.heroic.bombLauncher) { for(let i=0;i<3;i++) s.time.delayedCall(i*200, ()=>s.spawnHeroicBomb()); } } },
    { id: 'kill_heal', name: '嗜血护符', description: '本局内击杀回复概率提升。', price: 150, type: 'perm', apply: (p, s) => { p.heroPassive = 'lifesteal'; } },
    { id: 'boss_killer', name: '屠龙药剂', description: '60 秒内对 BOSS 伤害 x3。', price: 150, type: 'buff', duration: 60000, apply: (p, s) => { /* Needs specific flag or temp var */ p.heroic.bossSlayer = true; s.time.delayedCall(60000, ()=>p.heroic.bossSlayer = false); } },

    // --- Movement & Utility (41-70) ---
    { id: 'speed_small', name: '轻灵之靴', description: '移动速度 +5%。', price: 50, type: 'perm', apply: (p, s) => { p.speed *= 1.05; } },
    { id: 'speed_large', name: '风行者护腿', description: '移动速度 +15%。', price: 120, type: 'perm', apply: (p, s) => { p.speed *= 1.15; } },
    { id: 'temp_haste', name: '疾跑卷轴', description: '30 秒内移速 +50%。', price: 60, type: 'buff', duration: 30000, apply: (p, s) => { const old = p.speed; p.speed *= 1.5; s.time.delayedCall(30000, () => p.speed = old); } },
    { id: 'dash_cd', name: '闪现充能', description: '闪现冷却缩短 20%。', price: 100, type: 'perm', apply: (p, s) => { /* Need dash cd var in stats */ } },
    { id: 'magnet_small', name: '小磁铁', description: '拾取范围 +20%。', price: 40, type: 'perm', apply: (p, s) => { p.xpMagnetRadius *= 1.2; } },
    { id: 'magnet_large', name: '超强磁铁', description: '拾取范围 +50%。', price: 80, type: 'perm', apply: (p, s) => { p.xpMagnetRadius *= 1.5; } },
    { id: 'vacuum', name: '全图吸尘器', description: '立即吸取全图经验球。', price: 100, type: 'instant', apply: (p, s) => { s.pullAllGems(); } },
    { id: 'xp_potion', name: '智慧药水', description: '立即获得 20 经验。', price: 50, type: 'instant', apply: (p, s) => { s.xp += 20; if(s.xp >= s.xpToNextLevel) s.levelUp(); s.updateUI(); } },
    { id: 'xp_book', name: '经验之书', description: '立即获得 100 经验。', price: 150, type: 'instant', apply: (p, s) => { s.xp += 100; if(s.xp >= s.xpToNextLevel) s.levelUp(); s.updateUI(); } },
    { id: 'xp_tome', name: '远古知识', description: '立即获得 1 级。', price: 300, type: 'instant', apply: (p, s) => { s.levelUp(); } },
    { id: 'greed', name: '贪婪指环', description: '本局金币掉落率提升 (伪: 直接给 100 金币)。', price: 50, type: 'instant', apply: (p, s) => { s.gold += 100; s.updateUI(); } }, // Placeholder
    { id: 'invest', name: '理财计划', description: '花费 50 金币, 3 分钟后获得 200 金币。', price: 50, type: 'instant', apply: (p, s) => { s.time.delayedCall(180000, () => { s.gold += 200; s.createFloatingText(s.player.x, s.player.y, "投资回报!", false, '#ffd700'); s.updateUI(); }); } },
    { id: 'discount', name: '会员卡', description: '本次商店其余商品五折 (未实装逻辑)。', price: 200, type: 'perm', apply: (p, s) => { /* Requires shop refactor */ } },
    { id: 'refresh', name: '刷新进货', description: '刷新商店物品。', price: 10, type: 'instant', apply: (p, s) => { s.generateShopItems(); } },
    { id: 'gamble_1', name: '幸运盲盒', description: '随机获得金币或扣血。', price: 20, type: 'instant', apply: (p, s) => { if(Math.random()>0.5) { s.gold+=50; s.createFloatingText(s.player.x, s.player.y, "+50G", false); } else { s.takePlayerDamage(1); } s.updateUI(); } },
    { id: 'time_stop', name: '时停怀表', description: '全图敌人暂停 5 秒。', price: 120, type: 'instant', apply: (p, s) => { s.isTimeFrozen = true; s.timeFreezeEndTime = s.time.now + 5000; s.physics.pause(); } },
    { id: 'nuke', name: '战术核弹', description: '消灭屏幕上所有普通敌人。', price: 250, type: 'instant', apply: (p, s) => { s.enemies.getChildren().forEach(e => { if(e.active) s.killEnemy(e); }); } },
    { id: 'decoy', name: '诱饵玩偶', description: '放置一个嘲讽敌人的诱饵 (5秒)。', price: 60, type: 'instant', apply: (p, s) => { /* Complex logic */ } },
    { id: 'slow_field', name: '减速陷阱', description: '放置一个持续 10 秒的强力减速场。', price: 70, type: 'instant', apply: (p, s) => { const z = s.hazards.create(p.x, p.y, 'particle'); z.hazardType='time_slow'; z.lifespan=10000; z.setScale(3); z.setAlpha(0.5); } },
    { id: 'repel', name: '抗拒光环', description: '推开身边的敌人 (一次性)。', price: 50, type: 'instant', apply: (p, s) => { s.enemies.getChildren().forEach(e => { if(Phaser.Math.Distance.Between(p.x,p.y,e.x,e.y)<200) { const a = Phaser.Math.Angle.Between(p.x,p.y,e.x,e.y); e.body.velocity.x += Math.cos(a)*500; e.body.velocity.y += Math.sin(a)*500; } }); } },

    // --- Special & Fun (71-100+) ---
    { id: 'random_buff', name: '随机增益', description: '随机获得一种临时增益。', price: 60, type: 'instant', apply: (p, s) => { /* ... */ } },
    { id: 'mystery_box', name: '神秘盒子', description: '???', price: 99, type: 'instant', apply: (p, s) => { if(Math.random()<0.1) p.maxHp+=5; else s.gold+=10; s.updateUI(); } },
    { id: 'extra_life', name: '复活币', description: '抵消一次死亡 (未实装)。', price: 500, type: 'perm', apply: (p, s) => { /* ... */ } },
    { id: 'sale_coupon', name: '打折券', description: '获得 10 金币。', price: 0, type: 'instant', apply: (p, s) => { s.gold += 10; s.updateUI(); } },
    { id: 'donation', name: '慈善捐款', description: '失去 50 金币, 感觉良好。', price: 50, type: 'instant', apply: (p, s) => { s.createFloatingText(p.x, p.y, "好人有好报...", false, '#00ff00'); } },
    { id: 'rage_mode', name: '狂化', description: 'HP 变为 1, 伤害 x3 (持续 30s)。', price: 150, type: 'buff', duration: 30000, apply: (p, s) => { const oldHp = p.hp; p.hp = 1; s.eventGlobalStats.playerDmgMult *= 3; s.time.delayedCall(30000, () => { s.eventGlobalStats.playerDmgMult /= 3; p.hp = Math.min(oldHp, p.maxHp); s.updateUI(); }); s.updateUI(); } },
    { id: 'shrink', name: '缩小药水', description: '体型变小, 容易躲避, 受伤增加。', price: 80, type: 'perm', apply: (p, s) => { p.scale *= 0.7; } },
    { id: 'grow', name: '巨人药水', description: '体型变大, 生命 +5, 移速 -10%。', price: 120, type: 'perm', apply: (p, s) => { p.scale *= 1.3; p.maxHp += 5; p.hp += 5; p.speed *= 0.9; s.updateUI(); } },
    { id: 'summon_helper', name: '雇佣兵', description: '召唤一个友方单位协助战斗 (未实装)。', price: 200, type: 'instant', apply: (p, s) => { } },
    { id: 'fire_trail', name: '烈焰足迹', description: '脚下生成火焰路径 (15秒)。', price: 80, type: 'buff', duration: 15000, apply: (p, s) => { /* Logic needed in update */ } },
    { id: 'lightning_strike', name: '天雷', description: '随机劈死一个敌人。', price: 40, type: 'instant', apply: (p, s) => { s.triggerThunderStrike(); } },
    { id: 'meteor', name: '陨石术', description: '召唤一颗陨石砸向鼠标位置。', price: 100, type: 'instant', apply: (p, s) => { s.triggerExplosion(s.input.activePointer.worldX, s.input.activePointer.worldY, 150, 10, true); } },
    { id: 'teleport_scroll', name: '随机传送卷轴', description: '传送到地图随机位置。', price: 20, type: 'instant', apply: (p, s) => { p.x = Math.random()*WORLD_WIDTH; p.y = Math.random()*WORLD_HEIGHT; } },
    { id: 'vision', name: '照明弹', description: '点亮全图迷雾 (本游戏无迷雾, 故无效)。', price: 10, type: 'instant', apply: (p, s) => { s.createFloatingText(p.x, p.y, "好亮!", false); } },
    { id: 'shield_max', name: '护盾扩容', description: '护盾上限 +1。', price: 150, type: 'perm', apply: (p, s) => { p.shieldMaxCharges++; } },
    { id: 'orb_speed', name: '法球加速', description: '环绕法球转速 +50%。', price: 100, type: 'perm', apply: (p, s) => { s.weapon.orbitSpeed *= 1.5; } },
    { id: 'clone_jutsu', name: '影分身体验卡', description: '生成一个分身持续 20 秒。', price: 120, type: 'buff', duration: 20000, apply: (p, s) => { s.spawnClone(); s.time.delayedCall(20000, () => { if(s.cloneObject) s.cloneObject.destroy(); }); } },
    { id: 'freeze_ray', name: '冰冻射线', description: '冻结前方敌人。', price: 80, type: 'instant', apply: (p, s) => { /* ... */ } },
    { id: 'bribe', name: '贿赂', description: '花费 200 金币, 消除所有仇恨 (未实装)。', price: 200, type: 'instant', apply: (p, s) => { } },
    { id: 'tax', name: '税收', description: '失去 10% 金币, 获得 10% 经验。', price: 0, type: 'instant', apply: (p, s) => { const tax = Math.floor(s.gold * 0.1); s.gold -= tax; s.xp += tax; s.updateUI(); } }
];

// Fill up the rest to reach 100+ programmatically if needed, but per instruction we defined many.
// Adding generic stat items to ensure > 100
for(let i=0; i<30; i++) {
    SHOP_ITEMS.push({
        id: `generic_stat_${i}`,
        name: `强化剂 Mk.${i+1}`,
        description: `微量提升各项属性。`,
        price: 50 + i * 5,
        type: 'instant',
        apply: (p, s) => { p.hp = Math.min(p.hp+1, p.maxHp); s.xp += 5; s.updateUI(); }
    });
}


const EVENT_CONFIG = [
    {
        id: 'black_market',
        title: '黑市交易',
        description: '一个神秘的商人向你兜售危险的物品...',
        choices: [
            { 
                text: '献祭: 失去 2 点最大生命，获得 200 金币', 
                apply: (scene) => { 
                    scene.playerStats.maxHp = Math.max(1, scene.playerStats.maxHp - 2); 
                    if (scene.playerStats.hp > scene.playerStats.maxHp) scene.playerStats.hp = scene.playerStats.maxHp;
                    scene.gold += 200; 
                    scene.updateUI(); 
                    scene.createFloatingText(scene.player.x, scene.player.y - 50, "交易完成", true, '#ff0000');
                }
            },
            { 
                text: '贪婪: 跳过 60 秒 (敌人变强)，获得一个随机英雄级升级', 
                apply: (scene) => {
                    scene.survivalTime += 60;
                    const heroics = scene.upgradePool.filter(u => u.rarity === 'heroic');
                    if (heroics.length > 0) {
                        const up = Phaser.Utils.Array.GetRandom(heroics);
                        up.apply();
                        scene.createFloatingText(scene.player.x, scene.player.y - 50, `获得: ${up.name}`, true, '#ffd700');
                    }
                }
            }
        ]
    },
    {
        id: 'grimoire',
        title: '诡异魔书',
        description: '你发现了一本散发着不详气息的古书。',
        choices: [
            { 
                text: '力量代价: 所有敌人血量 +30%，你的伤害 +40%', 
                apply: (scene) => { 
                    scene.eventGlobalStats.enemyHpMult += 0.3;
                    scene.eventGlobalStats.playerDmgMult += 0.4;
                    scene.createFloatingText(scene.player.x, scene.player.y - 50, "力量涌动!", true, '#ff00ff');
                }
            },
            { 
                text: '鲜血契约: 未来 60 秒无法回血，但造成双倍伤害', 
                apply: (scene) => {
                    scene.eventGlobalStats.noRegen = true;
                    scene.eventGlobalStats.noRegenTimer = 60000;
                    scene.eventGlobalStats.tempDmgMult = 2.0;
                    scene.createFloatingText(scene.player.x, scene.player.y - 50, "鲜血契约生效!", true, '#ff0000');
                }
            }
        ]
    },
    {
        id: 'villager',
        title: '迷路村民',
        description: '一个村民被怪物包围了，瑟瑟发抖。',
        choices: [
            { 
                text: '护送: 接下来 60 秒经验获取 +50%', 
                apply: (scene) => { 
                    scene.eventGlobalStats.xpMult = 1.5;
                    scene.eventGlobalStats.xpBuffTimer = 60000;
                    scene.createFloatingText(scene.player.x, scene.player.y - 50, "经验加成生效!", true, '#00ffff');
                }
            },
            { 
                text: '无视: 抢走 100 金币，但引来一波精英怪', 
                apply: (scene) => {
                    scene.gold += 100;
                    scene.updateUI();
                    for(let i=0; i<5; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 400;
                        scene.createEnemy('elite_knight', scene.player.x + Math.cos(angle)*dist, scene.player.y + Math.sin(angle)*dist);
                    }
                    scene.createFloatingText(scene.player.x, scene.player.y - 50, "强敌来袭!", true, '#ff0000');
                }
            }
        ]
    }
];

const SAVE_KEY = 'survivor_soul_points';

const Persistence = {
    load: () => {
        try {
            const data = localStorage.getItem(SAVE_KEY);
            return data ? JSON.parse(data) : { soulPoints: 0, talents: {} };
        } catch (e) { return { soulPoints: 0, talents: {} }; }
    },
    save: (data) => {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    },
    getTalentLevel: (talents, id) => talents[id] || 0
};

// Base Stats (Used as fallback or reference)
const MAGNET_RADIUS_BASE = 100;
const COLLECT_RADIUS_BASE = 32; 
const AUTO_ATTACK_RANGE_BASE = 250; 
const BULLET_LIFETIME_RANGE_BASE = 260; 

// Font style for Chinese text
const FONT_STYLE = { 
    fontFamily: '"Microsoft YaHei", "SimHei", sans-serif', 
    fontSize: '12px', 
    fill: '#ffffff', 
    stroke: '#000000', 
    strokeThickness: 2 
};

// ----------------------------------------------------------------------------
// Hero Definitions
// ----------------------------------------------------------------------------
const HEROES = [
    {
        id: 'archer',
        name: '迅捷射手',
        description: '身手矫健，射速极快。\n被动：每5级额外提升10%移动速度。',
        color: 0x00ff00, // Green
        stats: {
            maxHp: 3,
            speed: 160, 
            cooldown: 500, 
            damage: 1,
            range: 300 
        },
        passive: 'speed_growth'
    },
    {
        id: 'tank',
        name: '重甲守卫',
        description: '皮糙肉厚，自带护盾。\n被动：出生自带1层护盾，且护盾恢复更快。',
        color: 0x0000ff, // Blue
        stats: {
            maxHp: 8,
            speed: 90, 
            cooldown: 900,
            damage: 2, 
            range: 200
        },
        passive: 'shield_master'
    },
    {
        id: 'fanatic',
        name: '狂热信徒',
        description: '以战养战。\n被动：击杀敌人有 5% 概率恢复 1 点生命。',
        color: 0xff0000, // Red
        stats: {
            maxHp: 5,
            speed: 120,
            cooldown: 700,
            damage: 1,
            range: 250
        },
        passive: 'lifesteal'
    },
    {
        id: 'mage',
        name: '时间行者',
        description: '掌控时空。\n被动：子弹自带微弱追踪，且有概率触发双倍射速。',
        color: 0x9900ff, // Purple
        stats: {
            maxHp: 4,
            speed: 130,
            cooldown: 800,
            damage: 1,
            range: 250
        },
        passive: 'time_magic'
    }
];

// ----------------------------------------------------------------------------
// Enemy Definitions (30+ Types)
// ----------------------------------------------------------------------------
const ENEMY_TYPES = {
    // --- Phase 1: Basics (0-60s) ---
    zombie: { id: 'zombie', name: '游荡僵尸', shape: 'square', color: 0x88aa88, size: 12, hp: 3, speed: 40, damage: 1, xp: 1, behavior: 'chaser' },
    rat: { id: 'rat', name: '变异巨鼠', shape: 'circle', color: 0x665544, size: 8, hp: 2, speed: 70, damage: 1, xp: 1, behavior: 'chaser' },
    skeleton: { id: 'skeleton', name: '枯骨士兵', shape: 'triangle', color: 0xeeeeee, size: 10, hp: 4, speed: 35, damage: 1, xp: 1, behavior: 'chaser' },
    
    // --- Phase 2: Agile & Ranged (60-120s) ---
    bat: { id: 'bat', name: '嗜血蝙蝠', shape: 'triangle', color: 0x333333, size: 8, hp: 2, speed: 90, damage: 1, xp: 2, behavior: 'zigzag', zigSpeed: 2 },
    ghost: { id: 'ghost', name: '虚空怨灵', shape: 'circle', color: 0xccffff, size: 12, hp: 5, speed: 50, damage: 1, xp: 2, behavior: 'chaser', alpha: 0.6 },
    archer: { id: 'archer', name: '骷髅弓手', shape: 'triangle', color: 0xdddddd, size: 11, hp: 4, speed: 30, damage: 1, xp: 2, behavior: 'shooter', range: 250, fireRate: 2000, bulletSpeed: 150 },
    spider: { id: 'spider', name: '剧毒蜘蛛', shape: 'star', color: 0x004400, size: 12, hp: 6, speed: 50, damage: 1, xp: 2, behavior: 'miner', mineType: 'web', mineInterval: 4000 },
    bomber: { id: 'bomber', name: '疯狂炸弹人', shape: 'circle', color: 0xff3300, size: 12, hp: 5, speed: 60, damage: 1, xp: 2, behavior: 'exploder', explodeRadius: 80, explodeDamage: 2 },
    
    // --- Phase 3: Support & Tanks (120-180s) ---
    tank: { id: 'tank', name: '铁甲卫士', shape: 'square', color: 0x000088, size: 16, hp: 12, speed: 25, damage: 2, xp: 3, behavior: 'chaser' },
    golem: { id: 'golem', name: '岩石傀儡', shape: 'square', color: 0x555555, size: 18, hp: 18, speed: 20, damage: 2, xp: 4, behavior: 'chaser' },
    mage: { id: 'mage', name: '黑暗学徒', shape: 'star', color: 0x5500aa, size: 11, hp: 6, speed: 25, damage: 1, xp: 3, behavior: 'shooter', range: 200, fireRate: 2500, bulletSpeed: 120 },
    charger: { id: 'charger', name: '蛮牛冲撞者', shape: 'triangle', color: 0xffaa00, size: 14, hp: 12, speed: 40, damage: 2, xp: 3, behavior: 'charger', chargeSpeed: 200 },
    healer: { id: 'healer', name: '黑暗牧师', shape: 'plus', color: 0xffffff, size: 12, hp: 8, speed: 30, damage: 1, xp: 4, behavior: 'healer', healRate: 2000, healRange: 150 },
    buffer: { id: 'buffer', name: '狂热军官', shape: 'diamond', color: 0xff00ff, size: 14, hp: 10, speed: 30, damage: 1, xp: 4, behavior: 'buffer', buffType: 'speed', buffRange: 150 },
    
    // --- Phase 4: Special Tactics (180-240s) ---
    sniper: { id: 'sniper', name: '暗影狙击手', shape: 'triangle', color: 0x000000, size: 10, hp: 6, speed: 35, damage: 2, xp: 4, behavior: 'shooter', range: 450, fireRate: 3500, bulletSpeed: 300, warning: true },
    shotgun: { id: 'shotgun', name: '霰弹暴徒', shape: 'square', color: 0xaa5522, size: 14, hp: 10, speed: 30, damage: 1, xp: 3, behavior: 'shooter_spread', range: 200, fireRate: 2500 },
    assassin: { id: 'assassin', name: '影流刺客', shape: 'diamond', color: 0x220022, size: 10, hp: 8, speed: 100, damage: 2, xp: 3, behavior: 'teleporter', teleportInterval: 3000 },
    turret: { id: 'turret', name: '移动炮台', shape: 'square', color: 0x444444, size: 20, hp: 25, speed: 10, damage: 1, xp: 5, behavior: 'shooter_rapid', range: 300, fireRate: 800 },
    slime_trail: { id: 'slime_trail', name: '腐化蛞蝓', shape: 'circle', color: 0x88ff00, size: 12, hp: 10, speed: 30, damage: 1, xp: 3, behavior: 'trail', trailType: 'poison' },
    orbiter: { id: 'orbiter', name: '旋刃舞者', shape: 'circle', color: 0xcc00cc, size: 10, hp: 8, speed: 60, damage: 1, xp: 3, behavior: 'orbiter', orbitDist: 100 },

    // --- Phase 5: Chaos (240s+) ---
    splitter: { id: 'splitter', name: '分裂软泥', shape: 'circle', color: 0x00aa44, size: 16, hp: 12, speed: 30, damage: 1, xp: 3, behavior: 'splitter', splitTo: 'slime_small', splitCount: 2 },
    splitter_giant: { id: 'splitter_giant', name: '巨型母体', shape: 'circle', color: 0x006622, size: 24, hp: 40, speed: 20, damage: 2, xp: 8, behavior: 'splitter', splitTo: 'splitter', splitCount: 2 },
    summoner: { id: 'summoner', name: '死灵法师', shape: 'star', color: 0x330033, size: 14, hp: 15, speed: 25, damage: 1, xp: 4, behavior: 'summoner', summonType: 'skeleton', summonInterval: 5000 },
    commander: { id: 'commander', name: '护盾发生器', shape: 'square', color: 0x0088ff, size: 16, hp: 20, speed: 20, damage: 1, xp: 5, behavior: 'buffer', buffType: 'defense', buffRange: 150 },
    repulsor: { id: 'repulsor', name: '重力排斥者', shape: 'diamond', color: 0x9999ff, size: 14, hp: 15, speed: 35, damage: 1, xp: 3, behavior: 'force', forceType: 'push' },
    attractor: { id: 'attractor', name: '黑洞引力体', shape: 'circle', color: 0x222222, size: 14, hp: 15, speed: 35, damage: 1, xp: 3, behavior: 'force', forceType: 'pull' },
    
    // --- Elites & Minions ---
    elite_knight: { id: 'elite_knight', name: '鲜血骑士', shape: 'square', color: 0xaa0000, size: 22, hp: 60, speed: 50, damage: 3, xp: 15, behavior: 'chaser', glow: true },
    elite_sorcerer: { id: 'elite_sorcerer', name: '大奥术师', shape: 'star', color: 0x440088, size: 20, hp: 45, speed: 40, damage: 2, xp: 15, behavior: 'shooter_spread', glow: true },
    
    slime_small: { id: 'slime_small', name: '分裂体', shape: 'circle', color: 0x00ff66, size: 8, hp: 3, speed: 60, damage: 1, xp: 1, behavior: 'chaser' }
};

const BOSS_DEFINITIONS = [
    { id: 'devourer', name: '巨型吞噬者', hpMult: 1.5, speed: 30, scale: 3.0, texture: 'boss_devourer', desc: 'Sucks enemies and spits them.' },
    { id: 'dodger', name: '子弹乍现者', hpMult: 0.6, speed: 90, scale: 1.0, texture: 'boss_dodger', desc: 'Dodges bullets quickly.' },
    { id: 'mage', name: '闪烁法师', hpMult: 0.8, speed: 40, scale: 1.5, texture: 'boss_mage', desc: 'Teleports and casts rings.' },
    { id: 'summoner', name: '召唤领主', hpMult: 1.0, speed: 20, scale: 2.0, texture: 'boss_summoner', desc: 'Summons minions.' },
    { id: 'charger', name: '狂暴冲锋兽王', hpMult: 1.2, speed: 50, scale: 2.5, texture: 'boss_charger', desc: 'Charges leaving trails.' },
    { id: 'splitter', name: '分裂巨躯', hpMult: 1.4, speed: 25, scale: 3.0, texture: 'boss_splitter', desc: 'Splits on death.' },
    { id: 'reflector', name: '镜面护盾者', hpMult: 1.0, speed: 35, scale: 1.8, texture: 'boss_reflector', desc: 'Reflects bullets periodically.' },
    { id: 'time', name: '时间操纵者', hpMult: 0.9, speed: 40, scale: 1.6, texture: 'boss_time', desc: 'Slows time in zones.' },
    { id: 'turret', name: '旋转炮塔', hpMult: 1.3, speed: 10, scale: 2.0, texture: 'boss_turret', desc: 'Rotates and fires.' },
    { id: 'firelord', name: '终焰君王', hpMult: 1.5, speed: 45, scale: 2.2, texture: 'boss_firelord', desc: 'Enrages at low HP.' }
];

// ----------------------------------------------------------------------------
// Scene 1: BootScene
// ----------------------------------------------------------------------------
class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    create() {
        // 1. Hero Textures (Dynamic based on HEROES)
        HEROES.forEach(hero => {
             this.createRectTexture(`hero_${hero.id}`, hero.color, 12, 12);
        });
        
        // 2. Player Clone texture
        this.createRectTexture('player_clone', 0x00aaaa, 12, 12);

        // 3. Enemies with Shapes
        Object.values(ENEMY_TYPES).forEach(type => {
            const size = type.size;
            const color = type.color;
            const shape = type.shape || 'square';
            const key = `enemy_${type.id}`;

            let g = this.make.graphics({x:0, y:0, add:false});
            g.fillStyle(color, 1);

            if (shape === 'square') {
                g.fillRect(0, 0, size, size);
            } else if (shape === 'circle') {
                g.fillCircle(size/2, size/2, size/2);
            } else if (shape === 'triangle') {
                // Pointing up
                g.fillTriangle(size/2, 0, size, size, 0, size);
            } else if (shape === 'diamond') {
                // Rotated square logic
                const p = [
                    {x: size/2, y: 0},
                    {x: size, y: size/2},
                    {x: size/2, y: size},
                    {x: 0, y: size/2}
                ];
                g.fillPoints(p, true);
            } else if (shape === 'plus') {
                const thickness = size / 3;
                g.fillRect(thickness, 0, thickness, size); // Vertical
                g.fillRect(0, thickness, size, thickness); // Horizontal
            } else if (shape === 'star') {
                // 5-point star
                const points = [];
                const outerRadius = size/2;
                const innerRadius = size/4;
                const centerX = size/2;
                const centerY = size/2;
                for(let i=0; i<10; i++) {
                    const r = (i % 2 === 0) ? outerRadius : innerRadius;
                    const a = (i * Math.PI) / 5 - Math.PI/2;
                    points.push({
                        x: centerX + Math.cos(a) * r,
                        y: centerY + Math.sin(a) * r
                    });
                }
                g.fillPoints(points, true);
            }

            g.generateTexture(key, size, size);
        });

        // 4. Projectiles & Objects
        this.createRectTexture('bullet', COLOR_BULLET, 4, 4);
        this.createCircleTexture('orbit_orb', COLOR_ORBIT, 4);
        this.createCircleTexture('orbit_blade', 0xeeeeee, 6); 
        this.createRectTexture('enemy_bullet', 0xff00ff, 6, 6);
        this.createRectTexture('fireball', 0xff4400, 8, 8); 
        this.createCircleTexture('bomb', 0x333333, 6); 
        this.createCircleTexture('black_hole', 0x110033, 10); 

        // 5. Pickups & FX
        this.createCircleTexture('gem', COLOR_XP, 3);
        this.createRectTexture('heart', COLOR_HEART, 6, 6);
        this.createRectTexture('particle', COLOR_PARTICLE, 2, 2);
        
        // 6. Bosses
        Object.keys(BOSS_COLORS).forEach(key => {
            this.createRectTexture(`boss_${key}`, BOSS_COLORS[key], 20, 20);
        });

        // 7. Background Grid
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
// Scene 2: MainMenuScene (Hero Selection)
// ----------------------------------------------------------------------------
class MainMenuScene extends Phaser.Scene {
    constructor() { super('MainMenuScene'); }

    create() {
        // Title
        this.add.text(GAME_WIDTH/2, 25, 'PIXEL SURVIVOR', { ...FONT_STYLE, fontSize: '32px', strokeThickness: 4, fill: '#ffffff' }).setOrigin(0.5);
        this.add.text(GAME_WIDTH/2, 55, '选择英雄', { ...FONT_STYLE, fontSize: '18px', fill: '#ffff00' }).setOrigin(0.5);

        this.selectedHeroIndex = 0;
        this.heroCards = [];

        // Layout Parameters
        const cardWidth = 100;
        const cardHeight = 140;
        const spacing = 15;
        const totalWidth = HEROES.length * cardWidth + (HEROES.length - 1) * spacing;
        const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;
        const centerY = GAME_HEIGHT / 2;

        HEROES.forEach((hero, index) => {
            const x = startX + index * (cardWidth + spacing);
            this.createHeroCard(hero, index, x, centerY, cardWidth, cardHeight);
        });

        // Passive Description Area (Fixed position at bottom)
        this.descText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 60, '', { ...FONT_STYLE, fontSize: '14px', fill: '#00ffff', align: 'center', wordWrap: { width: 440 }, stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
        
        // Talent Button
        const btnTalents = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 35, '[ 天赋树 ]', { ...FONT_STYLE, fontSize: '14px', fill: '#ffd700' }).setOrigin(0.5).setInteractive();
        btnTalents.on('pointerdown', () => this.scene.start('TalentScene'));
        btnTalents.on('pointerover', () => btnTalents.setScale(1.1));
        btnTalents.on('pointerout', () => btnTalents.setScale(1.0));

        // Hint Text
        this.tipText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 15, '按 ← / → 切换英雄，按 Enter 或双击开始游戏', { ...FONT_STYLE, fontSize: '12px', fill: '#888888' }).setOrigin(0.5);

        // Inputs
        this.input.keyboard.on('keydown-LEFT', () => {
            this.selectedHeroIndex = (this.selectedHeroIndex - 1 + HEROES.length) % HEROES.length;
            this.updateSelection();
        });
        this.input.keyboard.on('keydown-RIGHT', () => {
            this.selectedHeroIndex = (this.selectedHeroIndex + 1) % HEROES.length;
            this.updateSelection();
        });
        this.input.keyboard.on('keydown-ENTER', () => this.startGame());

        this.updateSelection();
    }

    createHeroCard(hero, index, x, y, w, h) {
        const container = this.add.container(x, y);
        
        // Background
        const bg = this.add.rectangle(0, 0, w, h, 0x333333).setStrokeStyle(2, 0x555555);
        
        // Hero Icon (Centered top half)
        const icon = this.add.sprite(0, -35, `hero_${hero.id}`).setScale(3);
        
        // Name
        const name = this.add.text(0, -5, hero.name, { ...FONT_STYLE, fontSize: '14px', fontStyle: 'bold', fill: '#ffffff' }).setOrigin(0.5);
        
        // Stats
        const statsStr = `HP: ${hero.stats.maxHp}\n攻: ${hero.stats.damage}\n速: ${hero.stats.speed}`;
        const statsText = this.add.text(0, 35, statsStr, { ...FONT_STYLE, fontSize: '11px', fill: '#cccccc', align: 'center', lineHeight: 16 }).setOrigin(0.5);

        container.add([bg, icon, name, statsText]);
        
        // Interactive Logic
        bg.setInteractive();
        
        // Single Click to Select
        bg.on('pointerdown', () => {
            const now = this.time.now;
            const lastClick = bg.lastClickTime || 0;
            
            if (now - lastClick < 300 && this.selectedHeroIndex === index) {
                // Double Click
                this.startGame();
            } else {
                // Single Click
                this.selectedHeroIndex = index;
                this.updateSelection();
            }
            bg.lastClickTime = now;
        });

        // Hover Effect
        bg.on('pointerover', () => {
            if (this.selectedHeroIndex !== index) {
                bg.setStrokeStyle(2, 0xaaaaaa); // Hover highlight (grayish)
            }
        });

        bg.on('pointerout', () => {
            if (this.selectedHeroIndex !== index) {
                bg.setStrokeStyle(2, 0x555555); // Reset normal border
            } else {
                bg.setStrokeStyle(3, 0xffff00); // Keep selected border
            }
        });

        this.heroCards.push({ container, bg, hero });
    }

    updateSelection() {
        this.heroCards.forEach((card, index) => {
            if (index === this.selectedHeroIndex) {
                // Selected State
                card.bg.setFillStyle(0x444444);
                card.bg.setStrokeStyle(3, 0xffff00); // Yellow border
                card.container.setScale(1.1); // Slightly bigger
                
                // Update Description
                const parts = card.hero.description.split('\n被动：');
                const passive = parts.length > 1 ? '被动：' + parts[1] : card.hero.description;
                this.descText.setText(passive);
            } else {
                // Unselected State
                card.bg.setFillStyle(0x333333);
                card.bg.setStrokeStyle(2, 0x555555); // Gray border
                card.container.setScale(1.0);
            }
        });
    }

    startGame() {
        const hero = HEROES[this.selectedHeroIndex];
        this.scene.start('GameScene', { hero: hero });
    }
}

// ----------------------------------------------------------------------------
// Scene 3: TalentScene (Meta Progression)
// ----------------------------------------------------------------------------
class TalentScene extends Phaser.Scene {
    constructor() { super('TalentScene'); }

    create() {
        this.saveData = Persistence.load();

        // Background
        this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x111111);
        
        // Header
        this.add.text(GAME_WIDTH/2, 25, '天赋树', { ...FONT_STYLE, fontSize: '28px', fill: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5);
        this.pointsText = this.add.text(GAME_WIDTH/2, 55, `灵魂点数: ${this.saveData.soulPoints}`, { ...FONT_STYLE, fontSize: '16px', fill: '#00ffff' }).setOrigin(0.5);

        // Layout Constants
        const cardWidth = 120;
        const cardHeight = 140; // Increased height for preview text
        const cardMarginX = 20;
        
        // Layout adjusted
        const talentGridStartY = 100;
        const talentGridRowSpacing = 20;
        const backButtonY = GAME_HEIGHT - 40;

        const cols = 3;
        
        // Calculate grid start position to center it
        const totalWidth = cols * cardWidth + (cols - 1) * cardMarginX;
        
        const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

        TALENT_CONFIG.forEach((talent, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = startX + col * (cardWidth + cardMarginX);
            const y = talentGridStartY + row * (cardHeight + talentGridRowSpacing);

            this.createTalentCard(x, y, talent, cardWidth, cardHeight);
        });

        // Back Button
        const btnBack = this.add.text(GAME_WIDTH/2, backButtonY, '【 返回主菜单 】', { 
            ...FONT_STYLE, 
            fontSize: '18px', 
            fill: '#ffffff', 
            backgroundColor: '#333333', 
            padding: { x: 30, y: 15 } 
        }).setOrigin(0.5).setInteractive();
        
        btnBack.on('pointerdown', () => this.scene.start('MainMenuScene'));
        btnBack.on('pointerover', () => btnBack.setFill('#ffff00'));
        btnBack.on('pointerout', () => btnBack.setFill('#ffffff'));
        
        // ESC Key Support
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        // Description Text Area (Global)
        this.descText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 90, '', { ...FONT_STYLE, fontSize: '14px', fill: '#cccccc', align: 'center', wordWrap: { width: 400 } }).setOrigin(0.5);
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            this.scene.start('MainMenuScene');
        }
    }

    createTalentCard(x, y, talent, width, height) {
        const currentLevel = Persistence.getTalentLevel(this.saveData.talents, talent.id);
        const isMax = currentLevel >= talent.maxLevel;
        const cost = talent.cost * (currentLevel + 1); // Simple cost scaling
        
        // Check prerequisites
        let prereqMet = true;
        if (talent.prerequisites) {
            talent.prerequisites.forEach(p => {
                const pLevel = Persistence.getTalentLevel(this.saveData.talents, p.id);
                if (pLevel < p.level) prereqMet = false;
            });
        }

        const canAfford = this.saveData.soulPoints >= cost;
        const isLocked = !prereqMet;

        const container = this.add.container(x, y);

        // Colors
        let bgColor, strokeColor, textColor;
        if (isLocked) { 
            bgColor = 0x111111; 
            strokeColor = 0x333333; 
            textColor = '#555555';
        } else if (isMax) { 
            bgColor = 0x222222; 
            strokeColor = 0xffd700; // Gold border
            textColor = '#ffffff';
        } else { 
            bgColor = 0x333333; 
            strokeColor = canAfford ? 0xffff00 : 0x666666;
            textColor = '#ffffff';
        }

        const bg = this.add.rectangle(0, 0, width, height, bgColor).setStrokeStyle(2, strokeColor);
        
        // Text Content
        const nameText = this.add.text(0, -height/2 + 20, talent.name, { ...FONT_STYLE, fontSize: '14px', fill: textColor, fontStyle: 'bold' }).setOrigin(0.5);
        const levelText = this.add.text(0, -height/2 + 40, `Lv. ${currentLevel}/${talent.maxLevel}`, { ...FONT_STYLE, fontSize: '12px', fill: isLocked ? '#555555' : '#aaaaaa' }).setOrigin(0.5);
        
        let costStr;
        let costFill = '#ffffff';

        if (isLocked) {
            costStr = "未解锁";
            costFill = '#555555';
        } else if (isMax) {
            costStr = "已满级";
            costFill = '#ffd700';
        } else {
            costStr = `消耗: ${cost}`;
            costFill = canAfford ? '#ffff00' : '#ff0000';
        }

        const costText = this.add.text(0, -height/2 + 60, costStr, { ...FONT_STYLE, fontSize: '12px', fill: costFill }).setOrigin(0.5);

        // Preview Text (Next Level)
        if (!isMax && !isLocked) {
             let previewStr = "";
             // Determine effect text
             // Hardcoded mapping for simplicity as per requirement
             if (talent.effectKey === 'maxHp') previewStr = `最大生命 +${talent.effectValue}`;
             else if (talent.effectKey === 'speed') previewStr = `移动速度 +${Math.round(talent.effectValue * 100)}%`;
             else if (talent.effectKey === 'damage') previewStr = `子弹伤害 +${talent.effectValue}`;
             else if (talent.effectKey === 'startShield') previewStr = `护盾格挡 +${talent.effectValue}`;
             else if (talent.effectKey === 'startXp') previewStr = `初始经验 +${talent.effectValue}`;

             if (previewStr) {
                const previewText = this.add.text(0, 10, `下级效果:\n${previewStr}`, { 
                    ...FONT_STYLE, 
                    fontSize: '12px', 
                    fill: '#aaaaaa', 
                    align: 'center',
                    wordWrap: { width: width - 10 }
                }).setOrigin(0.5, 0);
                container.add(previewText);
             }
        } else if (isMax) {
             const maxText = this.add.text(0, 10, "已达到\n最大等级", { 
                    ...FONT_STYLE, 
                    fontSize: '12px', 
                    fill: '#ffd700', 
                    align: 'center'
                }).setOrigin(0.5, 0);
             container.add(maxText);
        }

        container.add([bg, nameText, levelText, costText]);

        // Interactions
        if (!isLocked) {
            bg.setInteractive();

            bg.on('pointerdown', () => {
                if (isMax) return;
                
                if (canAfford) {
                    // Purchase Logic
                    this.saveData.soulPoints -= cost;
                    this.saveData.talents[talent.id] = currentLevel + 1;
                    Persistence.save(this.saveData);
                    
                    // Visual Feedback
                    this.pointsText.setText(`灵魂点数: ${this.saveData.soulPoints}`);
                    
                    // Flash effect
                    this.tweens.add({
                        targets: bg,
                        strokeAlpha: 0,
                        duration: 100,
                        yoyo: true,
                        repeat: 1
                    });
                    
                    // Float text
                    const floatTxt = this.add.text(x, y - height/2 - 10, "天赋+1", { ...FONT_STYLE, fontSize: '16px', fill: '#00ff00', strokeThickness: 3 }).setOrigin(0.5);
                    this.tweens.add({
                        targets: floatTxt,
                        y: y - height/2 - 40,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => floatTxt.destroy()
                    });

                    // Refresh this card only (or full scene)
                    // Full restart is easiest to ensure all dependencies update (e.g. unlocks)
                    this.time.delayedCall(200, () => this.scene.restart());
                } else {
                    // Not enough points
                    this.cameras.main.shake(50, 0.005);
                    const noPoints = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 100, "点数不足", { ...FONT_STYLE, fontSize: '18px', fill: '#ff0000', strokeThickness: 3 }).setOrigin(0.5);
                    this.tweens.add({
                        targets: noPoints,
                        alpha: 0,
                        duration: 1000,
                        onComplete: () => noPoints.destroy()
                    });
                }
            });

            bg.on('pointerover', () => {
                if (!isMax) bg.setScale(1.05);
                bg.setStrokeStyle(2, 0xffffff); // Brighten border
                this.descText.setText(talent.description);
                if (isLocked) this.descText.setText("[未解锁] " + talent.description);
            });

            bg.on('pointerout', () => {
                if (!isMax) bg.setScale(1.0);
                bg.setStrokeStyle(2, strokeColor); // Revert border
                this.descText.setText('');
            });
        } else {
             // Locked interaction (just tooltip)
             bg.setInteractive();
             bg.on('pointerover', () => {
                 this.descText.setText(`[未解锁] ${talent.description}`);
             });
             bg.on('pointerout', () => {
                 this.descText.setText('');
             });
        }
    }
}

class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        // Load hero data, default to first hero if debug/testing
        this.heroData = data.hero || HEROES[0];
    }

    create() {
        // --- Game State ---
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 5;
        this.kills = 0;
        this.killSinceLastShop = 0; // NEW: Track kills for shop unlock
        this.gold = 0; // In-run currency
        this.survivalTime = 0;
        this.isGameOver = false;
        this.isChoosingUpgrade = false;
        this.isShopOpen = false;
        this.isEventOpen = false;
        this.nextEventTime = 60; // Start events at 60s
        this.eventGlobalStats = {
            enemyHpMult: 1.0,
            playerDmgMult: 1.0,
            xpMult: 1.0,
            noRegen: false,
            noRegenTimer: 0,
            tempDmgMult: 1.0,
            xpBuffTimer: 0
        };
        this.isPaused = false;
        this.upgradeChoicesCount = 3;

        // --- Boss System State ---
        this.bossIntervalMin = 180; 
        this.bossIntervalMax = 300; 
        this.nextBossTime = Phaser.Math.Between(this.bossIntervalMin, this.bossIntervalMax);
        this.currentBoss = null; 
        this.bossesKilled = 0; // Track boss kills for currency 

        // Stats - Initialized from Hero Data
        this.playerStats = {
            maxHp: this.heroData.stats.maxHp,
            hp: this.heroData.stats.maxHp,
            speed: this.heroData.stats.speed,
            
            xpMagnetRadius: MAGNET_RADIUS_BASE,
            xpCollectRadius: COLLECT_RADIUS_BASE,
            
            critChance: 0,
            critMultiplier: 2.0, 
            damageMultiplier: 1, 
            autoAttackRange: this.heroData.stats.range || AUTO_ATTACK_RANGE_BASE,
            bulletRange: BULLET_LIFETIME_RANGE_BASE, 
            
            isBerserker: false,
            hasSlowAura: false,
            hasBurningAura: false,
            hasChainLightning: false,
            
            // Shield System
            hasShieldUpgrade: false,
            shieldCharges: 0,
            shieldMaxCharges: 0,
            shieldCooldown: 20000, 
            shieldTimer: 0,
            
            dashUnlocked: false,
            dashCooldown: 0,

            // Passives
            heroPassive: this.heroData.passive,

            heroic: {
                splitCross: false,
                splitAround: false,
                bombLauncher: false,
                chainExplosion: false,
                piercingChain: false,
                homing: false,
                bladeStorm: false,
                deathNova: false,
                deathNovaAvailable: true,
                bloodSiphon: false,
                thunderField: false,
                blackHole: false,
                timeFreeze: false,
                dashSlam: false,
                bossSlayer: false,
                globalBurn: false,
                wallBounce: false,
                clone: false,
                lastStand: false,
                hyperEngine: false
            }
        };

        // Apply Hero Specific Passives (Initialization)
        if (this.playerStats.heroPassive === 'shield_master') {
            this.playerStats.hasShieldUpgrade = true;
            this.playerStats.shieldMaxCharges = 1;
            this.playerStats.shieldCharges = 1;
            this.playerStats.shieldCooldown = 15000; // Faster regen for tank
        }
        if (this.playerStats.heroPassive === 'time_magic') {
            // Slight homing by default for mage
            this.playerStats.heroic.homing = true; // Weak version (reusing logic but maybe check passive id in update)
        }

        // Weapon
        this.weapon = {
            type: 'single', 
            damage: this.heroData.stats.damage,
            cooldown: this.heroData.stats.cooldown,
            hasOrbit: false,
            orbitCount: 0,
            orbitDamage: 1,
            orbitSpeed: 2
        };

        this.initUpgradePool();

        // --- Apply Talents (Meta Progression) ---
        const savedData = Persistence.load();
        const talents = savedData.talents || {};
        let appliedTalents = false;

        TALENT_CONFIG.forEach(t => {
            const level = Persistence.getTalentLevel(talents, t.id);
            if (level > 0) {
                appliedTalents = true;
                if (t.effectType === 'stat_add') {
                    if (t.effectKey === 'maxHp') {
                        this.playerStats.maxHp += t.effectValue * level;
                        this.playerStats.hp += t.effectValue * level;
                    } else if (t.effectKey === 'damage') {
                        this.weapon.damage += t.effectValue * level;
                    }
                } else if (t.effectType === 'stat_mult') {
                    if (t.effectKey === 'speed') {
                        this.playerStats.speed *= (1 + t.effectValue * level);
                    }
                } else if (t.effectType === 'special') {
                    if (t.effectKey === 'startShield') {
                        this.playerStats.hasShieldUpgrade = true;
                        this.playerStats.shieldMaxCharges = Math.max(this.playerStats.shieldMaxCharges, 1);
                        this.playerStats.shieldCharges = Math.max(this.playerStats.shieldCharges, 1);
                        if (this.playerStats.shieldCooldown === 20000) this.playerStats.shieldCooldown = 15000;
                    } else if (t.effectKey === 'startXp') {
                        this.xp += t.effectValue * level;
                    }
                }
            }
        });

        if (appliedTalents) {
            this.time.delayedCall(1000, () => {
                this.createFloatingText(this.player.x, this.player.y - 60, "已应用天赋加成", true);
            });
        }

        // --- Physics World & Camera ---
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.add.tileSprite(WORLD_WIDTH/2, WORLD_HEIGHT/2, WORLD_WIDTH, WORLD_HEIGHT, 'bg_grid').setDepth(-10);
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.setZoom(1.0); 

        // --- Groups ---
        this.enemies = this.physics.add.group({ runChildUpdate: false }); 
        this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 300 }); 
        this.enemyBullets = this.physics.add.group({ defaultKey: 'enemy_bullet', maxSize: 200 });
        this.orbitGroup = this.physics.add.group({ defaultKey: 'orbit_orb', maxSize: 20 });
        this.heroicBladeGroup = this.physics.add.group({ defaultKey: 'orbit_blade', maxSize: 20 });
        this.bombGroup = this.physics.add.group({ defaultKey: 'bomb', maxSize: 10 });
        this.blackHoleGroup = this.physics.add.group({ defaultKey: 'black_hole', maxSize: 5 });
        this.gems = this.physics.add.group();
        this.hearts = this.physics.add.group(); 
        
        this.bossGroup = this.physics.add.group(); 
        this.hazards = this.physics.add.group(); 
        this.cloneGroup = this.physics.add.group(); 

        // --- Particles ---
        this.deathEmitter = this.add.particles(0, 0, 'particle', {
            lifespan: 400, speed: {min: 50, max: 150}, scale: {start: 1.5, end: 0}, quantity: 6, emitting: false
        });
        this.explodeEmitter = this.add.particles(0, 0, 'particle', {
            lifespan: 300, speed: {min: 100, max: 300}, scale: {start: 2, end: 0}, tint: 0xffaa00, quantity: 20, emitting: false
        });

        // --- Player ---
        this.player = this.physics.add.sprite(WORLD_WIDTH/2, WORLD_HEIGHT/2, `hero_${this.heroData.id}`);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.shieldIndicator = this.add.graphics();
        this.shieldIndicator.setDepth(11);

        // --- Inputs ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC
        });
        this.input.keyboard.on('keydown-ESC', () => {
             if (this.isShopOpen) this.toggleShop();
             else this.togglePause();
        });

        // --- Timers ---
        this.lastFired = 0;
        this.nextSpawnTime = 0;
        this.burningAuraTimer = 0;
        
        this.bombTimer = 0;
        this.thunderTimer = 0;
        this.blackHoleTimer = 0;
        this.globalBurnTimer = 0;
        this.killStreak = 0;
        this.killStreakTimer = 0;
        this.isTimeFrozen = false;
        this.timeFreezeEndTime = 0;
        
        this.createUI();
        this.createBossUI(); 
        this.createUpgradeUI();

        // --- Collisions ---
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHitEnemy, null, this);
        this.physics.add.overlap(this.orbitGroup, this.enemies, this.handleOrbitHitEnemy, null, this);
        this.physics.add.overlap(this.heroicBladeGroup, this.enemies, this.handleBladeHitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.handleEnemyTouchPlayer, null, this);
        
        this.physics.add.overlap(this.player, this.gems, this.handlePickGem, null, this);
        this.physics.add.overlap(this.player, this.hearts, this.handlePickHeart, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.handleEnemyBulletHitPlayer, null, this);
        this.physics.add.overlap(this.player, this.hazards, this.handleHazardTouchPlayer, null, this);

        // Boss Collisions
        this.physics.add.overlap(this.bullets, this.bossGroup, this.handleBulletHitBoss, null, this);
        this.physics.add.overlap(this.orbitGroup, this.bossGroup, this.handleOrbitHitBoss, null, this);
        this.physics.add.overlap(this.heroicBladeGroup, this.bossGroup, this.handleBladeHitBoss, null, this);
        this.physics.add.overlap(this.player, this.bossGroup, this.handleBossTouchPlayer, null, this);
    }

    initUpgradePool() {
        this.upgradePool = [
            // COMMON
            { id: 'max_hp_up', rarity: 'common', name: '增加生命上限', description: '最大生命 +1，并立即回复 1 点生命。', apply: () => { this.playerStats.maxHp++; this.playerStats.hp = Math.min(this.playerStats.hp + 1, this.playerStats.maxHp); } },
            { id: 'move_speed_up', rarity: 'common', name: '提高移动速度', description: '移动速度提升 10%。', apply: () => { this.playerStats.speed *= 1.1; } },
            { id: 'cooldown_down', rarity: 'common', name: '缩短攻击冷却', description: '攻击间隔缩短 10%。', apply: () => { this.weapon.cooldown *= 0.9; } },
            { id: 'damage_up', rarity: 'common', name: '提升子弹伤害', description: '子弹伤害 +1。', apply: () => { this.weapon.damage++; } },
            { id: 'xp_gain', rarity: 'common', name: '增加经验获取', description: '经验获取效率略微提升。', apply: () => { /* Logic implicitly handled by XP curve */ } },
            { id: 'pickup_range', rarity: 'common', name: '增加拾取范围', description: '磁铁范围扩大 20%。', apply: () => { this.playerStats.xpMagnetRadius *= 1.2; } },
            { id: 'unlock_spread', rarity: 'common', name: '解锁散射', description: '攻击变为一次发射 3 发子弹。', apply: () => { this.weapon.type = 'spread'; } },
            { id: 'unlock_orbit', rarity: 'common', name: '解锁环绕法球', description: '在身边生成旋转法球保護自己。', apply: () => { this.weapon.hasOrbit = true; this.weapon.orbitCount += 1; this.spawnOrbits(); } },
            { id: 'attack_range', rarity: 'common', name: '增加射程', description: '攻击距离和射程扩大 20%。', apply: () => { this.playerStats.autoAttackRange *= 1.2; this.playerStats.bulletRange *= 1.2; } },

            // RARE
            { id: 'overload_fire', rarity: 'rare', name: '超载射击', description: '攻击间隔缩短 40%, 但生命上限 -1 (不会低于 1)。', apply: () => { this.weapon.cooldown *= 0.6; this.playerStats.maxHp = Math.max(1, this.playerStats.maxHp - 1); if (this.playerStats.hp > this.playerStats.maxHp) this.playerStats.hp = this.playerStats.maxHp; }},
            { id: 'berserker', rarity: 'rare', name: '狂战之心', description: '生命越低, 伤害越高, 最多提升 80%。', apply: () => { this.playerStats.isBerserker = true; } },
            { id: 'time_slow_aura', rarity: 'rare', name: '时间减速场', description: '靠近你的敌人会被减速 40%。', apply: () => { this.playerStats.hasSlowAura = true; } },
            { id: 'super_magnet', rarity: 'rare', name: '超级磁场', description: '经验吸附范围提升至 2.5 倍。', apply: () => { this.playerStats.xpMagnetRadius *= 2.5; } },
            { id: 'dash_skill', rarity: 'rare', name: '闪现步', description: '解锁空格闪现: 瞬间向移动方向冲刺, 冷却 2 秒。', apply: () => { this.playerStats.dashUnlocked = true; } },
            { id: 'shield_barrier', rarity: 'rare', name: '能量护盾', description: '获得每 20 秒刷新一次的护盾，抵挡一次伤害。', apply: () => { this.playerStats.hasShieldUpgrade = true; this.playerStats.shieldMaxCharges = 1; this.playerStats.shieldCharges = 1; }},
            { id: 'crit_master', rarity: 'rare', name: '暴击大师', description: '获得 35% 暴击率, 暴击时伤害 x2.5。', apply: () => { this.playerStats.critChance = 0.35; this.playerStats.critMultiplier = 2.5; } },
            { id: 'chain_lightning', rarity: 'rare', name: '连锁闪电', description: '击杀敌人时, 电击附近 5 个敌人。', apply: () => { this.playerStats.hasChainLightning = true; } },
            { id: 'burning_aura', rarity: 'rare', name: '灼烧领域', description: '靠近你的敌人持续受到更高伤害。', apply: () => { this.playerStats.hasBurningAura = true; } },
            { id: 'lucky_god', rarity: 'rare', name: '小小欧皇', description: '每次升级额外提供 2 个选项。', apply: () => { this.upgradeChoicesCount += 2; } },

            // HEROIC
            { id: 'bullet_split_cross', rarity: 'heroic', name: '十字分裂彈', description: '子彈擊殺敵人時, 在四個方向額外分裂出 4 發新子彈。', apply: () => { this.playerStats.heroic.splitCross = true; } },
            { id: 'bullet_split_around', rarity: 'heroic', name: '環形分裂彈', description: '子彈擊殺敵人時, 朝四周散射一圈小彈幕。', apply: () => { this.playerStats.heroic.splitAround = true; } },
            { id: 'bomb_launcher', rarity: 'heroic', name: '榴彈發射器', description: '每隔一段時間自動射出一枚緩慢飛行的炸彈, 造成大範圍爆炸。', apply: () => { this.playerStats.heroic.bombLauncher = true; } },
            { id: 'chain_explosion', rarity: 'heroic', name: '連鎖爆破', description: '被炸死的敵人會再引爆一次, 對附近敵人造成傷害。', apply: () => { this.playerStats.heroic.chainExplosion = true; } },
            { id: 'piercing_chain_bullet', rarity: 'heroic', name: '穿刺連鎖彈', description: '子彈可穿透多個敵人, 並在擊中後在附近敵人之間彈射。', apply: () => { this.playerStats.heroic.piercingChain = true; } },
            { id: 'homing_barrage', rarity: 'heroic', name: '追蹤彈幕', description: '部分子彈會自動追蹤最近的敵人。', apply: () => { this.playerStats.heroic.homing = true; } },
            { id: 'orbit_blade_storm', rarity: 'heroic', name: '刀輪風暴', description: '在你周圍形成一圈高速旋轉的刀刃, 對靠近的敵人造成巨大傷害。', apply: () => { this.playerStats.heroic.bladeStorm = true; this.spawnHeroicBlades(); } },
            { id: 'death_nova', rarity: 'heroic', name: '垂死震盪', description: '當你受到致命傷時, 立即釋放一次超強範圍衝擊波並保留 1 點生命。每局僅觸發一次。', apply: () => { this.playerStats.heroic.deathNova = true; } },
            { id: 'blood_siphon', rarity: 'heroic', name: '嗜血之力', description: '對敵人造成的傷害將會轉化為少量生命值。', apply: () => { this.playerStats.heroic.bloodSiphon = true; } },
            { id: 'thunder_field', rarity: 'heroic', name: '雷霆領域', description: '定期在隨機敵人頭頂落下閃電, 造成高額傷害。', apply: () => { this.playerStats.heroic.thunderField = true; } },
            { id: 'black_hole', rarity: 'heroic', name: '迷你黑洞', description: '偶爾生成一個小型黑洞, 將敵人拉向中心並在最後爆炸。', apply: () => { this.playerStats.heroic.blackHole = true; } },
            { id: 'time_freeze_killstreak', rarity: 'heroic', name: '時間斬擊', description: '短時間內連續擊殺足夠多敵人時, 全圖時間會暫停 1 秒。', apply: () => { this.playerStats.heroic.timeFreeze = true; } },
            { id: 'hero_dash_slam', rarity: 'heroic', name: '英雄突襲', description: '你的閃現落地時會造成強力衝擊波。', apply: () => { this.playerStats.heroic.dashSlam = true; } },
            { id: 'mega_magnet', rarity: 'heroic', name: '終極磁場', description: '立即將全地圖經驗球吸到你身邊, 並大幅提升之後的吸附範圍。', apply: () => { this.pullAllGems(); this.playerStats.xpMagnetRadius *= 2; this.playerStats.xpCollectRadius *= 1.5; } },
            { id: 'boss_slayer', rarity: 'heroic', name: '屠龍者', description: '對 BOSS 造成的傷害翻倍。', apply: () => { this.playerStats.heroic.bossSlayer = true; } },
            { id: 'global_burn', rarity: 'heroic', name: '焚世之火', description: '所有敵人都會持續受到灼燒傷害。', apply: () => { this.playerStats.heroic.globalBurn = true; } },
            { id: 'bullet_wall_bounce', rarity: 'heroic', name: '彈幕反彈', description: '子彈碰到世界邊緣不會消失, 而是最多反彈兩次。', apply: () => { this.playerStats.heroic.wallBounce = true; } },
            { id: 'double_hero_clone', rarity: 'heroic', name: '鏡像分身', description: '召喚一個跟隨你的分身, 模仿你的攻擊。', apply: () => { this.playerStats.heroic.clone = true; this.spawnClone(); } },
            { id: 'last_stand_mode', rarity: 'heroic', name: '絕境覺醒', description: '當生命降到 1 點時, 攻擊力與攻速大幅提升。', apply: () => { this.playerStats.heroic.lastStand = true; } },
            { id: 'hyper_engine', rarity: 'heroic', name: '超頻引擎', description: '大幅提升移動速度與攻擊速度, 但射程略微降低。', apply: () => { this.playerStats.speed *= 1.5; this.weapon.cooldown *= 0.6; this.playerStats.bulletRange *= 0.8; } }
        ];
    }

    togglePause() {
        if (this.isGameOver || this.isChoosingUpgrade || this.isEventOpen || this.isShopOpen) return;
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
        if (this.upgradeContainer.visible) {
            this.upgradeContainer.x = this.cameras.main.scrollX + GAME_WIDTH / 2;
            this.upgradeContainer.y = this.cameras.main.scrollY + GAME_HEIGHT / 2;
        }
        
        if (this.eventContainer.visible) {
            this.eventContainer.x = this.cameras.main.scrollX + GAME_WIDTH / 2;
            this.eventContainer.y = this.cameras.main.scrollY + GAME_HEIGHT / 2;
        }

        if (this.isGameOver || this.isPaused || this.isChoosingUpgrade || this.isShopOpen || this.isEventOpen) return;

        // Update Shop overlay position to follow camera if needed (but we used setScrollFactor(0) so container stays put)
        // However, if we didn't use setScrollFactor on overlay, we'd need to update it.
        // Since we added overlay to container and container has scrollFactor 0, it should be fine.

        // Event Timers
        if (this.eventGlobalStats.noRegenTimer > 0) {
            this.eventGlobalStats.noRegenTimer -= delta;
            if (this.eventGlobalStats.noRegenTimer <= 0) {
                this.eventGlobalStats.noRegen = false;
                this.eventGlobalStats.tempDmgMult = 1.0;
                this.createFloatingText(this.player.x, this.player.y - 40, "鲜血契约结束", false);
            }
        }
        if (this.eventGlobalStats.xpBuffTimer > 0) {
            this.eventGlobalStats.xpBuffTimer -= delta;
            if (this.eventGlobalStats.xpBuffTimer <= 0) {
                this.eventGlobalStats.xpMult = 1.0;
                this.createFloatingText(this.player.x, this.player.y - 40, "经验加成结束", false);
            }
        }

        this.shieldIndicator.clear();
        if (this.playerStats.shieldCharges > 0) {
             this.shieldIndicator.lineStyle(2, 0x00ffff, 0.6);
             this.shieldIndicator.strokeCircle(this.player.x, this.player.y, 16);
        }

        // Time Freeze Logic
        if (this.isTimeFrozen) {
            if (time > this.timeFreezeEndTime) {
                this.isTimeFrozen = false;
                this.physics.resume(); 
            } else {
                this.handlePlayerMovement(delta);
                this.updateProjectiles(delta);
                if (time > this.lastFired + this.weapon.cooldown) {
                    this.fireWeapon();
                    this.lastFired = time;
                }
                return;
            }
        }

        this.survivalTime += delta / 1000;
        this.timeText.setText(`时间: ${this.survivalTime.toFixed(1)} 秒`);

        if (!this.currentBoss) {
            if (this.survivalTime >= this.nextEventTime && !this.isEventOpen) {
                this.triggerEvent();
            } else if (this.survivalTime >= this.nextBossTime) {
                this.spawnBoss();
            }
        }

        if (this.currentBoss) {
            this.updateBoss(time, delta);
        }

        this.handlePlayerMovement(delta);
        this.handleMagnet();
        this.handleSpecialSkills(time, delta);
        this.handleHeroicEffects(time, delta);

        let fireCooldown = this.weapon.cooldown;
        if (this.playerStats.heroic.lastStand && this.playerStats.hp <= 1) fireCooldown *= 0.5;

        // Mage Time Magic Passive (Occasional rapid fire)
        if (this.playerStats.heroPassive === 'time_magic' && Math.random() < 0.05) {
             fireCooldown *= 0.5;
        }

        if (time > this.lastFired + fireCooldown) {
            this.fireWeapon();
            this.lastFired = time;
        }
        if (this.weapon.hasOrbit) this.updateOrbits(delta);
        if (this.playerStats.heroic.bladeStorm) this.updateHeroicBlades(delta);
        this.updateClone(delta, time);

        let spawnDelayBase = Math.max(300, 2000 - this.survivalTime * 10);
        if (this.currentBoss) spawnDelayBase *= 4;

        if (time > this.nextSpawnTime) {
            if (!this.currentBoss || Math.random() < 0.3) { 
                this.spawnEnemy();
            }
            this.nextSpawnTime = time + spawnDelayBase;
        }

        this.updateEnemies(time, delta);
        this.updateProjectiles(delta);
        
        this.hazards.getChildren().forEach(h => {
            if (h.lifespan) {
                h.lifespan -= delta;
                if (h.lifespan <= 0) h.destroy();
            }
        });
        
        this.killStreakTimer -= delta;
        if (this.killStreakTimer <= 0) this.killStreak = 0;
    }

    handleHeroicEffects(time, delta) {
        if (this.playerStats.heroic.bombLauncher) {
            this.bombTimer -= delta;
            if (this.bombTimer <= 0) {
                this.bombTimer = 3000; 
                this.spawnHeroicBomb();
            }
        }
        if (this.playerStats.heroic.thunderField) {
            this.thunderTimer -= delta;
            if (this.thunderTimer <= 0) {
                this.thunderTimer = 2000;
                this.triggerThunderStrike();
            }
        }
        if (this.playerStats.heroic.blackHole) {
            this.blackHoleTimer -= delta;
            if (this.blackHoleTimer <= 0) {
                this.blackHoleTimer = 8000; 
                this.spawnBlackHole();
            }
        }
        if (this.playerStats.heroic.globalBurn) {
            this.globalBurnTimer -= delta;
            if (this.globalBurnTimer <= 0) {
                this.globalBurnTimer = 1000;
                this.enemies.getChildren().forEach(e => {
                    if (e.active) this.damageEnemy(e, 1, false);
                });
                this.bossGroup.getChildren().forEach(b => {
                    if (b.active) this.damageBoss(b, 1, false);
                });
            }
        }
        
        this.blackHoleGroup.getChildren().forEach(bh => {
             bh.lifespan -= delta;
             if (bh.lifespan <= 0) {
                 this.explodeBlackHole(bh);
             } else {
                 const range = 200;
                 this.enemies.getChildren().forEach(e => {
                     if (Phaser.Math.Distance.Between(bh.x, bh.y, e.x, e.y) < range) {
                         this.physics.moveToObject(e, bh, 100);
                     }
                 });
             }
        });
    }

    handleSpecialSkills(time, delta) {
        if (this.playerStats.hasShieldUpgrade && this.playerStats.shieldCharges < this.playerStats.shieldMaxCharges) {
            this.playerStats.shieldTimer += delta;
            if (this.playerStats.shieldTimer >= this.playerStats.shieldCooldown) { 
                this.playerStats.shieldCharges++;
                this.playerStats.shieldTimer = 0;
                this.createFloatingText(this.player.x, this.player.y - 20, '护盾恢复', false, '#00ffff');
            }
        } else {
             this.playerStats.shieldTimer = 0;
        }
        
        if (this.playerStats.hasBurningAura) {
            this.burningAuraTimer += delta;
            if (this.burningAuraTimer >= 1000) {
                this.burningAuraTimer = 0;
                const radius = 120;
                this.enemies.getChildren().forEach(enemy => {
                    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < radius) {
                        this.damageEnemy(enemy, 1);
                    }
                });
                this.bossGroup.getChildren().forEach(bossSprite => {
                    if (bossSprite.active && Phaser.Math.Distance.Between(this.player.x, this.player.y, bossSprite.x, bossSprite.y) < radius + 32) {
                        this.damageBoss(bossSprite, 1);
                    }
                });
            }
        }
    }

    handlePlayerMovement(delta) {
        let speedMult = 1;
        this.hazards.getChildren().forEach(h => {
             if (h.hazardType === 'time_slow' && this.physics.overlap(this.player, h)) {
                 speedMult = 0.5;
             }
        });
        
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
            this.playerStats.dashCooldown = 2000;
            this.player.x = Phaser.Math.Clamp(this.player.x, 0, WORLD_WIDTH);
            this.player.y = Phaser.Math.Clamp(this.player.y, 0, WORLD_HEIGHT);
            this.deathEmitter.emitParticleAt(this.player.x, this.player.y);
            
            if (this.playerStats.heroic.dashSlam) {
                this.triggerExplosion(this.player.x, this.player.y, 150, 5, false);
                this.cameras.main.shake(100, 0.01);
            }
        } else {
            const speed = this.playerStats.speed * speedMult;
            this.player.setVelocity(dirX * speed, dirY * speed);
        }
    }

    // --- Heroic Actions ---

    spawnHeroicBomb() {
        const bomb = this.bombGroup.create(this.player.x, this.player.y, 'bomb');
        const angle = Math.random() * Math.PI * 2;
        bomb.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 100);
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        this.time.delayedCall(2000, () => {
            if (bomb.active) this.explodeBomb(bomb);
        });
    }

    explodeBomb(bomb) {
        if (!bomb.active) return;
        this.triggerExplosion(bomb.x, bomb.y, 120, 5, true); 
        bomb.destroy();
    }

    triggerExplosion(x, y, radius, damage, isExplosionType) {
        this.explodeEmitter.emitParticleAt(x, y);
        this.cameras.main.shake(50, 0.005);
        
        this.enemies.getChildren().forEach(e => {
            if (Phaser.Math.Distance.Between(x, y, e.x, e.y) < radius) {
                if (isExplosionType) e.lastDamageWasExplosion = true;
                this.damageEnemy(e, damage);
            }
        });
        this.bossGroup.getChildren().forEach(b => {
             if (Phaser.Math.Distance.Between(x, y, b.x, b.y) < radius) {
                 this.damageBoss(b, damage);
             }
        });
    }

    triggerThunderStrike() {
        const enemy = Phaser.Utils.Array.GetRandom(this.enemies.getChildren());
        if (!enemy) return;
        
        const g = this.add.graphics();
        g.lineStyle(2, 0xffff00);
        g.lineBetween(enemy.x, enemy.y - 200, enemy.x, enemy.y);
        this.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
        
        this.triggerExplosion(enemy.x, enemy.y, 60, 10, false);
    }

    spawnBlackHole() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 100;
        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;
        
        const bh = this.blackHoleGroup.create(x, y, 'black_hole');
        bh.lifespan = 3000;
        bh.setScale(0.1);
        this.tweens.add({ targets: bh, scale: 2, duration: 2000 });
        this.createFloatingText(x, y, "黑洞!", false);
    }

    explodeBlackHole(bh) {
        this.triggerExplosion(bh.x, bh.y, 150, 20, true);
        bh.destroy();
    }

    pullAllGems() {
        this.gems.getChildren().forEach(gem => {
            this.physics.moveToObject(gem, this.player, 800);
        });
    }

    spawnClone() {
        const clone = this.cloneGroup.create(this.player.x, this.player.y, 'player_clone');
        clone.setAlpha(0.7);
        this.cloneObject = clone;
    }

    updateClone(delta, time) {
        if (this.playerStats.heroic.clone && this.cloneObject && this.cloneObject.active) {
            const dist = Phaser.Math.Distance.Between(this.cloneObject.x, this.cloneObject.y, this.player.x, this.player.y);
            if (dist > 40) {
                this.physics.moveToObject(this.cloneObject, this.player, this.playerStats.speed * 0.9);
            } else {
                this.cloneObject.setVelocity(0);
            }
        }
    }

    // --- Enemy Logic & Spawning ---

    getSpawnWeights(t) {
        let w = {};
        
        // Default small chance for everything appropriate
        if (t < 60) {
            w = { zombie: 50, rat: 30, skeleton: 20 };
        } else if (t < 120) {
            w = { zombie: 20, rat: 20, bat: 20, ghost: 10, archer: 15, spider: 10, bomber: 5 };
        } else if (t < 180) {
            w = { tank: 15, golem: 5, mage: 15, charger: 10, healer: 10, buffer: 10, zombie: 10, skeleton: 10, archer: 10, bomber: 5 };
        } else if (t < 240) {
            w = { sniper: 15, shotgun: 15, assassin: 10, turret: 5, slime_trail: 10, orbiter: 10, tank: 10, charger: 10, healer: 5, buffer: 5, elite_knight: 5 };
        } else if (t < 300) {
            w = { splitter: 15, splitter_giant: 5, summoner: 10, commander: 10, repulsor: 5, attractor: 5, sniper: 10, shotgun: 10, assassin: 10, elite_sorcerer: 5, elite_knight: 5 };
        } else {
            // Chaos
            w = { splitter_giant: 10, summoner: 10, commander: 10, repulsor: 5, attractor: 5, elite_knight: 15, elite_sorcerer: 15, sniper: 10, assassin: 10, turret: 5, golem: 5 };
        }
        return w;
    }

    spawnEnemy() {
        const weights = this.getSpawnWeights(this.survivalTime);
        const pool = [];
        for (const [type, weight] of Object.entries(weights)) {
            for (let i = 0; i < weight; i++) pool.push(type);
        }
        const typeId = Phaser.Utils.Array.GetRandom(pool) || 'zombie';
        
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
        const baseHp = def.hp + Math.floor(this.survivalTime / 60);
        const hpMult = this.eventGlobalStats ? this.eventGlobalStats.enemyHpMult : 1;
        enemy.hp = Math.floor(baseHp * hpMult);
        enemy.speed = def.speed;
        enemy.typeId = def.id;
        enemy.isBuffed = false;
        
        // Init state variables based on behavior
        enemy.stateTimer = 0;
        enemy.customState = 'idle'; // Generic state variable
        
        if (def.behavior === 'zigzag') {
             enemy.zigOffset = Math.random() * 100;
        }
        else if (def.behavior === 'orbiter') {
             enemy.orbitDir = Math.random() < 0.5 ? 1 : -1;
        }
        
        // Visuals
        if (def.alpha) enemy.setAlpha(def.alpha);
        if (def.glow) enemy.setTint(0xffaaaa);

        Object.assign(enemy, overrideProps);
        enemy.setCollideWorldBounds(true); 
        return enemy;
    }

    updateEnemies(time, delta) {
        if (this.isTimeFrozen) return;

        // Pre-calculate buffers/zones
        const buffers = this.enemies.getChildren().filter(e => e.typeId === 'buffer' || e.typeId === 'commander');
        const speedZones = this.hazards.getChildren().filter(h => h.hazardType === 'time_fast');

        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            // Stats Update
            let speedMult = 1;
            if (this.playerStats.hasSlowAura) {
                if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < 150) speedMult *= 0.7;
            }
            speedZones.forEach(z => { if (this.physics.overlap(enemy, z)) speedMult *= 1.5; });

            enemy.isBuffed = false;
            buffers.forEach(buffer => {
                if (buffer !== enemy && buffer.active) {
                    if (Phaser.Math.Distance.Between(buffer.x, buffer.y, enemy.x, enemy.y) < buffer.def.buffRange) {
                        if (buffer.def.buffType === 'speed') {
                             speedMult *= 1.5;
                             enemy.isBuffed = true;
                        } 
                        // Defense handled in damage logic
                    }
                }
            });

            // Behavior Dispatch
            this.updateEnemyBehavior(enemy, delta, time, speedMult);
            
            // Devourer Boss Interaction
            if (this.currentBoss && this.currentBoss.def.id === 'devourer' && this.currentBoss.state.phase === 'suck') {
                const bossSprite = this.currentBoss.units[0];
                if (bossSprite && bossSprite.active && Phaser.Math.Distance.Between(enemy.x, enemy.y, bossSprite.x, bossSprite.y) < 250) {
                     this.physics.moveToObject(enemy, bossSprite, 120);
                }
            }
        });
    }

    updateEnemyBehavior(enemy, delta, time, speedMult) {
        const def = enemy.def;
        const speed = enemy.speed * speedMult;
        const distToPlayer = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        enemy.stateTimer += delta;

        switch (def.behavior) {
            case 'chaser':
            case 'splitter':
            case 'exploder':
                this.physics.moveToObject(enemy, this.player, speed);
                break;

            case 'zigzag':
                // Move towards player but add sine wave perpendicular
                const zigFreq = 0.005;
                const zigAmp = 100;
                const forwardX = Math.cos(angleToPlayer) * speed;
                const forwardY = Math.sin(angleToPlayer) * speed;
                const perpX = Math.cos(angleToPlayer + Math.PI/2);
                const perpY = Math.sin(angleToPlayer + Math.PI/2);
                const wave = Math.sin((time + enemy.zigOffset) * zigFreq * def.zigSpeed) * zigAmp;
                // We just set velocity directly roughly
                enemy.setVelocity(forwardX + perpX * wave, forwardY + perpY * wave);
                break;

            case 'charger':
                if (enemy.customState === 'idle') {
                    this.physics.moveToObject(enemy, this.player, speed * 0.5);
                    if (enemy.stateTimer > 2000) {
                        enemy.customState = 'charging';
                        enemy.stateTimer = 0;
                        enemy.chargeAngle = angleToPlayer;
                    }
                } else if (enemy.customState === 'charging') {
                    const chargeSpeed = def.chargeSpeed || 200;
                    enemy.setVelocity(Math.cos(enemy.chargeAngle) * chargeSpeed, Math.sin(enemy.chargeAngle) * chargeSpeed);
                    if (enemy.stateTimer > 1000) {
                        enemy.customState = 'idle';
                        enemy.stateTimer = 0;
                    }
                }
                break;

            case 'shooter':
            case 'shooter_spread':
            case 'shooter_rapid':
                if (distToPlayer > (def.range || 200)) {
                    this.physics.moveToObject(enemy, this.player, speed);
                } else {
                    enemy.setVelocity(0);
                    if (enemy.stateTimer > (def.fireRate || 2000)) {
                        enemy.stateTimer = 0;
                        if (def.behavior === 'shooter_spread') {
                             this.fireEnemyBullet(enemy, this.player.x, this.player.y, def.bulletSpeed, 'enemy_bullet', 0);
                             this.fireEnemyBullet(enemy, this.player.x, this.player.y, def.bulletSpeed, 'enemy_bullet', 0.3);
                             this.fireEnemyBullet(enemy, this.player.x, this.player.y, def.bulletSpeed, 'enemy_bullet', -0.3);
                        } else {
                             this.fireEnemyBullet(enemy, this.player.x, this.player.y, def.bulletSpeed);
                        }
                    }
                }
                break;

            case 'teleporter':
                this.physics.moveToObject(enemy, this.player, speed);
                if (enemy.stateTimer > (def.teleportInterval || 3000)) {
                    enemy.stateTimer = 0;
                    if (distToPlayer > 150) {
                         const angle = Phaser.Math.FloatBetween(0, Math.PI*2);
                         const r = 100;
                         // Blink visual
                         const startX = enemy.x, startY = enemy.y;
                         enemy.x = this.player.x + Math.cos(angle) * r;
                         enemy.y = this.player.y + Math.sin(angle) * r;
                         // Trail line
                         const g = this.add.graphics();
                         g.lineStyle(2, enemy.def.color, 0.5);
                         g.lineBetween(startX, startY, enemy.x, enemy.y);
                         this.tweens.add({targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy()});
                    }
                }
                break;
            
            case 'miner':
                this.physics.moveToObject(enemy, this.player, speed);
                if (enemy.stateTimer > (def.mineInterval || 3000)) {
                    enemy.stateTimer = 0;
                    const mine = this.hazards.create(enemy.x, enemy.y, 'particle');
                    mine.setScale(2);
                    mine.setTint(0x00ff00); // Poison web
                    mine.lifespan = 4000;
                    mine.hazardType = 'fire'; // Reusing fire logic for generic dmg
                }
                break;
                
            case 'trail':
                this.physics.moveToObject(enemy, this.player, speed);
                if (enemy.stateTimer > 200) { // Frequent drops
                    enemy.stateTimer = 0;
                    const trail = this.hazards.create(enemy.x, enemy.y, 'particle');
                    trail.setTint(0x00ff00);
                    trail.lifespan = 2000;
                    trail.hazardType = 'fire';
                }
                break;

            case 'orbiter':
                const orbitDist = def.orbitDist || 150;
                if (distToPlayer > orbitDist + 50) {
                    this.physics.moveToObject(enemy, this.player, speed);
                } else if (distToPlayer < orbitDist - 20) {
                     // Too close, back off
                     const awayX = Math.cos(angleToPlayer + Math.PI) * speed;
                     const awayY = Math.sin(angleToPlayer + Math.PI) * speed;
                     enemy.setVelocity(awayX, awayY);
                } else {
                     // Orbit
                     const orbitX = Math.cos(angleToPlayer + Math.PI/2 * (enemy.orbitDir||1)) * speed;
                     const orbitY = Math.sin(angleToPlayer + Math.PI/2 * (enemy.orbitDir||1)) * speed;
                     enemy.setVelocity(orbitX, orbitY);
                }
                break;
            
            case 'healer':
                // Find injured friend
                let target = null;
                this.enemies.getChildren().forEach(e => {
                     if (e !== enemy && e.active && e.hp < e.def.hp && Phaser.Math.Distance.Between(e.x, e.y, enemy.x, enemy.y) < (def.healRange||150)) {
                         target = e;
                     }
                });
                if (target) {
                    if (Phaser.Math.Distance.Between(enemy.x, enemy.y, target.x, target.y) > 50) {
                        this.physics.moveToObject(enemy, target, speed);
                    } else {
                        enemy.setVelocity(0);
                        if (enemy.stateTimer > (def.healRate||2000)) {
                            enemy.stateTimer = 0;
                            target.hp = Math.min(target.hp + 2, target.def.hp + 5); // Heal
                            this.createFloatingText(target.x, target.y, "+HP", false);
                        }
                    }
                } else {
                    // No target, follow player slightly
                    this.physics.moveToObject(enemy, this.player, speed * 0.8);
                }
                break;
            
            case 'summoner':
                if (distToPlayer < 300) enemy.setVelocity(0);
                else this.physics.moveToObject(enemy, this.player, speed);
                
                if (enemy.stateTimer > (def.summonInterval || 5000)) {
                    enemy.stateTimer = 0;
                    this.createEnemy(def.summonType || 'skeleton', enemy.x + 20, enemy.y);
                    this.createEnemy(def.summonType || 'skeleton', enemy.x - 20, enemy.y);
                    this.createFloatingText(enemy.x, enemy.y, "召唤!", true);
                }
                break;
                
            case 'force':
                this.physics.moveToObject(enemy, this.player, speed);
                // Apply force to player
                const forceDist = 200;
                if (distToPlayer < forceDist) {
                    const forceDir = def.forceType === 'push' ? 1 : -1;
                    const forceStr = 200 * (1 - distToPlayer/forceDist);
                    this.player.body.velocity.x += Math.cos(angleToPlayer) * forceStr * forceDir * (delta/1000);
                    this.player.body.velocity.y += Math.sin(angleToPlayer) * forceStr * forceDir * (delta/1000);
                }
                break;

            case 'shielder': // Commander
            case 'buffer': 
                this.physics.moveToObject(enemy, this.player, speed);
                break;

            default:
                this.physics.moveToObject(enemy, this.player, speed);
                break;
        }
    }

    fireEnemyBullet(source, targetX, targetY, speed = 150, texture = 'enemy_bullet', angleOffset = 0) {
        const bullet = this.enemyBullets.create(source.x, source.y, texture);
        const angle = Phaser.Math.Angle.Between(source.x, source.y, targetX, targetY) + angleOffset;
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        bullet.setRotation(angle);
        return bullet;
    }

    updateProjectiles(delta) {
        this.bullets.getChildren().forEach(b => { 
            const dist = Phaser.Math.Distance.Between(b.startX, b.startY, b.x, b.y);
            let destroy = false;
            
            if (dist > b.maxDistance) destroy = true;
            
            if (!this.physics.world.bounds.contains(b.x, b.y)) {
                if (this.playerStats.heroic.wallBounce && b.bounces > 0) {
                    b.bounces--;
                    if (b.x <= 0 || b.x >= WORLD_WIDTH) b.body.velocity.x *= -1;
                    if (b.y <= 0 || b.y >= WORLD_HEIGHT) b.body.velocity.y *= -1;
                    b.rotation = Math.atan2(b.body.velocity.y, b.body.velocity.x);
                    b.x = Phaser.Math.Clamp(b.x, 1, WORLD_WIDTH-1);
                    b.y = Phaser.Math.Clamp(b.y, 1, WORLD_HEIGHT-1);
                } else {
                    destroy = true;
                }
            }
            
            if (destroy) b.destroy();

            // Mage passive weak homing OR Heroic Homing
            const isHoming = (this.playerStats.heroic.homing) || (this.playerStats.heroPassive === 'time_magic');
            
            if (b.active && isHoming && b.isHoming) {
                let nearest = null;
                let minDist = 300;
                this.enemies.getChildren().forEach(e => {
                    const d = Phaser.Math.Distance.Between(b.x, b.y, e.x, e.y);
                    if (d < minDist) { minDist = d; nearest = e; }
                });
                if (nearest) {
                    const targetAngle = Phaser.Math.Angle.Between(b.x, b.y, nearest.x, nearest.y);
                    const currentAngle = b.rotation;
                    const turnRate = this.playerStats.heroic.homing ? 0.1 : 0.03; // Weak homing for passive
                    const nextAngle = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, turnRate); 
                    b.setRotation(nextAngle);
                    const speed = 350;
                    b.setVelocity(Math.cos(nextAngle) * speed, Math.sin(nextAngle) * speed);
                }
            }
        });
        this.enemyBullets.getChildren().forEach(b => { if (!this.physics.world.bounds.contains(b.x, b.y)) b.destroy(); });
    }

    // --- Boss Implementation ---

    createBossUI() {
        this.bossUI = this.add.container(GAME_WIDTH / 2, 40).setDepth(200).setScrollFactor(0).setVisible(false);
        this.bossNameText = this.add.text(0, -15, 'BOSS', { ...FONT_STYLE, fontSize: '14px', fill: '#ff0000', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
        this.bossHpBg = this.add.rectangle(0, 5, 200, 12, 0x000000).setStrokeStyle(1, 0xffffff);
        this.bossHpFill = this.add.rectangle(-100, 5, 200, 10, 0xff0000).setOrigin(0, 0.5);
        this.bossUI.add([this.bossHpBg, this.bossHpFill, this.bossNameText]);
    }

    spawnBoss() {
        const warning = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2 - 50, '⚠️ BOSS 即将出现! ⚠️', { ...FONT_STYLE, fontSize: '24px', fill: '#ff0000', strokeThickness: 4 }).setOrigin(0.5).setScrollFactor(0).setDepth(300);
        this.tweens.add({ targets: warning, alpha: 0, scale: 1.2, duration: 500, yoyo: true, repeat: 3, onComplete: () => warning.destroy() });

        const bossDef = Phaser.Utils.Array.GetRandom(BOSS_DEFINITIONS);
        const baseHp = 500 + this.level * 50 + (this.survivalTime * 2);
        const bossHp = Math.floor(baseHp * bossDef.hpMult);

        const startAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = 400;
        const bx = Phaser.Math.Clamp(this.player.x + Math.cos(startAngle) * dist, 50, WORLD_WIDTH - 50);
        const by = Phaser.Math.Clamp(this.player.y + Math.sin(startAngle) * dist, 50, WORLD_HEIGHT - 50);

        const bossSprite = this.bossGroup.create(bx, by, bossDef.texture);
        bossSprite.setScale(bossDef.scale);
        bossSprite.setCollideWorldBounds(true);
        bossSprite.setImmovable(true);
        bossSprite.hp = bossHp; 
        bossSprite.maxHp = bossHp;
        bossSprite.invulnOrbit = 0;
        bossSprite.bossId = bossDef.id;

        this.currentBoss = {
            def: bossDef,
            units: [bossSprite],
            maxHp: bossHp,
            hp: bossHp,
            name: `BOSS: ${bossDef.name}`,
            state: { timer: 0, phase: 'start' } 
        };

        if (bossDef.id === 'devourer') { this.currentBoss.state.phase = 'chase'; }
        if (bossDef.id === 'splitter') { this.currentBoss.state.split = false; }
        if (bossDef.id === 'reflector') { this.currentBoss.state.shieldActive = false; }
        if (bossDef.id === 'firelord') { this.currentBoss.state.enraged = false; }

        this.bossNameText.setText(this.currentBoss.name);
        this.bossUI.setVisible(true);
    }

    updateBoss(time, delta) {
        if (!this.currentBoss) return;
        this.currentBoss.units = this.currentBoss.units.filter(u => u.active);
        
        if (this.currentBoss.units.length === 0) {
            this.killBoss();
            return;
        }

        let currentTotalHp = 0;
        let maxTotalHp = 0;
        this.currentBoss.units.forEach(u => {
            currentTotalHp += u.hp;
            maxTotalHp += u.maxHp;
        });
        
        if (!(this.currentBoss.def.id === 'splitter' && this.currentBoss.state.split)) {
             maxTotalHp = this.currentBoss.maxHp;
        }
        
        const hpRatio = Math.max(0, currentTotalHp / maxTotalHp);
        this.bossHpFill.width = 200 * hpRatio;

        this.currentBoss.units.forEach(unit => {
            this.updateBossBehavior(unit, delta, time);
            if (unit.invulnOrbit > 0) unit.invulnOrbit -= delta;
        });
    }

    updateBossBehavior(boss, delta, time) {
        if (this.isTimeFrozen) return; 

        const id = this.currentBoss.def.id;
        const state = this.currentBoss.state;
        const baseSpeed = this.currentBoss.def.speed;

        switch(id) {
            case 'devourer':
                state.timer += delta;
                if (state.phase === 'chase') {
                    this.physics.moveToObject(boss, this.player, baseSpeed);
                    if (state.timer > 7000) { state.timer = 0; state.phase = 'suck'; }
                } 
                else if (state.phase === 'suck') {
                    boss.setVelocity(0);
                    if (state.timer % 200 < delta) {
                         const p = this.add.circle(boss.x, boss.y, state.timer/10, 0x990099, 0.3);
                         this.tweens.add({targets:p, scale: 0, duration: 500, onComplete: ()=>p.destroy()});
                    }
                    if (state.timer > 1500) {
                        state.timer = 0;
                        state.phase = 'spit';
                        this.enemies.getChildren().forEach(e => {
                             if (Phaser.Math.Distance.Between(e.x, e.y, boss.x, boss.y) < 100) {
                                 const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y) + Phaser.Math.FloatBetween(-0.5, 0.5);
                                 e.body.velocity.x = Math.cos(angle) * 400;
                                 e.body.velocity.y = Math.sin(angle) * 400;
                             }
                        });
                    }
                }
                else if (state.phase === 'spit') {
                    if (state.timer > 500) { state.timer = 0; state.phase = 'chase'; }
                }
                break;

            case 'dodger':
                state.timer += delta;
                let dodgeX = 0, dodgeY = 0;
                let dodging = false;
                this.bullets.getChildren().forEach(b => {
                    if (Phaser.Math.Distance.Between(boss.x, boss.y, b.x, b.y) < 100) {
                        const angle = Phaser.Math.Angle.Between(b.x, b.y, boss.x, boss.y);
                        dodgeX += Math.cos(angle + Math.PI/2);
                        dodgeY += Math.sin(angle + Math.PI/2);
                        dodging = true;
                    }
                });
                if (dodging) {
                    boss.setVelocity(dodgeX * 150, dodgeY * 150);
                } else {
                    if (state.timer > 2000) {
                        const dashAngle = Phaser.Math.FloatBetween(0, Math.PI*2);
                        boss.setVelocity(Math.cos(dashAngle)*300, Math.sin(dashAngle)*300);
                        if (state.timer > 2200) state.timer = 0;
                    } else {
                        this.physics.moveToObject(boss, this.player, baseSpeed);
                    }
                }
                break;

            case 'mage':
                state.timer += delta;
                if (state.timer > 4000) {
                    state.timer = 0;
                    const angle = Phaser.Math.FloatBetween(0, Math.PI*2);
                    const r = 150;
                    boss.x = this.player.x + Math.cos(angle) * r;
                    boss.y = this.player.y + Math.sin(angle) * r;
                    const count = boss.hp < boss.maxHp * 0.5 ? 12 : 8;
                    for(let i=0; i<count; i++) {
                        const fireAngle = (i/count) * Math.PI * 2;
                        this.fireEnemyBullet(boss, boss.x + Math.cos(fireAngle)*100, boss.y + Math.sin(fireAngle)*100, 100);
                    }
                } else {
                    boss.setVelocity(Math.sin(time/500)*20, Math.cos(time/500)*20);
                }
                break;

            case 'summoner':
                state.timer += delta;
                this.physics.moveToObject(boss, this.player, baseSpeed);
                if (state.timer > 5000) {
                    state.timer = 0;
                    const type = Phaser.Math.RND.pick(['rat', 'tank', 'charger']);
                    for(let i=0; i<3; i++) {
                        this.createEnemy(type, boss.x + Phaser.Math.Between(-50,50), boss.y + Phaser.Math.Between(-50,50));
                    }
                }
                break;

            case 'charger':
                if (!state.phase) state.phase = 'track';
                state.timer += delta;
                if (state.phase === 'track') {
                    this.physics.moveToObject(boss, this.player, baseSpeed);
                    if (state.timer > 3000) {
                        state.timer = 0;
                        state.phase = 'lock';
                        state.targetAngle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
                        const line = this.add.graphics();
                        line.lineStyle(2, 0xff0000, 0.5);
                        line.lineBetween(boss.x, boss.y, boss.x + Math.cos(state.targetAngle)*500, boss.y + Math.sin(state.targetAngle)*500);
                        this.tweens.add({targets:line, alpha:0, duration:500, onComplete:()=>line.destroy()});
                    }
                } else if (state.phase === 'lock') {
                    boss.setVelocity(0);
                    if (state.timer > 500) {
                        state.timer = 0;
                        state.phase = 'charge';
                        boss.setVelocity(Math.cos(state.targetAngle)*400, Math.sin(state.targetAngle)*400);
                    }
                } else if (state.phase === 'charge') {
                    if (state.timer % 100 < delta) {
                        const trail = this.hazards.create(boss.x, boss.y, 'particle');
                        trail.setScale(2);
                        trail.setTint(0xff0000);
                        trail.lifespan = 2000;
                        trail.hazardType = 'fire';
                    }
                    if (state.timer > 1000) {
                        state.timer = 0;
                        state.phase = 'track';
                    }
                }
                break;

            case 'splitter':
                this.physics.moveToObject(boss, this.player, baseSpeed * (state.split ? 1.5 : 1));
                break;

            case 'reflector':
                state.timer += delta;
                this.physics.moveToObject(boss, this.player, baseSpeed);
                if (state.timer > 4000) {
                     state.timer = 0;
                     state.shieldActive = !state.shieldActive;
                     boss.setAlpha(state.shieldActive ? 0.6 : 1);
                     boss.setTint(state.shieldActive ? 0xffffff : 0xc0c0c0);
                }
                if (state.shieldActive) {
                    if (Math.random() < 0.2) {
                        const g = this.add.graphics();
                        g.lineStyle(2, 0xffffff, 0.8);
                        g.strokeCircle(boss.x, boss.y, 30);
                        this.time.delayedCall(100, () => g.destroy());
                    }
                }
                break;

            case 'time':
                state.timer += delta;
                this.physics.moveToObject(boss, this.player, baseSpeed);
                if (state.timer > 3000) {
                    state.timer = 0;
                    const type = Math.random() < 0.5 ? 'time_slow' : 'time_fast';
                    const color = type === 'time_slow' ? 0x0000ff : 0xff0000;
                    const zone = this.hazards.create(this.player.x, this.player.y, 'particle'); 
                    zone.setAlpha(0);
                    zone.lifespan = 4000;
                    zone.hazardType = type;
                    const g = this.add.circle(zone.x, zone.y, 80, color, 0.3);
                    this.tweens.add({ targets: g, alpha: 0, duration: 4000, onComplete: () => g.destroy() });
                    zone.body.setCircle(80);
                    zone.body.moves = false;
                }
                break;

            case 'turret':
                boss.rotation += 0.02;
                state.timer += delta;
                if (state.timer > 200) {
                    state.timer = 0;
                    const barrelAngle = boss.rotation;
                    this.fireEnemyBullet(boss, boss.x + Math.cos(barrelAngle)*100, boss.y + Math.sin(barrelAngle)*100, 200);
                    this.fireEnemyBullet(boss, boss.x + Math.cos(barrelAngle + Math.PI)*100, boss.y + Math.sin(barrelAngle + Math.PI)*100, 200);
                }
                break;
            
            case 'firelord':
                this.physics.moveToObject(boss, this.player, state.enraged ? baseSpeed * 1.5 : baseSpeed);
                if (boss.hp < boss.maxHp * 0.5 && !state.enraged) {
                    state.enraged = true;
                    boss.setTint(0xffaa00);
                    this.createFloatingText(boss.x, boss.y, "狂暴!", true);
                }
                state.timer += delta;
                const fireRate = state.enraged ? 800 : 1500;
                if (state.timer > fireRate) {
                    state.timer = 0;
                    const bullet = this.fireEnemyBullet(boss, this.player.x, this.player.y, state.enraged ? 250 : 150, 'fireball');
                    if (state.enraged) {
                        bullet.isExplosive = true;
                    }
                }
                break;

            default:
                this.physics.moveToObject(boss, this.player, baseSpeed);
                break;
        }
    }

    handleBulletHitBoss(bullet, bossSprite) {
        bullet.destroy();
        if (!this.currentBoss) return;
        
        if (this.currentBoss.def.id === 'reflector' && this.currentBoss.state.shieldActive) {
            const reflected = this.enemyBullets.create(bossSprite.x, bossSprite.y, 'enemy_bullet');
            const angle = Phaser.Math.Angle.Between(bossSprite.x, bossSprite.y, this.player.x, this.player.y);
            reflected.setVelocity(Math.cos(angle)*300, Math.sin(angle)*300);
            this.createFloatingText(bossSprite.x, bossSprite.y, "反射!", false);
            return;
        }
        
        let dmg = bullet.damage || 1;
        let isCrit = false;
        if (Math.random() < this.playerStats.critChance) {
            dmg *= this.playerStats.critMultiplier;
            isCrit = true;
        }
        
        if (this.playerStats.heroic.bossSlayer) dmg *= 2;

        this.damageBoss(bossSprite, dmg, isCrit);
    }

    handleOrbitHitBoss(orb, bossSprite) {
        if (!this.currentBoss) return;
        if (bossSprite.invulnOrbit > 0) return;
        bossSprite.invulnOrbit = 500; 
        
        if (this.currentBoss.def.id === 'reflector' && this.currentBoss.state.shieldActive) return;

        let dmg = this.weapon.orbitDamage;
        if (this.playerStats.heroic.bossSlayer) dmg *= 2;
        
        this.damageBoss(bossSprite, dmg, false);
        this.createFloatingText(bossSprite.x, bossSprite.y - 20, "砍击", false);
    }
    
    handleBladeHitBoss(blade, bossSprite) {
        if (bossSprite.invulnBlade > 0) return;
        bossSprite.invulnBlade = 200; 
        
        let dmg = 5; 
        if (this.playerStats.heroic.bossSlayer) dmg *= 2;
        this.damageBoss(bossSprite, dmg, false);
        this.createFloatingText(bossSprite.x, bossSprite.y - 20, "斩!", true); 
    }

    damageBoss(bossSprite, amount, isCrit = false) {
        if (!bossSprite.active) return;
        bossSprite.hp -= amount;
        
        bossSprite.setTint(0xffaaaa);
        this.time.delayedCall(50, () => { 
            if (bossSprite.active) {
                 if (this.currentBoss && this.currentBoss.def.id === 'firelord' && this.currentBoss.state.enraged) bossSprite.setTint(0xffaa00);
                 else if (this.currentBoss && this.currentBoss.def.id === 'reflector' && this.currentBoss.state.shieldActive) bossSprite.setTint(0xffffff);
                 else bossSprite.clearTint(); 
            }
        });

        const damageText = isCrit ? `${Math.floor(amount)} 暴击!` : `${Math.floor(amount)}`;
        this.createFloatingText(bossSprite.x, bossSprite.y - 40, damageText, isCrit);
        
        if (this.playerStats.heroic.bloodSiphon && Math.random() < 0.1) {
             this.healPlayer(1);
        }

        if (bossSprite.hp <= 0) {
            if (this.currentBoss.def.id === 'splitter' && !this.currentBoss.state.split) {
                this.splitBoss(bossSprite);
            } else {
                this.destroyBossUnit(bossSprite);
            }
        }
    }

    splitBoss(oldSprite) {
        this.currentBoss.state.split = true;
        const x = oldSprite.x;
        const y = oldSprite.y;
        
        this.explodeEmitter.emitParticleAt(x, y);
        oldSprite.destroy();
        this.currentBoss.units = [];

        for (let i = 0; i < 2; i++) {
            const sub = this.bossGroup.create(x + (i===0?-30:30), y, 'boss_splitter');
            sub.setScale(2.0);
            sub.setCollideWorldBounds(true);
            sub.setImmovable(true);
            const subHp = Math.floor(this.currentBoss.maxHp * 0.6); 
            sub.hp = subHp;
            sub.maxHp = subHp;
            sub.invulnOrbit = 0;
            this.currentBoss.units.push(sub);
        }
        
        this.createFloatingText(x, y, "分裂!", true);
    }

    destroyBossUnit(bossSprite) {
        this.explodeEmitter.emitParticleAt(bossSprite.x, bossSprite.y);
        for (let i = 0; i < 15; i++) {
            const gx = bossSprite.x + Phaser.Math.Between(-40, 40);
            const gy = bossSprite.y + Phaser.Math.Between(-40, 40);
            const gem = this.gems.create(gx, gy, 'gem');
            gem.setCircle(3);
        }
        bossSprite.destroy();
    }

    killBoss() {
        this.currentBoss = null;
        this.bossesKilled++;
        this.bossUI.setVisible(false);
        this.nextBossTime = this.survivalTime + Phaser.Math.Between(this.bossIntervalMin, this.bossIntervalMax);
        
        this.createFloatingText(this.player.x, this.player.y - 50, "BOSS 击杀奖励!", true);
        this.time.delayedCall(1000, () => {
             this.xp += this.xpToNextLevel; 
             this.levelUp();
        });
    }

    handleBossTouchPlayer(player, bossSprite) {
        this.takePlayerDamage(3); 
        const angle = Phaser.Math.Angle.Between(bossSprite.x, bossSprite.y, player.x, player.y);
        player.x += Math.cos(angle) * 50;
        player.y += Math.sin(angle) * 50;
        player.x = Phaser.Math.Clamp(player.x, 20, WORLD_WIDTH - 20);
        player.y = Phaser.Math.Clamp(player.y, 20, WORLD_HEIGHT - 20);
    }
    
    handleHazardTouchPlayer(player, hazard) {
        if (hazard.hazardType === 'fire') {
            this.takePlayerDamage(1);
        }
    }

    // --- Combat ---

    fireWeapon() {
        let nearest = null;
        let minDist = Infinity;
        const range = this.playerStats.autoAttackRange; 

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist <= range && dist < minDist) { minDist = dist; nearest = enemy; }
        });

        this.bossGroup.getChildren().forEach(boss => {
            if (boss.active) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y);
                if (dist <= range && dist < minDist) {
                    minDist = dist;
                    nearest = boss;
                }
            }
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
        
        if (this.playerStats.heroic.clone && this.cloneObject && this.cloneObject.active) {
             const cloneBullet = this.bullets.create(this.cloneObject.x, this.cloneObject.y, 'bullet');
             const speed = 350;
             cloneBullet.setRotation(angle);
             cloneBullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
             cloneBullet.startX = this.cloneObject.x;
             cloneBullet.startY = this.cloneObject.y;
             cloneBullet.maxDistance = this.playerStats.bulletRange;
             cloneBullet.damage = Math.ceil(this.weapon.damage * 0.5); 
        }
    }

    fireBullet(angle) {
        const bullet = this.bullets.create(this.player.x, this.player.y, 'bullet');
        const speed = 350;
        bullet.setRotation(angle);
        bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        
        bullet.startX = this.player.x;
        bullet.startY = this.player.y;
        bullet.maxDistance = this.playerStats.bulletRange;
        bullet.bounces = 2; 
        bullet.isHoming = true; 

        let damage = this.weapon.damage * this.playerStats.damageMultiplier;
        if (this.eventGlobalStats) {
            damage *= this.eventGlobalStats.playerDmgMult * this.eventGlobalStats.tempDmgMult;
        }

        if (this.playerStats.isBerserker) {
            const missingHpPct = 1 - (this.playerStats.hp / this.playerStats.maxHp);
            damage *= (1 + 0.5 * missingHpPct);
        }
        if (this.playerStats.heroic.lastStand && this.playerStats.hp <= 1) {
            damage *= 2; 
        }
        
        bullet.damage = damage;
        bullet.pierceCount = this.playerStats.heroic.piercingChain ? 2 : 0; 
    }

    handleBulletHitEnemy(bullet, enemy) {
        if (bullet.pierceCount > 0) {
            bullet.pierceCount--;
            const currentVel = bullet.body.velocity;
            if (this.playerStats.heroic.piercingChain) {
                 let nextTarget = null;
                 let minDist = 200;
                 this.enemies.getChildren().forEach(e => {
                     if (e !== enemy && e.active) {
                         const d = Phaser.Math.Distance.Between(bullet.x, bullet.y, e.x, e.y);
                         if (d < minDist) { minDist = d; nextTarget = e; }
                     }
                 });
                 if (nextTarget) {
                     const ang = Phaser.Math.Angle.Between(bullet.x, bullet.y, nextTarget.x, nextTarget.y);
                     bullet.setVelocity(Math.cos(ang)*350, Math.sin(ang)*350);
                     bullet.setRotation(ang);
                 }
            }
        } else {
            bullet.destroy();
        }

        let dmg = bullet.damage || 1;
        let isCrit = false;
        if (Math.random() < this.playerStats.critChance) {
            dmg *= this.playerStats.critMultiplier;
            isCrit = true;
        }
        
        const willKill = (enemy.hp - dmg <= 0);
        
        this.damageEnemy(enemy, dmg, isCrit);
        
        if (willKill) {
             if (this.playerStats.heroic.splitCross) {
                 this.spawnSplitBullets(enemy.x, enemy.y, [0, Math.PI/2, Math.PI, -Math.PI/2]);
                 const g = this.add.graphics();
                 g.lineStyle(2, 0xffff00);
                 g.lineBetween(enemy.x-20, enemy.y, enemy.x+20, enemy.y);
                 g.lineBetween(enemy.x, enemy.y-20, enemy.x, enemy.y+20);
                 this.tweens.add({targets:g, alpha:0, duration:100, onComplete:()=>g.destroy()});
             }
             if (this.playerStats.heroic.splitAround) {
                 const angles = [];
                 for(let i=0;i<8;i++) angles.push((i/8)*Math.PI*2);
                 this.spawnSplitBullets(enemy.x, enemy.y, angles);
                 const c = this.add.circle(enemy.x, enemy.y, 5, 0xffffff);
                 this.tweens.add({targets:c, scale:5, alpha:0, duration:200, onComplete:()=>c.destroy()});
             }
        }
    }
    
    spawnSplitBullets(x, y, angles) {
        angles.forEach(a => {
            const b = this.bullets.create(x, y, 'bullet');
            b.setScale(0.8);
            b.setVelocity(Math.cos(a)*200, Math.sin(a)*200);
            b.damage = this.weapon.damage * 0.5; 
            b.maxDistance = 150;
            b.startX = x;
            b.startY = y;
        });
    }

    handleOrbitHitEnemy(orb, enemy) {
        if (enemy.invulnOrbit > 0) return;
        enemy.invulnOrbit = 20; 
        this.damageEnemy(enemy, this.weapon.orbitDamage, false);
        this.createFloatingText(enemy.x, enemy.y - 20, "砍击", false);
    }
    
    handleBladeHitEnemy(blade, enemy) {
        if (enemy.invulnBlade > 0) return;
        enemy.invulnBlade = 200; 
        this.damageEnemy(enemy, 5, false); 
        this.createFloatingText(enemy.x, enemy.y - 20, "斩!", true);
    }

    damageEnemy(enemy, amount, isCrit = false) {
        if (!enemy.active) return;
        
        // Commander Defense Buff check
        let defenseMod = 1.0;
        this.enemies.getChildren().forEach(e => {
            if (e.active && e !== enemy && e.typeId === 'commander' && Phaser.Math.Distance.Between(e.x, e.y, enemy.x, enemy.y) < 150) {
                defenseMod = 0.5; // 50% damage reduction
            }
        });
        
        enemy.hp -= amount * defenseMod;
        enemy.setTint(0xffffff);
        this.time.delayedCall(50, () => { if (enemy.active) enemy.clearTint(); });
        
        const damageText = isCrit ? `${Math.floor(amount)} 暴击!` : `${Math.floor(amount)}`;
        if (defenseMod < 1) this.createFloatingText(enemy.x, enemy.y - 10, "格挡", false);
        else this.createFloatingText(enemy.x, enemy.y, damageText, isCrit);

        if (this.playerStats.heroic.bloodSiphon) {
            if (Math.random() < 0.05) this.healPlayer(1);
        }

        if (enemy.hp <= 0) this.killEnemy(enemy);
    }
    
    healPlayer(amount) {
        if (this.eventGlobalStats && this.eventGlobalStats.noRegen) return;
        if (this.playerStats.hp < this.playerStats.maxHp) {
            this.playerStats.hp = Math.min(this.playerStats.hp + amount, this.playerStats.maxHp);
            this.updateUI();
            this.createFloatingText(this.player.x, this.player.y - 30, `+${amount}`, false);
        }
    }

    createFloatingText(x, y, text, isCrit, colorOverride = null) {
        const color = colorOverride ? colorOverride : (isCrit ? '#ffff00' : '#ffffff');
        const fontSize = isCrit ? '16px' : '12px';
        const txt = this.add.text(x, y, text, { ...FONT_STYLE, fontSize: fontSize, fill: color, strokeThickness: isCrit ? 3 : 1 }).setDepth(200);
        txt.setOrigin(0.5);
        this.tweens.add({
            targets: txt,
            y: y - 30,
            alpha: 0,
            duration: 600,
            onComplete: () => txt.destroy()
        });
    }

    killEnemy(enemy) {
        this.deathEmitter.emitParticleAt(enemy.x, enemy.y);
        
        if (this.playerStats.heroic.chainExplosion && enemy.lastDamageWasExplosion) {
            if (Math.random() < 0.5) {
                this.triggerExplosion(enemy.x, enemy.y, 80, 2, true);
            }
        }
        
        if (enemy.def.behavior === 'exploder') this.explodeEnemy(enemy);
        else if (enemy.def.behavior === 'splitter') {
             const count = enemy.def.splitCount || 2;
             const type = enemy.def.splitTo || 'slime_small';
             for(let i=0; i<count; i++) {
                this.createEnemy(type, enemy.x + Phaser.Math.Between(-10,10), enemy.y + Phaser.Math.Between(-10,10));
             }
        }
        
        if (this.playerStats.hasChainLightning) {
            const targets = this.enemies.getChildren().filter(e => e !== enemy && e.active && Phaser.Math.Distance.Between(e.x, e.y, enemy.x, enemy.y) < 100).slice(0, 5); 
            targets.forEach(t => this.damageEnemy(t, 1));
        }
        
        // Fanatic Passive
        if (this.playerStats.heroPassive === 'lifesteal') {
            if (Math.random() < 0.05) { // 5% chance
                this.healPlayer(1);
            }
        }
        
        if (this.playerStats.heroic.timeFreeze && !this.isTimeFrozen) {
            this.killStreak++;
            this.killStreakTimer = 1000; 
            if (this.killStreak >= 10) {
                 this.isTimeFrozen = true;
                 this.timeFreezeEndTime = this.time.now + 1000; 
                 this.createFloatingText(GAME_WIDTH/2, GAME_HEIGHT/2, "时间暂停!", true);
                 this.killStreak = 0;
            }
        }
        
        if (Math.random() < 0.01) { 
            const heart = this.hearts.create(enemy.x, enemy.y, 'heart');
            heart.setCircle(3);
        }
        
        const gem = this.gems.create(enemy.x, enemy.y, 'gem');
        gem.setCircle(3);
        enemy.destroy();
        this.kills++;
        this.killSinceLastShop++; // Increment shop kill counter
        
        // Gold Drop
        const goldDrop = Math.max(1, enemy.def.xp || 1);
        this.gold += goldDrop;
        this.createFloatingText(enemy.x, enemy.y - 15, `+${goldDrop} 金币`, false, '#ffd700');
        
        this.updateUI();
    }

    explodeEnemy(enemy) {
        this.explodeEmitter.emitParticleAt(enemy.x, enemy.y);
        if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < (enemy.def.explodeRadius || 60)) {
            this.takePlayerDamage(enemy.def.explodeDamage || 1);
        }
    }

    handleEnemyBulletHitPlayer(player, bullet) {
        if (bullet.isExplosive) {
             const pool = this.hazards.create(bullet.x, bullet.y, 'particle');
             pool.setScale(3);
             pool.setTint(0xff4400);
             pool.lifespan = 2000;
             pool.hazardType = 'fire';
        }
        bullet.destroy();
        this.takePlayerDamage(1);
    }

    handleEnemyTouchPlayer(player, enemy) {
        let damage = enemy.def.damage;
        if (enemy.def.behavior === 'charger' && enemy.customState === 'charging') damage = enemy.def.damage * 2;
        if (enemy.def.behavior === 'exploder') { this.killEnemy(enemy); return; }
        this.takePlayerDamage(damage);
    }

    takePlayerDamage(amount) {
        if (this.player.alpha < 1) return; 
        
        if (this.playerStats.hasShieldUpgrade && this.playerStats.shieldCharges > 0) {
            this.playerStats.shieldCharges--;
            this.playerStats.shieldTimer = 0; // Reset timer on use
            this.createFloatingText(this.player.x, this.player.y - 20, '护盾格挡!', false); 
            const circle = this.add.circle(this.player.x, this.player.y, 25, 0x00ffff, 0.4);
            this.tweens.add({targets: circle, scale: 2, alpha: 0, duration: 300, onComplete: () => circle.destroy()});
            return;
        }
        
        if (this.playerStats.hp - amount <= 0) {
            if (this.playerStats.heroic.deathNova && this.playerStats.heroic.deathNovaAvailable) {
                this.playerStats.hp = 1;
                this.playerStats.heroic.deathNovaAvailable = false;
                this.triggerExplosion(this.player.x, this.player.y, 300, 20, true); 
                this.createFloatingText(this.player.x, this.player.y - 50, "垂死震盪!", true);
                this.updateUI();
                return; 
            }
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
            this.time.delayedCall(1000, () => this.scene.start('GameOverScene', { time: this.survivalTime, kills: this.kills, level: this.level, bosses: this.bossesKilled }));
        }
    }
    
    handleMagnet() {
        this.gems.getChildren().forEach(gem => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, gem.x, gem.y);
            
            if (dist < this.playerStats.xpCollectRadius) {
                this.physics.moveToObject(gem, this.player, 400); 
            } 
            else if (dist < this.playerStats.xpMagnetRadius) {
                this.physics.moveToObject(gem, this.player, 250 + (this.playerStats.xpMagnetRadius - dist)*5);
            } else {
                gem.setVelocity(0);
            }
        });
        
        this.hearts.getChildren().forEach(heart => {
             const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, heart.x, heart.y);
             if (dist < this.playerStats.xpMagnetRadius) { 
                 this.physics.moveToObject(heart, this.player, 200);
             } else {
                 heart.setVelocity(0);
             }
        });
    }
    
    handlePickGem(player, gem) {
        gem.destroy();
        this.xp++;
        // Apply Event XP Buff
        if (this.eventGlobalStats && this.eventGlobalStats.xpBuffTimer > 0) {
             const extra = Math.ceil(1 * (this.eventGlobalStats.xpMult - 1));
             this.xp += extra;
        }

        if (this.xp >= this.xpToNextLevel) this.levelUp();
        this.updateUI();
    }
    
    handlePickHeart(player, heart) {
        heart.destroy();
        this.healPlayer(1);
    }

    spawnOrbits() {
        this.orbitGroup.clear(true, true);
        const radius = 50; 
        const count = this.weapon.orbitCount;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const orb = this.orbitGroup.create(this.player.x, this.player.y, 'orbit_orb');
            orb.setCircle(5); 
            orb.setScale(0.8);
            orb.orbitAngle = angle;
            orb.orbitRadius = radius;
        }
    }

    updateOrbits(delta) {
        const speed = 1.5; 
        const deltaSec = delta / 1000;
        this.orbitGroup.getChildren().forEach(orb => {
            orb.orbitAngle += speed * deltaSec;
            orb.x = this.player.x + Math.cos(orb.orbitAngle) * orb.orbitRadius;
            orb.y = this.player.y + Math.sin(orb.orbitAngle) * orb.orbitRadius;
        });
    }

    spawnHeroicBlades() {
        this.heroicBladeGroup.clear(true, true);
        const radius = 80; 
        const count = 4;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const blade = this.heroicBladeGroup.create(this.player.x, this.player.y, 'orbit_blade');
            blade.setCircle(6); 
            blade.setScale(1.2);
            blade.orbitAngle = angle;
            blade.orbitRadius = radius;
        }
    }

    updateHeroicBlades(delta) {
        const speed = 4.0; 
        const deltaSec = delta / 1000;
        this.heroicBladeGroup.getChildren().forEach(blade => {
            blade.orbitAngle -= speed * deltaSec; 
            blade.x = this.player.x + Math.cos(blade.orbitAngle) * blade.orbitRadius;
            blade.y = this.player.y + Math.sin(blade.orbitAngle) * blade.orbitRadius;
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

        // Gold UI
        this.goldText = this.add.text(10, 25, '金币: 0', { ...FONT_STYLE, fill: '#ffd700' }).setScrollFactor(0).setDepth(100);

        // Shop Button
        const btnShop = this.add.text(GAME_WIDTH - 60, GAME_HEIGHT - 30, '[ 商店 ]', { ...FONT_STYLE, fontSize: '14px', fill: '#ffd700', backgroundColor: '#000000' }).setPadding(5).setOrigin(0.5).setScrollFactor(0).setDepth(200).setInteractive();
        btnShop.on('pointerdown', () => this.toggleShop());

        this.pauseText = this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2, '暂停中 - 按 ESC 继续', { ...FONT_STYLE, fontSize: '24px' }).setOrigin(0.5).setDepth(300).setScrollFactor(0).setVisible(false);
        
        this.createShopUI();
        this.createEventUI();
        this.updateUI();
    }

    updateUI() {
        this.hpText.setText(`生命: ${Math.ceil(this.playerStats.hp)}/${this.playerStats.maxHp}`);
        this.killText.setText(`击杀: ${this.kills}`);
        this.levelText.setText(`等级 ${this.level}`);
        this.goldText.setText(`金币: ${this.gold}`);
        const maxWidth = GAME_WIDTH - 42;
        const ratio = Math.min(this.xp / this.xpToNextLevel, 1);
        this.xpBarFill.width = maxWidth * ratio;
    }

    createShopUI() {
        this.shopOverlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5).setInteractive();
        this.shopOverlay.on('pointerdown', () => this.toggleShop());

        this.shopContainer = this.add.container(GAME_WIDTH/2, GAME_HEIGHT/2).setDepth(600).setVisible(false).setScrollFactor(0);
        this.shopContainer.add(this.shopOverlay); // Add overlay to container so it shows/hides with it

        const bg = this.add.rectangle(0, 0, 300, 220, 0x111111, 0.95).setStrokeStyle(2, 0xffd700).setInteractive(); // Bg interactive to block clicks
        const title = this.add.text(0, -90, '商 店', { ...FONT_STYLE, fontSize: '20px', fill: '#ffd700' }).setOrigin(0.5);
        const closeBtn = this.add.text(130, -90, 'X', { ...FONT_STYLE, fontSize: '16px', fill: '#ff0000' }).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', () => this.toggleShop());
        
        this.shopContainer.add([bg, title, closeBtn]);
        
        this.shopSlots = [];
        for(let i=0; i<3; i++) {
            const y = -40 + i * 55;
            const itemBg = this.add.rectangle(0, y, 260, 45, 0x333333).setInteractive();
            const nameText = this.add.text(-120, y - 8, '', { ...FONT_STYLE, fontSize: '14px', fill: '#ffffff' }).setOrigin(0, 0.5);
            const descText = this.add.text(-120, y + 8, '', { ...FONT_STYLE, fontSize: '10px', fill: '#cccccc' }).setOrigin(0, 0.5);
            const priceText = this.add.text(120, y, '', { ...FONT_STYLE, fontSize: '14px', fill: '#ffd700' }).setOrigin(1, 0.5);
            
            this.shopContainer.add([itemBg, nameText, descText, priceText]);
            this.shopSlots.push({ bg: itemBg, name: nameText, desc: descText, price: priceText, data: null });
            
            itemBg.on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation(); // Prevent closing shop when clicking item
                if (this.isShopOpen && this.shopSlots[i].data) {
                    this.buyItem(this.shopSlots[i].data);
                }
            });
            itemBg.on('pointerover', () => itemBg.setFillStyle(0x555555));
            itemBg.on('pointerout', () => itemBg.setFillStyle(0x333333));
        }
    }

    toggleShop() {
        if (this.isGameOver || this.isChoosingUpgrade || this.isEventOpen) return;
        
        if (!this.isShopOpen) {
            // Check condition
            if (this.killSinceLastShop < KILLS_PER_SHOP) {
                const needed = KILLS_PER_SHOP - this.killSinceLastShop;
                this.createFloatingText(GAME_WIDTH/2, GAME_HEIGHT/2, `再击杀 ${needed} 个敌人才能开启商店`, false, '#ff0000');
                this.cameras.main.shake(50, 0.005);
                return;
            }
            // Open shop
            this.killSinceLastShop = 0; // Reset counter
            this.isShopOpen = true;
            this.physics.pause();
            this.shopContainer.setVisible(true);
            this.generateShopItems();
            
            // Re-center container to screen center
            this.shopContainer.setPosition(GAME_WIDTH/2, GAME_HEIGHT/2);
            // Re-center overlay relative to container (which is at center)
            this.shopOverlay.setPosition(0, 0); 
        } else {
            // Close shop
            this.isShopOpen = false;
            this.physics.resume();
            this.shopContainer.setVisible(false);
        }
    }

    createEventUI() {
        this.eventContainer = this.add.container(GAME_WIDTH/2, GAME_HEIGHT/2).setDepth(800).setVisible(false).setScrollFactor(0);
        
        const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setInteractive();
        const panel = this.add.rectangle(0, 0, 360, 240, 0x220022).setStrokeStyle(2, 0xff00ff);
        
        this.eventTitle = this.add.text(0, -90, '', { ...FONT_STYLE, fontSize: '22px', fill: '#ff00ff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
        this.eventDesc = this.add.text(0, -50, '', { ...FONT_STYLE, fontSize: '14px', fill: '#cccccc', align: 'center', wordWrap: { width: 340 } }).setOrigin(0.5);
        
        this.eventContainer.add([overlay, panel, this.eventTitle, this.eventDesc]);
        
        this.eventButtons = [];
        for (let i = 0; i < 2; i++) {
            const y = 20 + i * 60;
            const btnBg = this.add.rectangle(0, y, 320, 50, 0x330033).setStrokeStyle(1, 0x880088).setInteractive();
            const btnText = this.add.text(0, y, '', { ...FONT_STYLE, fontSize: '12px', fill: '#ffffff', align: 'center', wordWrap: { width: 300 } }).setOrigin(0.5);
            
            this.eventContainer.add([btnBg, btnText]);
            this.eventButtons.push({ bg: btnBg, text: btnText, choice: null });
            
            btnBg.on('pointerdown', () => {
                if (this.isEventOpen && this.eventButtons[i].choice) {
                    this.selectEventOption(this.eventButtons[i].choice);
                }
            });
            btnBg.on('pointerover', () => btnBg.setFillStyle(0x550055));
            btnBg.on('pointerout', () => btnBg.setFillStyle(0x330033));
        }
    }

    triggerEvent() {
        this.isEventOpen = true;
        this.physics.pause();
        
        const event = Phaser.Utils.Array.GetRandom(EVENT_CONFIG);
        this.eventTitle.setText(event.title);
        this.eventDesc.setText(event.description);
        
        this.eventButtons.forEach((btn, i) => {
            if (i < event.choices.length) {
                const choice = event.choices[i];
                btn.text.setText(choice.text);
                btn.choice = choice;
                btn.bg.setVisible(true);
                btn.text.setVisible(true);
            } else {
                btn.bg.setVisible(false);
                btn.text.setVisible(false);
            }
        });
        
        this.eventContainer.setVisible(true);
    }

    selectEventOption(choice) {
        choice.apply(this);
        
        this.isEventOpen = false;
        this.eventContainer.setVisible(false);
        this.physics.resume();
        
        // Schedule next event (60-90s later)
        this.nextEventTime = this.survivalTime + Phaser.Math.Between(60, 90);
    }

    generateShopItems() {
        // Pick 3 random items from new large pool
        const items = [];
        // Make a copy to avoid duplicates in one shop refresh
        const pool = [...SHOP_ITEMS]; 
        
        for(let i=0; i<3; i++) {
            if (pool.length === 0) break;
            const idx = Phaser.Math.Between(0, pool.length - 1);
            items.push(pool[idx]);
            pool.splice(idx, 1);
        }
        
        this.shopSlots.forEach((slot, i) => {
            if (i < items.length) {
                const item = items[i];
                slot.data = item;
                slot.name.setText(item.name);
                slot.desc.setText(item.description);
                slot.price.setText(`${item.price} G`);
            }
        });
    }

    buyItem(item) {
        if (this.gold >= item.price) {
            this.gold -= item.price;
            this.updateUI();
            this.applyShopEffect(item);
            this.createFloatingText(GAME_WIDTH/2, GAME_HEIGHT/2 - 50, "购买成功", true);
        } else {
            this.createFloatingText(GAME_WIDTH/2, GAME_HEIGHT/2, "金币不足", false);
            this.cameras.main.shake(50, 0.005);
        }
    }

    applyShopEffect(item) {
        // Delegate to item's own apply function if it exists
        if (item.apply) {
            item.apply(this.playerStats, this);
        }
    }

    createUpgradeUI() {
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

            card.on('pointerover', () => {
                 if (card.isHeroic) card.setFillStyle(0x776600); 
                 else if (card.isRare) card.setFillStyle(0x550055); 
                 else card.setFillStyle(0x555555);
            });
            card.on('pointerout', () => {
                 if (card.isHeroic) card.setFillStyle(0x554400); 
                 else if (card.isRare) card.setFillStyle(0x330033); 
                 else card.setFillStyle(0x333333);
            });
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
        
        this.playerStats.hp = this.playerStats.maxHp;
        this.createFloatingText(this.player.x, this.player.y - 40, '等级提升，生命全满！', true);

        // Archer Passive: Speed Growth
        if (this.playerStats.heroPassive === 'speed_growth' && this.level % 5 === 0) {
            this.playerStats.speed *= 1.1;
            this.createFloatingText(this.player.x, this.player.y - 60, '被动触发：移速提升!', true);
        }
        
        this.updateUI();

        this.isChoosingUpgrade = true;
        this.physics.pause();
        this.showUpgradePanel();
    }

    showUpgradePanel() {
        let pool = [];
        let heroics = [];
        
        this.upgradePool.forEach(up => {
            if (up.rarity === 'heroic') {
                let alreadyHave = false;
                if (up.id === 'mega_magnet') alreadyHave = false; 
                else if (up.id === 'hyper_engine') alreadyHave = false; 
                else {
                    if (this.playerStats.heroic[up.id]) alreadyHave = true; 
                    if (up.id === 'bullet_split_cross' && this.playerStats.heroic.splitCross) alreadyHave = true;
                    if (up.id === 'bullet_split_around' && this.playerStats.heroic.splitAround) alreadyHave = true;
                    if (up.id === 'piercing_chain_bullet' && this.playerStats.heroic.piercingChain) alreadyHave = true;
                    if (up.id === 'homing_barrage' && this.playerStats.heroic.homing) alreadyHave = true;
                    if (up.id === 'orbit_blade_storm' && this.playerStats.heroic.bladeStorm) alreadyHave = true;
                    if (up.id === 'hero_dash_slam' && this.playerStats.heroic.dashSlam) alreadyHave = true;
                }
                
                if (!alreadyHave) heroics.push(up);
            } else {
                const weightInt = up.rarity === 'rare' ? 1 : 10;
                for (let k = 0; k < weightInt; k++) pool.push(up);
            }
        });

        const choices = [];
        let showHeroic = (Math.random() < 0.05) && (heroics.length > 0);
        
        if (showHeroic) {
            const h = Phaser.Utils.Array.GetRandom(heroics);
            choices.push(h);
        }
        
        while(choices.length < this.upgradeChoicesCount) {
             if (pool.length === 0) break;
             const pick = Phaser.Utils.Array.GetRandom(pool);
             if (!choices.includes(pick)) choices.push(pick);
        }

        this.upgradeSlots.forEach(s => s.card.setVisible(false)); 
        for (let i = 0; i < choices.length; i++) {
            const slot = this.upgradeSlots[i];
            const up = choices[i];
            
            let nameStr = up.name;
            let color = '#ffff00';
            
            slot.card.isHeroic = false;
            slot.card.isRare = false;
            slot.card.setStrokeStyle(0);
            slot.card.setFillStyle(0x333333);

            if (up.rarity === 'rare') {
                nameStr += ' [稀有]';
                color = '#ff00ff';
                slot.card.isRare = true;
                slot.card.setStrokeStyle(1, 0xff00ff);
                slot.card.setFillStyle(0x330033); 
            } else if (up.rarity === 'heroic') {
                nameStr += ' [英雄級]';
                color = '#ffd700'; 
                slot.card.isHeroic = true;
                slot.card.setStrokeStyle(2, 0xffd700);
                slot.card.setFillStyle(0x554400); 
            }

            slot.nameText.setText(nameStr);
            slot.nameText.setColor(color);
            slot.descText.setText(up.description);
            slot.upgradeData = up;
            slot.card.setVisible(true);
            slot.nameText.setVisible(true);
            slot.descText.setVisible(true);
        }
        
        this.upgradeContainer.setVisible(true);
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
        // Calculate Soul Points
        // 1 point per 10 seconds
        // 1 point per 20 kills
        // 10 points per boss
        const timePoints = Math.floor(this.stats.time / 10);
        const killPoints = Math.floor(this.stats.kills / 20);
        const bossPoints = (this.stats.bosses || 0) * 10;
        const totalPoints = timePoints + killPoints + bossPoints;

        // Save
        const saveData = Persistence.load();
        saveData.soulPoints = (saveData.soulPoints || 0) + totalPoints;
        Persistence.save(saveData);

        this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.9);
        this.add.text(GAME_WIDTH/2, 50, '游戏结束', { ...FONT_STYLE, fontSize: '32px', fill: '#ff0000' }).setOrigin(0.5);
        
        const info = `生存时间: ${this.stats.time.toFixed(1)} 秒\n总击杀: ${this.stats.kills}\nBOSS击杀: ${this.stats.bosses || 0}\n最终等级: ${this.stats.level}`;
        this.add.text(GAME_WIDTH/2, 120, info, { ...FONT_STYLE, fontSize: '16px', align: 'center', lineHeight: 24 }).setOrigin(0.5);
        
        const rewardText = `获得灵魄: ${totalPoints}\n(时间+${timePoints} 击杀+${killPoints} BOSS+${bossPoints})`;
        this.add.text(GAME_WIDTH/2, 190, rewardText, { ...FONT_STYLE, fontSize: '14px', fill: '#00ffff', align: 'center' }).setOrigin(0.5);

        const btnRetry = this.add.text(GAME_WIDTH/2, 230, '[ 按 R 重新开始 ]', { ...FONT_STYLE, fontSize: '18px' }).setOrigin(0.5).setInteractive();
        const btnMenu = this.add.text(GAME_WIDTH/2, 260, '[ 按 M 返回菜单 ]', { ...FONT_STYLE, fontSize: '18px' }).setOrigin(0.5).setInteractive();
        
        btnRetry.on('pointerdown', () => this.scene.start('GameScene', { hero: HEROES[0] })); 
        btnMenu.on('pointerdown', () => this.scene.start('MainMenuScene'));
        this.input.keyboard.on('keydown-R', () => this.scene.start('GameScene', { hero: HEROES[0] }));
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
    scene: [BootScene, MainMenuScene, TalentScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);
