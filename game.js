// Tech Knight Game - Main Game Logic
class TechKnightGame extends Phaser.Scene {
    constructor() {
        super('TechKnightGame');
        this.score = 0;
        this.health = 100;
        this.isShielding = false;
        this.enemies = [];
    }

    preload() {
        // We'll draw shapes instead of loading sprites for now
        this.load.setBaseURL('');
    }

    create() {
        // Game world setup
        this.cameras.main.setBackgroundColor('#1a1a2e');
        
        // Create grid background
        this.createGrid();
        
        // Create player (Tech Knight)
        this.createPlayer();
        
        // Create enemies
        this.time.addEvent({
            delay: 3000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // Setup controls
        this.setupControls();
        
        // Create particles for effects
        this.createParticles();
        
        // Display welcome message
        this.showMessage('TECH KNIGHT INITIALIZED\nDEFEAT ENEMIES TO WIN!', 3000);
    }

    createGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00ff41, 0.1);
        
        for (let x = 0; x < 800; x += 40) {
            graphics.lineBetween(x, 0, x, 600);
        }
        for (let y = 0; y < 600; y += 40) {
            graphics.lineBetween(0, y, 800, y);
        }
    }

    createPlayer() {
        // Player body (golden knight)
        this.player = this.add.container(400, 300);
        
        // Shield (background)
        this.playerShield = this.add.circle(0, 0, 40, 0x00d4ff, 0);
        this.player.add(this.playerShield);
        
        // Body
        const body = this.add.rectangle(0, 0, 30, 40, 0xFFD700);
        this.player.add(body);
        
        // Head (helmet)
        const head = this.add.circle(0, -25, 15, 0xFFA500);
        this.player.add(head);
        
        // Visor
        const visor = this.add.rectangle(0, -25, 20, 8, 0x00ff41);
        this.player.add(visor);
        
        // Cape
        this.playerCape = this.add.rectangle(0, 5, 25, 30, 0xDC143C);
        this.playerCape.setAlpha(0.8);
        this.player.add(this.playerCape);
        this.player.sendToBack(this.playerCape);
        
        // Weapon
        this.playerWeapon = this.add.rectangle(20, 0, 30, 6, 0x00ff41);
        this.playerWeapon.setOrigin(0, 0.5);
        this.player.add(this.playerWeapon);
        
        // Player properties
        this.player.speed = 200;
        this.player.sprintSpeed = 350;
        this.player.setSize(60, 80);
        
        // Physics
        this.physics.world.enable(this.player);
    }

    createParticles() {
        // Attack particles
        this.attackParticles = this.add.particles(0, 0, 'null', {
            speed: { min: 100, max: 200 },
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            gravityY: 0
        });
        this.attackParticles.stop();
    }

    setupControls() {
        this.keys = {
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            shift: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
        };
        
        // Attack on space
        this.keys.space.on('down', () => this.attack());
        
        // Shield on Q
        this.keys.q.on('down', () => this.toggleShield());
    }

    spawnEnemy() {
        if (this.enemies.length >= 8) return;
        
        // Random spawn position at edges
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        
        switch(side) {
            case 0: x = Phaser.Math.Between(0, 800); y = -20; break;
            case 1: x = Phaser.Math.Between(0, 800); y = 620; break;
            case 2: x = -20; y = Phaser.Math.Between(0, 600); break;
            case 3: x = 820; y = Phaser.Math.Between(0, 600); break;
        }
        
        const enemy = this.add.container(x, y);
        
        // Enemy body (dark knight)
        const body = this.add.rectangle(0, 0, 25, 35, 0x8B0000);
        enemy.add(body);
        
        const head = this.add.circle(0, -22, 12, 0x4a0000);
        enemy.add(head);
        
        const eyes = this.add.rectangle(0, -22, 15, 5, 0xff0000);
        enemy.add(eyes);
        
        // Enemy properties
        enemy.health = 50;
        enemy.speed = 80;
        
        this.physics.world.enable(enemy);
        this.enemies.push(enemy);
        
        this.updateEnemyCount();
    }

    attack() {
        // Weapon swing animation
        this.tweens.add({
            targets: this.playerWeapon,
            angle: 90,
            duration: 150,
            yoyo: true,
            onComplete: () => {
                // Check for hits
                this.checkAttackHits();
            }
        });
        
        // Visual effect
        const circle = this.add.circle(this.player.x + 30, this.player.y, 5, 0x00ff41);
        this.tweens.add({
            targets: circle,
            scale: 3,
            alpha: 0,
            duration: 300,
            onComplete: () => circle.destroy()
        });
    }

    checkAttackHits() {
        const attackRange = 60;
        
        this.enemies.forEach((enemy, index) => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                enemy.x, enemy.y
            );
            
            if (distance < attackRange) {
                enemy.health -= 25;
                
                // Hit effect
                this.tweens.add({
                    targets: enemy,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true
                });
                
                if (enemy.health <= 0) {
                    this.destroyEnemy(enemy, index);
                    this.addScore(100);
                }
            }
        });
    }

    destroyEnemy(enemy, index) {
        // Death animation
        this.tweens.add({
            targets: enemy,
            scale: 0,
            angle: 360,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                enemy.destroy();
            }
        });
        
        // Particle burst
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(enemy.x, enemy.y, 3, 0xff0000);
            const angle = (Math.PI * 2 / 8) * i;
            this.tweens.add({
                targets: particle,
                x: enemy.x + Math.cos(angle) * 50,
                y: enemy.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
        
        this.enemies.splice(index, 1);
        this.updateEnemyCount();
    }

    toggleShield() {
        this.isShielding = !this.isShielding;
        
        if (this.isShielding) {
            this.playerShield.setAlpha(0.5);
            this.tweens.add({
                targets: this.playerShield,
                scale: { from: 1, to: 1.2 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        } else {
            this.playerShield.setAlpha(0);
            this.tweens.killTweensOf(this.playerShield);
        }
    }

    update(time, delta) {
        if (!this.player) return;
        
        // Player movement
        const speed = this.keys.shift.isDown ? this.player.sprintSpeed : this.player.speed;
        let velocityX = 0;
        let velocityY = 0;
        
        if (this.keys.w.isDown) velocityY = -speed;
        if (this.keys.s.isDown) velocityY = speed;
        if (this.keys.a.isDown) velocityX = -speed;
        if (this.keys.d.isDown) velocityX = speed;
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }
        
        this.player.body.setVelocity(velocityX, velocityY);
        
        // Cape animation based on movement
        if (velocityX !== 0 || velocityY !== 0) {
            this.tweens.add({
                targets: this.playerCape,
                scaleX: 1.2,
                duration: 200,
                yoyo: true
            });
        }
        
        // Keep player in bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 30, 770);
        this.player.y = Phaser.Math.Clamp(this.player.y, 30, 570);
        
        // Update enemies
        this.updateEnemies(delta);
        
        // Weapon rotation towards cursor (if implemented)
        // For now, keep it horizontal
    }

    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            if (!enemy.active) return;
            
            // Move towards player
            const angle = Phaser.Math.Angle.Between(
                enemy.x, enemy.y,
                this.player.x, this.player.y
            );
            
            enemy.body.setVelocity(
                Math.cos(angle) * enemy.speed,
                Math.sin(angle) * enemy.speed
            );
            
            // Check collision with player
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                enemy.x, enemy.y
            );
            
            if (distance < 40 && !this.isShielding) {
                this.takeDamage(5);
                
                // Knockback
                const knockbackAngle = Phaser.Math.Angle.Between(
                    enemy.x, enemy.y,
                    this.player.x, this.player.y
                );
                this.player.x += Math.cos(knockbackAngle) * 10;
                this.player.y += Math.sin(knockbackAngle) * 10;
            }
        });
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.updateHealth();
        
        // Flash effect
        this.cameras.main.flash(100, 255, 0, 0, false);
        
        if (this.health <= 0) {
            this.gameOver();
        }
    }

    addScore(points) {
        this.score += points;
        document.getElementById('score-value').textContent = this.score;
    }

    updateHealth() {
        document.getElementById('health-value').textContent = this.health;
        document.getElementById('health-fill').style.width = this.health + '%';
    }

    updateEnemyCount() {
        document.getElementById('enemies-value').textContent = this.enemies.length;
    }

    showMessage(text, duration) {
        const message = this.add.text(400, 300, text, {
            fontSize: '32px',
            fill: '#00ff41',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: message,
            alpha: 0,
            y: 250,
            duration: duration,
            onComplete: () => message.destroy()
        });
    }

    gameOver() {
        this.showMessage('GAME OVER\nFinal Score: ' + this.score, 5000);
        
        // Stop all enemies
        this.enemies.forEach(enemy => {
            enemy.body.setVelocity(0, 0);
            enemy.setAlpha(0.3);
        });
        
        // Restart after delay
        this.time.delayedCall(5000, () => {
            this.scene.restart();
            this.health = 100;
            this.score = 0;
            this.enemies = [];
            this.updateHealth();
            this.addScore(0);
            this.updateEnemyCount();
        });
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: TechKnightGame
};

// Start game
const game = new Phaser.Game(config);
