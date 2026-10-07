import mongoose from "mongoose";



const userSchema=mongoose.Schema({
    googleId:{
        type:String,
        trim:true
    },
    role: {
    type: String,
     enum: ["user", "admin"],
    default: "user"
},

    fullname:{
        type:String,
        trim:true
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
const User=mongoose.model("User",userSchema)

export default User

