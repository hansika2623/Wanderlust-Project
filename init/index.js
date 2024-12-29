const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(()=>{
    console.log("Connected to the database")
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB = async()=>{ // To delete the data if something is present in the database
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);//Inserting the entire data of data.js using the object 'data' present in the data.js file; initData is the object in which we need to access the data key value
    console.log("Data was initialized");
};

initDB();