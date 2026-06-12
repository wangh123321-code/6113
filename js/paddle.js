class Paddle {
    constructor(x, y, isPlayer1 = true) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PADDLE.WIDTH;
        this.height = CONFIG.PADDLE.HEIGHT;
        this.vy = 0;
        this.isPlayer1 = isPlayer1;
        this.color = isPlayer1 ? CONFIG.COLORS.PLAYER1 : CONFIG.COLORS.PLAYER2;
        
        this.isSmashing = false;
        this.smashTime = 0;
        this.smashCooldown = 0;
        this.smashDirection = isPlayer1 ? 1 : -1;
    }

    moveUp() {
        this.vy -= CONFIG.PADDLE.ACCELERATION;
        if (this.vy < -CONFIG.PADDLE.MAX_SPEED) {
            this.vy = -CONFIG.PADDLE.MAX_SPEED;
        }
    }

    moveDown() {
        this.vy += CONFIG.PADDLE.ACCELERATION;
        if (this.vy > CONFIG.PADDLE.MAX_SPEED) {
            this.vy = CONFIG.PADDLE.MAX_SPEED;
        }
    }

    update() {
        this.vy *= CONFIG.PADDLE.FRICTION;
        if (Math.abs(this.vy) < 0.01) {
            this.vy = 0;
        }
        
        this.y += this.vy;

        const halfHeight = this.height / 2;
        if (this.y - halfHeight < CONFIG.TABLE.TOP) {
            this.y = CONFIG.TABLE.TOP + halfHeight;
            this.vy = 0;
        }
        if (this.y + halfHeight > CONFIG.TABLE.BOTTOM) {
            this.y = CONFIG.TABLE.BOTTOM - halfHeight;
            this.vy = 0;
        }

        if (this.smashCooldown > 0) {
            this.smashCooldown -= 16;
        }
    }

    canSmash(ball) {
        if (this.smashCooldown > 0) return false;
        if (this.isSmashing) return false;

        const dx = Math.abs(ball.x - this.x);
        const dy = Math.abs(ball.y - this.y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < CONFIG.SMASH.TRIGGER_DISTANCE && ball.isHighBall();
    }

    triggerSmash() {
        this.isSmashing = true;
        this.smashTime = CONFIG.SMASH.ANIMATION_DURATION;
        this.smashCooldown = CONFIG.SMASH.COOLDOWN;
        
        setTimeout(() => {
            this.isSmashing = false;
        }, CONFIG.SMASH.ANIMATION_DURATION);
    }

    checkCollision(ball) {
        const paddleLeft = this.x - this.width / 2;
        const paddleRight = this.x + this.width / 2;
        const paddleTop = this.y - this.height / 2;
        const paddleBottom = this.y + this.height / 2;

        const closestX = Math.max(paddleLeft, Math.min(ball.x, paddleRight));
        const closestY = Math.max(paddleTop, Math.min(ball.y, paddleBottom));

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball.radius) {
            return {
                hit: true,
                hitY: (ball.y - this.y) / (this.height / 2)
            };
        }
        return { hit: false, hitY: 0 };
    }

    draw(ctx) {
        ctx.save();
        
        const currentWidth = this.isSmashing ? CONFIG.PADDLE.SMASH_WIDTH : this.width;
        const currentHeight = this.isSmashing ? CONFIG.PADDLE.SMASH_HEIGHT : this.height;

        if (this.isSmashing) {
            ctx.shadowColor = '#ff6b00';
            ctx.shadowBlur = 20;
        }

        const gradient = ctx.createLinearGradient(
            this.x - currentWidth / 2, 0,
            this.x + currentWidth / 2, 0
        );
        
        if (this.isPlayer1) {
            gradient.addColorStop(0, '#ff8888');
            gradient.addColorStop(0.5, this.color);
            gradient.addColorStop(1, '#cc4444');
        } else {
            gradient.addColorStop(0, '#66dddd');
            gradient.addColorStop(0.5, this.color);
            gradient.addColorStop(1, '#22aaaa');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(
            this.x - currentWidth / 2,
            this.y - currentHeight / 2,
            currentWidth,
            currentHeight,
            4
        );
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const woodGradient = ctx.createLinearGradient(
            this.x - currentWidth / 2 - 6, 0,
            this.x - currentWidth / 2, 0
        );
        woodGradient.addColorStop(0, '#8B4513');
        woodGradient.addColorStop(0.5, '#A0522D');
        woodGradient.addColorStop(1, '#8B4513');

        ctx.fillStyle = woodGradient;
        if (this.isPlayer1) {
            ctx.fillRect(this.x - currentWidth / 2 - 6, this.y - 10, 6, 20);
        } else {
            ctx.fillRect(this.x + currentWidth / 2, this.y - 10, 6, 20);
        }

        if (this.smashCooldown > 0) {
            const cooldownPercent = this.smashCooldown / CONFIG.SMASH.COOLDOWN;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(
                this.x - currentWidth / 2,
                this.y + currentHeight / 2 + 5,
                currentWidth * cooldownPercent,
                4
            );
        }

        ctx.restore();
    }
}
