
const enemyManager = require('./enemy/enemy-manager');
const bulletManager = require('./projectile/bullet-manager');
const playerManager = require('./player/player-manager');

//Heading twoards 
//DB manager [Save player, load player]
//Player manager [Update, newPlayer(user... )] - player factory 
//Bullet manager [Update] - enemy factory
//Hitbox manager [Update]
//State manager [Update]

 
function ShapeScooter(){

    this.enemyManager = enemyManager;
    this.playerManager = playerManager;

    this.clientState = {
        player: {},
        enemies: {},
        shooting: false,
        enemyCount: 0,
		enemyIncId: 0,
        activeUsers: 0,
        gameWorldHeight: 10000,
        gameWorldWidth: 10000,
        shop: {
            x: 400,
            y: 500,
            width: 200,
            height: 100,
        },
        graveyard: {
            x: 0,
            y: 0,
            widith: 100,
            height: 100,
        },
        gameWorldHeight: 1500,
        gameWorldWidth: 1500,
        canvasPadding: 25
    }

    let self = this;

    this.update = () => {
        this.updateProjectilePositions();
        this.enemyManager.update(this.clientState);
    }

    this.newPlayer =  async function(socketId, userName, db){
        if(!userName){return}
        db.loadUser(this.clientState, userName, socketId, self.playerManager.spawnPlayer)
    }


    this.newProjectile = function(mouse, socketId){
        let bulletsPlayer = this.clientState.player[socketId];
        if(!bulletsPlayer) { return }
        if(!bulletsPlayer.bullets) { return }
        if(bulletsPlayer.bulletCount >= 10) { return }
        bulletsPlayer.bullets[bulletsPlayer.bulletIncId] = {
                x: bulletsPlayer.x,
                y: bulletsPlayer.y,
                width: bulletsPlayer.bulletRadius,
                height: 1,
                destination: { 
                    x: mouse.x, 
                    y: mouse.y, 
                },
                direction: { 
                    x: mouse.x - bulletsPlayer.x, 
                    y: mouse.y - bulletsPlayer.y, 
                },
                lifespan: bulletsPlayer.bulletLifespan,
                currentLife: bulletsPlayer.bulletLifespan,
                speed: bulletsPlayer.bulletSpeed,
                color: bulletsPlayer.color,
                id: bulletsPlayer.bulletIncId,
                parentId: bulletsPlayer.id,
        }
        bulletsPlayer.bulletCount++;
        bulletsPlayer.bulletIncId++;
        this.shooting = true;
    }

    this.removePlayer = function(socketId){
        delete this.clientState.player[socketId];
    }

    this.handleKeyboardInput = function(input, id){
        this.playerManager.updatePlayer(this.clientState, input, id);
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
                    if(bullet.parentId !== this.clientState.player[playerIdInternal].id){
                        if(this.collides(this.clientState.player[playerIdInternal], bullet)){
                            this.playerManager.levelPlayer(this.clientState.player[playerId], Math.sqrt(this.clientState.player[playerIdInternal].level));
                            this.playerManager.hurtPlayer(this.clientState.player[playerIdInternal], this.clientState.player[playerId].bulletDamage);
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
                            this.playerManager.levelPlayer(this.clientState.player[playerId], 1);
                        }else{
                            this.clientState.enemies[enemyId].life--;
                        }
                        bullet.currentLife = 0;
                    }
                
                }
            }
            
        }
    }
    

    this.save = function(db){
        for(playerId of Object.keys(this.clientState.player)){
            if(this.clientState.player[playerId].shouldSave){
                console.log("attempting to save")
                db.saveUser(this.clientState.player[playerId])
                this.clientState.player[playerId].shouldSave = false
            }
        }
    }

    this.updateBulletPosition = function(bullet){
        let xMovement = bullet.direction.x 
        let yMovement = bullet.direction.y
        if(xMovement > 0){
            bullet.x +=  ( Math.cos(yMovement/ xMovement) * bullet.speed )
            bullet.y += ( Math.sin(yMovement/ xMovement) * bullet.speed )
        }else{
            bullet.x -= ( Math.cos(yMovement/ xMovement) * bullet.speed )
            bullet.y -= ( Math.sin(yMovement/ xMovement) * bullet.speed )
        }
    }
   

    this.collides = function(enemy,bullet){
        if(self.inSafeZone(enemy)){
            return false;
        }

        if(bullet.x >= enemy.x && bullet.x <= enemy.x + enemy.width ){
            if(bullet.y >= enemy.y && bullet.y <= enemy.y + enemy.height){
                return true;
            }
        }
        return false;
    }

    this.inSafeZone = function(enemy){
        //Graveyard
        if(enemy.x < 100 && enemy.y < 100){
            return true;
        }

        //At the shop
        let shop = self.clientState.shop;
        if(enemy.x <= shop.x + shop.width && enemy.x >= shop.x && enemy.y >= shop.y && enemy.y <= shop.y + shop.height){
            return true;
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