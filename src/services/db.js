
/*
Data Access Layer
*/

/*
PLAYER MODEL:
x
y
userId
color 
level
*/
function DBService(){

    const { Pool } = require('pg')

    const pool = new Pool({
        user: 'postgres',
        host: 'database-1.cdyivaq2pji9.us-east-1.rds.amazonaws.com',
        database: 'sa',
        password: 'mypassword',
        port: 5432,
    })

    this.authorizeUser = async function(username, password, cb){
        console.log(username, username == 'guest')
        if(username==='guest'){return cb(null,  true) }
        await pool.query("SELECT EXISTS (select * from users where password='"+password+"' and username='"+username+"')::int", (err, res) => {
            console.log(username + " exists with given password? ", res.rows[0]['exists'])
            return cb(null, res.rows[0]['exists'])
        });

    }

    this.saveMessage = function(user,message){
        pool.query("insert into chat(message, username) values ('"+message+"','"+user+"')", (err, res) => {
            if(err){
                console.log("message error", err)
                return false
            }else{
                return true
            }
            
        });
    }

    this.createUser = async function(username, password){
        
        await pool.query("insert into users(username, password) values ('"+username+"','"+password+"')", (err, res) => {
            if(err){
                console.log("creation error", err)
                return false
            }else{
                console.log(username + " Has been created")
                return true
            }
            
        });
    }

    this.saveUser = async function(player){
        
        await pool.query("insert into characters(x, y, username, color, level) values \
                        ('"+player.x+"','"+player.y+"','"+player.user+"','"+player.color+"','"+player.level+"') \
                        ON CONFLICT (username) DO UPDATE SET (username, color, level, x, y) = \
                        (EXCLUDED.username, EXCLUDED.color, EXCLUDED.level, EXCLUDED.x, EXCLUDED.y)", (err, res) => {
            if(err){
                console.log("creation error", err)
                return false
            }else{
                console.log(player.user + " has been saved at level " + player.level)
                return true
            }
            
        });
    }

    this.loadUser =  async function(username, socketId, cb){
        console.log(username, socketId, cb)
        return await pool.query("select * from characters where username='"+username+"'", (err, res) => {
            if(err){
                console.log("creation error", err)
                return cb(username, socketId, null)
            }else{
                console.log("found em ", username)
                return cb(username, socketId, res.rows[0])
            }
        });
    }

}

module.exports = DBService;
