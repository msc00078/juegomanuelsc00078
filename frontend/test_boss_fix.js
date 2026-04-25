// Test to verify the boss NaN bug fix
class MockScene {
    constructor() {
        this.entities = [];
        this.player = { hp: 100, maxHp: 100 };
        this.registry = {
            get: (key) => {
                if (key === 'relics') return [];
                return null;
            }
        };
        this.cameras = { main: { shake: () => {} } };
        this.time = {
            addEvent: (config) => {
                return {
                    remove: () => {},
                    config
                };
            },
            delayedCall: (delay, callback) => {
                setTimeout(callback, delay);
                return { remove: () => {} };
            }
        };
        this.tweens = {
            add: (config) => {
                return {
                    stop: () => {}
                };
            }
        };
    }
    
    createParticles(x, y, color) {}
    spawnHealth(x, y) {}
    spawnGold(x, y) {}
    updateUI() {}
    createParticles(x, y, color) {}
}

// Test the Boss class with the fix
class TestBoss {
    constructor() {
        this.scene = new MockScene();
        this.boss = new (require('./src/game/entities/Boss').Boss)(this.scene, 400, 150, 'poeta');
    }
    
    takeDamage(amount) {
        this.boss.takeDamage(amount);
    }
    
    get isDead() {
        return this.boss.isDead;
    }
    
    get hp() {
        return this.boss.hp;
    }
    
    get phase() {
        return this.boss.phase;
    }
}

console.log("=== Testing Boss Damage Fix ===\n");

// Test 1: Boss takes damage and dies properly
console.log("Test 1: Boss takes damage and dies");
let boss1 = new TestBoss();
console.log("Initial HP:", boss1.hp);
console.log("Initial phase:", boss1.phase);
boss1.takeDamage(600);
console.log("After 600 damage - HP:", boss1.hp);
console.log("After 600 damage - isDead:", boss1.isDead);
console.log("After 600 damage - phase:", boss1.phase);
console.log("");

// Test 2: Boss receives additional damage after death (should be ignored)
console.log("Test 2: Boss receives additional damage after death");
let boss2 = new TestBoss();
boss2.takeDamage(600); // First damage - dies
console.log("After first damage - isDead:", boss2.isDead);
console.log("After first damage - HP:", boss2.hp);
boss2.takeDamage(100); // Second damage - should be ignored
console.log("After second damage - HP:", boss2.hp);
console.log("After second damage - isDead:", boss2.isDead);
console.log("");

// Test 3: Boss takes partial damage, then more damage to reach 0
console.log("Test 3: Boss takes partial damage, then more damage");
let boss3 = new TestBoss();
boss3.takeDamage(300);
console.log("After 300 damage - HP:", boss3.hp);
console.log("After 300 damage - phase:", boss3.phase);
boss3.takeDamage(301); // Should bring HP to 0 and trigger death
console.log("After additional 301 damage - HP:", boss3.hp);
console.log("After additional 301 damage - isDead:", boss3.isDead);
console.log("");

// Test 4: Boss doesn't go below 0 HP
console.log("Test 4: Boss doesn't go below 0 HP");
let boss4 = new TestBoss();
boss4.takeDamage(700); // More than max HP
console.log("After 700 damage - HP:", boss4.hp);
console.log("After 700 damage - isDead:", boss4.isDead);
console.log("");

console.log("=== All tests completed ===");