
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

    this.createUser = async function(username, password){
        
        await pool.query("insert into users(username, password) values ('"+username+"','"+password+"')", (err, res) => {
            if(err){
                console.log("creation error", err)
            }else{
                console.log(username + " Has been created")
            }
            return true
        });
    }


}

module.exports = DBService;
