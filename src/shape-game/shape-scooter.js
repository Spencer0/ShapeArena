const gameWorldHeight = 1200;
const gameWorldWidth = 1600;
const canvasPadding = 25;
const enemyManager = require('./enemy/enemy-manager');
const bulletManager = require('./projectile/bullet-manager');

//Heading twoards 
//DB manager [Save player, load player]
//Player manager [Update, newPlayer(user... )] - player factory 
//Bullet manager [Update] - enemy factory
//Enemy manager [Update] - 
//Hitbox manager [Update]
//State manager [Update]

function ShapeScooter(){

    //Entity Managers
    this.enemyManager = enemyManager;

    //This is whats needed to be sent to the view for a proper render 
    this.clientState = {
        player: {},
        enemies: {},
        shooting: false,
        enemyCount: 0,
		enemyIncId: 0,
        activeUsers: 0,
        gameWorldHeight: 1200,
        gameWorldWidth: 1600
    }

    //This is everything else 
    this.serverState = {
        player: {},
    }

    let self = this;

    this.update = () => {
        this.updateProjectilePositions();
        this.enemyManager.update(this.clientState);
    }

    this.newPlayer =  async function(socketId, userName, db){
        if(!userName){return}
        db.loadUser(userName, socketId, this.spawnPlayer)

    }

    this.spawnPlayer = function(userName, socketId, player){
        
        if(player){
            //console.log(tryLoadedPlayer)
            self.clientState.player[socketId] = {
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
                level: player.level,
                speed: 3,
            }

            self.serverState.player[socketId] = {
                id: socketId,
                user: userName,
                shouldSave: false,
            }

        }else{
            //console.log(tryLoadedPlayer)
            self.clientState.player[socketId] = {
                x: 15,
                y: 15,
                width: 4,
                height: 12,
                color: self.randomColor(),
                id: socketId,
                user: userName,
                bullets: {},
                bulletCount: 0,
                bulletIncId: 0,
                bulletRadius: 1,
                bulletLifespan: 50,
                level: 1,
                speed: 3,
            }

            self.serverState.player[socketId] = {
                id: socketId,
                user: userName,
                shouldSave: false,
            }
        }
        
    }

    this.newProjectile = function(mouse, socketId){
        let bulletsPlayer = this.clientState.player[socketId];
        if(!bulletsPlayer) { return }
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


    this.removePlayer = function(socketId){
        delete this.clientState.player[socketId];
        delete this.serverState.player[socketId];
    }

    this.randomColor = function() {
        let trimColors = ['red', 'black', 'white', 'orange', 'blue', 'yellow', 'aqua', 'navyblue', 'purple', 'pink']
        return trimColors[Math.floor(Math.random() * trimColors.length)];
    }


    this.updatePlayerPosition = function(input, id){
        let directionString = Object.keys(input).join("");
        let directionCount = directionString.length;
        let player = this.clientState.player[id];
        if(!player){return}
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
        for(playerId of Object.keys(this.clientState.player)){
            let bullets = this.clientState.player[playerId].bullets;
            for(enemyId of Object.keys(this.clientState.enemies)){
                //Did they hit me?
                if(this.collidesSquares(this.clientState.enemies[enemyId], this.clientState.player[playerId])){
                    if(this.clientState.enemies[enemyId].life === 0){
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
                    delete this.clientState.player[playerId].bullets[bullet.id]
                    this.clientState.player[playerId].bulletCount--;
                    continue;
                }

                //If it does, move it forward 
                this.updateBulletPosition(bullet)
                
                //Check collisions
                for(playerIdInternal of Object.keys(this.clientState.player)){
                    if(bullet.color !== this.clientState.player[playerIdInternal].color){
                        if(this.collides(this.clientState.player[playerIdInternal], bullet)){
                            this.respawnPlayer(playerIdInternal);
                            this.levelUp(playerId, 2);
                            if(typeof io === 'undefined') { return }
                            io.sockets.emit('state', this.clientState);
                        }
                    }
                }
                
                //For each player, for each enemy 
                for(enemyId of Object.keys(this.clientState.enemies)){
                    
                    //Did i hit them?
                    if(this.collides(this.clientState.enemies[enemyId], bullet)){
                        if(this.clientState.enemies[enemyId].life === 0){
                            delete this.clientState.enemies[enemyId] 
                            this.clientState.enemyCount--;
                            this.levelUp(playerId, 1);
                        }else{
                            this.clientState.enemies[enemyId].life--;
                        }
                        bullet.currentLife = 0;
                    }
                
                }
            }
            
        }
    }
    

    this.levelUp = function(playerId, levels) {
        let player = this.clientState.player[playerId];
        this.serverState.player[playerId].shouldSave = true;
        for(let i = 0; i < levels; i++) {
            player.width *= 1.1;
            player.height *= 1.1;
            player.bulletRadius += 0.2;
            player.bulletLifespan += 1;
            player.level += 1;
        }
    }
    
    this.save = function(db){
        for(playerId of Object.keys(this.serverState.player)){
            if(this.serverState.player[playerId].shouldSave){
                console.log("attempting to save")
                db.saveUser(this.clientState.player[playerId])
                this.serverState.player[playerId].shouldSave = false
            }
        }
    }

    this.respawnPlayer = function( playerId ) {
        let player = this.clientState.player[playerId];
        player.x = 30;
        player.y = 30;
        player.width = 35;
        player.height = 20;
        player.bulletRadius = 5;
        player.bulletLifespan = 300;
        player.level = 1; 
    }
    
    this.updateBulletPosition = function(bullet){
        let xMovement = bullet.direction.x - bullet.x
        let yMovement = bullet.direction.y - bullet.y 
        if(xMovement > 0){
            bullet.x += Math.cos(yMovement/ xMovement);
            bullet.y += Math.sin(yMovement/ xMovement);
        }else{
            bullet.x -= Math.cos(yMovement/ xMovement);
            bullet.y -= Math.sin(yMovement/ xMovement);
        }
    }

    this.collides = function(enemy,bullet){
        if(enemy.x < 100 && enemy.y < 100){
            return false;
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

    //If there are players on the map, every second try to spawn an enemy 
    setInterval(() => {
        if(Object.keys(this.clientState.player).length !== 0){
                this.enemyManager.enemySpawner(this.clientState);
        }
    }, 1000);
}

module.exports = ShapeScooter;