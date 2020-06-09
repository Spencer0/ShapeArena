

const spawnPlayer = function(state, userName, socketId, player){
    console.log("spawning player")
    if(player){
        //console.log(tryLoadedPlayer)
        let returningPlayer = { 
            x: player.x,
            y: player.y,
            width: 4,
            height: 12,
            color: player.color,
            id: socketId,
            user: userName,
            bullets: {},
            bulletCount: 0,
            bulletIncId: 0,
            bulletRadius: 1,
            bulletLifespan: 50,
            bulletSpeed: 1,
            level: player.level,
            speed: 3,
            shouldSave: false,
        }
        powerLevelPlayer(returningPlayer);
        state.player[socketId] = returningPlayer;

    }else{
        //console.log(tryLoadedPlayer)
        state.player[socketId] = {
            x: 15,
            y: 15,
            width: 4,
            height: 12,
            color: randomColor(),
            id: socketId,
            user: userName,
            bullets: {},
            bulletCount: 0,
            bulletIncId: 0,
            bulletRadius: 1,
            bulletLifespan: 50,
            bulletSpeed: 1,
            level: 1,
            speed: 3,
            shouldSave: false,
        }
    }
    
}

powerLevelPlayer = function(player){
    console.log("leveling", player.level)
    for(let i = 0; i < player.level; i++) {
        player.width *= 1.02;
        player.height *= 1.02;
        player.bulletRadius += 0.05;
        player.bulletLifespan += 3;
        player.speed += 0.1;
        player.bulletSpeed += 0.2;
    }
}

randomColor = function() {
    let trimColors = ['red', 'black', 'white', 'orange', 'blue', 'yellow', 'aqua', 'navyblue', 'purple', 'pink']
    return trimColors[Math.floor(Math.random() * trimColors.length)];
}

function PlayerFactory(){

}

function Player(color, life) {
    this.x = 100 + Math.random() * 300;
    this.y = 100 + Math.random() * 300;
    this.width = 50;
    this.height = 50;
    this.color = color;
    this.user = "mammoth";
    this.bullets = {};
    this.bulletCount = 0;
    this.life = life;
}

module.exports.spawnPlayer = spawnPlayer;