require("dotenv").config()
const mysql = require('mysql')


let db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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

