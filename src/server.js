const express = require('express');
const ShapeScooter = require('./shape-scooter');
const app = express();
var http = require('http').createServer(app);
const port = process.env.PORT || 3000;
const io = require('socket.io')(http);
const basicAuth = require('express-basic-auth');
const shapescooter = new ShapeScooter();
let activeUsers = shapescooter.state.activeUsers;

//Serve static 
app.use(express.static('public'))


//Server via server
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

//User service w/ BasicAuth
app.post('/', basicAuth({
                 users: { 'admin': 'supersecret',
                          's': '1',
                          'garrett': 'buris',
                          'guest': '' }}), 
                 (req, res) => {

    res.sendFile(__dirname + '/index.html');
    res.send(JSON.stringify({authstatus: true}));
})


io.on('connection', (socket) => {
    let newUserName = socket.handshake.query['user'];
    console.log('a user connected');
    console.log('ACTIVE USERS:', ++activeUsers);
    shapescooter.newPlayer(socket.id, newUserName);
    if(!io) { return }
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

setInterval(() => {
    shapescooter.updateProjectilePositions();
    shapescooter.updateEnemyPositions();
    io.sockets.emit('state', shapescooter.state);
}, 1000 / 60);

http.listen(port, () => {
    console.log('Garden Server, Port: ', port);
});
