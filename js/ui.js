class UIManager {
    constructor(game, customizer) {
        this.game = game;
        this.customizer = customizer;
        this.customMode = false;
        this._cacheElements();
        this._bindEvents();
    }

    _cacheElements() {
        this.startMenu = document.getElementById('startMenu');
        this.pauseMenu = document.getElementById('pauseMenu');
        this.gameOverMenu = document.getElementById('gameOverMenu');
        this.restCountdown = document.getElementById('restCountdown');
        this.customMenu = document.getElementById('customMenu');
        this.gameHUD = document.getElementById('gameHUD');

        this.score1El = document.getElementById('score1');
        this.score2El = document.getElementById('score2');
        this.sets1El = document.getElementById('sets1');
        this.sets2El = document.getElementById('sets2');
        this.rallyDisplay = document.getElementById('rallyDisplay');
        this.rallyCountEl = document.getElementById('rallyCount');

        this.winnerText = document.getElementById('winnerText');
        this.finalScore = document.getElementById('finalScore');
        this.restScore = document.getElementById('restScore');
        this.countdownNum = document.getElementById('countdownNum');
    }

    _bindEvents() {
        document.getElementById('btnSingle').addEventListener('click', () => {
            this._hideMenu(this.startMenu);
            this.game.startGame('single');
            this._showHUD();
        });

        document.getElementById('btnDouble').addEventListener('click', () => {
            this._hideMenu(this.startMenu);
            this.game.startGame('double');
            this._showHUD();
        });

        document.getElementById('btnCustom').addEventListener('click', () => {
            this.customMode = true;
            this._hideMenu(this.startMenu);
            this.customizer.show();
        });

        document.getElementById('btnCustomBack').addEventListener('click', () => {
            this.customMode = false;
            this.customizer.hide();
            this._showMenu(this.startMenu);
        });

        document.getElementById('btnPause').addEventListener('click', () => {
            this.game.pauseGame();
        });

        document.getElementById('btnResume').addEventListener('click', () => {
            this.game.resumeGame();
        });

        document.getElementById('btnRestart').addEventListener('click', () => {
            this._hideMenu(this.pauseMenu);
            this.game.restartGame();
            this._showHUD();
        });

        document.getElementById('btnMainMenu').addEventListener('click', () => {
            this._hideMenu(this.pauseMenu);
            this._hideHUD();
            this.game.returnToMenu();
            this._showMenu(this.startMenu);
        });

        document.getElementById('btnPlayAgain').addEventListener('click', () => {
            this._hideMenu(this.gameOverMenu);
            this.game.restartGame();
            this._showHUD();
        });

        document.getElementById('btnBackToMenu').addEventListener('click', () => {
            this._hideMenu(this.gameOverMenu);
            this._hideHUD();
            this.game.returnToMenu();
            this._showMenu(this.startMenu);
        });
    }

    update() {
        const state = this.game.getState();

        this.score1El.textContent = state.score1;
        this.score2El.textContent = state.score2;
        this.sets1El.textContent = state.sets1;
        this.sets2El.textContent = state.sets2;

        if (state.rallyCount >= 3) {
            this.rallyDisplay.classList.add('active');
            this.rallyCountEl.textContent = state.rallyCount;
        } else {
            this.rallyDisplay.classList.remove('active');
        }

        switch (state.gameState) {
            case 'menu':
                if (!this.customMode) {
                    this._showMenu(this.startMenu);
                }
                this._hideHUD();
                break;
            case 'playing':
            case 'scored':
                this.customMode = false;
                this._hideAllMenus();
                this._showHUD();
                break;
            case 'paused':
                this._showMenu(this.pauseMenu);
                break;
            case 'rest':
                this._showRestCountdown(state);
                break;
            case 'gameOver':
                this._showGameOver(state);
                break;
        }
    }

    _showMenu(menu) {
        menu.classList.remove('hidden');
    }

    _hideMenu(menu) {
        menu.classList.add('hidden');
    }

    _hideAllMenus() {
        this._hideMenu(this.startMenu);
        this._hideMenu(this.pauseMenu);
        this._hideMenu(this.gameOverMenu);
        this._hideMenu(this.restCountdown);
        this._hideMenu(this.customMenu);
    }

    _showHUD() {
        this.gameHUD.classList.remove('hidden');
    }

    _hideHUD() {
        this.gameHUD.classList.add('hidden');
    }

    _showRestCountdown(state) {
        this._hideAllMenus();
        this._showHUD();
        this.restCountdown.classList.remove('hidden');
        this.restScore.textContent = `当前局分: ${state.sets1} - ${state.sets2}`;
        this.countdownNum.textContent = state.restTimer;
    }

    _showGameOver(state) {
        this._hideAllMenus();
        this.gameOverMenu.classList.remove('hidden');

        const winnerName = state.winner === 1 ? '玩家1' : '玩家2';
        this.winnerText.textContent = `🎉 ${winnerName} 获胜!`;
        this.finalScore.textContent = `最终比分: ${state.sets1} - ${state.sets2} (局) | 本局: ${state.score1} - ${state.score2}`;
    }
}
