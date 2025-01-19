const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const {listingSchema} = require("../schema.js");
const ExpressError= require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");

const validateListing = (req,res,next)=>{
    let {error}=listingSchema.validate(req.body);
    
    if(error){
        let errMsg = error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
    }else{
        next();
    }
}

//Index Route
router.get("/",wrapAsync(async (req,res)=>{
    const allListings = await Listing.find({});
    //console.log(allListings);
    res.render("listings/index.ejs",{allListings});    
}));

//New Route
router.get("/new",(req,res)=>{
    res.render("listings/new.ejs");
});

//Create Route
router.post("/",validateListing, wrapAsync(async(req,res,next)=>{
    //let {title,description,image,price,location,country}=req.body;
    //or you can use the given below format
    //in the new.ejs we create a key value listing in all input type by writting it as 'listing[title]' for example and then this listing is called as req.body.listing
    // let listing = req.body.listing;
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

//Edit Route
router.get("/:id/edit",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
}));

//Update Route
router.put("/:id",validateListing, wrapAsync(async(req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});//req.body.listing is the javascript object which has several values. Thus, we deconstruct this by writiing (...req.body.listing) and extract the individual values from the object.
    res.redirect(`/listings/${id}`);
}));

//Show Route
router.get("/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("listings/show.ejs",{listing});
}));

//Delete Route
router.delete("/:id",wrapAsync(async(req,res)=>{
    let {id}= req.params,s;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

module.exports = router;