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

    socket.on('user-input', (data) => {
        shapescooter.update(data, socket.id)
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
        player: {}
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
        }
    }

    this.removePlayer = function(socketId){
        delete this.state.player[socketId];
    }

    this.randomColor = function() {
        let trimColors = ['red', 'black', 'white', 'orange', 'blue', 'yellow', 'aqua', 'navyblue', 'purple', 'pink']
        return trimColors[Math.floor(Math.random() * trimColors.length)];
    }


      
    this.update = function(input, id){
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
    setInterval(() => {
            io.sockets.emit('state', this.state);
    }, 1000 / 60);
}