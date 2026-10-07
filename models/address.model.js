import mongoose  from "mongoose";

const addressSchema=mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
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
     phoneNumber:{
        type:String,
        trim:true
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    city:{
      type: String,
      required: true,
    },
    address:{
        type:String,
        required:true
    }
},{
    timestamps:true
}
)

const Address=mongoose.model("Address",addressSchema)
export default Address

