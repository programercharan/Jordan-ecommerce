import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    razorpayOrderId: {
        type: String,
        required: true,
        unique: true
    },

    amount: {
        type: Number,
        required: true
    },

    currency: {
        type: String,
        default: "INR"
    },

    paymentMethod: {
        type: String,
        enum: ["Razorpay"],
        default: "Razorpay"
    },

    status: {
        type: String,
        enum: [
            "Created",
            "Paid",
            "Failed"
        ],
        default: "Created"
    },

    razorpayPaymentId: {
        type: String,
        default: null
    },

    razorpaySignature: {
        type: String,
        default: null
    }

}, {
    timestamps: true
});

export default mongoose.model("Payment", paymentSchema);