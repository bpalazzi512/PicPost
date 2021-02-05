const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const db = require('./db')
const hbs = require('hbs');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const fs = require('fs');

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

// app.get("/delete", (req, res)=>{
//     try {
//         fs.unlinkSync("./public/uploads/test.txt")
//     } catch (error) {
//         console.log(error)
        
//     }
//     res.send("hello")
// })

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
     
    db.query("SELECT * FROM posts ORDER BY postId DESC LIMIT 5", (err, rows)=>{
        if(req.user){
            console.log(req.owner)
            if(req.owner){
                console.log('rendering owner')
                res.render("home", {posts: rows, user: req.user, owner: req.owner}) 
            }else{
                console.log("rendering not owner")
                res.render("home", {posts: rows, user: req.user}) 
            }
            

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


app.post("/deletepost", (req, res) => {
    let postId = req.body.postId
    console.log(req.body.postId)
    //res.json({message: "hello"})
    db.query("SELECT * FROM posts WHERE postId=?", [postId], (err, rows) => {
        let imgName = rows[0].imgName
        console.log("Got the Image name")
        db.query("DELETE FROM posts WHERE postId=?", [postId], (err, results)=>{
            console.log("deleted post")
            if(imgName != null){ 
                try {
                    fs.unlinkSync("./public/uploads/"+imgName)
                    res.json({message: "done", postId: postId})
                    
                } catch (error) {
                    console.log("error")
                    
                }
                
            }else{
                res.json({message: "done", postId: postId})
            }
        })
    })
})

app.post("/getposts", getUser,(req, res) => {
    console.log(req.body.limit)
    let limit = req.body.limit
    db.query("SELECT * FROM posts ORDER BY postId DESC LIMIT ?", [limit], (err, rows) => {
        if(req.owner){
            res.json({posts: rows, owner: req.owner})

        }else{
            res.json({posts: rows})
        }
        
    })
    
})

//when post needs to be added
app.post("/upload", getUser, (req, res) => {
    upload(req, res, (err) => {
        if(err){
            res.send('error occurred')
        }else{
            //if user did not upload a file
            if(!req.file){
                //if user did not write a description
                if(req.body.description == ""){
                    console.log("User Needs to Write Something")
                    res.redirect("/compose")
                }else{
                    db.query("INSERT INTO posts VALUES(0, ?, ?, NULL, ?, ?, ?, NULL, ?)", [req.user.userId, req.body.description, getDateTime(), getFormattedDate(), getFormattedTime(), req.user.name], (err, rows)=>{
                        if(err){
                            console.log(err)
                        }else{
                            res.render("uploaded", {user: req.user})
                        }
                        
                    })

                }
                
                
                
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

const port = process.env.PORT || 3000

app.listen(port, ()=>{
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
            console.log(user.userId)
            if(user.userId == 1){ 
                req.owner = "Owner Account"
            }
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