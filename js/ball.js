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
        const tableHeight = CONFIG.TABLE.BOTTOM - CONFIG.TABLE.TOP;
        const highZoneBottom = CONFIG.TABLE.TOP + tableHeight * CONFIG.SMASH.HIGH_BALL_ZONE;
        return this.y < highZoneBottom;
    }

    increaseSpeed() {
        this.speedMultiplier = Math.min(
            this.speedMultiplier * (1 + CONFIG.BALL.SPEED_INCREMENT),
            CONFIG.BALL.MAX_SPEED / Math.sqrt(this.vx * this.vx + this.vy * this.vy)
        );
    }

    smash(direction) {
        this.isSmash = true;
        this.speedMultiplier *= CONFIG.SMASH.SMASH_SPEED_BONUS;
        
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = CONFIG.BALL.MAX_SPEED;
        if (currentSpeed * this.speedMultiplier > maxSpeed) {
            this.speedMultiplier = maxSpeed / currentSpeed;
        }
        
        setTimeout(() => {
            this.isSmash = false;
        }, 500);
    }

    draw(ctx) {
        try {
            if (this.onFire && this.trail.length > 1) {
                for (let i = 0; i < this.trail.length; i++) {
                    const t = this.trail[i];
                    if (!t || !isFinite(t.x) || !isFinite(t.y)) continue;
                    
                    const alphaRatio = 1 - (i / this.trail.length);
                    const alpha = Math.max(0, Math.min(1, alphaRatio));
                    if (alpha <= 0.001) continue;
                    
                    const sizeRatio = 1 - i * 0.05;
                    const size = Math.max(0.5, Math.abs(this.radius * sizeRatio));
                    if (!isFinite(size) || size <= 0) continue;
                    
                    const colorIndex = Math.floor(i / 3) % CONFIG.EFFECTS.FLAME_COLORS.length;
                    
                    ctx.beginPath();
                    safeArc(ctx, t.x, t.y, size, 0, Math.PI * 2);
                    ctx.fillStyle = CONFIG.EFFECTS.FLAME_COLORS[colorIndex];
                    ctx.globalAlpha = alpha * 0.6;
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            if (!isFinite(this.x) || !isFinite(this.y)) return;
            const baseRadius = Math.max(0.5, Math.abs(this.radius));

            const gradient = ctx.createRadialGradient(
                this.x - 3, this.y - 3, 0,
                this.x, this.y, baseRadius
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#f0f0f0');
            gradient.addColorStop(1, '#cccccc');

            ctx.beginPath();
            safeArc(ctx, this.x, this.y, baseRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.beginPath();
            safeArc(ctx, this.x, this.y, baseRadius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = this.isSmash ? '#ff6b00' : 'rgba(255,255,255,0.3)';
            ctx.lineWidth = this.isSmash ? 3 : 1;
            ctx.stroke();

            if (this.isSmash) {
                ctx.beginPath();
                safeArc(ctx, this.x, this.y, baseRadius + 8, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 107, 0, 0.4)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        } catch (e) {
            console.warn('Ball draw error:', e.message);
        }
    }
}
