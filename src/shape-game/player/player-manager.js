const spawnPlayer = function(state, userName, socketId, player){
    console.log("spawning player")
    if(player){
        //console.log(tryLoadedPlayer)
        let returningPlayer = { 
            x: player.x,
            y: player.y,
            width: 4,
            height: 8,
            color: player.color,
            id: socketId,
            user: userName,
            bullets: {},
            bulletCount: 0,
            bulletIncId: 0,
            bulletRadius: 1,
            bulletLifespan: 12,
            bulletSpeed: 3,
            bulletDamage: 1,
            health: 1,
            level: 1,
            speed: 2,
            shouldSave: false,
            inShop: false
        }
        powerLevelPlayer(returningPlayer);
        state.player[socketId] = returningPlayer;

    }else{
        //console.log(tryLoadedPlayer)
        state.player[socketId] = {
            x: 15,
            y: 15,
            width: 4,
            height: 8,
            color: randomColor(),
            id: socketId,
            user: userName,
            bullets: {},
            bulletCount: 0,
            bulletIncId: 0,
            bulletRadius: 1,
            bulletLifespan: 12,
            bulletSpeed: 3,
            health: 1,
            level: 1,
            bulletDamage: 1,
            speed: 2,
            shouldSave: false,
            inShop: false
        }
    }
    
}

const updatePlayerPosition = function(state, input, id){
    let directionString = Object.keys(input).join("");
    let directionCount = directionString.length;
    let player = state.player[id];
    if(!player){return}
    while(directionCount--){
        switch(directionString.charAt(directionCount)){
            case "w":
                if(player.y <= state.canvasPadding){ continue }
                player.y -= player.speed;
                break;
            case "a":
                if(player.x <= state.canvasPadding){ continue }
                player.x -= player.speed;
                break;
            case "s":
                if(player.y >= state.gameWorldHeight- state.canvasPadding){ continue }
                player.y += player.speed;
                break;
            case "d":
                if(player.x >= state.gameWorldWidth - state.canvasPadding){ continue }
                player.x += player.speed;
                break;
            default:
                break;
        }
    }

    if(isInShop(player, state.shop)){
        if(!player.inShop == true) { console.log("In shop") }
        player.inShop = true;
    }else{
        if(!player.inShop == false) { console.log("leaving shop") }
        player.inShop = false;
    }
}

function isInShop(player, shop){
    if(player.x <= shop.x + shop.width && player.x >= shop.x && player.y >= shop.y && player.y <= shop.y + shop.height){
        return true;
    }
    return false;
}

const powerLevelPlayer = function(player){
    console.log("leveling", player.level)
    for(let i = 0; i < player.level; i++) {
        player.width *= 1.02;
        player.height *= 1.02;
        player.bulletRadius += 0.05;
        player.bulletLifespan += 1;
        player.speed += 0.1;
        player.bulletSpeed += 0.12;
    }
}

const levelUp = function(player, levels) {
    player.shouldSave = true;
    for(let i = 0; i < levels; i++) {
        player.width *= 1.02;
        player.height *= 1.02;
        player.bulletRadius += 0.05;
        player.bulletLifespan += 1;
        player.speed += 0.1;
        player.bulletSpeed += 0.12;
        player.level += 1;
    }
}

const respawnPlayer = function( player ) {
    player.x = 30;
    player.y = 30;
    player.width = 4;
    player.height = 8;
    player.health = 1;
    player.bulletRadius = 1;
    player.bulletLifespan = 12;
    player.bulletSpeed = 3;
    player.level = Math.sqrt(player.level); 
}

const hurtPlayer = function( player, damage ) {
    player.health -= damage;
    if(player.health <= 0){
        respawnPlayer(player);
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

module.exports.levelPlayer = levelUp;
module.exports.spawnPlayer = spawnPlayer;
module.exports.hurtPlayer = hurtPlayer;
module.exports.updatePlayer = updatePlayerPosition;