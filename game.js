class KarateFighter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 400;

        // Game state
        this.player = {
            x: 100, y: 300, width: 60, height: 100,
            health: 100, maxHealth: 100,
            vx: 0, vy: 0, onGround: true,
            facing: 1, attacking: false, block: false,
            punchTimer: 0, jumpTimer: 0
        };

        this.enemy = {
            x: 600, y: 300, width: 60, height: 100,
            health: 100, maxHealth: 100,
            vx: 0, vy: 0, onGround: true,
            facing: -1, attacking: false, block: false,
            punchTimer: 0, jumpTimer: 0, aiTimer: 0
        };

        this.keys = {};
        this.gameRunning = true;
        this.winner = null;

        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') {
                e.preventDefault();
                this.player.attacking = true;
                this.player.punchTimer = 15;
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    update() {
        if (!this.gameRunning) return;

        this.updatePlayer();
        this.updateEnemy();
        this.checkCollisions();
        this.updateUI();
    }

    updatePlayer() {
        const p = this.player;

        // Movement
        if (this.keys['a'] || this.keys['arrowleft']) {
            p.vx = -5;
            p.facing = -1;
        } else if (this.keys['d'] || this.keys['arrowright']) {
            p.vx = 5;
            p.facing = 1;
        } else {
            p.vx *= 0.8;
        }

        // Jump
        if ((this.keys['w'] || this.keys['arrowup']) && p.onGround) {
            p.vy = -15;
            p.onGround = false;
        }

        // Block
        p.block = this.keys['s'] || this.keys['arrowdown'];

        // Physics
        p.vy += 0.8; // gravity
        p.x += p.vx;
        p.y += p.vy;

        // Ground collision
        if (p.y >= 300) {
            p.y = 300;
            p.vy = 0;
            p.onGround = true;
        }

        // Boundaries
        p.x = Math.max(0, Math.min(700, p.x));

        // Attack timer
        if (p.punchTimer > 0) p.punchTimer--;
        else p.attacking = false;
    }

    updateEnemy() {
        const e = this.enemy;
        this.enemy.aiTimer++;

        // Simple AI
        const distance = this.player.x - e.x;
        const shouldAttack = Math.abs(distance) < 120;

        if (this.enemy.aiTimer > 30) {
            if (Math.random() < 0.3 && Math.abs(distance) > 80) {
                e.vx = distance > 0 ? -3 : 3;
            } else if (shouldAttack && Math.random() < 0.4) {
                e.attacking = true;
                e.punchTimer = 15;
            }
            this.enemy.aiTimer = 0;
        } else {
            e.vx *= 0.9;
        }

        // Jump occasionally
        if (Math.random() < 0.01 && e.onGround) {
            e.vy = -12;
            e.onGround = false;
        }

        // Physics
        e.vy += 0.8;
        e.x += e.vx;
        e.y += e.vy;

        if (e.y >= 300) {
            e.y = 300;
            e.vy = 0;
            e.onGround = true;
        }

        e.x = Math.max(100, Math.min(700, e.x));
        e.facing = this.player.x > e.x ? -1 : 1;

        if (e.punchTimer > 0) e.punchTimer--;
        else e.attacking = false;
    }

    checkCollisions() {
        const dx = this.player.x - this.enemy.x;
        const dy = this.player.y - this.enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Punch collision (when close enough)
        if (dist < 90) {
            if (this.player.attacking && this.player.punchTimer > 5) {
                if (!this.enemy.block) {
                    this.enemy.health -= 1.5;
                }
            }
            if (this.enemy.attacking && this.enemy.punchTimer > 5) {
                if (!this.player.block) {
                    this.player.health -= 1.5;
                }
            }
        }

        // Check win conditions
        if (this.player.health <= 0) {
            this.gameRunning = false;
            this.winner = 'Enemy';
        } else if (this.enemy.health <= 0) {
            this.gameRunning = false;
            this.winner = 'Player';
        }
    }

    updateUI() {
        document.getElementById('playerHealth').style.width = 
            (this.player.health / this.player.maxHealth * 100) + '%';
        document.getElementById('enemyHealth').style.width = 
            (this.enemy.health / this.enemy.maxHealth * 100) + '%';
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, 350, 800, 50);

        // Draw player
        this.drawFighter(this.player, '#FF6B6B');
        
        // Draw enemy
        this.drawFighter(this.enemy, '#4ECDC4');

        // Draw winner
        if (!this.gameRunning && this.winner) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(200, 150, 400, 100);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${this.winner} Wins!`, 400, 210);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Refresh to play again', 400, 250);
        }
    }

    drawFighter(fighter, color) {
        this.ctx.save();
        this.ctx.translate(fighter.x, fighter.y);
        this.ctx.scale(fighter.facing, 1);
        this.ctx.translate(fighter.width/2, fighter.height/2);

        // Body
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-fighter.width/2, -fighter.height + 20, fighter.width, fighter.height - 20);

        // Head
        this.ctx.beginPath();
        this.ctx.arc(0, -fighter.height + 10, 20, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(-8, -fighter.height + 8, 3, 0, Math.PI * 2);
        this.ctx.arc(8, -fighter.height + 8, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Punch effect
        if (fighter.attacking && fighter.punchTimer > 0) {
            this.ctx.fillStyle = 'rgba(255,255,0,0.6)';
            this.ctx.beginPath();
            this.ctx.arc(fighter.width/2 + 10, -20, 25, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Block effect
        if (fighter.block) {
            this.ctx.fillStyle = 'rgba(0,0,255,0.3)';
            this.ctx.fillRect(-fighter.width/2 - 10, -50, fighter.width + 20, 60);
        }

        this.ctx.restore();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
window.addEventListener('load', () => {
    new KarateFighter();
});
