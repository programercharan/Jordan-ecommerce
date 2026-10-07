import mongoose from "mongoose";
const otpSchema= mongoose.Schema({
    email:{
        type:String,
        trim:true,
        required:true
    },
    otp:{
        type:String,
        trim:true,
        required:true
    }, 
    expiresAt:{
        type:Date,
        required:true
    }
})
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const otpCollection=mongoose.model("otpCollection",otpSchema)
export default otpCollection