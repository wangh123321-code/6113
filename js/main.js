const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);
const ui = new UIManager(game);

window.game = game;
window.ui = ui;

let lastTime = 0;

function gameLoop(currentTime) {
    if (lastTime === 0) {
        lastTime = currentTime;
    }
    
    game.lastTime = lastTime;
    
    game.update(currentTime);
    game.draw();
    ui.update();
    
    lastTime = currentTime;
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

console.log('🏓 街机乒乓球游戏已加载!');
console.log('操作说明:');
console.log('  玩家1 (左侧): W/S 移动, D 扣杀');
console.log('  玩家2 (右侧): ↑/↓ 移动, L 扣杀');
console.log('  ESC 暂停游戏');
