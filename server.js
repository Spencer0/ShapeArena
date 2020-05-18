const express = require('express');
const app = express();
var http = require('http').createServer(app);
const port = process.env.PORT || 3000
const io = require('socket.io')(http);


let activeUsers = 0;

//Serve static 
app.use(express.static('public'))

//Server via server
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

io.on('connection', (socket) => {
    console.log('a user connected');
    console.log('ACTIVE USERS:', ++activeUsers);
    io.emit('connection-event', activeUsers);

    socket.on('disconnect', () => {
        console.log('user disconnected');
        console.log('ACTIVE USERS:', --activeUsers);
        io.emit('connection-event', activeUsers);
    });

    socket.on('message-event', (msg) => {
      console.log("Message broadcasting"  )
      io.emit('message-event', msg);
    });

    socket.on('user-input', (data) => {
        console.log("shape-game-input" ,data )
        updatePlayer(data);
        io.emit('user-input', data);
      });

    socket.on('latency', function (fn) {
        fn();
    }); 

    function updatePlayer(data){
        function updatePos(direction, player){
            switch(direction){
                case "w":
                    data.player.pos.y -= 10
                    break;
                case "a":
                    data.player.pos.x -= 10
                    break;
                case "s":
                    data.player.pos.y += 10
                    break;
                case "d":
                    data.player.pos.x += 10
                    break;
                default:
                    console.log("Bad direction");
                    break;
            }
        }
            
        
        if(data.player.direction){
            console.log("applying direction one", data.player.direction, data.player.pos)
            updatePos(data.player.direction, data.player)
        }
        if(data.player.directionTwo){
            console.log("applying direction two", data.player.directionTwo, data.player.pos)
            updatePos(data.player.directionTwo, data.player)
        }
        console.log("applying direction done", data.player.direction, data.player.directionTwo, data.player.pos)
    }
});


http.listen(port, () => {
    console.log('Garden Server, Port: ', port);
});
