const express = require('express');
const app = express();
var http = require('http').createServer(app);
const port = process.env.PORT || 3000
const io = require('socket.io')(http);


let activeUsers = 0;
const shapescooter = new ShapeScooter();

//Serve static 
app.use(express.static('public'))

//Server via server
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

io.on('connection', (socket) => {
    console.log('a user connected');
    console.log('ACTIVE USERS:', ++activeUsers);
    shapescooter.newPlayer(socket.id);
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

    this.newPlayer = function(socketId){
        this.state.player[socketId] = {
            x: 10 * activeUsers,
            y: 10 * activeUsers,
            width: 15,
            height: 20
        }
    }

    this.removePlayer = function(socketId){
        delete this.state.player[socketId];
    }

    this.update = function(input, id){
        console.log("input", input)
        let directionString = Object.keys(input).join("");
        let directionCount = directionString.length;
        let player = this.state.player[id];
        while(directionCount--){
            switch(directionString.charAt(directionCount)){
                case "w":
                    player.y -= 10;
                    break;
                case "a":
                    player.x -= 10;
                    break;
                case "s":
                    player.y += 10;
                    break;
                case "d":
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