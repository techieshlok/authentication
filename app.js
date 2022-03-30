//jshint esversion:6
require("dotenv").config();
const express =require("express");
const ejs =require("ejs");
const bodyparser=require("body-parser");
const mongoose =require("mongoose");
const encrypt =require("mongoose-encryption")
const app= express();
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs")
mongoose.connect("mongodb://localhost:27017/dataBS",{useNewUrlParser:true});
const userSchema = new mongoose.Schema({
    Username:String,
    Password:String
});


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["Password"]});

const User =mongoose.model("User",userSchema);


app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.post("/register",function(req,res){
    const User1=new User({
        Username:req.body.username,
        Password:req.body.password
    })
    User1.save(function(err){
        if(!err){
            res.render("secrets")
        }else{
            console.log(err);
        }
    })
})

app.post("/login",function(req,res){
    const userName= req.body.username;
    const pass =req.body.password;

    User.findOne({Username:userName},function(err,foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                if(foundUser.Password===pass){
                    res.render("secrets")
                }
            }
        }
    })
})

app.listen(3000,function(){
    console.log("server ready at 3000");
});