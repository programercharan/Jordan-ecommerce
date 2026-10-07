import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
{
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    list: {
      type: Boolean,
      default: true   
    },

    color: {
        type: String,
        required: true
    },

    regularPrice: {
        type: Number
        
    },

    salePrice: {
        type: Number,
        required: true
    },

    sizeAndStock: [{
    size: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    }
}],

    images: [{
        type: String
    }]
},
{
    timestamps: true
});

export default mongoose.model("ProductVariant", variantSchema);