function safeArc(ctx, x, y, radius, startAngle, endAngle) {
    const safeRadius = Math.max(0.1, Math.abs(radius));
    ctx.arc(x, y, safeRadius, startAngle, endAngle);
}

class Particle {
    constructor(x, y, vx, vy, color, lifetime, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.lifetime = Math.max(1, lifetime);
        this.maxLifetime = Math.max(1, lifetime);
        this.size = Math.max(0.5, size);
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.lifetime -= 1;
        
        if (this.lifetime <= 0.5) {
            this.lifetime = 0;
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active || this.lifetime <= 0.5 || this.size <= 0) return;
        
        try {
            const ratio = this.lifetime / this.maxLifetime;
            const alpha = Math.max(0, Math.min(1, ratio));
            if (alpha <= 0.001) return;
            
            const radius = Math.max(0.5, Math.abs(this.size * alpha));
            if (!isFinite(radius) || radius <= 0) return;
            
            if (!isFinite(this.x) || !isFinite(this.y)) return;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            safeArc(ctx, this.x, this.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } catch (e) {
            this.active = false;
        }
    }
}

class EffectsManager {
    constructor() {
        this.particles = [];
        this.screenShake = 0;
        this.flashColor = null;
        this.flashAlpha = 0;
        this.rallyFlameActive = false;
    }

    spawnHitParticles(x, y, direction, isSmash = false) {
        const count = isSmash ? CONFIG.EFFECTS.PARTICLE_COUNT * 2 : CONFIG.EFFECTS.PARTICLE_COUNT;
        const colors = isSmash ? 
            CONFIG.EFFECTS.FLAME_COLORS : 
            ['#ffffff', '#ffff00', '#ffaa00'];

        for (let i = 0; i < count; i++) {
            const angle = (Math.random() - 0.5) * Math.PI + (direction > 0 ? 0 : Math.PI);
            const speed = 2 + Math.random() * 4;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const lifetime = CONFIG.EFFECTS.PARTICLE_LIFETIME + Math.floor(Math.random() * 20);
            const size = 2 + Math.random() * 3;

            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                lifetime,
                size
            ));
        }
    }

    spawnScoreParticles(x, y, isPlayer1) {
        const color = isPlayer1 ? CONFIG.COLORS.PLAYER1 : CONFIG.COLORS.PLAYER2;
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2,
                color,
                40 + Math.floor(Math.random() * 20),
                3 + Math.random() * 4
            ));
        }
    }

    triggerScreenShake(amount) {
        this.screenShake = Math.max(this.screenShake, amount);
    }

    triggerFlash(color, alpha = 0.3) {
        this.flashColor = color;
        this.flashAlpha = alpha;
    }

    activateRallyFlame() {
        this.rallyFlameActive = true;
    }

    deactivateRallyFlame() {
        this.rallyFlameActive = false;
    }

    update() {
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.active);
        
        if (this.particles.length > 500) {
            this.particles = this.particles.slice(-300);
        }

        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.1) {
                this.screenShake = 0;
            }
        }

        if (this.flashAlpha > 0) {
            this.flashAlpha *= 0.9;
            if (this.flashAlpha < 0.01) {
                this.flashAlpha = 0;
            }
        }
    }

    draw(ctx, canvasWidth, canvasHeight) {
        ctx.save();

        try {
            if (this.screenShake > 0) {
                const shakeX = (Math.random() - 0.5) * this.screenShake * 2;
                const shakeY = (Math.random() - 0.5) * this.screenShake * 2;
                ctx.translate(shakeX, shakeY);
            }

            for (let i = 0; i < this.particles.length; i++) {
                const p = this.particles[i];
                if (p && p.active) {
                    p.draw(ctx);
                }
            }

            if (this.flashAlpha > 0 && this.flashColor) {
                ctx.globalAlpha = Math.max(0, this.flashAlpha);
                ctx.fillStyle = this.flashColor;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                ctx.globalAlpha = 1;
            }
        } catch (e) {
            console.warn('EffectsManager draw error:', e.message);
        }

        ctx.restore();
    }

    clear() {
        this.particles = [];
        this.screenShake = 0;
        this.flashColor = null;
        this.flashAlpha = 0;
        this.rallyFlameActive = false;
    }
}
