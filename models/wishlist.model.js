import mongoose from "mongoose";

const wishlistSchema= mongoose.Schema({
    userId:{
        type:String,
        required:true,
    },
    items:[
        {
            productId:{
                type:String,
                required:true
            },
            variantId:{
            type:String,
            required:true
            },
            size:{
                type:Number,
                required:true
            }

        }
    ]
},
{
    timestamps:true
})

export default mongoose.model("Wishlist",wishlistSchema) 


