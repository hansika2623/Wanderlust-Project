const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

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
    res.render("listings/show.ejs",{listing});
}

module.exports.createListing = async(req,res,next)=>{
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
        .send()
        
      
    let url = req.file.path;
    let filename = req.file.filename;
    
    const newListing = new Listing(req.body.listing);
    newListing.owner =  req.user._id;
    newListing.image = {url, filename};
 
    newListing.geometry = response.body.features[0].geometry;
    let savedListing = await newListing.save();
    console.log(savedListing);

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
    let coordinate = await geocodingClient.forwardGeocode({
        query: `${req.body.listing.location},${req.body.listing.country}`,
        limit: 2
    })
    .send();
    req.body.listing.geometry = coordinate.body.features[0].geometry;

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

module.exports.filterListings = async (req, res, next) => {
    const { q } = req.params;
    //console.log(req.params);
    const filteredListings = await Listing.find({category: { $regex: new RegExp(`^${q}$`, "i") }}).exec();
    console.log(filteredListings);
    if (!filteredListings.length) {
        req.flash("error", "No Listings exists for this filter!");
        return res.redirect("/listings");
    }
    res.locals.success = `Listings Filtered by ${q}`;
    res.render("listings/index.ejs", { allListings: filteredListings });
}

module.exports.destroyListing =async(req,res)=>{
    let {id}= req.params,s;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
}

module.exports.search = async(req,res)=>{
    console.log(req.query.q);
    let input = req.query.q.trim().replace(/\s+/g, " "); //remove start and end space
    console.log(input);
    if(input == "" || input == " "){
        //search value is empty
        req.flash("error", "Search value empty!!!");
        res.redirect("/listings");
    }
    //Convert the first letter capital of every search and other letters small
    let data = input.split("");
    let element = "";
    let flag= false;
    for(let index=0;index<data.length;index++){
        if(index==0 || flag){
            element = element + data[index].toUpperCase();
        }else{
            element = element + data[index].toLowerCase();
        }
        flag = data[index] == " ";
    }
    console.log(element);

    //to search the "element" in the listing by matching title and element
    let allListings = await Listing.find({
        title: { $regex: element, $options:"i"},    //this is a MongoDB query that uses a regular expression to perform a case-insensitive search in the title field. 
        //$options: "i": Makes the search case-insensitive.
    });

    if(allListings.length !=0 ){
        res.locals.success = "Listings searched by title";
        res.render("listings/index.ejs", {allListings});
        return;
    }

    //to search the "element" in the listing by entering the category
    if(allListings.length == 0){
        allListings = await Listing.find({
            category: { $regex: element, $options: "i"},
        }).sort({_id: -1});
        if(allListings.length != 0) {
            res.locals.success = "Listings searched by category";
            res.render("listings/index.ejs", {allListings});
            return;
        }
    }

    //to search the "element" in the listing by entering the country
    if(allListings.length == 0) {
        allListings = await Listing.find({
            country: { $regex: element, $options: "i"},
        }).sort({_id: -1});
        if(allListings.length != 0) {
            res.locals.success = "Listings searched by country";
            res.render("listings/index.ejs", {allListings});
            return;
        }
    }

    //to search the "element" in the listing by entering the location
    if(allListings.length == 0) {
        allListings = await Listing.find({
            location: { $regex: element, $options: "i"},
        }).sort({_id: -1});
        if(allListings.length != 0) {
            res.locals.success = "Listings searched by location";
            res.render("listings/index.ejs", {allListings});
            return;
        }
    }

    const intValue = parseInt(element, 10);//this parses the element from string representation of a number into an integer with base 10(decimal).
    const intDec = Number.isInteger(intValue); //This checks if intValue is a valid integer.

    if(allListings.length == 0 && intDec) {//This checks if aaListings is empty and if intValue is a valid integer.
        allListings = await Listing.find({ price: { $lte: element }}).sort({
            price: 1,
        });//filters listings where price is less than or equal to the given element and sorts the results in ascending order.
        if(allListings.length != 0) {
            res.locals.success = `Listings searched for less than Rs ${element}`;
            res.render("listings/index.ejs", { allListings });
            return;
        }
    }
    if(allListings.length == 0) {
        req.flash("error", "Listings is not here !!!");
        res.redirect("/listings");
    }
}