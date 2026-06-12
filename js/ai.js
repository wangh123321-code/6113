class AIOpponent {
    constructor(paddle, isLeft = false) {
        this.paddle = paddle;
        this.isLeft = isLeft;
        this.difficulty = 0.5;
        this.reactionTimer = 0;
        this.targetY = paddle.y;
        this.ballLastSeen = null;
        this.predictedY = null;
        this.smashChance = 0.3;
    }

    setDifficulty(difficulty) {
        this.difficulty = Math.max(0.1, Math.min(1.0, difficulty));
        this.smashChance = 0.2 + this.difficulty * 0.5;
    }

    update(ball, deltaTime) {
        this.reactionTimer -= deltaTime;
        
        if (this.reactionTimer <= 0) {
            this.updatePrediction(ball);
            const reactionTime = CONFIG.AI.BASE_REACTION_TIME - 
                (CONFIG.AI.BASE_REACTION_TIME - CONFIG.AI.MIN_REACTION_TIME) * this.difficulty;
            this.reactionTimer = reactionTime + Math.random() * 100;
        }

        const accuracy = CONFIG.AI.BASE_ACCURACY + 
            (CONFIG.AI.MAX_ACCURACY - CONFIG.AI.BASE_ACCURACY) * this.difficulty;
        
        const errorOffset = (1 - accuracy) * (Math.random() - 0.5) * 100;
        const targetY = this.predictedY !== null ? 
            this.predictedY + errorOffset : 
            (CONFIG.TABLE.TOP + CONFIG.TABLE.BOTTOM) / 2;

        const dy = targetY - this.paddle.y;
        
        if (Math.abs(dy) > 10) {
            if (dy > 0) {
                this.paddle.moveDown();
            } else {
                this.paddle.moveUp();
            }
        }

        this.trySmash(ball);
    }

    updatePrediction(ball) {
        const ballComingTowards = this.isLeft ? 
            (ball.vx < 0) : (ball.vx > 0);
        
        if (ballComingTowards) {
            this.predictedY = this.predictBallY(ball);
        } else {
            this.predictedY = (CONFIG.TABLE.TOP + CONFIG.TABLE.BOTTOM) / 2;
        }
    }

    predictBallY(ball) {
        const targetX = this.paddle.x;
        let simX = ball.x;
        let simY = ball.y;
        let simVx = ball.vx * ball.speedMultiplier;
        let simVy = ball.vy * ball.speedMultiplier;
        
        const maxIterations = 2000;
        let iterations = 0;

        while (iterations < maxIterations) {
            simX += simVx;
            simY += simVy;

            if (simY - ball.radius < CONFIG.TABLE.TOP) {
                simY = CONFIG.TABLE.TOP + ball.radius;
                simVy = -simVy * CONFIG.BALL.BOUNCE_DAMPING;
            }
            if (simY + ball.radius > CONFIG.TABLE.BOTTOM) {
                simY = CONFIG.TABLE.BOTTOM - ball.radius;
                simVy = -simVy * CONFIG.BALL.BOUNCE_DAMPING;
            }

            if (this.isLeft && simX <= targetX) {
                return simY;
            }
            if (!this.isLeft && simX >= targetX) {
                return simY;
            }

            iterations++;
        }

        return simY;
    }

    trySmash(ball) {
        if (this.paddle.canSmash(ball)) {
            const isSmashOpportunity = this.isLeft ? 
                (ball.vx < 0) : (ball.vx > 0);
            
            if (isSmashOpportunity && Math.random() < this.smashChance * 0.05) {
                this.paddle.triggerSmash();
            }
        }
    }

    adjustDifficulty(playerScore, aiScore) {
        const diff = playerScore - aiScore;
        const adjustRate = CONFIG.AI.DIFFICULTY_ADJUST_RATE;
        
        if (diff > 0) {
            this.difficulty = Math.min(1.0, this.difficulty + adjustRate * diff);
        } else if (diff < 0) {
            this.difficulty = Math.max(0.1, this.difficulty + adjustRate * diff);
        }
    }
}
