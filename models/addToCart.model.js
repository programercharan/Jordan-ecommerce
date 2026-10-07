import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
{
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },

            variantId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ProductVariant",
                required: true
            },
            size: {
                type: Number,
                required: true
            },

            quantity: {
                type: Number,
                default: 1,
                min: 1
            },
        }
    ]
},
{
    timestamps: true
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;