class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.gameState = 'menu';
        this.gameMode = 'single';

        this.ball = null;
        this.paddle1 = null;
        this.paddle2 = null;
        this.ai = null;

        this.score1 = 0;
        this.score2 = 0;
        this.sets1 = 0;
        this.sets2 = 0;
        this.rallyCount = 0;

        this.effects = new EffectsManager();

        this.keys = {};
        
        this.restTimer = 0;
        this.lastTime = 0;
        
        this.servePlayer = 1;
        
        this._initGame();
        this._bindEvents();
    }

    _initGame() {
        const paddleY = (CONFIG.TABLE.TOP + CONFIG.TABLE.BOTTOM) / 2;
        
        this.paddle1 = new Paddle(CONFIG.TABLE.LEFT + 30, paddleY, true);
        this.paddle2 = new Paddle(CONFIG.TABLE.RIGHT - 30, paddleY, false);
        
        this.ball = new Ball(CONFIG.TABLE.NET_X, paddleY);
        
        this.ai = new AIOpponent(this.paddle2, false);
        this.ai.setDifficulty(0.5);

        this.score1 = 0;
        this.score2 = 0;
        this.sets1 = 0;
        this.sets2 = 0;
        this.rallyCount = 0;
        this.servePlayer = 1;
        
        this.effects.clear();
    }

    _bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    startGame(mode) {
        this.gameMode = mode;
        this._initGame();
        this._startSet();
    }

    _startSet() {
        this.score1 = 0;
        this.score2 = 0;
        this.rallyCount = 0;
        this.gameState = 'playing';
        this._serveBall(this.servePlayer);
        
        if (this.gameMode === 'single') {
            const totalDiff = this.sets1 - this.sets2;
            let baseDifficulty = 0.5 + totalDiff * 0.1;
            this.ai.setDifficulty(Math.max(0.2, Math.min(0.9, baseDifficulty)));
        }
        
        this.effects.clear();
    }

    _serveBall(player) {
        const paddleY = (CONFIG.TABLE.TOP + CONFIG.TABLE.BOTTOM) / 2;
        const startX = player === 1 ? 
            CONFIG.TABLE.LEFT + 60 : 
            CONFIG.TABLE.RIGHT - 60;
        
        this.ball.reset(startX, paddleY, player === 1 ? 1 : -1);
        this.rallyCount = 0;
        this.ball.onFire = false;
        this.effects.deactivateRallyFlame();
        
        this.paddle1.y = paddleY;
        this.paddle1.vy = 0;
        this.paddle2.y = paddleY;
        this.paddle2.vy = 0;
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.lastTime = performance.now();
        }
    }

    restartGame() {
        this._initGame();
        this._startSet();
    }

    returnToMenu() {
        this.gameState = 'menu';
        this._initGame();
    }

    update(currentTime) {
        if (this.gameState !== 'playing' && this.gameState !== 'rest') {
            return;
        }

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.gameState === 'rest') {
            this.restTimer -= deltaTime / 1000;
            if (this.restTimer <= 0) {
                this.gameState = 'playing';
                this._startSet();
            }
            return;
        }

        this._handleInput();
        this._updateGame(deltaTime);
    }

    _handleInput() {
        if (this.keys['KeyW']) {
            this.paddle1.moveUp();
        }
        if (this.keys['KeyS']) {
            this.paddle1.moveDown();
        }
        if (this.keys['KeyD']) {
            if (this.paddle1.canSmash(this.ball)) {
                this.paddle1.triggerSmash();
            }
        }

        if (this.gameMode === 'double') {
            if (this.keys['ArrowUp']) {
                this.paddle2.moveUp();
            }
            if (this.keys['ArrowDown']) {
                this.paddle2.moveDown();
            }
            if (this.keys['KeyL']) {
                if (this.paddle2.canSmash(this.ball)) {
                    this.paddle2.triggerSmash();
                }
            }
        }
    }

    _updateGame(deltaTime) {
        this.paddle1.update();
        this.paddle2.update();

        if (this.gameMode === 'single') {
            this.ai.update(this.ball, deltaTime);
        }

        this.ball.update();
        this.effects.update();

        this._checkCollisions();
        this._checkScore();
        this._updateRallyFlame();
    }

    _checkCollisions() {
        if (this.ball.vx < 0) {
            const collision = this.paddle1.checkCollision(this.ball);
            if (collision.hit && this.ball.lastHitBy !== 1) {
                this._handlePaddleHit(this.paddle1, collision, 1);
            }
        }

        if (this.ball.vx > 0) {
            const collision = this.paddle2.checkCollision(this.ball);
            if (collision.hit && this.ball.lastHitBy !== 2) {
                this._handlePaddleHit(this.paddle2, collision, 2);
            }
        }
    }

    _handlePaddleHit(paddle, collision, playerNum) {
        const direction = playerNum === 1 ? 1 : -1;
        
        this.ball.lastHitBy = playerNum;
        this.rallyCount++;

        const hitY = collision.hitY;
        const ballComingTowards = playerNum === 1 ? 
            (this.ball.vx < 0) : (this.ball.vx > 0);
        const isSmash = paddle.isSmashing && this.ball.isHighBall() && ballComingTowards;
        
        if (isSmash) {
            const smashVy = hitY * CONFIG.BALL.INITIAL_SPEED_Y * CONFIG.SMASH.DIRECTION_NARROW;
            this.ball.vy = smashVy;
            this.ball.vx = Math.abs(this.ball.vx) * direction;
            this.ball.smash(direction);
            this.effects.triggerScreenShake(8);
            this.effects.triggerFlash('#ff6b00', 0.3);
        } else {
            this.ball.increaseSpeed();
            const baseAngle = hitY * 0.9;
            this.ball.vy = baseAngle * CONFIG.BALL.INITIAL_SPEED_Y * 2;
            this.ball.vx = Math.abs(this.ball.vx) * direction;
        }

        this.effects.spawnHitParticles(
            this.ball.x, 
            this.ball.y, 
            direction, 
            isSmash
        );

        if (this.gameMode === 'single' && playerNum === 1) {
            this.ai.adjustDifficulty(this.score1, this.score2);
        }
    }

    _checkScore() {
        let scored = false;
        let scoringPlayer = 0;

        if (this.ball.x < CONFIG.TABLE.LEFT) {
            this.score2++;
            scoringPlayer = 2;
            scored = true;
        } else if (this.ball.x > CONFIG.TABLE.RIGHT) {
            this.score1++;
            scoringPlayer = 1;
            scored = true;
        }

        if (scored) {
            this.effects.spawnScoreParticles(
                scoringPlayer === 1 ? CONFIG.TABLE.LEFT + 100 : CONFIG.TABLE.RIGHT - 100,
                this.height / 2,
                scoringPlayer === 1
            );
            
            this.effects.triggerScreenShake(5);
            
            if (this._checkSetWin()) {
                return;
            }

            setTimeout(() => {
                if (this.gameState === 'playing') {
                    this.servePlayer = scoringPlayer;
                    this._serveBall(scoringPlayer);
                }
            }, 1000);
            
            this.gameState = 'scored';
            setTimeout(() => {
                if (this.gameState === 'scored') {
                    this.gameState = 'playing';
                }
            }, 1000);
        }
    }

    _checkSetWin() {
        const winScore = CONFIG.GAME.POINTS_TO_WIN;
        let setWinner = 0;

        if (this.score1 >= winScore && this.score1 - this.score2 >= 2) {
            setWinner = 1;
        } else if (this.score2 >= winScore && this.score2 - this.score1 >= 2) {
            setWinner = 2;
        }

        if (setWinner > 0) {
            if (setWinner === 1) {
                this.sets1++;
            } else {
                this.sets2++;
            }

            if (this.sets1 >= CONFIG.GAME.SETS_TO_WIN || 
                this.sets2 >= CONFIG.GAME.SETS_TO_WIN) {
                this._endGame(setWinner);
            } else {
                this._startRest();
            }
            return true;
        }
        return false;
    }

    _startRest() {
        this.gameState = 'rest';
        this.restTimer = CONFIG.GAME.REST_DURATION;
    }

    _endGame(winner) {
        this.gameState = 'gameOver';
        this.winner = winner;
        
        this.effects.triggerScreenShake(10);
        this.effects.triggerFlash(
            winner === 1 ? CONFIG.COLORS.PLAYER1 : CONFIG.COLORS.PLAYER2,
            0.4
        );
    }

    _updateRallyFlame() {
        if (this.rallyCount >= CONFIG.GAME.RALLY_FLAME_THRESHOLD) {
            this.ball.onFire = true;
            this.effects.activateRallyFlame();
        }
    }

    draw() {
        try {
            this.ctx.clearRect(0, 0, this.width, this.height);

            this._drawTable();

            if (this.gameState !== 'menu') {
                this.paddle1.draw(this.ctx);
                this.paddle2.draw(this.ctx);
                
                if (this.gameState !== 'rest') {
                    this.ball.draw(this.ctx);
                }
                
                this.effects.draw(this.ctx, this.width, this.height);
            }

            if (this.gameState === 'rest') {
                this._drawRestOverlay();
            }
        } catch (e) {
            console.error('Game draw error:', e.message);
            try {
                this.ctx.clearRect(0, 0, this.width, this.height);
                this._drawTable();
                if (this.gameState !== 'menu') {
                    this.paddle1.draw(this.ctx);
                    this.paddle2.draw(this.ctx);
                }
            } catch (e2) {
                console.error('Fallback draw also failed:', e2.message);
            }
        }
    }

    _drawTable() {
        const { TABLE } = CONFIG;
        
        const tableGradient = this.ctx.createLinearGradient(0, TABLE.TOP, 0, TABLE.BOTTOM);
        tableGradient.addColorStop(0, '#1d5a35');
        tableGradient.addColorStop(0.5, '#164a29');
        tableGradient.addColorStop(1, '#0d2e1a');
        
        this.ctx.fillStyle = tableGradient;
        this.ctx.fillRect(TABLE.LEFT, TABLE.TOP, TABLE.RIGHT - TABLE.LEFT, TABLE.BOTTOM - TABLE.TOP);

        this.ctx.strokeStyle = TABLE.LINE_COLOR;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(TABLE.LEFT, TABLE.TOP, TABLE.RIGHT - TABLE.LEFT, TABLE.BOTTOM - TABLE.TOP);

        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.moveTo(TABLE.NET_X, TABLE.TOP);
        this.ctx.lineTo(TABLE.NET_X, TABLE.BOTTOM);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let y = TABLE.TOP + 20; y < TABLE.BOTTOM; y += 40) {
            this.ctx.fillRect(TABLE.NET_X - 1, y, 2, 20);
        }

        const borderGradient = this.ctx.createLinearGradient(0, TABLE.TOP - 10, 0, TABLE.TOP);
        borderGradient.addColorStop(0, '#8B6914');
        borderGradient.addColorStop(0.5, TABLE.BORDER_COLOR);
        borderGradient.addColorStop(1, '#8B6914');
        
        this.ctx.strokeStyle = borderGradient;
        this.ctx.lineWidth = 8;
        this.ctx.strokeRect(TABLE.LEFT - 4, TABLE.TOP - 4, TABLE.RIGHT - TABLE.LEFT + 8, TABLE.BOTTOM - TABLE.TOP + 8);
    }

    _drawRestOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    getState() {
        return {
            gameState: this.gameState,
            gameMode: this.gameMode,
            score1: this.score1,
            score2: this.score2,
            sets1: this.sets1,
            sets2: this.sets2,
            rallyCount: this.rallyCount,
            restTimer: Math.ceil(this.restTimer),
            winner: this.winner
        };
    }
}
