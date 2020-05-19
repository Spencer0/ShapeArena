const express = require('express');
const app = express();
var http = require('http').createServer(app);
const port = process.env.PORT || 3000
const io = require('socket.io')(http);
const gameWorldHeight = 6000;
const gameWorldWidth = 8000;
const canvasPadding = 25;

let activeUsers = 0;
const shapescooter = new ShapeScooter();

//Serve static 
app.use(express.static('public'))

//Server via server
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

io.on('connection', (socket) => {
    let newUserName = socket.handshake.query['user'];
    console.log('a user connected');
    console.log('ACTIVE USERS:', ++activeUsers);
    shapescooter.newPlayer(socket.id, newUserName);
    io.emit('connection-event', activeUsers);

    socket.on('disconnect', () => {
        console.log('user disconnected');
        console.log('ACTIVE USERS:', --activeUsers);
        shapescooter.removePlayer(socket.id);
        io.emit('connection-event', activeUsers);
    });

    socket.on('message-event', (msg) => {
      console.log("Message broadcasting"  )
      io.emit('message-event', msg);
    });

    socket.on('error', (e) => {
        console.log("ERORR", e)
    })

    socket.on('keyboard-input', (data) => {
        shapescooter.updatePlayerPosition(data, socket.id)
    });

    socket.on('mouse-input', (data) => {
        shapescooter.newProjectile(data, socket.id)
    });

    socket.on('latency', function (fn) {
        fn();
    }); 

});


http.listen(port, () => {
    console.log('Garden Server, Port: ', port);
});

//Basic Canvas Stream
function ShapeScooter(){

    this.state = {
        player: {},
        enemies: {},
        shooting: false,
        enemyCount: 0,
    }

    

    this.newPlayer = function(socketId, userName){
        if(!userName){return}
        this.state.player[socketId] = {
            x: 30 * activeUsers,
            y: 30 * activeUsers,
            width: 35,
            height: 20,
            color: this.randomColor(),
            id: socketId,
            user: userName,
            bullets: {},
            bulletCount: 0,
            bulletIncId: 0,
        }
    }
    
    this.newProjectile = function(mouse, socketId){
        let bulletsPlayer = this.state.player[socketId]
        if(bulletsPlayer.bulletCount >= 10) { return }
        bulletsPlayer.bullets[bulletsPlayer.bulletIncId] = {
                x: this.state.player[socketId].x,
                y: this.state.player[socketId].y,
                width: 5,
                height: 1,
                direction: { x: mouse.x, 
                             y: mouse.y, 
                },
                lifespan: 100,
                currentLife: 100,
                color: this.state.player[socketId].color,
                id: bulletsPlayer.bulletIncId,
        }
        bulletsPlayer.bulletCount++;
        bulletsPlayer.bulletIncId++;
        this.shooting = true;
    }

    this.newEnemy = function(){
        console.log("enemy")
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
                        console.log("checking, ", bullet.color, this.state.player[playerIdInternal].color)
                        if(bullet.color !== this.state.player[playerIdInternal].color){
                            console.log("different ship found, checking colision, ")

                            if(this.collides(this.state.player[playerIdInternal], bullet)){
                                console.log("collision detected, moiving ", this.state.player[playerIdInternal].color)
                                this.state.player[playerIdInternal].x = 30;
                                this.state.player[playerIdInternal].y = 30;
                                this.state.player[playerIdInternal].width = 35;
                                this.state.player[playerIdInternal].height = 20;
                                io.sockets.emit('state', this.state);
                            }
                        }
                    }
                    for(enemyId of Object.keys(this.state.enemies)){
                        if(this.collides(this.state.enemies[enemyId], bullet)){
                            if(this.state.enemies[enemyId].life === 0){
                                delete this.state.enemies[enemyId] 
                            }else{
                                this.state.enemies[enemyId].life--;
                            }
                            bullet.currentLife = 0;
                            this.state.player[playerId].width += 1;
                            this.state.player[playerId].height += 1;
                        }
                        
                    }
                }
            }
    }

    this.updateEnemyPositions = function(){
        for(enemyId of Object.keys(this.state.enemies)){
            let enemy = this.state.enemies[enemyId];
            enemy.x += 1;
            enemy.y += 1;
        }
    
}
    
    this.updateBulletPosition = function(bullet){
        let xMovement = bullet.direction.x - bullet.x
        let yMovement = bullet.direction.y - bullet.y 
        bullet.x += xMovement / bullet.lifespan;
        bullet.y += yMovement  / bullet.lifespan;
    }

    this.collides = function(enemy,bullet){
        if(bullet.x >= enemy.x && bullet.x <= enemy.x + enemy.width ){
            if(bullet.y >= enemy.y && bullet.y <= enemy.y + enemy.height){
                return true;
            }
        }
        return false;
    }
    
    setInterval(() => {
        if(this.state.enemyCount < 10){
            this.newEnemy();
        }
    }, 10000);

    setInterval(() => {
            this.updateProjectilePositions();
            this.updateEnemyPositions();
            io.sockets.emit('state', this.state);
    }, 1000 / 60);
}