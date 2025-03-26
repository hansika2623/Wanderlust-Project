const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});

router
    .route("/")
    .get(wrapAsync(listingController.index))//Index Route
    .post(isLoggedIn,upload.single('listing[image]'),validateListing, wrapAsync(listingController.createListing))//Create Route

//New Route
router.get("/new",isLoggedIn,listingController.renderNewForm);

//Filter route
router.get("/filter/:q", wrapAsync(listingController.filterListings));

//Search Route
router.get("/search", wrapAsync(listingController.search));

router
    .route("/:id")
    .put(isLoggedIn,isOwner,upload.single('listing[image]'),validateListing,wrapAsync(listingController.updateListing))//Update Route
    .get(wrapAsync(listingController.showListing))//Show Route
    .delete(isLoggedIn,isOwner,wrapAsync(listingController.destroyListing))//Delete Route

//Edit Route
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(listingController.renderEditForm));

module.exports = router;


