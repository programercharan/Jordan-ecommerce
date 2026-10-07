import mongoose from "mongoose";

export async function  connect(){
    try{
    await mongoose.connect(process.env.MONGO_URI)
    // console.log("database connected")
}catch(error){
    console.log(error)
}
}
