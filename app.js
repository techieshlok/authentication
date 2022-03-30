//jshint esversion:6
//THIS IS USED TO HIDE EVERY CONFIDENTIAL VALUE
require("dotenv").config();
const express =require("express");
const ejs =require("ejs");
const bodyparser=require("body-parser");
const mongoose =require("mongoose");
// LINE NO 9,10,13 REQUIRE FOR MANUAL AUTHENTICATION
const session =require("express-session");
const passport =require("passport");
//LINE NO 12,13 REQUIRE FOR USING GOOGLE AUTHENTICATION FROM PASSPORT.JS DOCUMENTation google auth2.0
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const passportLocalMongoose=require("passport-local-mongoose");
const app= express();
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs")
//require for the manual and authentication available at passport.js local documentation 
app.use(session({
    secret:"helloiamshloksharma",
    resave:false,
    saveUninitialized:false
}));

//use for initialzing the passport module to start
app.use(passport.initialize());
//to give access to the passport module with session for authentication
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/dataBS",{useNewUrlParser:true});
const userSchema = new mongoose.Schema({
    Username:String,
    Password:String,
    googleId:String,
    secret:String
});
//after creating schema attact with the plugin for authentication
userSchema.plugin(passportLocalMongoose);
//use for finding the googleid in database if not found then it will create itself but first to require it
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User",userSchema);
//strategy created for local authentication easily found on passport documentation for local
passport.use(User.createStrategy());
//this is very important for catching the serial id and starting it also
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  //this is also very important used for deleting the session id found on passport documentation(local)
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
//the startegy used for google 2.0 autentication found on passport documentation for google 2.0 auth
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
    res.render("home");
})

//after  clicking the the siging with google button the details of the person is caught here 
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);
//easily available on the documentation of passport auth google2.0
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
      if (err){
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });
  });
//after clicking the button checking if the person is authenticated or not
app.get("/submit", function(req, res){
    if (req.isAuthenticated()){
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  });
  
  app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
  
  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user.id);
  
    User.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
  });
  

app.get("/register",function(req,res){
    res.render("register");
})

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
})
//use for registration for the local authentication found on the local authentication
app.post("/register",function(req,res){
    User.register({username :req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets");
            });
        }
      })
});
//used for login for the local authentication found on the  paport documentation
app.post("/login",function(req,res){
   const user =new User({
       username:req.body.username,
       password:req.body.password
   });
   req.login(user,function(err){
       if(err){
           console.log(err);
       }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets");
          });
       }
   })
})

app.listen(3000,function(){
    console.log("server ready at 3000");
});