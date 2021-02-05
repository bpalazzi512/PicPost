const mysql = require('mysql')


let db = mysql.createConnection({
    host: 'sql5.freesqldatabase.com',
    user: 'sql5390952',
    password: 'wm3XCSHcM3',
    database: 'sql5390952',
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

