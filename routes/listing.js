const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listing = require("../models/listing.js");

//Index Route
router.get("/",wrapAsync(async (req,res)=>{
    const allListings = await Listing.find({});
    //console.log(allListings);
    res.render("listings/index.ejs",{allListings});    
}));

//New Route
router.get("/new",isLoggedIn,(req,res)=>{
    res.render("listings/new.ejs");
});

//Create Route
router.post("/",isLoggedIn,validateListing, wrapAsync(async(req,res,next)=>{
    //let {title,description,image,price,location,country}=req.body;
    //or you can use the given below format
    //in the new.ejs we create a key value listing in all input type by writting it as 'listing[title]' for example and then this listing is called as req.body.listing
    // let listing = req.body.listing;
    const newListing = new Listing(req.body.listing);
    newListing.owner =  req.user._id;
    await newListing.save();
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
}));

//Edit Route
router.get("/:id/edit",
            isLoggedIn,
            isOwner,
            wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for doesn't exist!");
        res.redirect("/listings");
    }
    res.render("listings/edit.ejs",{listing});
}));

//Update Route
router.put("/:id",
            isLoggedIn,
            isOwner,
            validateListing,
            wrapAsync(async(req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});//req.body.listing is the javascript object which has several values. Thus, we deconstruct this by writiing (...req.body.listing) and extract the individual values from the object.
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
}));

//Show Route
router.get("/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path:"reviews",
        populate:{
            path:"author",
        },
    })
    .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for doesn't exist!");
        res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs",{listing});
}));

//Delete Route
router.delete("/:id",
            isLoggedIn,
            isOwner,
            wrapAsync(async(req,res)=>{
    let {id}= req.params,s;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
}));

module.exports = router;