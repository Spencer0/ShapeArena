const gameWorldHeight = 6000;
const gameWorldWidth = 8000;
const canvasPadding = 25;

function ShapeScooter(){

    this.state = {
        player: {},
        enemies: {},
        shooting: false,
        enemyCount: 0,
        activeUsers: 0
    }

    this.newPlayer = function(socketId, userName){
        if(!userName){return}
        this.state.player[socketId] = {
            x: 30 * this.state.activeUsers,
            y: 30 * this.state.activeUsers,
            width: 35,
            height: 20,
            color: this.randomColor(),
            id: socketId,
            user: userName,
            bullets: {},
            bulletCount: 0,
            bulletIncId: 0,
            bulletRadius: 5,
            bulletLifespan: 100,
            level: 1,
        }
    }
    
    this.newProjectile = function(mouse, socketId){
        let bulletsPlayer = this.state.player[socketId]
        if(bulletsPlayer.bulletCount >= 10) { return }
        bulletsPlayer.bullets[bulletsPlayer.bulletIncId] = {
                x: this.state.player[socketId].x,
                y: this.state.player[socketId].y,
                width: this.state.player[socketId].bulletRadius,
                height: 1,
                direction: { 
                    x: mouse.x, 
                    y: mouse.y, 
                },
                lifespan: this.state.player[socketId].bulletLifespan,
                currentLife: this.state.player[socketId].bulletLifespan,
                color: this.state.player[socketId].color,
                id: bulletsPlayer.bulletIncId,
        }
        bulletsPlayer.bulletCount++;
        bulletsPlayer.bulletIncId++;
        this.shooting = true;
    }

    this.newEnemy = function(){
        this.state.enemies[this.state.enemyCount] = {
            x: 30,
            y: 30,
            width: 50,
            height: 50,
            color: "black",
            user: "void",
            bullets: {},
            bulletCount: 0,
            life: 15,
        }
        this.state.enemyCount++;
    }

    this.removePlayer = function(socketId){
        delete this.state.player[socketId];
    }

    this.randomColor = function() {
        let trimColors = ['red', 'black', 'white', 'orange', 'blue', 'yellow', 'aqua', 'navyblue', 'purple', 'pink']
        return trimColors[Math.floor(Math.random() * trimColors.length)];
    }


    this.updatePlayerPosition = function(input, id){
        let directionString = Object.keys(input).join("");
        let directionCount = directionString.length;
        let player = this.state.player[id];
        while(directionCount--){
            switch(directionString.charAt(directionCount)){
                case "w":
                    if(player.y <= canvasPadding){ continue }
                    player.y -= 10;
                    break;
                case "a":
                    if(player.x <= canvasPadding){ continue }
                    player.x -= 10;
                    break;
                case "s":
                    if(player.y >= gameWorldHeight-canvasPadding){ continue }
                    player.y += 10;
                    break;
                case "d":
                    if(player.x >= gameWorldWidth - canvasPadding){ continue }
                    player.x += 10;
                    break;
                default:
                    break;
            }
        }
    }

    this.updateProjectilePositions = function(){
            for(playerId of Object.keys(this.state.player)){
                let bullets = this.state.player[playerId].bullets;
                if(!bullets) { continue }
                for(bulletId of Object.keys(bullets)){
                    let bullet = bullets[bulletId];
                    //See if it has any life left in it
                    bullet.currentLife--
                    if(bullet.currentLife <= 0){
                        delete this.state.player[playerId].bullets[bullet.id]
                        this.state.player[playerId].bulletCount--;
                        continue;
                    }

                    //If it does, move it forward 
                    this.updateBulletPosition(bullet)
                    
                    //Check collisions
                    for(playerIdInternal of Object.keys(this.state.player)){
                        if(bullet.color !== this.state.player[playerIdInternal].color){
                            if(this.collides(this.state.player[playerIdInternal], bullet)){
                                this.respawnPlayer(playerIdInternal);
                                this.levelUp(playerId, 2);
                                io.sockets.emit('state', this.state);
                            }
                        }
                    }
                    for(enemyId of Object.keys(this.state.enemies)){
                        if(this.collides(this.state.enemies[enemyId], bullet)){
                            if(this.state.enemies[enemyId].life === 0){
                                delete this.state.enemies[enemyId] 
                                this.state.enemyCount--;
                                this.levelUp(playerId, 1);
                            }else{
                                this.state.enemies[enemyId].life--;
                            }
                            bullet.currentLife = 0;
                        }
                    }
                }
            }
    }

    this.levelUp = function(playerId, levels) {
        for(let i = 0; i < levels; i++) {
            this.state.player[playerId].width *= 1.1;
            this.state.player[playerId].height *= 1.1;
            this.state.player[playerId].bulletRadius += 0.2;
            this.state.player[playerId].bulletLifespan *= .9;
            this.state.player[playerId].level += 1;
        }
    }
    
    this.respawnPlayer = function( playerId ) {
        this.state.player[playerId].x = 30;
        this.state.player[playerId].y = 30;
        this.state.player[playerId].width = 35;
        this.state.player[playerId].height = 20;
        this.state.player[playerId].bulletRadius = 5;
        this.state.player[playerId].bulletLifespan = 100;
        this.state.player[playerId].level = 1;
    }

    this.updateEnemyPositions = function(){
        for(enemyId of Object.keys(this.state.enemies)){
            let enemy = this.state.enemies[enemyId];
            enemy.x += 1;
            enemy.y += 1;
            if(enemy.x >= gameWorldWidth){
                delete this.state.enemies[enemyId]
                this.state.player.enemyCount--;
            }
            else if(enemy.y >= gameWorldHeight){
                delete this.state.enemies[enemyId]
                this.state.player.enemyCount--;
            }
        }
    
}
    
    this.updateBulletPosition = function(bullet){
        let xMovement = bullet.direction.x - bullet.x
        let yMovement = bullet.direction.y - bullet.y 
        bullet.x += xMovement * (1 / bullet.lifespan);
        bullet.y += yMovement  * (1 / bullet.lifespan);
    }

    this.collides = function(enemy,bullet){
        if(enemy.x < 100 && enemy.y < 100){
            return
        }
        if(bullet.x >= enemy.x && bullet.x <= enemy.x + enemy.width ){
            if(bullet.y >= enemy.y && bullet.y <= enemy.y + enemy.height){
                return true;
            }
        }
        return false;
    }
}

module.exports = ShapeScooter;