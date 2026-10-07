import mongoose from "mongoose";


const couponSchema = new mongoose.Schema(
    {
        couponCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        discountType: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true
        },

        discountValue: {
            type: Number,
            required: true,
            min: 1
        },

        minimumCartValue: {
            type: Number,
            required: true,
            min: 1000
        },

        usageLimit: {
            type: Number,
            default: 10,
            min: 1
        },

        usageCount: {
            type: Number,
            default: 0,
            min: 0
        },

        usedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        isActive: {
            type: Boolean,
            default: true
        },

        expiryDate: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;




