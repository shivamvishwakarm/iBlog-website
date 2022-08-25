require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const https = require("https");
const bodyParser = require('body-parser');
const path = require('path');
const e = require('express');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy    = require('passport-facebook').Strategy
const app = express()
const session = require("express-session");
const passport = require("passport");
const passpostLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate')


// uses and set 
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

passport.serializeUser((user, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user, done) => {
    done(null, user);
  });


app.use(session({
    secret: "Out little secret.",
    resave: false,
    saveUninitialized: false
}));
var userProfile;
app.use(passport.initialize());
app.use(passport.session());


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://admin-shivam:Test123@cluster0.wwzsn.mongodb.net/Blogs');
}

const userSchema = new mongoose.Schema({
    googleId: String,
    facebookId: String,
    secret: String
});

const User = new mongoose.model('User', userSchema);
userSchema.plugin(passpostLocalMongoose);
userSchema.plugin(findOrCreate);



const blogSchema = new mongoose.Schema({
    title: String,
    author: String,
    post: String,
  });

  const Blog = new mongoose.model('Blog', blogSchema);


passport.serializeUser(function(user, cb) {
  cb(null, user);
});
 
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

  
  passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/google/iBlog-website",
    passReqToCallback:true
  },

  function(request, accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));

  // facebook authenciation


  passport.use(new FacebookStrategy({
    clientID: process.env.Facebook_CLIENT_ID, // getting CLIENT_ID_FB from .env file
    clientSecret: process.env.Facebook_CLIENT_SECRET, //getting CLIENT_SECRET_FB from .env file
    callbackURL: "http://localhost:8080/auth/facebook/iBlog-website" // callback url
},
function(accessToken, refreshToken, profile, done) {
    //check user table for anyone with a facebook ID of profile.id
    User.findOne({
        'facebook.id': profile.id 
    }, function(err, user) {
        if (err) {
            return done(err);
        }
        //No user was found... so create a new user with values from Facebook (all the profile. stuff)
        if (!user) {
            user = new User({
                provider: 'facebook',
                //now in the future searching on User.findOne({'facebook.id': profile.id } will match because of this next line
                facebook: profile._json
            });
            user.save(function(err) {
                if (err) console.log(err);
                return done(err, user);
            });
        } else {
            //found user. Return
            return done(err, user);
        }
    });
}
));

app.get("/", (req, res) => {
    Blog.find((err,results)=>{
        if(err){
            console.log(err);
        }
        else{
            res.render("index",{posts: results});
        }
    }) 
});






app.get("/signup", (req,res)=>{
    res.render("login");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] }));

app.get('/auth/google/iBlog-website', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

  // authenticate the user from facebook
app.get('/auth/facebook',
passport.authenticate('facebook'));

// authenticate the user from facebook with callback
app.get('/auth/facebook/iBlog-website',
passport.authenticate('facebook', { failureRedirect: '/login' }),
function(req, res) {
    // Successful authentication, redirect to Secrets page.
    res.redirect('/'); // redirect to secrets page
});


// here start routes

app.get("/blogs", (req, res) => {
    Blog.find((err,results)=>{
        if(err){
            console.log(err);
        }
        else{
            res.render("blogFeed",{posts: results});
        }
    })
});
app.get("/contact", (req, res) => {
    res.render("contact");
});
app.get("/create", (req, res) => {

    if (req.isAuthenticated()) {
        res.render("compose"); // render the secrets page
    } else {
        res.redirect("signup"); // redirect to login route
    };

});
app.post("/create", (req, res) => {
 postTitle = req.body.postTitle;
 postAuthor = req.body.authorName;
 postBody = req.body.postBody;

    var blog = new Blog({
        title: postTitle,
        author: postAuthor,
        post: postBody
    })
      
    blog.save(function(err,result){
        if (err){
            console.log(err);
        }
        else{
            // console.log(result);
        }
    })
    res.redirect("/")
});



app.get("/posts/:postId",(req,res)=>{
    const _id = req.params.postId.trim();

    Blog.findById(_id, (err,blogs)=>{
        if(err){
            console.log(err);
        }
        else{
            res.render("blog",{
                title: blogs.title,
                author: blogs.author,
                content: blogs.post,
                id: _id
            });
        }
    })
})



app.get("/delete/:id",(req,res)=>{
    const _id = req.params.id.trim();

    if(req.isAuthenticated()){
        Blog.findByIdAndDelete(_id,(err,result)=>{
            if(err){
                console.log(err)
            }
            else{
             
                res.redirect("/")
            }
    })
    }

    else{
        res.send("<h1>You don't have permission to delete the article</h1>")
    }


  
});

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });




app.listen(process.env.PORT || 8080, () => {
    console.log("Sever is listening at port 8080");
})