const express = require('express');
const ShapeScooter = require('./shape-game/shape-scooter');
const basicAuth = require('express-basic-auth');
const dbService = require('./services/db.js');
const port = process.env.PORT || 3000;
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const db = new dbService();
const shapescooter = new ShapeScooter();
let activeUsers = shapescooter.state.activeUsers;


//Express settings
app.use(express.json())
app.use(express.static('public'))

//Client gets served static page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

//Client waits for an auth code before connection to the socket
app.post('/', basicAuth( { authorizer: db.authorizeUser, authorizeAsync: true } ), 
                 (req, res) => {
    res.send(JSON.stringify({authstatus: true}));
})

//Route for creating a user
app.post('/users', (req, res) => {
    console.log('Attempting to create user:', req.body);
    let tryNewUser = req.body.username;
    let tryNewPass = req.body.password;
    if(db.createUser(tryNewUser, tryNewPass)){
        res.sendStatus(200);
    }else{
        res.sendStatus(500);
    }
})


//When client connects, a username will be unique for all clients 
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
