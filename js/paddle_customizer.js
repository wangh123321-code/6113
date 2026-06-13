class PaddleCustomizer {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('radarCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

        this.config = {
            weight: CONFIG.PADDLE_CUSTOM.WEIGHT.DEFAULT,
            faceSize: CONFIG.PADDLE_CUSTOM.FACE_SIZE.DEFAULT,
            elasticity: CONFIG.PADDLE_CUSTOM.ELASTICITY.DEFAULT
        };

        this.presets = [null, null, null];
        this.activePresetIndex = -1;
        this._loadFromStorage();

        this._cacheElements();
        this._bindEvents();
        this._syncUIFromConfig();
        this._drawRadar();
    }

    _loadFromStorage() {
        try {
            const saved = localStorage.getItem('paddleCustomConfig');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.current) {
                    this.config = {
                        weight: this._clamp(data.current.weight, CONFIG.PADDLE_CUSTOM.WEIGHT.MIN, CONFIG.PADDLE_CUSTOM.WEIGHT.MAX),
                        faceSize: this._clamp(data.current.faceSize, CONFIG.PADDLE_CUSTOM.FACE_SIZE.MIN, CONFIG.PADDLE_CUSTOM.FACE_SIZE.MAX),
                        elasticity: this._clamp(data.current.elasticity, 0, 2)
                    };
                }
                if (data.presets && Array.isArray(data.presets)) {
                    this.presets = data.presets.map(p => {
                        if (!p) return null;
                        return {
                            weight: this._clamp(p.weight, CONFIG.PADDLE_CUSTOM.WEIGHT.MIN, CONFIG.PADDLE_CUSTOM.WEIGHT.MAX),
                            faceSize: this._clamp(p.faceSize, CONFIG.PADDLE_CUSTOM.FACE_SIZE.MIN, CONFIG.PADDLE_CUSTOM.FACE_SIZE.MAX),
                            elasticity: this._clamp(p.elasticity, 0, 2)
                        };
                    }).slice(0, CONFIG.PADDLE_CUSTOM.MAX_PRESETS);
                    while (this.presets.length < CONFIG.PADDLE_CUSTOM.MAX_PRESETS) {
                        this.presets.push(null);
                    }
                }
            }
        } catch (e) {
            console.warn('加载球拍配置失败:', e);
        }
    }

    _saveToStorage() {
        try {
            const data = {
                current: { ...this.config },
                presets: this.presets.map(p => p ? { ...p } : null)
            };
            localStorage.setItem('paddleCustomConfig', JSON.stringify(data));
        } catch (e) {
            console.warn('保存球拍配置失败:', e);
        }
    }

    _clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    _cacheElements() {
        this.weightSlider = document.getElementById('weightSlider');
        this.weightValue = document.getElementById('weightValue');
        this.faceSlider = document.getElementById('faceSlider');
        this.faceValue = document.getElementById('faceValue');
        this.elasticityBtns = document.querySelectorAll('.elasticity-btn');
        this.presetBtns = document.querySelectorAll('.preset-btn');
        this.savePresetBtns = document.querySelectorAll('.save-preset-btn');
    }

    _bindEvents() {
        if (this.weightSlider) {
            this.weightSlider.addEventListener('input', (e) => {
                this.config.weight = parseInt(e.target.value);
                this.weightValue.textContent = this.config.weight + 'g';
                this._onConfigChange();
            });
        }

        if (this.faceSlider) {
            this.faceSlider.addEventListener('input', (e) => {
                this.config.faceSize = parseInt(e.target.value);
                this.faceValue.textContent = this.config.faceSize + '%';
                this._onConfigChange();
            });
        }

        this.elasticityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.config.elasticity = parseInt(btn.dataset.value);
                this._updateElasticityUI();
                this._onConfigChange();
            });
        });

        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this._loadPreset(index);
            });
        });

        this.savePresetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                this._savePreset(index);
            });
        });
    }

    _syncUIFromConfig() {
        if (this.weightSlider) {
            this.weightSlider.value = this.config.weight;
            this.weightValue.textContent = this.config.weight + 'g';
        }
        if (this.faceSlider) {
            this.faceSlider.value = this.config.faceSize;
            this.faceValue.textContent = this.config.faceSize + '%';
        }
        this._updateElasticityUI();
        this._updatePresetUI();
    }

    _updateElasticityUI() {
        this.elasticityBtns.forEach(btn => {
            const val = parseInt(btn.dataset.value);
            if (val === this.config.elasticity) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    _updatePresetUI() {
        this.presetBtns.forEach(btn => {
            const index = parseInt(btn.dataset.index);
            const preset = this.presets[index];
            if (preset) {
                btn.classList.add('has-preset');
                btn.textContent = CONFIG.PADDLE_CUSTOM.ELASTICITY.LABELS[preset.elasticity] +
                    ' ' + preset.weight + 'g/' + preset.faceSize + '%';
            } else {
                btn.classList.remove('has-preset');
                btn.textContent = '空槽' + (index + 1);
            }
        });
    }

    _onConfigChange() {
        this._drawRadar();
        this._applyToGame();
        this._saveToStorage();
    }

    _applyToGame() {
        this.game.applyPaddleCustom({ ...this.config });
    }

    _savePreset(index) {
        this.presets[index] = { ...this.config };
        this._updatePresetUI();
        this._saveToStorage();
    }

    _loadPreset(index) {
        const preset = this.presets[index];
        if (!preset) return;

        this.config = { ...preset };
        this._syncUIFromConfig();
        this._onConfigChange();
    }

    _computeRadarValues() {
        const weightFactor = (this.config.weight - CONFIG.PADDLE_CUSTOM.WEIGHT.MIN) /
            (CONFIG.PADDLE_CUSTOM.WEIGHT.MAX - CONFIG.PADDLE_CUSTOM.WEIGHT.MIN);
        const faceFactor = (this.config.faceSize - CONFIG.PADDLE_CUSTOM.FACE_SIZE.MIN) /
            (CONFIG.PADDLE_CUSTOM.FACE_SIZE.MAX - CONFIG.PADDLE_CUSTOM.FACE_SIZE.MIN);
        const elasticityFactor = this.config.elasticity / 2;

        const F = CONFIG.PADDLE_CUSTOM.RADAR.FORMULAS;

        return {
            speed: F.SPEED.ELASTICITY * elasticityFactor +
                   F.SPEED.WEIGHT_INV * (1 - weightFactor) +
                   F.SPEED.FACE_INV * (1 - faceFactor),
            control: F.CONTROL.ELASTICITY_INV * (1 - elasticityFactor) +
                     F.CONTROL.FACE * faceFactor +
                     F.CONTROL.WEIGHT_INV * (1 - weightFactor),
            power: F.POWER.WEIGHT * weightFactor +
                   F.POWER.ELASTICITY * elasticityFactor,
            spin: F.SPIN.ELASTICITY * elasticityFactor +
                  F.SPIN.FACE * faceFactor,
            defense: F.DEFENSE.FACE * faceFactor +
                     F.DEFENSE.WEIGHT_INV * (1 - weightFactor) +
                     F.DEFENSE.ELASTICITY_INV * (1 - elasticityFactor)
        };
    }

    _drawRadar() {
        if (!this.ctx) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.min(cx, cy) - 35;

        ctx.clearRect(0, 0, w, h);

        const labels = CONFIG.PADDLE_CUSTOM.RADAR.LABELS;
        const count = labels.length;
        const angleStep = (Math.PI * 2) / count;
        const startAngle = -Math.PI / 2;

        for (let ring = 1; ring <= 5; ring++) {
            const r = maxR * ring / 5;
            ctx.beginPath();
            for (let i = 0; i <= count; i++) {
                const angle = startAngle + angleStep * i;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        const values = this._computeRadarValues();
        const valueArr = [values.speed, values.control, values.power, values.spin, values.defense];

        ctx.beginPath();
        for (let i = 0; i <= count; i++) {
            const idx = i % count;
            const angle = startAngle + angleStep * idx;
            const r = maxR * (valueArr[idx] / 100);
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.fillStyle = 'rgba(255, 107, 107, 0.35)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            const r = maxR * (valueArr[i] / 100);
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6b6b';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i;
            const labelR = maxR + 22;
            const x = cx + Math.cos(angle) * labelR;
            const y = cy + Math.sin(angle) * labelR;

            ctx.font = '12px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labels[i], x, y - 8);

            ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(Math.round(valueArr[i]), x, y + 7);
        }
    }

    getCurrentConfig() {
        return { ...this.config };
    }

    show() {
        const menu = document.getElementById('customMenu');
        if (menu) menu.classList.remove('hidden');
        this._syncUIFromConfig();
        this._drawRadar();
    }

    hide() {
        const menu = document.getElementById('customMenu');
        if (menu) menu.classList.add('hidden');
    }
}
