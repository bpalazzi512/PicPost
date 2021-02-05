const mysql = require('mysql')


let db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'golf',
    multipleStatements: true
})

db.connect((err)=>{
    if(!err){
        console.log("Connected to mysql Database")
    }else{
        console.log("Connection to mysql Database Failed")
    }
})

module.exports = db

