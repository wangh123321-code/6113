class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = CONFIG.BALL.RADIUS;
        this.vx = 0;
        this.vy = 0;
        this.speedMultiplier = 1;
        this.lastHitBy = null;
        this.isSmash = false;
        this.trail = [];
        this.onFire = false;
    }

    reset(x, y, direction = 1) {
        this.x = x;
        this.y = y;
        this.vx = CONFIG.BALL.INITIAL_SPEED_X * direction;
        this.vy = (Math.random() - 0.5) * CONFIG.BALL.INITIAL_SPEED_Y * 2;
        this.speedMultiplier = 1;
        this.lastHitBy = null;
        this.isSmash = false;
        this.trail = [];
        this.onFire = false;
    }

    update() {
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > CONFIG.EFFECTS.TRAIL_LENGTH) {
            this.trail.pop();
        }

        this.vy += CONFIG.BALL.GRAVITY;
        this.x += this.vx * this.speedMultiplier;
        this.y += this.vy * this.speedMultiplier;

        if (this.y - this.radius < CONFIG.TABLE.TOP) {
            this.y = CONFIG.TABLE.TOP + this.radius;
            this.vy = -this.vy * CONFIG.BALL.BOUNCE_DAMPING;
        }
        if (this.y + this.radius > CONFIG.TABLE.BOTTOM) {
            this.y = CONFIG.TABLE.BOTTOM - this.radius;
            this.vy = -this.vy * CONFIG.BALL.BOUNCE_DAMPING;
        }
    }

    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy) * this.speedMultiplier;
    }

    isHighBall() {
        const centerY = (CONFIG.TABLE.TOP + CONFIG.TABLE.BOTTOM) / 2;
        return Math.abs(this.y - centerY) < CONFIG.SMASH.HIGH_BALL_THRESHOLD / 2;
    }

    increaseSpeed() {
        this.speedMultiplier = Math.min(
            this.speedMultiplier * (1 + CONFIG.BALL.SPEED_INCREMENT),
            CONFIG.BALL.MAX_SPEED / Math.sqrt(this.vx * this.vx + this.vy * this.vy)
        );
    }

    smash(direction) {
        this.isSmash = true;
        this.speedMultiplier *= CONFIG.BALL.SMASH_SPEED_MULTIPLIER;
        this.vx = Math.abs(this.vx) * direction;
        this.vy *= CONFIG.SMASH.DIRECTION_NARROW;
        
        const maxBaseSpeed = CONFIG.BALL.MAX_SPEED / CONFIG.BALL.SMASH_SPEED_MULTIPLIER;
        const baseSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (baseSpeed > maxBaseSpeed) {
            const ratio = maxBaseSpeed / baseSpeed;
            this.vx *= ratio;
            this.vy *= ratio;
        }
        
        setTimeout(() => {
            this.isSmash = false;
        }, 500);
    }

    draw(ctx) {
        if (this.onFire && this.trail.length > 1) {
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                const alpha = 1 - (i / this.trail.length);
                const size = this.radius * (1 - i * 0.05);
                const colorIndex = Math.floor(i / 3) % CONFIG.EFFECTS.FLAME_COLORS.length;
                
                ctx.beginPath();
                ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
                ctx.fillStyle = CONFIG.EFFECTS.FLAME_COLORS[colorIndex];
                ctx.globalAlpha = alpha * 0.6;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        const gradient = ctx.createRadialGradient(
            this.x - 3, this.y - 3, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, '#f0f0f0');
        gradient.addColorStop(1, '#cccccc');

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = this.isSmash ? '#ff6b00' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = this.isSmash ? 3 : 1;
        ctx.stroke();

        if (this.isSmash) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 107, 0, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}
