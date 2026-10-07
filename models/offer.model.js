import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
    {
        offerName: {
            type: String,
            required: true,
            trim: true
        },

        offerType: {
            type: String,
            enum: ["product", "category"],
            required: true
        },

        productId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null
        }

    ],

        categoryId:[ 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null
        }
    ],

        discountPercentage: {
            type: Number,
            required: true,
            min: 1,
            max: 100
        },

        endDate: {
            type: Date,
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Offer", offerSchema);
