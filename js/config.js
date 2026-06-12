const CONFIG = {
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 600,
    
    TABLE: {
        TOP: 80,
        BOTTOM: 520,
        LEFT: 60,
        RIGHT: 900,
        NET_X: 480,
        NET_WIDTH: 4,
        COLOR: '#1a472a',
        LINE_COLOR: '#ffffff',
        BORDER_COLOR: '#c9a227'
    },

    BALL: {
        RADIUS: 8,
        INITIAL_SPEED_X: 5,
        INITIAL_SPEED_Y: 3,
        MAX_SPEED: 14,
        SPEED_INCREMENT: 0.03,
        SMASH_SPEED_MULTIPLIER: 1.4,
        COLOR: '#ffffff',
        BOUNCE_DAMPING: 1.0
    },

    PADDLE: {
        WIDTH: 12,
        HEIGHT: 80,
        ACCELERATION: 0.8,
        MAX_SPEED: 10,
        FRICTION: 0.9,
        COLOR: '#ff6b6b',
        COLOR2: '#4ecdc4',
        SMASH_WIDTH: 20,
        SMASH_HEIGHT: 100
    },

    SMASH: {
        TRIGGER_DISTANCE_X: 120,
        HIGH_BALL_ZONE: 0.5,
        DIRECTION_NARROW: 0.4,
        SMASH_SPEED_BONUS: 1.4,
        ANIMATION_DURATION: 300,
        COOLDOWN: 400
    },

    GAME: {
        POINTS_TO_WIN: 11,
        SETS_TO_WIN: 2,
        REST_DURATION: 5,
        RALLY_FLAME_THRESHOLD: 8
    },

    AI: {
        BASE_REACTION_TIME: 200,
        MIN_REACTION_TIME: 50,
        BASE_ACCURACY: 0.7,
        MAX_ACCURACY: 0.95,
        DIFFICULTY_ADJUST_RATE: 0.05
    },

    EFFECTS: {
        TRAIL_LENGTH: 15,
        PARTICLE_COUNT: 8,
        PARTICLE_LIFETIME: 30,
        FLAME_COLORS: ['#ff6b00', '#ffaa00', '#ffff00', '#ff4400']
    },

    COLORS: {
        PLAYER1: '#ff6b6b',
        PLAYER2: '#4ecdc4',
        BALL: '#ffffff',
        NET: '#ffffff',
        SCORE: '#ffd700'
    }
};
