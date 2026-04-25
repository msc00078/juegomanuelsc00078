// Simple test to verify the enemy death fix logic
class MockScene {
    constructor() {
        this.enemies = [];
        this.player = { hp: 100, maxHp: 100 };
        this.registry = {
            get: (key) => {
                if (key === 'relics') return [];
                return null;
            }
        };
    }
    
    createParticles(x, y, color) {}
    spawnHealth(x, y) {}
    spawnGold(x, y) {}
    updateUI() {}
    createParticles(x, y, color) {}
}

// Test the Enemy class logic
class TestEnemy {
    constructor() {
        this.scene = new MockScene();
        this.hp = 30;
        this.maxHp = 30;
        this.isDead = false;
        this.sprite = { 
            active: true, 
            setActive: function(v) { this.active = v; },
            setVisible: function(v) { this.visible = v; },
            destroy: function() { this.destroyed = true; }
        };
        this.sprite.destroyed = false;
        this.scene.enemies.push(this);
    }
    
    takeDamage(amount) {
        if (this.isDead) return;
        if (this.hp <= 0) return;
        
        this.hp -= amount;
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }
    
    die() {
        if (this.isDead) return;
        this.isDead = true;
        
        // Remove from enemies array
        const enemyIndex = this.scene.enemies.indexOf(this);
        if (enemyIndex !== -1) {
            this.scene.enemies.splice(enemyIndex, 1);
        }
        
        this.sprite.destroy();
        this.sprite.setActive(false);
        this.sprite.setVisible(false);
    }
}

// Test 1: Enemy takes damage and dies
console.log("Test 1: Enemy takes damage and dies");
let enemy1 = new TestEnemy();
console.log("Initial HP:", enemy1.hp);
enemy1.takeDamage(30);
console.log("After damage HP:", enemy1.hp);
console.log("isDead:", enemy1.isDead);
console.log("Enemies array length:", enemy1.scene.enemies.length);
console.log("Sprite destroyed:", enemy1.sprite.destroyed);
console.log("");

// Test 2: Enemy receives additional damage after death (should be ignored)
console.log("Test 2: Enemy receives additional damage after death");
let enemy2 = new TestEnemy();
enemy2.takeDamage(30); // First damage - dies
console.log("After first damage - isDead:", enemy2.isDead);
enemy2.takeDamage(10); // Second damage - should be ignored
console.log("After second damage - HP:", enemy2.hp);
console.log("Enemies array length:", enemy2.scene.enemies.length);
console.log("");

// Test 3: Multiple enemies, one dies
console.log("Test 3: Multiple enemies, one dies");
let enemy3a = new TestEnemy();
let enemy3b = new TestEnemy();
enemy3a.hp = 30;
enemy3b.hp = 30;
enemy3a.scene.enemies = [enemy3a, enemy3b];
console.log("Initial enemies count:", enemy3a.scene.enemies.length);
enemy3a.takeDamage(30); // Kill enemy3a
console.log("After killing enemy3a - enemies count:", enemy3a.scene.enemies.length);
console.log("enemy3a.isDead:", enemy3a.isDead);
console.log("enemy3b.isDead:", enemy3b.isDead);