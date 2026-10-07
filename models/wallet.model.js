import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    balance: {
        type: Number,
        default: 0,
        min: 0
    },

    transactions: [
        {
            type: {
                type: String,
                enum: ["credit", "debit", "refund"],
                required: true
            },

            amount: {
                type: Number,
                required: true
            },

            description: {
                type: String
            },

            orderId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order"
            },

            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]

}, {
    timestamps: true
});


export default mongoose.model("Wallet", walletSchema);