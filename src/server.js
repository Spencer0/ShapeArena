const express = require('express');
const ShapeScooter = require('./shape-scooter');
const app = express();
var http = require('http').createServer(app);
const port = process.env.PORT || 3000;
const io = require('socket.io')(http);
const basicAuth = require('express-basic-auth');
const { Pool, Client } = require('pg')

const pool = new Pool({
    user: 'postgres',
    host: 'database-1.cdyivaq2pji9.us-east-1.rds.amazonaws.com',
    database: 'sa',
    password: 'mypassword',
    port: 5432,
})

const authorizeUser = async function(username, password, cb){
    console.log(username, username == 'guest')
    if(username==='guest'){return cb(null,  true) }
    await pool.query("SELECT EXISTS (select * from users where password='"+password+"' and username='"+username+"')::int", (err, res) => {
        console.log(username + " exists with given password? ", res.rows[0]['exists'])
        return cb(null, res.rows[0]['exists'])
    });

}

const createUser = async function(username, password){
    
    await pool.query("insert into users(username, password) values ('"+username+"','"+password+"')", (err, res) => {
        if(err){
            console.log("creation error", err)
        }else{
            console.log(username + " Has been created")
        }
        return true
    });

}

const shapescooter = new ShapeScooter();
let activeUsers = shapescooter.state.activeUsers;

//Parsing tool
app.use(express.json())

//Serve static 
app.use(express.static('public'))


//Server via server
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

//User service w/ BasicAuth
app.post('/', basicAuth( { authorizer: authorizeUser, authorizeAsync: true } ), 
                 (req, res) => {
    res.send(JSON.stringify({authstatus: true}));
})

app.post('/users', (req, res) => {
    console.log('Got body:', req.body);
    let tryNewUser = req.body.username;
    let tryNewPass = req.body.password;
    if(createUser(tryNewUser, tryNewPass)){
        res.sendStatus(200);
    }
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
