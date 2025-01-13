//npm init -y ; npm i express ; npm i ejs ; npm i mongoose ; npm i method-override ; npm i ejs-mate   ->These aare the packages installed for the project
//ejs-mate is used for styling the template in more advanced way
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError= require("./utils/ExpressError.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(()=>{
    console.log("Connected to the database")
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.get("/",(req,res)=>{
    res.send("Hi, I am root!");
});

//Index Route
app.get("/listings",async (req,res)=>{
    const allListings = await Listing.find({});
    //console.log(allListings);
    res.render("listings/index.ejs",{allListings});    
});

//New Route
app.get("/listings/new",async(req,res)=>{
    res.render("listings/new.ejs");
});

//Create Route
app.post("/listings", wrapAsync(async(req,res,next)=>{
    //let {title,description,image,price,location,country}=req.body;
    //or you can use the given below format
    //in the new.ejs we create a key value listing in all input type by writting it as 'listing[title]' for example and then this listing is called as req.body.listing
    // let listing = req.body.listing;
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

//Edit Route
app.get("/listings/:id/edit",async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
});

//Update Route
app.put("/listings/:id", async(req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});//req.body.listing is the javascript object which has several values. Thus, we deconstruct this by writiing (...req.body.listing) and extract the individual values from the object.
    res.redirect(`/listings/${id}`);
});

//Show Route
app.get("/listings/:id",async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
});

//Delete Route
app.delete("/listings/:id",async(req,res)=>{
    let {id}= req.params,s;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
})

// app.get("/testListing",async (req,res)=>{
//     let sampleListing = new Listing({
//         title:"My new villa",
//         description:"By the beach",
//         price:1200,
//         location:"Calangute, Goa",
//         country:"India",
//     });

//     await sampleListing.save();
//     console.log("Sample was saved");
//     res.send("Successful testing");
// });

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not found!"));
});

app.use((err,req,res,next)=>{
    let {statusCode, message} = err;
    res.status(statusCode).send(message);
});

app.listen(8080,()=>{
    console.log("Server is listening to port 8080");
});