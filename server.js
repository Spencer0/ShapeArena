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
        shooting: false,
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
        }
    }
    
    this.newProjectile = function(mouse, socketId){
        let bulletsPlayer = this.state.player[socketId]
        bulletsPlayer.bullets[bulletsPlayer.bulletCount] = {
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
                id: bulletsPlayer.bulletCount,
        }
        bulletsPlayer.bulletCount++;
        this.shooting = true;
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
                        continue;
                    }

                    //If it does, move it forward 
                    this.updateBulletPosition(bullet)
                }
            }
        
    }
    
    this.updateBulletPosition = function(bullet){
        let xMovement = bullet.direction.x - bullet.x
        let yMovement = bullet.direction.y - bullet.y 
        bullet.x += xMovement / bullet.lifespan;
        bullet.y += yMovement  / bullet.lifespan;
    }

    

    setInterval(() => {
            this.updateProjectilePositions();
            io.sockets.emit('state', this.state);
    }, 1000 / 60);
}