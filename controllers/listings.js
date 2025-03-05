const Listing = require("../models/listing");

module.exports.index = async (req,res)=>{
    const allListings = await Listing.find({});
    //console.log(allListings);
    res.render("listings/index.ejs",{allListings});    
}

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
}

module.exports.showListing = async(req,res)=>{
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
}

module.exports.createListing = async(req,res,next)=>{
    //let {title,description,image,price,location,country}=req.body;
    //or you can use the given below format
    //in the new.ejs we create a key value listing in all input type by writting it as 'listing[title]' for example and then this listing is called as req.body.listing
    // let listing = req.body.listing;
    let url = req.file.path;
    let filename = req.file.filename;
    
    const newListing = new Listing(req.body.listing);
    newListing.owner =  req.user._id;
    newListing.image = {url, filename};
    await newListing.save();
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
}

module.exports.renderEditForm =async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for doesn't exist!");
        res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
}

module.exports.updateListing = async(req,res)=>{
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});//req.body.listing is the javascript object which has several values. Thus, we deconstruct this by writiing (...req.body.listing) and extract the individual values from the object.
    
    if(typeof req.file != "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();
    }
    
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing =async(req,res)=>{
    let {id}= req.params,s;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
}