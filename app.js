//npm init -y ; npm i express ; npm i ejs ; npm i mongoose ; npm i method-override ; npm i ejs-mate ; npm i joi  ->These aare the packages installed for the project
//npm i express-session ; npm i connect-flash
//ejs-mate is used for styling the template in more advanced way
//joi is used to validate the schema(server side)
//npm i passport ; npm i passport-local ; npm i passport-local-mongoose (All these libraries are used for authentication. Since it is passport local so it is used only for local username and password. If you want to signup and login using your any other platform like goggle, linkedin etc. then visit passportjs.org website and use the libraries accordingly.)
//npm i multer(It is a node.js miidleware for handling multipart/form-data, which is primarily used for uploading files. )
//npm i dotenv files(credentials are taken by signing in on cloudinary throgh han*************3@gmail.com)
//npm i cloudinary multer-storage-cloudinary
//CLOUDINARY IS USED TO SAVE PHOTOS AT THE BACKEND
//MAPBOX IS USED HERE TO INCLUDE MAPS
//npm i @mapbox/mapbox-sdk
//MONGO ATLAS & MONGO STORE is used for deployment
//npm i connect-mongo; connect-mongo has by default 14days of time period, if user doesn't perfrm any activity within 14days then he is removed from the site.
//Deployment is done with the help of render

if(process.env.NODE_ENV != "production"){//it is only used in development phase and not in production phase
    require('dotenv').config();//This is due to the fact that .env file contains credentials which can't be shared and thus .env files are not uploaded on the github 
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError= require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl = process.env.ATLASDB_URL;

main().then(()=>{
    console.log("Connected to the database")
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
     mongoUrl : dbUrl,
     crypto: {
         secret: process.env.SECRET,
     },
     touchAfter: 24*3600,//touchAfter is used when we want if no updations are made and user is simply refreshing the page then no need to mske new store. The store will be refreshed after 24 hrs. It stores value in second therefore we multiplied it with 3600.
 });

 store.on("error", ()=>{
     console.log("ERROR IN MONGO SESSION STORE", err);
 })

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie: {
        expires : Date.now()+7*24*60*60*1000,//By default, cookie does not have expiry date and once browser is closed cokkie is deleted from the browser.
        //We can set the expiry date by using expires option. Here we have made the expiry date for the 7 days after the session is created.
        //Expires always counted in milli-seconds. Hence 7Days* 24 hrs* 60 minutes* 60seconds* 1000milliseconds
        maxAge : 7*24*60*60*1000,
        httpOnly : true, //to prevent cross-scripting attacks
    },
};

// app.get("/",(req,res)=>{
//     res.send("Hi, I am root!");
// });

app.use(session(sessionOptions));
app.use(flash());

// Middleware to pass Mapbox token to frontend
app.use((req, res, next) => {
    res.locals.mapToken = process.env.MAP_TOKEN; 
    next();
});


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

//THIS IS THE FAKE USER WE HAVE TRIED TO GENERATE
// app.get("/demouser",async(req,res)=>{
//     let fakeUser = new User({
//         email:"student@gmail.com",
//         username:"delta-student"
//     });

//     let registeredUser = await User.register(fakeUser,"helloworld");
//     res.send(registeredUser);
// })

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not found!"));
});

app.use((err,req,res,next)=>{
    let {statusCode=500, message="Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs",{err});
    // res.status(statusCode).send(message);
});

app.listen(8080,()=>{
    console.log("Server is listening to port 8080");
});