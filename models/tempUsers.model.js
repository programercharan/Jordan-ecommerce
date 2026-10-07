import mongoose from "mongoose";

const tempUserSchema=mongoose.Schema({
    googleId:{
        type:String,
        trim:true,
        required:false
    },
    fullname:{
        type:String,
        trim:true,
        required:false
    },
    firstName:{
        type:String,
        required:false,
        trim:true
    },
    lastName:{
        type:String,
        trim:true
    },
    email:{
        type:String,
        trim:true,
        lowercase:true,

        unique:true
    },
    password:{
        type:String,
        trim:true
    },
    phoneNumber:{
        type:String,
        trim:true
    },
    referralCode:{
        type:String,
        trim:true,
        required:false,
        unique:true,
        sparse:true
        // default:null
    },
    referredBy:{
        type:String,
        trim:true,
        required:false

    },
    isBlocked:{
        type:Boolean,
        default:false
    }
},
    {
        timestamps:true    
    }
    
)
tempUserSchema.index({createdAt:1},{expireAfterSeconds:300})
const tempUser=mongoose.model("tempUser",tempUserSchema)

export default tempUser