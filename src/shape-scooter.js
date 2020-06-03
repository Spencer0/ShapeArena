const gameWorldHeight = 1200;
const gameWorldWidth = 1600;
const canvasPadding = 25;
const enemyFactory = require('./enemy/enemy-factory');

function ShapeScooter(){

    this.state = {
        player: {},
        enemies: {},
        shooting: false,
        enemyCount: 0,
		enemyIncId: 0,
        activeUsers: 0
    }

    this.newPlayer = function(socketId, userName){
        if(!userName){return}
        this.state.player[socketId] = {
            x: 30 * this.state.activeUsers,
            y: 30 * this.state.activeUsers,
            width: 4,
            height: 12,
            color: this.randomColor(),
            id: socketId,
            user: userName,
            bullets: {},
            bulletCount: 0,
            bulletIncId: 0,
            bulletRadius: 1,
            bulletLifespan: 5,
            level: 1,
            speed: 3,
        }
    }
    
    this.newProjectile = function(mouse, socketId){
        let bulletsPlayer = this.state.player[socketId];
        if(bulletsPlayer.bulletCount >= 10) { return }
        bulletsPlayer.bullets[bulletsPlayer.bulletIncId] = {
                x: bulletsPlayer.x,
                y: bulletsPlayer.y,
                width: bulletsPlayer.bulletRadius,
                height: 1,
                direction: { 
                    x: mouse.x, 
                    y: mouse.y, 
                },
                lifespan: bulletsPlayer.bulletLifespan,
                currentLife: bulletsPlayer.bulletLifespan,
                color: bulletsPlayer.color,
                id: bulletsPlayer.bulletIncId,
        }
        bulletsPlayer.bulletCount++;
        bulletsPlayer.bulletIncId++;
        this.shooting = true;
    }

    this.newEnemy = function(){
        this.state.enemies[this.state.enemyIncId] = enemyFactory('Brown', 1);
        this.state.enemyCount++;
		this.state.enemyIncId++;
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
                    player.y -= player.speed;
                    break;
                case "a":
                    if(player.x <= canvasPadding){ continue }
                    player.x -= player.speed;
                    break;
                case "s":
                    if(player.y >= gameWorldHeight-canvasPadding){ continue }
                    player.y += player.speed;
                    break;
                case "d":
                    if(player.x >= gameWorldWidth - canvasPadding){ continue }
                    player.x += player.speed;
                    break;
                default:
                    break;
            }
        }
    }

    this.updateProjectilePositions = function(){
        for(playerId of Object.keys(this.state.player)){
            let bullets = this.state.player[playerId].bullets;
            for(enemyId of Object.keys(this.state.enemies)){
                //Did they hit me?
                if(this.collidesSquares(this.state.enemies[enemyId], this.state.player[playerId])){
                    if(this.state.enemies[enemyId].life === 0){
                        this.respawnPlayer(playerIdInternal);
                    }
                }
            }
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
                            if(typeof io === 'undefined') { return }
                            io.sockets.emit('state', this.state);
                        }
                    }
                }
                
                //For each player, for each enemy 
                for(enemyId of Object.keys(this.state.enemies)){
                    
                    //Did i hit them?
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
        let player = this.state.player[playerId];
        for(let i = 0; i < levels; i++) {
            player.width *= 1.1;
            player.height *= 1.1;
            player.bulletRadius += 0.2;
            player.bulletLifespan += 1;
            player.level += 1;
        }
    }
    
    this.respawnPlayer = function( playerId ) {
        let player = this.state.player[playerId];
        player.x = 30;
        player.y = 30;
        player.width = 35;
        player.height = 20;
        player.bulletRadius = 5;
        player.bulletLifespan = 300;
        player.level = 1; 
    }

    this.updateEnemyPositions = function(){
        for(enemyId of Object.keys(this.state.enemies)){
            let enemy = this.state.enemies[enemyId];
            enemy.x += 1;
            enemy.y += 1;
            if(enemy.x >= gameWorldWidth || enemy.y >= gameWorldHeight ){
                this.state.enemyCount--;
                delete this.state.enemies[enemyId]
            }
        }
    }
    
    this.updateBulletPosition = function(bullet){
        let xMovement = bullet.direction.x - bullet.x
        let yMovement = bullet.direction.y - bullet.y 
        bullet.x += xMovement *  0.001;
        bullet.y += yMovement  * 0.001;
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

    this.collidesSquares = function(enemy, player){

        //TODO: Running into an ememy kils you
        return false;
        if(player.x < 60 && player.y < 60){
            return
        }
        if(!enemy) {return}
        // l1: Top Left coordinate of first rectangle.
        let l1 = {
            x: enemy.x,
            y: enemy.y
        } 
        // r1: Bottom Right coordinate of first rectangle.
        let r1 = {
            x: enemy.x + enemy.width,
            y: enemy.y + enemy.height
        } 
        // l2: Top Left coordinate of second rectangle.
        let l2 = {
            x: player.x,
            y: player.y
        } 
        // r2: Bottom Right coordinate of second rectangle.
        let r2 = {
            x: player.x + player.width,
            y: player.y + player.height,
        } 


        // If one rectangle is on left side of other 
        if (l1.x >= r2.x || l2.x >= r1.x) 
            {   console.log("rect above", l2, l1)
                return false; } 

        // If one rectangle is above other 
        if (l1.y <= r2.y || l2.y <= r1.y) 
            { console.log("rect below", l2, l1)
                return false; } 
        
        console.log("rect IN")
        return true; 
    }

    setInterval(() => {
        if(Object.keys(this.state.player).length !== 0){
            
            if(this.state.enemyCount < 10){
                this.newEnemy();
            }
        }
    }, 5000);
}

module.exports = ShapeScooter;