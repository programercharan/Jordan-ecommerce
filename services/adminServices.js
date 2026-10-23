import bcrypt from "bcrypt"
import User from "../models/user.model.js"
import Category from "../models/category.model.js"
import Product from "../models/product.model.js"
import ProductVariant from "../models/variant.model.js"
import Order from "../models/orders.model.js"
import Coupon from "../models/coupen.model.js"
import Offer from "../models/offer.model.js"
import Wallet from "../models/wallet.model.js"
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import compressAndUploadImage from "./imageUploadService.js"

export const loginServices = async (email, password) => {
    console.log("admin login verifying")
    try {
        const user = await User.findOne({ email })
        if (user && user.role === "admin") {
            const isMatch = await bcrypt.compare(password, user.password)
            if (isMatch) {
                console.log("password matched")
                return { success: true, user }
            } else {
                return { success: false, error: "invalid password" }
            }
        } else {
            return { success: false, error: "invalid user" }
        }
    } catch (error) {
        console.log(error)
    }

}

export const userDetails = async (page, search) => {
    const limit = 2
    const skip = (page - 1) * limit

    const searchQuery = {
        role: "user",
        $or: [
            {
                firstName:
                {
                    $regex: search,
                    $options: "i"
                }
            },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ],
    }

    const users = await User.find(searchQuery).sort({ createdAt: -1 }).skip(skip).limit(limit)
    const totalUsers = await User.countDocuments(searchQuery)
    const totalPages = Math.ceil(totalUsers / limit)
    //   console.log(users)

    const cancelDetails = []
    for (let user of users) {
        const orders = await Order.find({ userId: user._id, orderStatus: "Cancelled" })
        console.log(orders)
        cancelDetails.push({ userId: user._id, count: orders.length })
    }

    console.log(cancelDetails)
    return {
        success: true,
        users,
        totalPages,
        currentPage: page,
        cancelDetails
    }
}

export const blockUserServices=async (userId)=>{
    const userUpdated = await User.findByIdAndUpdate(userId, { isBlocked: true });
    if(!userUpdated){
        return{success:false,error:"cannot able to block user"}
    }

    return {success:true}
}

export const unblockUserServices=async(userId)=>{

    const userUpdated = await User.findByIdAndUpdate(userId, { isBlocked: false });
    if(!userUpdated){
        return{success:false,error:"cannot able to unblock user"}
    }

    return {success:true}
}













export const createProductVariant = async (body, files) => {

    const {
        productId,
        list,
        color,
        regularPrice,
        salePrice,
        size,
        stock
    } = body;

    // CHECK COLOR ALREADY EXISTS

    const existingVariant =
        await ProductVariant.findOne({

            productId,
            color: {
                $regex: new RegExp(
                    "^" + color + "$",
                    "i"
                )
            }

        });

    if (existingVariant) {

        return {

            success: false,

            message:
                "This color variant already exists. Edit stock instead."

        };

    }

    // CREATE SIZE & STOCK ARRAY

    const sizeAndStock = [];

    for (
        let i = 0;
        i < size.length;
        i++
    ) {

        sizeAndStock.push({

            size: Number(size[i]),

            stock: Number(stock[i])

        });

    }

    // CLOUDINARY URLS

    const imageUrls = files.map(file => file.path);

    // CREATE VARIANT

    await ProductVariant.create({

        productId,
        list:
            list === "true",
        color,
        regularPrice,
        salePrice,
        sizeAndStock,
        images: imageUrls

    });

    return { success: true };
};







export const saveProductVariantService = async (body, files) => {

    const { productId, list, color, regularPrice, salePrice, size, stock } = body;
    const product=await Product.findById(productId)
    console.log("🟡 RAW FILES FROM MULTER:", files)
    const existingVariant = await ProductVariant.findOne({
        productId,
        color: { $regex: new RegExp("^" + color + "$", "i") }
    });

    if (existingVariant) {

        return {
            success: false,
            message:"This color variant already exists. Edit stock instead.",
            product
        };

    }

    const sizeAndStock = [];

    const sizes = Array.isArray(size) ? size : [size];
    const stocks = Array.isArray(stock) ? stock : [stock];

    for (let i = 0; i < sizes.length; i++) {
        if (Number(sizes[i]) < 0 || Number(stocks[i]) < 0) {
            return { success: false, message: "Size Or Stock Should Not Be In Negative" ,product}
        }
        sizeAndStock.push({
            size: Number(sizes[i]),
            stock: Number(stocks[i])
        });

    }


    const uploadedImages = await Promise.all(
    files.map(file => compressAndUploadImage(file))
    );

    const imageUrls = uploadedImages.map(image => image.url);

    console.log(
    "IMAGE COMPRESSION RESULTS:",
    uploadedImages.map(image => ({
        originalSize: image.originalSize,
        compressedSize: image.compressedSize,
        width: image.width,
        height: image.height
    }))
    );

    console.log("🖼 FINAL IMAGE URLS:", imageUrls)
    console.log("checking weather the list is ")
    const saved = await ProductVariant.create({ productId, list, color, regularPrice, salePrice, sizeAndStock, images: imageUrls });
    console.log("💾 SAVED TO MONGODB:", saved)
    return {
        success: true
    };

};

export const updateProductVariantService = async (variantId, body, files) => {

    const variant = await ProductVariant.findById(variantId);
    console.log("variant->", variant)

    if (!variant) {
        return {
            success: false,
            message: "Variant not found"
        };
    }
    const duplicate = await ProductVariant.findOne({
        productId: variant.productId,
        _id: { $ne: variantId },
        color: { $regex: new RegExp("^" + body.color + "$", "i") }
    });

    if (duplicate) {
        return {
            success: false,
            message: "Color already exists"
        };
    }


    const sizeAndStock = [];
    const sizes = Array.isArray(body.size) ? body.size : body.size ? [body.size] : [];
    console.log("sizes->", sizes)
    const stocks = Array.isArray(body.stock) ? body.stock : body.stock ? [body.stock] : [];

    for (let i = 0; i < sizes.length; i++) {
        if (Number(sizes[i]) < 0 || Number(stocks[i]) < 0) {
            return { success: false, message: "Sizes or Stocks should not be in Negative" }
        }
        sizeAndStock.push({
            size: Number(sizes[i]),
            stock: Number(stocks[i])
        });
    }
    // let existingImages = body.existingImages;

    // if (!existingImages) {
    //     existingImages = [];
    // }

    // if (!Array.isArray(existingImages)) {
    //     existingImages = [existingImages];
    // }

    // let newImages = [];

    // if (files && files.length > 0) {
    //     newImages = files.map(file => file.path);
    // }

    // const imageUrls = [...existingImages, ...newImages];


let existingImages = body.existingImages;

if (!existingImages) {
    existingImages = [];
}

if (!Array.isArray(existingImages)) {
    existingImages = [existingImages];
}

// Compress and upload only newly added images.
let newImages = [];

if (files && files.length > 0) {
    const uploadedImages = await Promise.all(
        files.map(file => compressAndUploadImage(file))
    );

    newImages = uploadedImages.map(image => image.url);
}

// Retain existing images and append newly uploaded images.
const imageUrls = [...existingImages, ...newImages];

if (imageUrls.length === 0) {
    return {
        success: false,
        message: "At least one image is required"
    };
}

if (imageUrls.length > 4) {
    return {
        success: false,
        message: "A maximum of 4 images is allowed"
    };
}

    // if (imageUrls.length === 0) {
    //     return {
    //         success: false,
    //         message: "At least one image is required"
    //     };
    // }

    await ProductVariant.findByIdAndUpdate(variantId, {
        list: body.list === "active",
        color: body.color,
        regularPrice: body.regularPrice,
        salePrice: body.salePrice,
        sizeAndStock,
        images: imageUrls
    });

    return {
        success: true,
        productId: variant.productId
    };
};

export const activateProductVariantService = async (variantId) => {
    const variant = await ProductVariant.findByIdAndUpdate(variantId, { list: true }, { new: true });
    return variant.productId;
};

export const deactivateProductVariantService = async (variantId) => {

    const variant = await ProductVariant.findByIdAndUpdate(variantId, { list: false }, { new: true });
    return variant.productId;

};






export const adminOrdersService = async ({ search, sort, status, page = 1 }) => {
    const limit = 12;
    let query = {};

    // SEARCH ORDER ID

    if (search) {
        query.$or = [
            { orderId: { $regex: search, $options: "i" } },
            { orderStatus: { $regex: search, $options: "i" } }
        ]
    }
    if (status) {
        query.orderStatus = status
    }
    // SORT

    let sortOption = {};
    if (sort === "oldest") {
        sortOption.createdAt = 1;
    } else {
        sortOption.createdAt = -1;
    }

    console.log(sortOption)
    // PAGINATION
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);
    const skip = (page - 1) * limit;
    const orders = await Order.find(query).sort(sortOption).skip(skip).limit(limit).lean();

    //    let countOfUserOrder=[]

    //         for(let order of orders){

    //             let exist=0
    //         for(let user of countOfUserOrder){
    //             console.log("user.id->",user.id.toString(),"order.userId->",order.userId.toString())
    //             if(user.id.toString()===order.userId.toString()){
    //                 exist=1
    //                 user.count+=1
    //             }
    //             }

    //             if(exist===0){
    //                 countOfUserOrder.push(
    //                     {
    //                         id:order.userId,
    //                         name:order.shippingAddress.firstName,
    //                         count:Number(1)
    //                     }
    //                 )
    //             }

    //         }
    // console.log(countOfUserOrder)
    //         let finalOrders=[]

    //         for(let user of countOfUserOrder){
    //             if(user.count>20){
    //                 const order=await Order.find({userId:user.id})
    //                 if(order){
    //                     finalOrders.push(order)
    //                 }
    //             }
    //         }

    // let falttendFinalOrder=finalOrders.flat(Infinity)

    return {
        orders: orders,
        currentPage: page,
        totalPages
    };

}

export const adminOrderDetailsService = async (orderId) => {
    const order = await Order.findById(orderId).populate("userId");
    if (!order) {
        return {
            success: false,
            message: "Order not found"
        }
    }
    return {
        success: true,
        order
    }
}

export const creditWalletService = async ({
    userId,
    amount,
    orderId,
    description
}) => {

    if (amount <= 0) {
        return {
            success: false,
            message: "Invalid refund amount"
        };
    }

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
        return {
            success: false,
            message: "Wallet not found"
        };
    }

    wallet.balance += amount;

    wallet.transactions.push({
        type: "refund",
        amount: amount,
        description: description,
        orderId: orderId,
        createdAt: new Date()
    });

    await wallet.save();

    return {
        success: true
    };
};






export const updateOrderStatusService = async (
    orderId,
    status
) => {

    const order = await Order.findById(orderId);

    if (!order) {
        return {
            success: false,
            message: "Order not found"
        };
    }


    const statusFlow = [
        "Confirmed",
        "Shipped",
        "Out for Delivery",
        "Delivered"
    ];


    const currentIndex = statusFlow.indexOf(order.orderStatus);

    const newIndex = statusFlow.indexOf(status);


    // Invalid status
    if (newIndex === -1) {

        return {
            success: false,
            message: "Invalid order status"
        };

    }


    // Cannot move backward
    if (newIndex < currentIndex) {

        return {
            success: false,
            message:
                "Order status cannot move backward"
        };

    }


    // Already at this status
    if (newIndex === currentIndex) {

        return {
            success: false,
            message:
                "Order is already in this status"
        };

    }


    // Cannot change a completely cancelled/returned order
    if (order.orderStatus === "Cancelled" || order.orderStatus === "Returned") {
        return {
            success: false,
            message:
                "Cancelled or returned order cannot be updated"
        };
    }


    order.orderStatus = status;


    // Update only active items
    for (const item of order.orderItems) {

        if (
            item.itemStatus !== "Cancelled" &&
            item.itemStatus !== "Returned"
        ) {

            item.itemStatus = status;

        }

    }


    await order.save();


    return {
        success: true
    };
};




export const updatePaymentStatusService = async (
    orderId,
    paymentStatus
) => {

    const order = await Order.findById(orderId);

    if (!order) {
        return {
            success: false,
            message: "Order not found"
        };
    }


    // Pending → Paid
    if (order.paymentStatus === "Pending" &&
        paymentStatus === "Paid") {

        order.paymentStatus = "Paid";

        order.orderItems.forEach((item) => {

            if (
                item.itemStatus !== "Cancelled" &&
                item.itemStatus !== "Returned"
            ) {
                item.paymentStatus = "Paid";
            }

        });

    }


    // Pending → Failed
    else if (
        order.paymentStatus === "Pending" &&
        paymentStatus === "Failed"
    ) {

        order.paymentStatus = "Failed";

        order.orderItems.forEach((item) => {

            if (item.itemStatus === "Pending") {
                item.paymentStatus = "Failed";
            }

        });

    }


    // Failed → Paid
    else if (
        order.paymentStatus === "Failed" &&
        paymentStatus === "Paid"
    ) {

        order.paymentStatus = "Paid";

        order.orderItems.forEach((item) => {

            if (
                item.itemStatus !== "Cancelled" &&
                item.itemStatus !== "Returned"
            ) {
                item.paymentStatus = "Paid";
            }

        });

    }


    else {

        return {
            success: false,
            message:
                `Cannot change payment status from ${order.paymentStatus} to ${paymentStatus}`
        };

    }


    await order.save();


    return {
        success: true,
        message: "Payment status updated successfully"
    };
};

export const adminReturnAcceptService = async (
    orderId,
    itemId
) => {

    const order =
        await Order.findById(orderId);

    if (!order) {

        return {
            success: false,
            message: "Order not found"
        };

    }


    const item =
        order.orderItems.id(itemId);

    if (!item) {

        return {
            success: false,
            message: "Item not found"
        };

    }


    if (item.itemStatus !== "Delivered") {

        return {
            success: false,
            message:
                "Only delivered products can be returned"
        };

    }


    if (
        !item.returnRequest.requested ||
        item.returnRequest.status !== "Pending"
    ) {

        return {
            success: false,
            message:
                "No pending return request"
        };

    }



    // REFUND USER


    const refundAmount =
        item.paidAmount;


    const walletResult =
        await creditWalletService({

            userId: order.userId,

            amount: refundAmount,

            orderId: order._id,

            description:
                `Refund for returned product - ${item.productName}`

        });


    if (!walletResult.success) {

        return walletResult;

    }



    // UPDATE ITEM


    item.returnRequest.status =
        "Accepted";

    item.itemStatus =
        "Returned";

    item.returnedAt =
        new Date();

    item.paymentStatus =
        "Refunded";



    // UPDATE ORDER TOTAL


    order.grandTotal =
        Math.max(
            0,
            Number((order.grandTotal - refundAmount).toFixed(2))
        );



    // STOCK


    const damagedReasons = [
        "Damaged or defective product"
    ];


    const shouldRestoreStock = !damagedReasons.includes(item.returnRequest.reason);


    if (shouldRestoreStock) {

        const variant =
            await ProductVariant.findById(
                item.variantId
            );


        if (variant) {

            const stock =
                variant.sizeAndStock.find(
                    size =>
                        size.size === item.size
                );


            if (stock) {

                stock.stock += item.quantity;

                await variant.save();

            }

        }

    }


    // =========================================
    // ALL ITEMS RETURNED?
    // =========================================

    const allReturned =
        order.orderItems.every(
            item =>
                item.itemStatus === "Returned" ||
                item.itemStatus === "Cancelled"
        );


    if (allReturned) {

        order.orderStatus =
            "Returned";
        order.paymentStatus = "Refunded"
    }



    await order.save();


    return {
        success: true,
        refundAmount
    };
};





export const adminReturnRejectService = async (
    orderId,
    itemId
) => {

    const order =
        await Order.findById(orderId);

    if (!order) {

        return {
            success: false,
            message: "Order not found"
        };

    }


    const item =
        order.orderItems.id(itemId);

    if (!item) {

        return {
            success: false,
            message: "Item not found"
        };

    }


    if (
        !item.returnRequest.requested ||
        item.returnRequest.status !== "Pending"
    ) {

        return {
            success: false,
            message:
                "No pending return request"
        };

    }


    item.returnRequest.status =
        "Rejected";

    item.returnRequest.requested =
        true;


    await order.save();


    return {
        success: true
    };
};


export const adminCancelAcceptService = async (
    orderId,
    itemId
) => {

    const order =
        await Order.findById(orderId);

    if (!order) {

        return {
            success: false,
            message: "Order not found"
        };

    }


    const item =
        order.orderItems.id(itemId);

    if (!item) {

        return {
            success: false,
            message: "Item not found"
        };

    }


    if (
        !item.cancelRequest.requested ||
        item.cancelRequest.status !== "Pending"
    ) {

        return {
            success: false,
            message:
                "No pending cancellation request"
        };

    }


    // REFUND


    const refundAmount =
        item.paidAmount;



    // CREDIT WALLET


    const walletResult =
        await creditWalletService({

            userId: order.userId,

            amount: refundAmount,

            orderId: order._id,

            description:
                `Refund for cancelled product - ${item.productName}`

        });


    if (!walletResult.success) {

        return walletResult;

    }


    // =========================================
    // UPDATE ITEM


    item.cancelRequest.status =
        "Accepted";

    item.itemStatus =
        "Cancelled";

    item.cancelledAt =
        new Date();

    item.paymentStatus =
        "Refunded";


    // =========================================
    // UPDATE ORDER TOTAL
    // =========================================

    order.grandTotal =
        Math.max(
            0,
            order.grandTotal - refundAmount
        );


    // =========================================
    // RESTORE STOCK
    // =========================================

    const variant =
        await ProductVariant.findById(
            item.variantId
        );


    if (variant) {

        const stock =
            variant.sizeAndStock.find(
                size =>
                    size.size === item.size
            );


        if (stock) {

            stock.stock += item.quantity;

            await variant.save();

        }

    }


    // CHECK ALL ITEMS

    const allCancelled =
        order.orderItems.every(
            item =>
                item.itemStatus === "Cancelled" ||
                item.itemStatus === "Returned"
        );


    if (allCancelled) {

        order.orderStatus =
            "Cancelled";

    }


    await order.save();


    return {
        success: true,
        refundAmount
    };
};





export const adminCancelRejectService = async (
    orderId,
    itemId
) => {

    const order =
        await Order.findById(orderId);

    if (!order) {

        return {
            success: false,
            message: "Order not found"
        };

    }


    const item =
        order.orderItems.id(itemId);

    if (!item) {

        return {
            success: false,
            message: "Item not found"
        };

    }


    if (
        !item.cancelRequest.requested ||
        item.cancelRequest.status !== "Pending"
    ) {

        return {
            success: false,
            message:
                "No pending cancellation request"
        };

    }


    item.cancelRequest.status =
        "Rejected";

    item.cancelRequest.requested =
        false;


    await order.save();


    return {
        success: true
    };
};






export const downloadInvoiceService = async (orderId) => {

    return await Order.findById(orderId).lean();

};

export const adminCouponServices = async ({
    couponCode,
    discountType,
    discountValue,
    minimumCartValue,
    usageLimit,
    isActive,
    expiryDate
}) => {

    try {

        const formattedCouponCode = couponCode.trim().toUpperCase();


        const existing = await Coupon.findOne({
            couponCode: formattedCouponCode
        });

        if (existing) {

            return {
                success: false,
                message: "Coupon code already exists"
            };
        }

        if (!discountType) {
            return {
                success: false,
                message: "discount Type Is Required"
            };
        }

        if (!discountValue) {
            return {
                success: false,
                message: "discount Value Is Required"
            };
        }


        if (discountType === "percentage" && discountValue > 50) {
            return {
                success: false,
                message: "Percentage discount cannot exceed 50%"
            };
        }


        if (!minimumCartValue || minimumCartValue < 1000) {
            return {
                success: false,
                message: "Minimum cart value should be at least 1000"
            };
        }

        if (discountType === "fixed" && discountValue > minimumCartValue) {
            return {
                success: false,
                message: "Discount cannot exceed minimum cart value"
            };
        }

        if (!usageLimit || usageLimit <= 0) {
            return {
                success: false,
                message: "Enter a valid usage limit(should be atleast 1 )"
            };
        }

        const expiry = new Date(expiryDate);
        const now = new Date();

        if (isNaN(expiry.getTime())) {
            return {
                success: false,
                message: "Invalid expiry date"
            };
        }

        if (expiry <= now) {
            return {
                success: false,
                message: "Expiry date must be in the future"
            };
        }


        // Create coupon
        const newCoupon = await Coupon.create({

            couponCode: formattedCouponCode,

            discountType,

            discountValue: Number(discountValue),

            minimumCartValue: Number(minimumCartValue),

            usageLimit: Number(usageLimit),

            isActive,

            expiryDate
        });


        return {
            success: true,
            coupon: newCoupon
        };

    } catch (error) {

        console.log("Error in adminCouponServices:", error);

        return {
            success: false,
            message: "Unable to create coupon"
        };
    }
};


export const getAllCouponsService = async (page = 1, search, status, discountType) => {

    try {

        const limit = 10;

        const skip = (page - 1) * limit;

        let searchQuery = {}
        if (search & status & discountType) {
            searchQuery.couponCode = search,
                searchQuery.discountType = discountType,
                searchQuery.isActive = status
        }
        else if (search & status) {
            searchQuery.couponCode = search,
                searchQuery.isActive = status
        } else if (status & discountType) {
            searchQuery.discountType = discountType,
                searchQuery.isActive = status
        } else if (status) {
            searchQuery.isActive = status
        } else if (discountType) {
            searchQuery.discountType = discountType
        } else if (search) {
            searchQuery.couponCode = search
        }
        // Get total number of coupons
        const totalCoupons = await Coupon.countDocuments();


        // Calculate total pages
        const totalPages = Math.ceil(totalCoupons / limit);


        // Get coupons for current page
        const coupons = await Coupon.find(searchQuery)
            .populate({
                path: "usedBy",
                select: "name email"
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        for (let coupon of coupons) {
            console.log("coupon used by users->", coupon.usedBy)
        }
        return {

            success: true,

            coupons,

            currentPage: page,

            totalPages

        };

    } catch (error) {

        console.log("Error in getAllCouponsService:", error);

        return {

            success: false,

            message: "Unable to fetch coupons"

        };
    }
};






export const adminOfferServices = async ({
    offerName,
    offerType,
    productIds,
    categoryIds,
    discountPercentage,
    endDate,
    isActive
}) => {

    try {
            const products =await Product.find({list: true}).select("_id name");

            const categories =await Category.find({ list: true}).select("_id categoryName");


        // OFFER NAME

        if (
            !offerName ||
            !offerName.trim()
        ) {

            return {
                success: false,
                message: "Offer name is required",
                products,
                categories
            };

        }


        // OFFER TYPE

        if (
            offerType !== "product" &&
            offerType !== "category"
        ) {

            return {
                success: false,
                message: "Invalid offer type",
                products,
                categories
            };

        }


        // DISCOUNT

        const discount =
            Number(discountPercentage);


        if (
            !Number.isFinite(discount) ||
            discount < 1 ||
            discount > 100
        ) {

            return {
                success: false,
                message:
                    "Discount percentage must be between 1% and 100%",
                products,
                categories
            };

        }


        // END DATE

        if (!endDate) {

            return {
                success: false,
                message:
                    "End date is required",
                products,
                categories
            };

        }


        const selectedDate =
            new Date(endDate);


        if (
            isNaN(
                selectedDate.getTime()
            )
        ) {

            return {
                success: false,
                message:
                    "Invalid end date",
                products,
                categories
            };

        }


        // FUTURE DATE

        const today =
            new Date();

        today.setHours(
            0,
            0,
            0,
            0
        );

        selectedDate.setHours(
            0,
            0,
            0,
            0
        );


        if (
            selectedDate <= today
        ) {

            return {
                success: false,
                message:
                    "End date must be a future date",
                products,
                categories
            };

        }


        // STATUS

        if (
            isActive !== "true" &&
            isActive !== "false"
        ) {

            return {
                success: false,
                message:
                    "Please select offer status",
                products,
                categories
            };

        }


        // PRODUCT OFFER
        let eachProduct = []
        if (offerType === "product") {

            if (!productIds) {

                return {
                    success: false,
                    message:
                        "Product is required",
                products,
                categories
                };

            }

            for (let eachProductIds of productIds) {
                const product = await Product.findOne({
                    _id: eachProductIds,
                    list: true
                });

                if (product) {
                    eachProduct.push(product)
                }
            }



        }


        // CATEGORY OFFER

        let eachCategory = []

        if (offerType === "category") {

            if (!categoryIds) {

                return {
                    success: false,
                    message:
                        "Category is required",
                products,
                categories
                };

            }

            for (let eachCategoryIds of categoryIds) {

                const category = await Category.findOne({
                    _id: eachCategoryIds,
                    list: true
                });

                if (category) {
                    eachCategory.push(category)
                }
            }


        }


        // CREATE OFFER

        const newOffer =
            await Offer.create({

                offerName:
                    offerName.trim(),

                offerType,

                productId:
                    offerType === "product" ? eachProduct : null,

                categoryId:
                    offerType === "category" ? eachCategory : null,

                discountPercentage:
                    discount,

                endDate:
                    selectedDate,

                // Converting  string to Boolean
                isActive: isActive === "true"

            });
        console.log(newOffer)

        return {
            success: true,
            offer: newOffer
        };


    } catch (error) {

        console.log(
            "Error in createOfferService:",
            error
        );

            const products =await Product.find({list: true}).select("_id name");

            const categories =await Category.find({ list: true}).select("_id categoryName");
        return {
            success: false,
            message:
                "Unable to create offer",
                products,
                categories
        };

    }

};





export const getAllOffersService = async (page) => {

    try {

        const limit = 5
        const skip = (page - 1) * limit
        const currentPage = page
        const totalPages = await Offer.countDocuments() / limit

        const offers = await Offer.find().skip(skip).limit(limit)
            .populate("productId", "name")
            .populate("categoryId", "categoryName")
            .sort({
                createdAt: -1
            });


        return {
            success: true,
            offers,
            totalPages,
            currentPage

        };


    } catch (error) {

        console.log(
            "Error in getAllOffersService:",
            error
        );


        return {
            success: false,
            message: "Unable to fetch offers"
        };

    }

};





// =====================================================
// GET EDIT OFFER
// =====================================================

export const getEditOfferService = async (offerId) => {

    try {

        const offer = await Offer.findById(offerId);

        if (!offer) {

            return {
                success: false,
                message: "Offer not found"
            };

        }

        const categories = await Category
            .find({ list: true })
            .sort({ categoryName: 1 });


        const products = await Product
            .find({ list: true })
            .sort({ name: 1 });


        const categoryIds =
            offer.categoryId || [];


        const productIds =
            offer.productId || [];


        return {
            success: true,
            offer,
            products,
            categories,
            categoryIds,
            productIds
        };


    } catch (error) {

        console.log(
            "Error in getEditOfferService:",
            error
        );

        return {
            success: false,
            message: "Unable to load offer"
        };

    }

};



// =====================================================
// UPDATE OFFER
// =====================================================

export const updateOfferService = async ({
    offerId,
    offerName,
    offerType,
    productIds,
    categoryIds,
    discountPercentage,
    endDate,
    isActive
}) => {

    try {

        // =============================================
        // FIND OFFER
        // =============================================

        const offer =
            await Offer.findById(offerId);


        if (!offer) {

            return {
                success: false,
                message: "Offer not found"
            };

        }


        // =============================================
        // OFFER NAME
        // =============================================

        if (
            !offerName ||
            !offerName.trim()
        ) {

            return {
                success: false,
                message: "Offer name is required"
            };

        }


        // =============================================
        // OFFER TYPE
        // =============================================

        if (
            offerType !== "product" &&
            offerType !== "category"
        ) {

            return {
                success: false,
                message: "Invalid offer type"
            };

        }


        // =============================================
        // DISCOUNT
        // =============================================

        const discount =
            Number(discountPercentage);


        if (
            !Number.isFinite(discount) ||
            discount < 1 ||
            discount > 100
        ) {

            return {
                success: false,
                message:
                    "Discount percentage must be between 1% and 100%"
            };

        }


        // =============================================
        // END DATE
        // =============================================

        if (!endDate) {

            return {
                success: false,
                message: "End date is required"
            };

        }


        const selectedDate = new Date(endDate);


        if (
            isNaN(selectedDate.getTime())
        ) {

            return {
                success: false,
                message: "Invalid end date"
            };

        }


        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );


        selectedDate.setHours(
            0,
            0,
            0,
            0
        );


        if (
            selectedDate <= today
        ) {

            return {
                success: false,
                message:
                    "End date must be a future date"
            };

        }


        // =============================================
        // STATUS VALIDATION
        // =============================================

        if (
            isActive !== "true" &&
            isActive !== "false"
        ) {

            return {
                success: false,
                message:
                    "Please select a valid offer status"
            };

        }


        // =============================================
        // NORMALIZE PRODUCT IDS
        // =============================================

        const normalizedProductIds =
            Array.isArray(productIds)
                ? productIds
                : productIds
                    ? [productIds]
                    : [];


        // =============================================
        // NORMALIZE CATEGORY IDS
        // =============================================

        const normalizedCategoryIds =
            Array.isArray(categoryIds)
                ? categoryIds
                : categoryIds
                    ? [categoryIds]
                    : [];


        // =============================================
        // PRODUCT OFFER
        // =============================================

        if (
            offerType === "product"
        ) {

            if (
                normalizedProductIds.length === 0
            ) {

                return {
                    success: false,
                    message:
                        "Please select at least one product"
                };

            }


            // Find all selected products

            const products =
                await Product.find({
                    _id: {
                        $in: normalizedProductIds
                    },
                    list: true
                });


            // Check whether every selected ID
            // belongs to an active product

            if (
                products.length !==
                normalizedProductIds.length
            ) {

                return {
                    success: false,
                    message:
                        "One or more selected products were not found"
                };

            }

        }


        // =============================================
        // CATEGORY OFFER
        // =============================================

        if (
            offerType === "category"
        ) {

            if (
                normalizedCategoryIds.length === 0
            ) {

                return {
                    success: false,
                    message:
                        "Please select at least one category"
                };

            }


            // Find all selected categories

            const categories =
                await Category.find({
                    _id: {
                        $in: normalizedCategoryIds
                    },
                    list: true
                });


            // Check whether every selected ID
            // belongs to an active category

            if (
                categories.length !==
                normalizedCategoryIds.length
            ) {

                return {
                    success: false,
                    message:
                        "One or more selected categories were not found"
                };

            }

        }


        // =============================================
        // UPDATE BASIC OFFER DETAILS
        // =============================================

        offer.offerName =
            offerName.trim();


        offer.offerType =
            offerType;


        offer.discountPercentage =
            discount;


        offer.endDate =
            selectedDate;


        // =============================================
        // CONVERT STRING TO BOOLEAN
        // =============================================

        offer.isActive =
            isActive === "true";


        // =============================================
        // UPDATE PRODUCT / CATEGORY
        // =============================================

        if (
            offerType === "product"
        ) {

            offer.productId =
                normalizedProductIds;

            // Clear category IDs because
            // this is now a product offer

            offer.categoryId = [];

        }


        if (
            offerType === "category"
        ) {

            offer.categoryId =
                normalizedCategoryIds;

            // Clear product IDs because
            // this is now a category offer

            offer.productId = [];

        }


        // =============================================
        // SAVE
        // =============================================

        await offer.save();


        console.log(
            "before the success return",
            offer
        );


        return {

            success: true,

            offer

        };


    } catch (error) {

        console.log(
            "catch block in updateOfferService executed"
        );

        console.log(
            "Error in updateOfferService:",
            error
        );


        return {

            success: false,

            message:
                "Unable to update offer"

        };

    }

};



// DELETE OFFER

export const deleteOfferService = async (offerId) => {

    try {

        const offer =
            await Offer.findById(offerId);
        console.log("the offer to be deleted is ", offer)

        if (!offer) {

            return {
                success: false,
                message: "Offer not found"
            };

        }


        await Offer.findByIdAndUpdate(offerId, {
            isActive: false
        });


        return {
            success: true
        };


    } catch (error) {

        console.log(
            "Error in deleteOfferService:",
            error
        );


        return {
            success: false,
            message: "Unable to delete offer"
        };

    }

};




export const getSalesReportService = async (
    filter,
    startDate,
    endDate
) => {

    console.log(
        filter,
        startDate,
        endDate
    );


    const now = new Date();

    let start;
    let end;



    // TODAY

    if (filter === "today") {

        start = new Date();

        start.setHours(0, 0, 0, 0);


        end = new Date();

        end.setHours(23, 59, 59, 999);

    }


    // =========================================
    // YESTERDAY
    // =========================================

    else if (filter === "yesterday") {

        start = new Date();

        start.setDate(
            start.getDate() - 1
        );

        start.setHours(0, 0, 0, 0);


        end = new Date();

        end.setDate(
            end.getDate() - 1
        );

        end.setHours(23, 59, 59, 999);

    }


    // =========================================
    // THIS WEEK
    // =========================================

    else if (filter === "thisWeek") {

        start = new Date();

        const day = start.getDay();

        const difference =
            day === 0 ? 6 : day - 1;

        start.setDate(
            start.getDate() - difference
        );

        start.setHours(0, 0, 0, 0);


        end = new Date(start);

        end.setDate(
            end.getDate() + 6
        );

        end.setHours(23, 59, 59, 999);

    }


    // =========================================
    // THIS MONTH
    // =========================================

    else if (filter === "thisMonth") {

        start = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        start.setHours(0, 0, 0, 0);


        end = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        );

        end.setHours(23, 59, 59, 999);

    }


    // =========================================
    // THIS YEAR
    // =========================================

    else if (filter === "thisYear") {

        start = new Date(
            now.getFullYear(),
            0,
            1
        );

        start.setHours(0, 0, 0, 0);


        end = new Date(
            now.getFullYear(),
            11,
            31
        );

        end.setHours(23, 59, 59, 999);

    }


    // =========================================
    // CUSTOM
    // =========================================

    else if (
        filter === "custom" &&
        startDate &&
        endDate
    ) {

        start = new Date(startDate);

        start.setHours(0, 0, 0, 0);


        end = new Date(endDate);

        end.setHours(23, 59, 59, 999);

    }


    // =========================================
    // DEFAULT
    // =========================================

    else {

        start = new Date();

        start.setHours(0, 0, 0, 0);


        end = new Date();

        end.setHours(23, 59, 59, 999);

    }


    // FETCH PAID ORDERS

    const orders = await Order.find({

        $or: [
            { paymentMethod: "Razorpay", paymentStatus: "Paid" },
            { paymentMethod: "Wallet", paymentStatus: "Paid" },
            { paymentMethod: "Cash on Delivery", paymentStatus: "Paid" }
        ],

        createdAt: {
            $gte: start,
            $lt: end
        }

    }).sort({

        createdAt: -1

    });

    console.log(orders)


    // REPORT VARIABLES

    let totalOrders = 0;

    let totalItems = 0;

    let grossSales = 0;

    let offerDiscount = 0;

    let couponDiscount = 0;


    let netSales = 0;

    let finalOrders = []
    // =========================================
    // CALCULATE REPORT
    // =========================================

    orders.forEach((order) => {

        totalOrders++;


        order.orderItems.forEach((item) => {

            if (item.paymentStatus === "Paid") {

                totalItems += item.quantity;


                // ORIGINAL PRICE × QUANTITY

                grossSales += (item.regularPrice || 0) * item.quantity;


                // PRODUCT / CATEGORY OFFER DISCOUNT

                offerDiscount += (item.offerDiscountAmount || 0) * item.quantity;

                // COUPON DISCOUNT

                couponDiscount += item.couponDiscount || 0;


                // FINAL AMOUNT PAID

                netSales += item.paidAmount || 0;

                finalOrders.push({
                    ...item.toObject(),
                    orderId: order.orderId,
                    createdAt: order.createdAt,
                    paymentMethod: order.paymentMethod
                })
            }

        });

    });


    // TOTAL DISCOUNT

    const totalDiscount = offerDiscount + couponDiscount;

    // RETURN REPORT

    return {

        orders: finalOrders,

        totalOrders,

        totalItems,

        grossSales,

        offerDiscount,

        couponDiscount,

        totalDiscount,

        netSales,

        startDate: start,

        endDate: end,

        filter

    };

};






export const generateSalesReportPDF = (report, res) => {

    const doc = new PDFDocument({
        size: "A4",
        margin: 40
    });


    // -----------------------------------------
    // PDF RESPONSE HEADERS
    // -----------------------------------------

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        "attachment; filename=sales-report.pdf"
    );

    doc.pipe(res);


    // -----------------------------------------
    // PAGE SETTINGS
    // -----------------------------------------

    const pageWidth = doc.page.width;

    const left = 40;

    const right = pageWidth - 40;

    const contentWidth = right - left;


    // -----------------------------------------
    // TITLE
    // -----------------------------------------

    doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(
            "SALES REPORT",
            left,
            45,
            {
                width: contentWidth,
                align: "center"
            }
        );


    doc
        .fontSize(11)
        .font("Helvetica")
        .text(
            "Shoe Store",
            left,
            72,
            {
                width: contentWidth,
                align: "center"
            }
        );


    // -----------------------------------------
    // REPORT PERIOD
    // -----------------------------------------

    const startDate = new Date(report.startDate);

    const endDate = new Date(report.endDate);


    const formatDate = (date) => {

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    };


    const periodText =
        `${formatDate(startDate)} - ${formatDate(endDate)}`;


    doc
        .fontSize(10)
        .text(
            `Report Period: ${periodText}`,
            left,
            105
        );


    // -----------------------------------------
    // FILTER
    // -----------------------------------------

    doc
        .text(
            `Filter: ${report.filter || "Selected Period"}`,
            left,
            122
        );


    // -----------------------------------------
    // HORIZONTAL LINE
    // -----------------------------------------

    doc
        .moveTo(left, 145)
        .lineTo(right, 145)
        .stroke();


    // =========================================
    // SALES SUMMARY
    // =========================================

    doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(
            "SALES SUMMARY",
            left,
            165
        );


    const summaryTop = 190;

    const summaryHeight = 125;


    const summaryRows = [

        [
            "Total Orders",
            report.totalOrders
        ],

        [
            "Items Sold",
            report.totalItems
        ],

        [
            "Gross Sales",
            `₹${Number(
                report.grossSales || 0
            ).toFixed(2)}`
        ],

        [
            "Product/Category Discount",
            `₹${Number(
                report.offerDiscount || 0
            ).toFixed(2)}`
        ],

        [
            "Coupon Discount",
            `₹${Number(
                report.couponDiscount || 0
            ).toFixed(2)}`
        ],

        [
            "Total Discount",
            `₹${Number(
                report.totalDiscount || 0
            ).toFixed(2)}`
        ],

        [
            "Net Sales",
            `₹${Number(
                report.netSales || 0
            ).toFixed(2)}`
        ]

    ];


    const summaryRowHeight =
        summaryHeight / summaryRows.length;


    doc
        .rect(
            left,
            summaryTop,
            contentWidth,
            summaryHeight
        )
        .stroke();


    summaryRows.forEach((row, index) => {

        const y =
            summaryTop +
            index * summaryRowHeight;


        if (index !== 0) {

            doc
                .moveTo(left, y)
                .lineTo(right, y)
                .stroke();

        }


        // Label

        doc
            .fontSize(9)
            .font("Helvetica")
            .text(
                row[0],
                left + 10,
                y + 5,
                {
                    width: 230
                }
            );


        // Value

        doc
            .fontSize(9)
            .font(
                row[0] === "Net Sales"
                    ? "Helvetica-Bold"
                    : "Helvetica"
            )
            .text(
                row[1].toString(),
                left + 250,
                y + 5,
                {
                    width: 200,
                    align: "right"
                }
            );

    });


    // =========================================
    // SALES DETAILS
    // =========================================

    let currentY =
        summaryTop +
        summaryHeight +
        35;


    doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(
            "SALES DETAILS",
            left,
            currentY
        );


    currentY += 25;


    // -----------------------------------------
    // TABLE WIDTHS
    // -----------------------------------------

    const colOrderId = 65;

    const colDate = 65;

    const colProduct = 125;

    const colQty = 35;

    const colPayment = 70;

    const colAmount = 75;


    const rowHeight = 28;


    const xOrderId = left;

    const xDate =
        xOrderId + colOrderId;

    const xProduct =
        xDate + colDate;

    const xQty =
        xProduct + colProduct;

    const xPayment =
        xQty + colQty;

    const xAmount =
        xPayment + colPayment;


    // -----------------------------------------
    // TABLE HEADER FUNCTION
    // -----------------------------------------

    const drawSalesHeader = () => {

        doc
            .rect(
                left,
                currentY,
                contentWidth,
                rowHeight
            )
            .stroke();


        doc
            .fontSize(8)
            .font("Helvetica-Bold");


        doc.text(
            "Order ID",
            xOrderId + 4,
            currentY + 9,
            {
                width: colOrderId - 8
            }
        );


        doc.text(
            "Date",
            xDate + 4,
            currentY + 9,
            {
                width: colDate - 8
            }
        );


        doc.text(
            "Product",
            xProduct + 4,
            currentY + 9,
            {
                width: colProduct - 8
            }
        );


        doc.text(
            "Qty",
            xQty + 4,
            currentY + 9,
            {
                width: colQty - 8,
                align: "center"
            }
        );


        doc.text(
            "Payment",
            xPayment + 4,
            currentY + 9,
            {
                width: colPayment - 8
            }
        );


        doc.text(
            "Paid Amount",
            xAmount + 4,
            currentY + 9,
            {
                width: colAmount - 8,
                align: "right"
            }
        );


        currentY += rowHeight;

    };


    // -----------------------------------------
    // DRAW SALES HEADER
    // -----------------------------------------

    drawSalesHeader();


    // =========================================
    // SALES DATA
    // =========================================

    doc.font("Helvetica");


    /*
     * IMPORTANT:
     *
     * report.orders is already FLAT.
     *
     * So DO NOT do:
     *
     * report.orders.forEach(order => {
     *     order.orderItems.forEach(...)
     * });
     *
     * Instead:
     *
     * report.orders.forEach(item => {
     *     ...
     * });
     */


    report.orders.forEach((item) => {


        // -------------------------------------
        // PAGE BREAK
        // -------------------------------------

        if (currentY > 720) {

            doc.addPage();

            currentY = 50;

            drawSalesHeader();

        }


        // -------------------------------------
        // ROW BORDER
        // -------------------------------------

        doc
            .rect(
                left,
                currentY,
                contentWidth,
                rowHeight
            )
            .stroke();


        // -------------------------------------
        // ORDER ID
        // -------------------------------------

        doc
            .fontSize(7)
            .text(
                item.orderId || "",
                xOrderId + 4,
                currentY + 9,
                {
                    width: colOrderId - 8
                }
            );


        // -------------------------------------
        // DATE
        // -------------------------------------

        doc
            .fontSize(7)
            .text(
                item.createdAt
                    ? formatDate(item.createdAt)
                    : "",
                xDate + 4,
                currentY + 9,
                {
                    width: colDate - 8
                }
            );


        // -------------------------------------
        // PRODUCT
        // -------------------------------------

        doc
            .fontSize(7)
            .text(
                item.productName || "",
                xProduct + 4,
                currentY + 9,
                {
                    width: colProduct - 8,
                    height: rowHeight - 8
                }
            );


        // -------------------------------------
        // QUANTITY
        // -------------------------------------

        doc
            .text(
                String(item.quantity || 0),
                xQty + 4,
                currentY + 9,
                {
                    width: colQty - 8,
                    align: "center"
                }
            );


        // -------------------------------------
        // PAYMENT METHOD
        // -------------------------------------

        doc
            .text(
                item.paymentMethod || "",
                xPayment + 4,
                currentY + 9,
                {
                    width: colPayment - 8
                }
            );


        // -------------------------------------
        // PAID AMOUNT
        // -------------------------------------

        doc
            .text(
                `₹${Number(
                    item.paidAmount || 0
                ).toFixed(2)}`,
                xAmount + 4,
                currentY + 9,
                {
                    width: colAmount - 8,
                    align: "right"
                }
            );


        currentY += rowHeight;

    });


    // =========================================
    // REFUNDED ENTRIES
    // =========================================

    const refundedEntries =
        report.refundedEntries || [];


    if (refundedEntries.length > 0) {


        // -------------------------------------
        // PAGE BREAK BEFORE REFUNDS
        // -------------------------------------

        if (currentY > 650) {

            doc.addPage();

            currentY = 50;

        } else {

            currentY += 30;

        }


        // -------------------------------------
        // REFUNDED TITLE
        // -------------------------------------

        doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text(
                "REFUNDED ENTRIES",
                left,
                currentY
            );


        currentY += 25;


        // -------------------------------------
        // REFUND TABLE HEADER
        // -------------------------------------

        doc
            .rect(
                left,
                currentY,
                contentWidth,
                rowHeight
            )
            .stroke();


        doc
            .fontSize(8)
            .font("Helvetica-Bold");


        doc.text(
            "Order ID",
            xOrderId + 4,
            currentY + 9,
            {
                width: colOrderId - 8
            }
        );


        doc.text(
            "Date",
            xDate + 4,
            currentY + 9,
            {
                width: colDate - 8
            }
        );


        doc.text(
            "Product",
            xProduct + 4,
            currentY + 9,
            {
                width: colProduct - 8
            }
        );


        doc.text(
            "Qty",
            xQty + 4,
            currentY + 9,
            {
                width: colQty - 8,
                align: "center"
            }
        );


        doc.text(
            "Payment",
            xPayment + 4,
            currentY + 9,
            {
                width: colPayment - 8
            }
        );


        doc.text(
            "Refunded",
            xAmount + 4,
            currentY + 9,
            {
                width: colAmount - 8,
                align: "right"
            }
        );


        currentY += rowHeight;


        // -------------------------------------
        // REFUND DATA
        // -------------------------------------

        doc.font("Helvetica");


        refundedEntries.forEach((item) => {


            // ---------------------------------
            // PAGE BREAK
            // ---------------------------------

            if (currentY > 720) {

                doc.addPage();

                currentY = 50;


                // Header after page break

                doc
                    .rect(
                        left,
                        currentY,
                        contentWidth,
                        rowHeight
                    )
                    .stroke();


                doc
                    .fontSize(8)
                    .font("Helvetica-Bold");


                doc.text(
                    "Order ID",
                    xOrderId + 4,
                    currentY + 9,
                    {
                        width: colOrderId - 8
                    }
                );


                doc.text(
                    "Date",
                    xDate + 4,
                    currentY + 9,
                    {
                        width: colDate - 8
                    }
                );


                doc.text(
                    "Product",
                    xProduct + 4,
                    currentY + 9,
                    {
                        width: colProduct - 8
                    }
                );


                doc.text(
                    "Qty",
                    xQty + 4,
                    currentY + 9,
                    {
                        width: colQty - 8,
                        align: "center"
                    }
                );


                doc.text(
                    "Payment",
                    xPayment + 4,
                    currentY + 9,
                    {
                        width: colPayment - 8
                    }
                );


                doc.text(
                    "Refunded",
                    xAmount + 4,
                    currentY + 9,
                    {
                        width: colAmount - 8,
                        align: "right"
                    }
                );


                currentY += rowHeight;

            }


            // ---------------------------------
            // ROW BORDER
            // ---------------------------------

            doc
                .rect(
                    left,
                    currentY,
                    contentWidth,
                    rowHeight
                )
                .stroke();


            // ---------------------------------
            // ORDER ID
            // ---------------------------------

            doc
                .fontSize(7)
                .text(
                    item.orderId || "",
                    xOrderId + 4,
                    currentY + 9,
                    {
                        width: colOrderId - 8
                    }
                );


            // ---------------------------------
            // DATE
            // ---------------------------------

            doc
                .text(
                    item.createdAt
                        ? formatDate(item.createdAt)
                        : "",
                    xDate + 4,
                    currentY + 9,
                    {
                        width: colDate - 8
                    }
                );


            // ---------------------------------
            // PRODUCT
            // ---------------------------------

            doc
                .text(
                    item.productName || "",
                    xProduct + 4,
                    currentY + 9,
                    {
                        width: colProduct - 8
                    }
                );


            // ---------------------------------
            // QUANTITY
            // ---------------------------------

            doc
                .text(
                    String(item.quantity || 0),
                    xQty + 4,
                    currentY + 9,
                    {
                        width: colQty - 8,
                        align: "center"
                    }
                );


            // ---------------------------------
            // PAYMENT METHOD
            // ---------------------------------

            doc
                .text(
                    item.paymentMethod || "",
                    xPayment + 4,
                    currentY + 9,
                    {
                        width: colPayment - 8
                    }
                );


            // ---------------------------------
            // REFUNDED AMOUNT
            // ---------------------------------

            doc
                .text(
                    `₹${Number(
                        item.refundedAmount || 0
                    ).toFixed(2)}`,
                    xAmount + 4,
                    currentY + 9,
                    {
                        width: colAmount - 8,
                        align: "right"
                    }
                );


            currentY += rowHeight;

        });


        // -------------------------------------
        // TOTAL REFUNDED
        // -------------------------------------

        const totalRefunded =
            refundedEntries.reduce(
                (total, item) =>
                    total +
                    Number(
                        item.refundedAmount || 0
                    ),
                0
            );


        if (currentY > 720) {

            doc.addPage();

            currentY = 50;

        }


        currentY += 15;


        doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(
                `TOTAL REFUNDED: ₹${totalRefunded.toFixed(2)}`,
                left,
                currentY,
                {
                    width: contentWidth,
                    align: "right"
                }
            );

    }


    // =========================================
    // FINAL TOTAL
    // =========================================

    if (currentY > 720) {

        doc.addPage();

        currentY = 50;

    }


    currentY += 35;


    doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(
            `TOTAL NET SALES: ₹${Number(
                report.netSales || 0
            ).toFixed(2)}`,
            left,
            currentY,
            {
                width: contentWidth,
                align: "right"
            }
        );


    // =========================================
    // FOOTER
    // =========================================

    currentY += 35;


    doc
        .fontSize(8)
        .font("Helvetica")
        .text(
            "END OF REPORT",
            left,
            currentY,
            {
                width: contentWidth,
                align: "center"
            }
        );


    // =========================================
    // FINISH PDF
    // =========================================

    doc.end();

};



export const getAdminDashboardService = async (filter) => {


    const chart = {
        labels: [],
        sales: []
    };

    const highestProducts = {};
    const highestBrand = {};
    const highestProductPrice = {};

    let totalOrders = 0;
    let totalItems = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let startDate;
    let endDate;

    // =========================================
    // STEP 1: PREPARE THE DATE RANGE AND LABELS
    // =========================================

    if (filter === "yearly") {

        const firstYear = currentYear - 4;

        startDate = new Date(firstYear, 0, 1);
        endDate = new Date(currentYear + 1, 0, 1);

        for (
            let year = firstYear;
            year <= currentYear;
            year++
        ) {
            chart.labels.push(String(year));
        }

    } else if (filter === "monthly") {

        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear + 1, 0, 1);

        chart.labels = [
            "Jan", "Feb", "Mar", "Apr",
            "May", "Jun", "Jul", "Aug",
            "Sep", "Oct", "Nov", "Dec"
        ];

    } else if (filter === "weekly") {

        startDate = new Date(
            currentYear,
            currentMonth,
            1
        );

        endDate = new Date(
            currentYear,
            currentMonth + 1,
            1
        );

        chart.labels = [
            "Week 1",
            "Week 2",
            "Week 3",
            "Week 4"
        ];

    } else if (filter === "daily") {

        const dayOfWeek = now.getDay();

        // Monday = beginning of the week
        const daysFromMonday =
            dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        startDate = new Date(now);
        startDate.setDate(
            now.getDate() - daysFromMonday
        );
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);

        chart.labels = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ];
    }

    // =========================================
    // STEP 2: FETCH ALL REQUIRED ORDERS ONCE
    // =========================================

    const orders = await Order.find({

        paymentMethod: {
            $in: [
                "Razorpay",
                "Wallet",
                "Cash on Delivery"
            ]
        },

        paymentStatus: "Paid",

        createdAt: {
            $gte: startDate,
            $lt: endDate
        }

    });

    // =========================================
    // STEP 3: COLLECT VARIANT IDs
    // =========================================

    const variantIds = new Set();

    for (const order of orders) {

        for (const item of order.orderItems || []) {

            // Cancelled and returned items are
            // excluded from product/brand rankings.
            if (
                item.itemStatus === "Cancelled" ||
                item.itemStatus === "Returned"
            ) {
                continue;
            }

            if (item.variantId) {

                const variantId = item.variantId._id
                    ? item.variantId._id.toString()
                    : item.variantId.toString();

                variantIds.add(variantId);
            }
        }
    }

    // =========================================
    // STEP 4: FETCH ALL VARIANTS IN ONE QUERY
    // =========================================

    let variants = [];

    if (variantIds.size > 0) {

        variants = await ProductVariant.find({
            _id: {
                $in: [...variantIds]
            }
        }).populate("productId");
    }

    // =========================================
    // STEP 5: CREATE THE VARIANT MAP
    // =========================================

    const variantMap = new Map();

    for (const variant of variants) {

        variantMap.set(
            variant._id.toString(),
            variant
        );
    }

    // =========================================
    // STEP 6: PREPARE CHART SALES
    // =========================================

    const salesByPeriod = Array(
        chart.labels.length
    ).fill(0);

    // =========================================
    // STEP 7: PROCESS ORDERS AND ORDER ITEMS
    // =========================================

    for (const order of orders) {

        const orderDate = new Date(order.createdAt);

        let periodIndex;

        if (filter === "yearly") {

            periodIndex =
                orderDate.getFullYear() -
                (currentYear - 4);

        } else if (filter === "monthly") {

            periodIndex = orderDate.getMonth();

        } else if (filter === "weekly") {

            const day = orderDate.getDate();

            if (day <= 7) {
                periodIndex = 0;
            } else if (day <= 14) {
                periodIndex = 1;
            } else if (day <= 21) {
                periodIndex = 2;
            } else {
                periodIndex = 3;
            }

        } else if (filter === "daily") {

            // Monday = 0, Tuesday = 1, ..., Sunday = 6
            periodIndex =
                (orderDate.getDay() + 6) % 7;
        }

        totalOrders++;

        // Preserve your existing chart calculation:
        // add the full order grandTotal.
        if (
            periodIndex >= 0 &&
            periodIndex < salesByPeriod.length
        ) {
            salesByPeriod[periodIndex] +=
                Number(order.grandTotal || 0);
        }

        for (const item of order.orderItems || []) {

            // Exclude cancelled and returned items
            // from item/product/brand calculations.
            if (
                item.itemStatus === "Cancelled" ||
                item.itemStatus === "Returned"
            ) {
                continue;
            }

            const quantity = Number(item.quantity || 0);

            totalItems += quantity;

            // =====================================
            // TOP-SELLING PRODUCTS
            // =====================================

            highestProducts[item.productName] =
                (highestProducts[item.productName] || 0)
                + quantity;

            // =====================================
            // PRODUCT SALES AMOUNT
            // =====================================

            const paidAmount = Number(
                item.paidAmount || 0
            );

            if (
                filter === "yearly" ||
                filter === "monthly"
            ) {

                highestProductPrice[item.productName] =
                    (highestProductPrice[item.productName] || 0)
                    + paidAmount * quantity;

            } else {

                // Preserves your existing weekly/daily logic.
                highestProductPrice[item.productName] =
                    (highestProductPrice[item.productName] || 0)
                    + paidAmount;
            }

            // =====================================
            // TOP-SELLING BRANDS
            // =====================================

            // Get the variant from the Map.
            // No additional MongoDB query here.
            const variantId = item.variantId
                ? (
                    item.variantId._id
                        ? item.variantId._id.toString()
                        : item.variantId.toString()
                )
                : null;

            const variant = variantId
                ? variantMap.get(variantId)
                : null;

            if (!variant || !variant.productId) {
                continue;
            }

            const brand = variant.productId.brand;

            if (!brand) {
                continue;
            }

            highestBrand[brand] =
                (highestBrand[brand] || 0)
                + quantity;
        }
    }

    // =========================================
    // STEP 8: ASSIGN CHART SALES
    // =========================================

    chart.sales = salesByPeriod;

    // =========================================
    // STEP 9: GET TOTAL USERS
    // =========================================

    const totalUsers = await User.countDocuments();

    // =========================================
    // STEP 10: SORT BEST-SELLING PRODUCTS
    // =========================================

    const sortedHighestProducts =
        Object.entries(highestProducts)
            .sort((a, b) => b[1] - a[1]);

    const bestSellingProducts =
        sortedHighestProducts.map(product => ({
            productName: product[0],
            quantity: product[1],
            sales: highestProductPrice[product[0]]
        }));

    // =========================================
    // STEP 11: SORT BEST-SELLING BRANDS
    // =========================================

    const sortedHighestBrands =
        Object.entries(highestBrand)
            .sort((a, b) => b[1] - a[1]);

    const bestSellingBrands =
        sortedHighestBrands.map(brand => ({
            _id: brand[0],
            quantity: brand[1],
            sales: 0
        }));

    // =========================================
    // STEP 12: RETURN DASHBOARD DATA
    // =========================================

    return {
        success: true,
        filter,
        totalOrders,
        totalUsers,
        totalItems,
        chart,
        bestSellingProducts,
        bestSellingBrands
    };
};


export const deleteCouponService = async (couponId) => {

    try {

        const deletedCoupon =
            await Coupon.findOneAndUpdate({ _id: couponId }, { isActive: false });


        if (!deletedCoupon) {

            return {

                success: false,

                message: "Coupon not found"

            };

        }

        console.log("COUPON deleted successfully")

        return {

            success: true,

            message: "Coupon deleted successfully"

        };

    }

    catch (error) {

        console.log(
            "Error in deleteCouponService:",
            error
        );

        return {

            success: false,

            message: "Unable to delete coupon"

        };

    }

};












// =====================================================
// GENERATE EXCEL SALES REPORT
// =====================================================

export const generateSalesReportExcel = async (
    report,
    res
) => {

    const workbook = new ExcelJS.Workbook();


    workbook.creator = "JORDAN";
    workbook.lastModifiedBy = "JORDAN";


    const worksheet =
        workbook.addWorksheet(
            "Sales Report"
        );


    // =================================================
    // PAGE SETTINGS
    // =================================================

    worksheet.pageSetup = {

        paperSize:
            worksheet.PAPERSIZE_A4,

        orientation:
            "portrait",

        fitToPage: true,

        fitToWidth: 1,

        fitToHeight: 0

    };


    worksheet.pageMargins = {

        left: 0.5,

        right: 0.5,

        top: 0.75,

        bottom: 0.75

    };


    // =================================================
    // COLUMN WIDTH
    // =================================================

    worksheet.columns = [

        {
            key: "description",
            width: 40
        },

        {
            key: "amount",
            width: 22
        }

    ];


    // =================================================
    // TITLE
    // =================================================

    worksheet.mergeCells(
        "A1:B1"
    );


    const title =
        worksheet.getCell("A1");


    title.value =
        "JORDAN";


    title.font = {

        name: "Arial",

        size: 22,

        bold: true

    };


    title.alignment = {

        horizontal: "center",

        vertical: "middle"

    };


    worksheet.getRow(1).height = 35;


    // =================================================
    // SUB TITLE
    // =================================================

    worksheet.mergeCells(
        "A2:B2"
    );


    const subtitle =
        worksheet.getCell("A2");


    subtitle.value =
        "SALES REPORT";


    subtitle.font = {

        name: "Arial",

        size: 16,

        bold: true

    };


    subtitle.alignment = {

        horizontal: "center"

    };


    worksheet.getRow(2).height = 25;


    // =================================================
    // REPORT PERIOD
    // =================================================

    worksheet.mergeCells(
        "A3:B3"
    );


    const period =
        worksheet.getCell("A3");


    period.value =
        `Report Period: ${formatDate(report.startDate)} - ${formatDate(report.endDate)}`;


    period.font = {

        name: "Arial",

        size: 10

    };


    period.alignment = {

        horizontal: "center"

    };


    worksheet.getRow(3).height = 20;


    // =================================================
    // EMPTY ROW
    // =================================================

    worksheet.addRow([]);


    // =================================================
    // SUMMARY TITLE
    // =================================================

    worksheet.mergeCells(
        "A5:B5"
    );


    const summaryTitle =
        worksheet.getCell("A5");


    summaryTitle.value =
        "SALES SUMMARY";


    summaryTitle.font = {

        bold: true,

        size: 13

    };


    // =================================================
    // TABLE HEADER
    // =================================================

    const headerRow =
        worksheet.addRow(
            [
                "Description",
                "Amount"
            ]
        );


    headerRow.font = {

        bold: true

    };


    headerRow.alignment = {

        horizontal: "center"

    };


    // =================================================
    // SUMMARY DATA
    // =================================================

    addExcelRow(
        worksheet,
        "Total Orders",
        report.totalOrders
    );


    addExcelRow(
        worksheet,
        "Items Sold",
        report.totalItems
    );


    addExcelRow(
        worksheet,
        "Gross Sales",
        report.grossSales
    );


    addExcelRow(
        worksheet,
        "Product / Category Discount",
        report.offerDiscount
    );


    addExcelRow(
        worksheet,
        "Coupon Discount",
        report.couponDiscount
    );


    addExcelRow(
        worksheet,
        "Total Discount",
        report.totalDiscount
    );


    const netRow =
        addExcelRow(
            worksheet,
            "NET SALES",
            report.netSales
        );


    netRow.font = {

        bold: true,

        size: 12

    };


    // =================================================
    // SALES BREAKDOWN
    // =================================================

    worksheet.addRow([]);


    worksheet.mergeCells(
        `A${worksheet.lastRow.number + 1}:B${worksheet.lastRow.number + 1}`
    );


    const breakdownTitle =
        worksheet.getCell(
            `A${worksheet.lastRow.number}`
        );


    breakdownTitle.value =
        "SALES BREAKDOWN";


    breakdownTitle.font = {

        bold: true,

        size: 13

    };


    worksheet.addRow(
        [
            "Description",
            "Amount"
        ]
    );


    const breakdownHeader =
        worksheet.lastRow;


    breakdownHeader.font = {

        bold: true

    };


    addExcelRow(
        worksheet,
        "Gross Sales",
        report.grossSales
    );


    addExcelRow(
        worksheet,
        "Product / Category Discount",
        -report.offerDiscount
    );


    addExcelRow(
        worksheet,
        "Coupon Discount",
        -report.couponDiscount
    );


    addExcelRow(
        worksheet,
        "Total Discount",
        -report.totalDiscount
    );


    const finalRow =
        addExcelRow(
            worksheet,
            "Net Sales",
            report.netSales
        );


    finalRow.font = {

        bold: true,

        size: 12

    };


    // =================================================
    // NUMBER FORMATTING
    // =================================================

    worksheet.eachRow(
        (row, rowNumber) => {

            if (rowNumber >= 6) {

                row.getCell(2).numFmt =
                    '"₹"#,##0.00';

            }

        }
    );


    // =================================================
    // BORDERS
    // =================================================

    worksheet.eachRow(
        (row) => {

            row.eachCell(
                (cell) => {

                    cell.border = {

                        top: {
                            style: "thin"
                        },

                        bottom: {
                            style: "thin"
                        },

                        left: {
                            style: "thin"
                        },

                        right: {
                            style: "thin"
                        }

                    };

                }
            );

        }
    );


    // =================================================
    // RESPONSE
    // =================================================

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );


    res.setHeader(
        "Content-Disposition",
        'attachment; filename="JORDAN-Sales-Report.xlsx"'
    );


    await workbook.xlsx.write(res);


    res.end();

};







const formatDate = (date) => {

    return new Date(date).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

};


const drawLine = (doc) => {

    doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

    doc.moveDown(0.5);

};


const addPDFRow = (
    doc,
    description,
    amount,
    bold = false
) => {

    doc
        .font(
            bold
                ? "Helvetica-Bold"
                : "Helvetica"
        )
        .fontSize(
            bold ? 11 : 10
        );


    const y = doc.y;


    doc.text(
        description,
        50,
        y
    );


    doc.text(
        amount,
        400,
        y,
        {
            width: 145,
            align: "right"
        }
    );


    doc.moveDown(0.8);

};


const addExcelRow = (
    worksheet,
    description,
    amount
) => {

    return worksheet.addRow({

        description,

        amount

    });

};

export const getCreateOfferPageServices = async () => {

    const categories = await Category.find({ list: true }).sort({ categoryName: 1 })
    const categoryIds = await Category.find({ list: true }).sort({ categoryName: 1 }).select('id')

    const products = await Product.find({ list: true }).sort({ name: 1 })
    const productIds = await Product.find({ list: true }).sort({ categoryName: 1 }).select('id')

    if (categories.length > 1 && products.length > 1) {
        // console.log(categories,products)
        return { success: true, categories, products, categoryIds, productIds }
    }
    else {
        return { success: true }
    }

}

export const adminEditCouponServices = async (couponId) => {

    try {
        const coupon = await Coupon.findById(couponId)

        if (!coupon) {

            return {
                success: false,
                message: "Coupon Not Found"
            }

        }

        return { success: true, coupon }

    } catch (error) {

        console.log(error)

        return {
            success: false,
            message: "Unable To Edit Coupon"
        }
    }

}

export const adminPostEditCouponServices = async ({ couponId, couponCode,
    discountType,
    discountValue,
    minimumCartValue,
    usageLimit,
    isActive,
    expiryDate }) => {

    const coupon = await Coupon.findById(couponId)

    if (!coupon) {
        return {
            success: false,
            message: "coupon not found",
            coupon
        }
    }

    const duplicate = await Coupon.findOne({ couponCode, _id: { $ne: couponId } })
    if (duplicate) {
        return {
            success: false,
            message: `${couponCode} already exist`,
            coupon
        }
    }

    if (!discountType) {
        return {
            success: false,
            message: "discount Type Is Required",
            coupon
        };
    }

    if (!discountValue || discountValue <= 0) {
        return {
            success: false,
            message: "discount Value Is Required",
            coupon
        };
    }


    if (discountType === "percentage" && discountValue > 50) {
        return {
            success: false,
            message: "Percentage discount cannot exceed 50%",
            coupon
        };
    }


    if (!minimumCartValue || minimumCartValue < 1000) {
        return {
            success: false,
            message: "Minimum cart value should be at least 1000",
            coupon
        };
    }

    if (discountType === "fixed" && discountValue > minimumCartValue) {
        return {
            success: false,
            message: "Discount cannot exceed minimum cart value",
            coupon
        };
    }

    if (!usageLimit || usageLimit <= 0) {
        return {
            success: false,
            message: "Enter a valid usage limit(should be atleast 1 )",
            coupon
        };
    }

    if (isActive !== true && isActive !== false) {
        console.log(typeof (isActive))
        return {
            success: false,
            message:
                "Please select a valid offer status",
                coupon
        };
    }

    const expiry = new Date(expiryDate);
    const now = new Date();

    if (isNaN(expiry.getTime())) {
        return {
            success: false,
            message: "Invalid expiry date",
            coupon
        };
    }

    if (expiry <= now) {
        return {
            success: false,
            message: "Expiry date must be in the future",
            coupon
        };
    }

    coupon.couponCode = couponCode
    coupon.discountType = discountType
    coupon.discountValue = discountValue
    coupon.minimumCartValue = minimumCartValue
    coupon.usageLimit = usageLimit
    coupon.isActive = isActive === true
    coupon.expiryDate = expiryDate
    await coupon.save()
    console.log(coupon)
    return { success: true }
}


export const addProductVariantPageServices=async(productId)=>{
const product = await Product.findById(productId)
if(product){
    return{success:true,product}
}else{
    console.log("false is executrd")
    return{success:false}
}
}


 export const editProductVariantPageServices=async(varaintId)=>{
const variant = await ProductVariant.findById(varaintId);

if (!variant) {
    return {
        success: false,
        message: "Variant not found"
    };
}

const product = await Product.findById(variant.productId);

// console.log("variant ->", variant);
// console.log("product ->", product);

if (variant && product) {
    return {
        success: true,
        variant,
        product
    };
}

return {
    success: false,
    message: "Product not found"
};


}

export const productVarientPageServices=async(productId,page)=>{

    const limit = 5; // variants per page

    const skip = (page - 1) * limit;

    const product = await Product.findById(productId);

    const totalDocuments = await ProductVariant.countDocuments({
        productId
    });

    const totalPages = Math.ceil(totalDocuments / limit);

    const variants = await ProductVariant.find({
        productId
    })
    .skip(skip)
    .limit(limit);

    return{
        success:true,
        product,
        variants,
        totalPages
    }

}


export const getRefundedEntriesService = async (start, end) => {

    const refundedOrders = await Order.find({
        createdAt: {
            $gte: start,
            $lt: end
        },
        "orderItems.paymentStatus": "Refunded"
    });

    const refundedEntries = [];

    refundedOrders.forEach((order) => {

        order.orderItems.forEach((item) => {

            if (item.paymentStatus === "Refunded") {

                refundedEntries.push({
                    orderId: order.orderId,
                    createdAt: order.createdAt,
                    productName: item.productName,
                    quantity: item.quantity,
                    paymentMethod: order.paymentMethod,
                    refundedAmount: Number(item.paidAmount || 0)
                });

            }

        });

    });

    return refundedEntries;
};

export const getSalesReportPDFService = async (
    filter,
    startDate,
    endDate
) => {

    const report = await getSalesReportService(
        filter,
        startDate,
        endDate
    );

    const refundedEntries =
        await getRefundedEntriesService(
            report.startDate,
            report.endDate
        );

    report.refundedEntries = refundedEntries;

    return report;
};


export const generateInvoicePDF = (order, res) => {

    const doc = new PDFDocument({
        margin: 40
    });

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename=${order.orderId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(22).text("INVOICE", {
        align: "center"
    });

    doc.moveDown();

    doc.fontSize(12);

    doc.text(`Order ID : ${order.orderId}`);

    doc.text(
        `Date : ${new Date(order.createdAt).toLocaleDateString("en-IN")}`
    );

    doc.text(
        `Customer : ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
    );

    doc.text(
        `Phone : ${order.shippingAddress.phoneNumber}`
    );

    doc.moveDown();

    doc.text("Shipping Address");

    doc.text(order.shippingAddress.address);

    doc.text(
        `${order.shippingAddress.city}, ${order.shippingAddress.state}`
    );

    doc.text(
        order.shippingAddress.pincode.toString()
    );

    doc.moveDown();

    doc.fontSize(15).text("Products");

    doc.moveDown(0.5);

    order.orderItems.forEach((item) => {

        doc.fontSize(11);

        doc.text(item.productName);

        doc.text(
            `Size : ${item.size}`
        );

        doc.text(
            `Quantity : ${item.quantity}`
        );

        doc.text(
            `Price : ₹${item.salePrice}`
        );

        doc.text(
            `Subtotal : ₹${item.salePrice * item.quantity}`
        );

        doc.moveDown();

    });

    doc.moveDown();

    doc.fontSize(13);

    doc.text(
        `Payment Method : ${order.paymentMethod}`
    );

    doc.text(
        `Payment Status : ${order.paymentStatus}`
    );

    doc.moveDown();

    doc.fontSize(18);

    doc.text(
        `Grand Total : ₹${order.grandTotal}`,
        {
            align: "right"
        }
    );

    doc.end();

};



export const generateSalesReportExcelService = async (
    filter,
    startDate,
    endDate
) => {

    const report = await getSalesReportService(
        filter,
        startDate,
        endDate
    );

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet(
        "Sales Report"
    );


    // TITLE

    worksheet.mergeCells("A1:G1");

    worksheet.getCell("A1").value =
        "SALES REPORT";

    worksheet.getCell("A1").font = {
        bold: true,
        size: 18
    };

    worksheet.getCell("A1").alignment = {
        horizontal: "center"
    };


    // REPORT INFORMATION

    worksheet.getCell("A3").value = "Filter";

    worksheet.getCell("B3").value =
        report.filter;

    worksheet.getCell("A4").value = "Period";

    worksheet.getCell("B4").value =
        `${new Date(report.startDate).toLocaleDateString("en-IN")} - ${new Date(report.endDate).toLocaleDateString("en-IN")}`;


    // SALES SUMMARY

    worksheet.getCell("A6").value =
        "SALES SUMMARY";

    worksheet.getCell("A7").value =
        "Total Orders";

    worksheet.getCell("B7").value =
        report.totalOrders;

    worksheet.getCell("A8").value =
        "Items Sold";

    worksheet.getCell("B8").value =
        report.totalItems;

    worksheet.getCell("A9").value =
        "Gross Sales";

    worksheet.getCell("B9").value =
        report.grossSales;

    worksheet.getCell("A10").value =
        "Product/Category Discount";

    worksheet.getCell("B10").value =
        report.offerDiscount;

    worksheet.getCell("A11").value =
        "Coupon Discount";

    worksheet.getCell("B11").value =
        report.couponDiscount;

    worksheet.getCell("A12").value =
        "Total Discount";

    worksheet.getCell("B12").value =
        report.totalDiscount;

    worksheet.getCell("A13").value =
        "Net Sales";

    worksheet.getCell("B13").value =
        report.netSales;


    // SALES DETAILS

    worksheet.getCell("A15").value =
        "SALES DETAILS";

    worksheet.getRow(16).values = [
        "Order ID",
        "Date",
        "Product",
        "Quantity",
        "Payment Method",
        "Paid Amount",
        "Status"
    ];

    worksheet.getRow(16).font = {
        bold: true
    };


    // SALES ITEMS

    let rowNumber = 17;

    report.orders.forEach((item) => {

        worksheet.getRow(rowNumber).values = [

            item.orderId,

            new Date(item.createdAt),

            item.productName,

            item.quantity,

            item.paymentMethod,

            item.paidAmount,

            item.itemStatus

        ];

        worksheet
            .getCell(`B${rowNumber}`)
            .numFmt = "dd-mm-yyyy";

        worksheet
            .getCell(`F${rowNumber}`)
            .numFmt = "₹#,##0.00";

        rowNumber++;

    });


    // SUMMARY FORMATTING

    worksheet.getCell("B7").numFmt =
        "#,##0";

    worksheet.getCell("B8").numFmt =
        "#,##0";

    worksheet.getCell("B9").numFmt =
        "₹#,##0.00";

    worksheet.getCell("B10").numFmt =
        "₹#,##0.00";

    worksheet.getCell("B11").numFmt =
        "₹#,##0.00";

    worksheet.getCell("B12").numFmt =
        "₹#,##0.00";

    worksheet.getCell("B13").numFmt =
        "₹#,##0.00";


    // COLUMN WIDTHS

    worksheet.getColumn(1).width = 18;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 30;
    worksheet.getColumn(4).width = 12;
    worksheet.getColumn(5).width = 20;
    worksheet.getColumn(6).width = 18;
    worksheet.getColumn(7).width = 20;


    // CREATE BUFFER

    const buffer =
        await workbook.xlsx.writeBuffer();

    return buffer;
};
