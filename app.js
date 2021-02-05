const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const db = require('./db')
const hbs = require('hbs');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const { read } = require('fs');

//set storage for multer
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb)=>{
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    }
})

//init upload variable
const upload = multer({
    storage: storage
}).single("media")

const app = express();

app.set('view engine', 'hbs')
app.use(bodyParser.urlencoded({ extended: false }))
hbs.registerPartials(__dirname + '/partials/')
app.use(bodyParser.json())
app.use(cookieParser()) 
hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});


app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'public', 'uploads')));

app.get("/", (req, res) => {
    res.redirect("/home")
}) 

app.get("/logout", (req, res) => {
    res.clearCookie("accessToken")
    res.redirect("/home")
})

app.get("/home", getUser,(req, res) => {
     
    db.query("SELECT * FROM posts ORDER BY postId DESC", (err, rows)=>{
        if(req.user){
            res.render("home", {posts: rows, user: req.user}) 

        }else{
            res.render("home", {posts: rows})
        }
        
    })
    
    
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/compose", authTokenSecret,(req, res) => {
    console.log(getFormattedTime())   
    res.render("compose", {user: req.user})  
})



//when post needs to be added
app.post("/upload", getUser, (req, res) => {
    upload(req, res, (err) => {
        if(err){
            res.send('error occurred')
        }else{
            if(!req.file){
                db.query("INSERT INTO posts VALUES(0, ?, ?, NULL, ?, ?, ?, NULL, ?)", [req.user.userId, req.body.description, getDateTime(), getFormattedDate(), getFormattedTime(), req.user.name], (err, rows)=>{
                    if(err){
                        console.log(err)
                    }else{
                        res.render("uploaded", {user: req.user})
                    }
                    
                })
                
                
            }else{
                const originalNameExt = path.extname(req.file.originalname)
                let mediaType

                //checks if file is an image
                if(originalNameExt == ".jpg" || originalNameExt == ".png" || originalNameExt ==".gif" || originalNameExt == ".pdf" || originalNameExt == ".heic" || originalNameExt == ".svg" || originalNameExt == ".jpeg"){
                    mediaType = "img"
                    console.log("Is an image!")
                }else{
                    mediaType = null

                }
                console.log(path.extname(req.file.originalname))
                
                //inserts post into db
                db.query("INSERT INTO posts VALUES(0, ?, ?, ?, ?, ?, ?, ?, ?)", [req.user.userId, req.body.description, req.file.filename, getDateTime(),getFormattedDate(), getFormattedTime(), mediaType, req.user.name],(err, rows)=>{
                    if(err){
                        res.send("error") 
                        console.log(err)
                    }else{
                        res.render("uploaded", {user: req.user})
                    }
                })
                
                console.log(req.body.description)
                console.log(req.file)

            }
            
            
        }
    })
    //console.log("got it")
    
}) 


app.post("/login", (req, res) => {
    username = req.body.username
    password = req.body.password
    db.query("SELECT * FROM users WHERE username=?",[username], (err, rows) => {
        console.log(rows)
        if(err){
            res.render("login", {error: "Error in Database"})
        }else if(rows.length ==0){
            res.render("login", {error: "No User with that Username"})
        }else if(rows[0].password != password){
            res.render("login", {error: "Incorrect Password"})

        }else{
            user = {
                userId: rows[0].userId,
                name: rows[0].name,
                username: rows[0].username,
                password: rows[0].password
            }
            const accessToken = jwt.sign(user, "asldkfjslad;kgjsadfk32klsfd")
            res.cookie("accessToken", accessToken)
            console.log(user)
            res.redirect("/compose")

        }
    })
    
}) 

app.listen(3000, ()=>{
    console.log('server running')
})

function authTokenSecret(req, res, next) {
    const token = req.cookies.accessToken
    if(token == null){
        return res.redirect("/login")
    }
    jwt.verify(token,'asldkfjslad;kgjsadfk32klsfd', (err, user) => {
        if(err){
            return res.redirect("/login")
        }else{
            req.user = user
            next()
        }
    })
}

function getUser(req, res, next) {
    const token = req.cookies.accessToken
    if(token == null){
        return next()
    }
    jwt.verify(token,'asldkfjslad;kgjsadfk32klsfd', (err, user) => {
        if(err){
            return next()
        }else{
            req.user = user
            next()
        }
    })

}

function getDateTime(){
    let date = new Date()
    let month = date.getMonth() + 1
    let day = date.getDate()
    let year = date.getFullYear()
    let hour = date.getHours()
    let minute = date.getMinutes()
    let seconds = date.getSeconds()
    
    let fullDate = year + "-" +month + "-" +day
    let fullTime = hour+":"+minute+":"+seconds
    let dateTime = fullDate + " " + fullTime
    return dateTime
}


function getFormattedDate(){
    let date = new Date()
    let month = date.getMonth() + 1
    let day = date.getDate()
    return month + "/" + day
}

function getFormattedTime(){
    let date = new Date()
    let hour = date.getHours()
    let time = "AM"
    let minute = date.getMinutes().toString()
    let second = date.getSeconds()
    if(hour == 0){
        hour = 12
        time = "AM"
    }else if(hour == 12){
        time = "PM"
    }else if(hour >12){
        time = "PM"
        hour = hour - 12
    }
    
    if(minute.length == 1){
        minute = "0"+minute
    }
    return hour + ":"+minute + " "+time
}