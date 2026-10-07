import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
{
     categoryId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Category",
    required:true,
    index:true
},
        
    list: {
      type: Boolean,
      default: true   
    },
    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        trim: true
    },

    brand: {
        type: String,
        trim: true
    },

    gender: {
        type: String,
        enum: ["men", "women", "kids", "unisex"],
        required: true
    },

   stockStatus:{
    type:String,
    enum:["inStock","outOfStock"],
    default:"inStock"
}

//     images: [{
//         type: String
//     }]
},
{
    timestamps: true
});

const Product = mongoose.model("Product", productSchema);

export default Product;