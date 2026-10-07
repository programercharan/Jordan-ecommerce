import mongoose from "mongoose";

const orderSchema = mongoose.Schema({

    orderId: {
        type: String,
        required: true,
        unique: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    shippingAddress: {

        firstName: {
            type: String,
            required: true
        },

        lastName: {
            type: String
        },

        phoneNumber: {
            type: String,
            required: true
        },

        address: {
            type: String,
            required: true
        },

        city: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true
        },

        pincode: {
            type: Number,
            required: true
        }

    },

    orderItems: [
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

                productName: {
                    type: String,
                    required: true
                },

                productImage: {
                    type: String,
                    required: true
                },

                size: {
                    type: Number,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                // Original product price
                regularPrice: {
                    type: Number,
                    required: true
                },

                // Price after product/category offer
                salePrice: {
                    type: Number,
                    required: true
                },

                // Percentage of product/category offer
                offerDiscountPercentage: {
                    type: Number,
                    default: 0
                },

                // Amount reduced by product/category offer
                offerDiscountAmount: {
                    type: Number,
                    default: 0
                },

                // Price before coupon
                itemSubtotal: {
                    type: Number,
                    required: true
                },

                // This item's portion of coupon discount
                couponDiscount: {
                    type: Number,
                    default: 0
                },

                // Final amount paid for this item
                paidAmount: {
                    type: Number,
                    required: true
                },

                    offerApplied: {
                    type: Boolean,
                    default: false
                },
                        

                    itemStatus: {
                        type: String,
                        enum: [
                            "Pending",
                            "Confirmed",
                            "Shipped",
                            "Out for Delivery",
                            "Delivered",
                            "Cancelled",
                            "Returned"
                        ],
                        default: "Confirmed"
                    },

                    cancelReason: {
                        type: String,
                        default: null
                    },

                    returnReason: {
                        type: String,
                        default: null
                    },

                    cancelledAt: {
                        type: Date,
                        default: null
                    },

                    deliveredAt: {
                        type: Date,
                        default: null
                    },

                    returnedAt: {
                        type: Date,
                        default: null
                    },
                    


                    returnRequest:{
                        requested:{
                            type:Boolean,
                            default:false
                        },
                        reason:String,
                        status:{
                            type:String,
                            enum:[
                            "Pending",
                            "Accepted",
                            "Rejected"
                            ],
                            default:"Pending"
                        }
                    },

                    paymentStatus: {
                    type: String,
                    enum: [
                        "Pending",
                        "Paid",
                        "Refund Pending",
                        "Refunded"
                    ],
                    default: "Pending"
                }

                }
    ],

    subtotal: {
    type: Number,
    required: true
},

couponDetails: {
    discountType: {
        type: String,
        enum: ["percentage", "fixed", null],
        default: null
    },

    discountValue: {
        type: Number,
        default: 0
    },
        minimumCartValue: {
        type: Number,
        default: 0
    }
},


razorpayOrderId: {
    type: String,
    default: null
},

razorpayPaymentId: {
    type: String,
    default: null
},

razorpaySignature: {
    type: String,
    default: null
},

    paymentMethod: {
        type: String,
        enum: ["Cash on Delivery","Razorpay","Wallet"],
        default: "Cash on Delivery"
    },

    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending"
    },

    orderStatus: {
        type: String,
        enum: [
            "Confirmed",
            "Shipped",
            "Out for Delivery",
            "Delivered",
            "Cancelled",
            "Returned"
        ],
        default: "Confirmed"
    },
    
    grandTotal: {
        type: Number,
        required: true
    }

}, {
    timestamps: true
});

export default mongoose.model("Order", orderSchema);


