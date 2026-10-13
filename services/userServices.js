
import bcrypt from "bcrypt"
import User from "../models/user.model.js"
import otpCollection from "../models/otp.model.js"
import Product from "../models/product.model.js"
import ProductVariant from "../models/variant.model.js"
import { sendMail } from "../config/otp.js"
import tempUser from "../models/tempUsers.model.js"
import Address from "../models/address.model.js"
import Category from "../models/category.model.js"
import Cart from "../models/addToCart.model.js"
import Wishlist from "../models/wishlist.model.js"
import Order from "../models/orders.model.js"
import crypto from "crypto"
import razorpay from "../config/razorpay.js"
import Coupon from "../models/coupen.model.js"
import Wallet from "../models/wallet.model.js"
import Offer from "../models/offer.model.js"
import PDFDocument from "pdfkit";


export const login = async (email, password) => {
    try {
        const user = await User.findOne({ email })
        if (user) {
            if (user.isBlocked) {
                return { success: false, error: "user is been blocked contact admin" }
            }
            if (!user.password) {
                return { success: false, error: 'user has signed up using GoogleAuth so the user can only login using "sign in with google" and not by entering the password' }
            }
            const isMatch = await bcrypt.compare(password, user.password)
            if (isMatch) {
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
// <----------signup -------->

export const signup = async (firstName, lastName, email, password, phoneNumber, referralCode, referredBy, isBlocked) => {

    try {
        const isExisting = await User.findOne({ email })
        if (isExisting) {
            return { success: false, error: "email already exists" }
        }

        // const phoneNumberExist=await User.findOne({phoneNumber:phoneNumber})
        // if(phoneNumberExist){
        //     return{success:false,error:"phone number already taken try some other number"}
        // }
        else {
            const hashedPassword = await bcrypt.hash(password, 10)
            const tempNewUser = new tempUser({ firstName, lastName, email, password: hashedPassword, phoneNumber, referralCode: referralCode || undefined, referredBy: referredBy || undefined, isBlocked })
            await tempNewUser.save()
            const otp = Math.floor(100000 + Math.random() * 900000)
            const otpString = otp.toString()
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
             await otpCollection.create({ email, otp: otpString, expiresAt })
            await sendMail(email, `OTP  sent to ${email}`, `your OTP is ${otpString}`)
            console.log("otp sent  to email sucessfully")
            return { success: true }
        }
    } catch (error) {
        console.log(error)
        return { success: false, error: "something went wrong try again later" }
    }
}


const generateReferralCode = () => {

    return "JORDAN" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

};

export const updateProfileEmailPageServices=async (userId)=>{

      const user = await User.findOne({ _id: userId })
  console.log("user in the get updateProfile email page->", user)

  if (user?.googleId) {
    return {success:false,user}
  } else {
    return {success:true}

  }
}

export const forgotPasswordGenerateOtp = async (email) => {
    try {
        const existing = await User.findOne({ email })
        if (!existing) {
            console.log("user don't have account")
            return { success: false, error: "user don't have account" }
        }
        if (existing) {
            try {
                const otp = Math.floor(100000 + Math.random() * 900000)
                const otpString = otp.toString()
                const expiresAt = new Date(Date.now() + 2 * 60 * 1000)
                console.log({ email, otp: otpString, expiresAt })
                // const exist=await otpCollection.findOne({email})
                // if(exist){
                //     const doc=await otpCollection.findByIdAndUpdate({email},{otp: otpString, expiresAt},{new:true,upsert:true})
                // }else{        
                // const newOtp = await new otpCollection({ email, otp: otpString, expiresAt })
                // await newOtp.save()
                // }
                await otpCollection.findOneAndUpdate({ email: email }, { otp: otpString, expiresAt }, { new: true, upsert: true })
                console.log("otp stored temperorly")
                await sendMail(email, "Your OTP to change password", `Your OTP is ${otpString}`)
                return { success: true }
            } catch (error) {
                console.log(error)
                return { success: false, error: "something went wrong try again later" }

            }
        }

    }
    catch (error) {
        console.log(error)
    }
}

export const verifyingOtp = async (otp, email, purpose, updateEmail) => {
    try {
        
        if (purpose === "signupVerification") {

            const existing =
                await otpCollection.findOne({ email });


            if (!existing) {

                console.log(
                    "email dont exist in otpCollection"
                );

                return {
                    success: false,
                    error: "Time expired. Signup again"
                };

            }


            if (existing.expiresAt < new Date()) {

                console.log(
                    "expiresAt is lesser than the current time"
                );

                return {
                    success: false,
                    error: "OTP Expired"
                };

            }


            if (existing.otp === otp) {

                console.log("OTP found in otpCollection");

                const temp =
                    await tempUser.findOne({ email });


                if (!temp) {

                    return {
                        success: false,
                        error: "Signup data not found"
                    };

                }

                // GENERATE NEW USER'S OWN REFERRAL CODE

                const referralCode = generateReferralCode();



                // CREATE NEW USER

                const newUser =
                    await User.create({

                        firstName: temp.firstName,

                        lastName: temp.lastName,

                        email: temp.email,

                        password: temp.password,

                        phoneNumber: temp.phoneNumber,

                        // This is the NEW user's own code
                        referralCode: referralCode

                    });

                // CREATE WALLET FOR NEW USER

                await Wallet.create({

                    userId: newUser._id,

                    balance: 0

                });

                // FIND OWNER OF ENTERED REFERRAL CODE

                if (temp.referralCode) {

                    const referralOwner = await User.findOne({ referralCode: temp.referralCode });

                    // CREDIT ₹500 TO REFERRAL OWNER

                    if (referralOwner) {

                        await creditWalletService({

                            userId: referralOwner._id,

                            amount: 500,

                            description:
                                `Referral reward for ${newUser.firstName}`
                        });

                    }

                }

                // DELETE TEMP USER
                await tempUser.findOneAndDelete({ email });

                // DELETE OTP
                await otpCollection.findOneAndDelete({ email });

                return {
                    success: true,
                    error: null,
                    newUser
                };

            }
            else {
                console.log(purpose);
                return {
                    success: false,
                    error: "Incorrect OTP"
                };
            }
        }
        else if (purpose === "forgotPassword") {
            const existing = await otpCollection.findOne({ email })
            if (!existing) {
                console.log("email dont exixt in otpCollection")
                return { success: false, error: "OTP expired" }
            } else {
                if (existing.expiresAt < new Date()) {
                    console.log("expiresAt is lesser than the current time")
                    return { success: false, error: "OTP Expired" }
                }
                if (existing.otp === otp) {
                    console.log("verifying otp")
                    await otpCollection.findOneAndDelete({ otp })
                    return { success: true, error: null }
                } else {
                    console.log("incorrect Otp")
                    return { success: false, error: "invalid OTP" }
                }
            }

        }

        else if (purpose === "updateProfileEmail") {
            console.log("updateprofileEmail executed")
            const existing = await otpCollection.findOne({ email: updateEmail })
            if (!existing) {
                console.log("email dont exixt in otpCollection")
                return { success: false, error: "OTP expired" }
            }
            if (existing.expiresAt < new Date()) {
                console.log("expiresAt is lesser than the current time")
                return { success: false, error: "OTP Expired" }
            }
            if (existing.otp === otp) {
                const alreadyExist = await User.findOne({ email: updateEmail })
                if (alreadyExist) {
                    console.log(alreadyExist)
                    return { success: false, error: "In This Email User Already Exist" }
                }
                const updated = await User.findOneAndUpdate({ email }, { email: updateEmail })
                if (updated) {
                    await otpCollection.findOneAndDelete({ otp })
                    return { success: true, error: null }
                }
                else {
                    return { success: false, error: "error in findAndUpdate" }
                }
            } else {
                return { success: false, error: "Invalid OTP" }
            }
        }
    }

    catch (error) {
        console.log(error)
    }
}

export const resetPassword = async (password, confirmPassword, email) => {
    try {

        if (password === confirmPassword) {
            const hashedPassword = await bcrypt.hash(confirmPassword, 10)
            const existing = await User.findOneAndUpdate({ email }, { password: hashedPassword })
            if (existing) {
                return { success: true, error: null }
            } else {
                return { success: false, error: "password didn't match" }
            }
        }
    } catch (error) {
        console.log(error)
    }
}

export const resetCurrentPassword = async (currentPassword, password, confirmPassword, userId) => {
    try {
        const user = await User.findOne({ _id: userId })
        if (!user) {
            return { success: false, error: "user didn't exist" }
        }
        console.log(currentPassword)
        const currentPasswordCorrect = await bcrypt.compare(currentPassword, user.password)
        console.log(currentPasswordCorrect)
        if (!currentPasswordCorrect) {
            return { success: false, error: "Incorrect Current Password" }
        }
        if (password !== confirmPassword) {
            return { success: false, error: "Confirm Password and Password are not same" }
        }
        const hashedPassword = await bcrypt.hash(confirmPassword, 10)
        const passwordChanged = await User.findOneAndUpdate({ _id: userId }, { password: hashedPassword })
        if (passwordChanged) {
            return { success: true, error: null }
        } else {
            return { success: false, error: "password didn't change" }
        }
    } catch (error) {
        console.log(error)
    }
}
export const resendOtpService = async (email) => {
    try {
        console.log(email)
        const existing = await otpCollection.findOne({ email });

        if (!existing) {
            return { success: false, error: "OTP expired. Please try again." };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        existing.otp = otp;
        existing.expiresAt = expiresAt;

        await existing.save();

        await sendMail(
            email,
            "Your new OTP",
            `Your OTP is ${otp}`
        );

        return { success: true };

    } catch (error) {
        console.log(error);
        return { success: false, error: "Unable to resend OTP" };
    }
};

export const loadHome = async (userId) => {
    try {
        if (userId) {
            const user = await User.findOne({ _id: userId })
            const products = await Product.find({ status: "active" })
            // console.log(products)
            console.log("email if exiust")
            console.log(user)
            return { success: true, products, user }
        }
        else {
            const products = await Product.find({ status: "active" })
            return { success: true, products }
        }
    } catch (error) {
        console.log(error);
    }
};

export const profileInfo = async (userId) => {
    try {
        const user = await User.findOne({ _id: userId })
        if (user) {
            return { success: true, user }
        } else {
            return { success: false }
        }
    } catch (error) {
        console.log(error)
    }
}
export const updateProfileEmailOtp = async (email,userId) => {
    try {
        const otp = Math.floor(100000 + Math.random() * 900000)
        const otpString = otp.toString()
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000)
        // console.log({ email, otp: otpString, expiresAt })
         await otpCollection.findOneAndUpdate({ email: email }, { otp: otpString, expiresAt }, { new: true, upsert: true })
        // const newOtp = await new otpCollection({ email, otp: otpString, expiresAt })
        // await newOtp.save()
        console.log("otp stored temperorly")
        await sendMail(email, "Your OTP to change email", `Your OTP is ${otpString}`)
          const user = await User.findOne({ _id: userId })
        return { success: true,user }
    } catch (error) {
        console.log(error)
    }
}

export const addressDetails = async (userId) => {
    const addresses = await Address.find({ userId })
    // console.log(addresses)
    if (!addresses) {
        return { success: true, addresses: [] }
    }
    if (addresses) {
        return { success: true, addresses }
    }
}

export const newaddress = async (firstName, lastName, address, city, state, pincode, phoneNumber, userId) => {
    try {
        const existing = await Address.create({ firstName, lastName, address, city, state, pincode, phoneNumber, userId })
        if (existing) {
            console.log("existing done")
            return { success: true }
        }
    } catch (error) {
        console.log(error)
    }
}


export const forgotcurrentpasswordOtp = async (userId) => {
    try {
        const existing = await User.findById({ _id: userId })
        const email = existing.email
        console.log("email to be sent", email)
        const otp = Math.floor(100000 + Math.random() * 900000)
        const otpString = otp.toString()
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000)
        // console.log({ email, otp: otpString, expiresAt })
        const otpExist = await otpCollection.findOne({ email })
        // console.log("otpexist??",otpExist.otp)
        if (!otpExist) {
            console.log("otp does not exist")
            const newOtp = await new otpCollection({ email, otp: otpString, expiresAt })
            await newOtp.save()
            console.log("otp stored temperorly")
        }
        else {
            console.log("otp exist")
            const newOtp = await otpCollection.findOneAndUpdate({ email }, { otp: otpString, expiresAt })
            console.log(newOtp)
        }
        await sendMail(email, "Your OTP to change password", `Your OTP is ${otpString}`)
        return { success: true, userEmail: email }
    } catch (error) {
        console.log(error)
    }
}

export const verifyForgotCurrentPassword = async (otp, purpose, email) => {

    const existing = await otpCollection.findOne({ email });
    if (!existing) {
        console.log("email dont exixt in otpCollection")
        return { success: false, error: "OTP expired" }
    } else {
        if (existing.expiresAt < new Date()) {
            console.log("expiresAt is lesser than the current time")
            return { success: false, error: "OTP Expired" }
        }
        if (existing.otp === otp) {
            console.log("verifying otp")
            return { success: true, error: null }
        } else {
            console.log("Invalid OTP")
            return { success: false, error: "Invalid OTP" }
        }
    }
}

export const updateProfileDetails = async (userId, firstName, lastName, phoneNumber) => {
    const existGoogleId = await User.findOne({ _id: userId, googleId: { $exists: true, $ne: null } })
    if (existGoogleId) {
        return { success: false, errormsg: "User Signed up Via Google Auth cannot edit profile" }
    } else {
        const existing = await User.findOneAndUpdate({ _id: userId }, { firstName, lastName, phoneNumber })
        if (existing) {
            return { success: true }
        }
    }
}


export const findEditAddress = async (addressId) => {
    const address = await Address.findOne({ _id: addressId })
    if (address) {
        return { success: true, address }
    }
}

export const findUpdateAddress = async (addressId, firstName, lastName, address, city, state, pincode, phoneNumber) => {
    const existing = await Address.findByIdAndUpdate(addressId, { firstName, lastName, address, city, state, pincode, phoneNumber })
    if (existing) {
        return { success: true }
    }
}
export const DeleteAddressService = async (addressId) => {
    const existing = await Address.findByIdAndDelete(addressId)
    console.log(existing)
    if (existing) {
        return { success: true }
    }
}


export const productDetails = async (productId) => {

    const productDetail = await Product.findById(productId)

    const variants = await ProductVariant.find({
        productId: productId
    })

    if (productDetail) {
        return {
            success: true,
            productDetail,
            variants
        }
    }

    return { success: false }
}

export const fetchAllProducts = async () => {
    return { success: true }
}

export const getAllProductsPageService = async ({
    search,
    sort,
    page = 1,
    category,
    brand,
    color,
    price, userId, minPrice, maxPrice
}) => {
    console.log("brand->", brand)
    console.log("getProductsPageService executing...")

    if (price === "gt5000") {
        price = { $gt: 5000 };
    }

    if (price === "gt3000") {
        price = { $gt: 3000 };
    }

    if (price === "lt5000") {
        price = { $lt: 5000 };
    }

    if (price === "lt3000") {
        price = { $lt: 3000 };
    }




    const limit = 10;
    const skip = (page - 1) * limit;
    // console.log("the page->",page)
    // console.log("skip->",skip)
    let multipleCategory = false
    let cat;
    let splitedCategory;
    let multipleCat = []
    let multiplePrd = []

    if (category) {
        splitedCategory = category.split(",")
    }

    if (splitedCategory && splitedCategory.length > 1) {

        multipleCategory = true
        for (let eachCat of splitedCategory) {
            const categ = await Category.findOne({ categoryName: eachCat, list: true })
            multipleCat.push(categ)
        }
    } else {
        let categorySearchQuery = { list: true }
        if (category) {
            categorySearchQuery.categoryName = { $regex: category, $options: "i" }

            console.log("Name of the category user selected->", category)
            console.log(categorySearchQuery)
            cat = await Category.findOne(categorySearchQuery)
            // console.log("fetched categories->",cat)
        }
    }

    let searchQuery;

    let productSearchQuery = { list: true }

    let products;
    if (cat) {
        console.log("fetching product when filter has category is ")
        // if(search)
        // { searchQuery={categoryId:cat._id,list:true, "$or":[{name:{$regex:search,$options:"i" },},{brand:{$regex:search,$options:"i"}}]}   
        if (brand && search) {
            productSearchQuery.categoryId = cat._id,
                productSearchQuery.brand = brand,
                productSearchQuery.$or = [{
                    name: { $regex: search, $options: "i" }
                }]

        } else if (brand) {
            productSearchQuery.categoryId = cat._id,
                productSearchQuery.brand = brand
        } else if (search) {
            productSearchQuery.categoryId = cat._id,
                productSearchQuery.$or = [
                    {
                        name: { $regex: search, $options: "i" }
                    },

                    {
                        search: { $regex: search, $options: "i" }
                    }
                ]
        } else {
            productSearchQuery.categoryId = cat._id
        }
        console.log("category exist and productSearchQuery->", productSearchQuery)
        products = await Product.find(productSearchQuery)

    }

    else if (multipleCategory) {
        if (brand && search) {
            productSearchQuery.brand = brand,
                productSearchQuery.$or = [{
                    name: { $regex: search, $options: "i" }
                }]

        } else if (brand) {
            productSearchQuery.brand = brand
        } else if (search) {
            productSearchQuery.$or = [
                {
                    name: { $regex: search, $options: "i" }
                },

                {
                    search: { $regex: search, $options: "i" }
                }
            ]
        }

        for (let eachCatToFetchPrd of multipleCat) {
            let prod = await Product.find({ categoryId: eachCatToFetchPrd._id, ...productSearchQuery })
            // multiplePrd.push([].concat(...prod))
            multiplePrd = multiplePrd.concat(...prod)
        }
        console.log(multiplePrd)

    }

    else {

        if (brand && search) {
            productSearchQuery.brand = brand,
                productSearchQuery.$or = [{
                    name: { $regex: search, $options: "i" }
                }]

        } else if (brand && !search) {
            console.log("expecting this")
            productSearchQuery.brand = brand
        } else if (search && !brand) {
            console.log("executing need to see in ter")
            productSearchQuery.$or = [
                {
                    name: { $regex: search, $options: "i" }
                },

                {
                    brand: { $regex: search, $options: "i" }
                }
            ]
        }
        console.dir(productSearchQuery, { depth: null, color: true })
        products = await Product.find(productSearchQuery).populate({ path: "categoryId", match: { list: true } })
        // console.log("products using the populate fetch->",products)  
    }
    let variants;

    let priceFilter = {};

    if (minPrice || maxPrice) {

        priceFilter.salePrice = {};

        if (minPrice) {
            priceFilter.salePrice.$gte = Number(minPrice);
        }

        if (maxPrice) {
            priceFilter.salePrice.$lte = Number(maxPrice);
        }
    }

    if (color || price) {
        searchQuery = {
            list: true,
            "$or": [
                { color: color },
                {
                    salePrice: price
                }
            ]
        }
        variants = await ProductVariant.find({ ...searchQuery, ...priceFilter })
    } else {
        console.log("without searchQuery")
        variants = await ProductVariant.find({ list: true, ...priceFilter })
    }

    // console.log(products)
    // console.log(variants.length,"variants Length")


    let matchedVariants = []
    let matchedProduct = []
    if (multipleCategory) {
        multiplePrd.forEach((p) => {
            variants.forEach((v) => {
                if (p._id.toString() === v.productId.toString() && p.categoryId != null) {
                    const exist = matchedProduct.some((s) => { return s._id.toString() === p._id.toString() })
                    if (!exist) {
                        matchedProduct.push(p)
                        // console.log(p)
                        // console.log("matchedProduct array->",matchedProduct)
                    }
                    // console.log("matchedVariants----->",matchedVariants)
                    const variantExist = matchedVariants.some((mv) => {
                        // console.log("matchedVariants->",matchedVariants)
                        return mv.productId.toString() === v.productId.toString()
                    })
                    if (!variantExist) {
                        matchedVariants.push(v)
                        // console.log(v)

                    }
                }
            })

        })
    } else {

        products.forEach((p) => {
            variants.forEach((v) => {
                if (p._id.toString() === v.productId.toString() && p.categoryId != null) {
                    const exist = matchedProduct.some((s) => { return s._id.toString() === p._id.toString() })
                    if (!exist) {
                        matchedProduct.push(p)
                        // console.log(p)
                        // console.log("matchedProduct array->",matchedProduct)
                    }
                    // console.log("matchedVariants----->",matchedVariants)
                    const variantExist = matchedVariants.some((mv) => {
                        // console.log("matchedVariants->",matchedVariants)
                        return mv.productId.toString() === v.productId.toString()
                    })
                    if (!variantExist) {
                        matchedVariants.push(v)
                        // console.log(v)

                    }
                }
            })

        })
    }


    //   console.log("matchedProduct.length->",matchedProduct.length)
    // console.log("matchedVariants.length->",matchedVariants.length)
    const noOfProducts = matchedProduct.length
    // console.log(noOfProducts)
    const totalPages = Math.ceil(noOfProducts / limit)

    const finalMatchedProduct = matchedProduct.slice(skip, (skip + limit))

    let wishedProductIndexes = []

    for (const [i, value] of finalMatchedProduct.entries()) {
        // console.log(i)
        const userWishlist = await Wishlist.findOne({ userId })
        if (!userWishlist) {
            break
        }
        const index = userWishlist.items.findIndex((item) => {
            //   console.log(item.productId.toString(),value._id.toString())
            return item.productId.toString() === value._id.toString()


        })
        if (index > -1) {
            wishedProductIndexes.push(i)
        }
    }
    // console.log(wishedProductIndexes)


    let sortAlphabeticOrder = false;

    if (sort === "Newest First") {
        matchedVariants.sort((a, b) => { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() })
        // matchedVariants.sort((a,b)=>{return new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()})
    }
    if (sort === "Oldest First") {
        matchedVariants.sort((a, b) => { return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() })
        // matchedVariants.sort((a,b)=>{return new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()})
    }
    if (sort === "A-Z") {
        console.log("executing A-Z");
        finalMatchedProduct.sort((a, b) => { return a.name.localeCompare(b.name) })
        sortAlphabeticOrder = true
    }
    if (sort === "Z-A") {
        finalMatchedProduct.sort((a, b) => { return b.name.localeCompare(a.name) })
        sortAlphabeticOrder = true
    }
    if (sort === "price_low") {
        matchedVariants.sort((a, b) => { return a.salePrice - b.salePrice })
    }
    if (sort === "price_high") {
        matchedVariants.sort((a, b) => { return b.salePrice - a.salePrice })
    }


    //-----listing  offer--------
    console.log("after Sorting", matchedProduct, "after Sorting")

    let offersOfEachProduct = []

    for (let product of finalMatchedProduct) {
        // console.log("product-->",product._id)

        const categoryx = await Product.findOne({ _id: product._id }).populate("categoryId")
        // console.log("category-->",categoryx)
        const offerByCategory = await Offer.findOne({ categoryId: categoryx.categoryId._id, isActive: true })
        const offerByProduct = await Offer.findOne({ productId: product._id, isActive: true })

        if (offerByCategory && offerByProduct) {
            if (offerByCategory.discountPercentage > offerByProduct.discountPercentage) {
                const productOfOfferByCategory = await Product.find({ categoryId: offerByCategory.categoryId }).select('_id')
                offersOfEachProduct.push({ offerPercentage: offerByCategory.discountPercentage, productId: productOfOfferByCategory })
            } else {
                const productOfOfferByProduct = await Product.findOne({ _id: offerByProduct.productId })
                offersOfEachProduct.push({ offerPercentage: offerByProduct.discountPercentage, productId: [productOfOfferByProduct._id] })
            }
        }
        else if (offerByCategory) {
            const productOfOfferByCategory = await Product.find({ categoryId: offerByCategory.categoryId }).select('_id')
            offersOfEachProduct.push({ offerPercentage: offerByCategory.discountPercentage, productId: productOfOfferByCategory })
        }
        else if (offerByProduct) {
            const productOfOfferByProduct = await Product.findOne({ _id: offerByProduct.productId })
            offersOfEachProduct.push({ offerPercentage: offerByProduct.discountPercentage, productId: [productOfOfferByProduct._id] })
        }

    }

    console.log("offersOfEachProduct-->", offersOfEachProduct)
  const categories = await Category.find({});
    return {
        offersOfEachProduct: offersOfEachProduct,
        products: finalMatchedProduct,
        eachProductVariant: matchedVariants,
        sortAlphabeticOrder, totalPages,
        currentPage: page, wishedProductIndexes,
        categories
    };




};




export const productDetailServices = async (
    variantId,
    userId
) => {

    console.log(
        "/user/product/variantId"
    );


    const selectedVariant =
        await ProductVariant.findById(
            variantId
        );


    if (
        !selectedVariant ||
        selectedVariant.list === false
    ) {

        return {
            success: false,
            errorMsg:
                "Variant blocked or not found"
        };

    }


    const product =
        await Product.findById(
            selectedVariant.productId
        );


    if (!product || product.list === false
    ) {

        return {
            success: false,
            errorMsg:
                "Product blocked or not found"
        };

    }


    // =========================================
    // WISHLIST
    // =========================================

    let inWishlist = false;


    const userInWishlist =
        await Wishlist.findOne({
            userId
        });


    if (userInWishlist) {

        const variantExistInWishlist =
            userInWishlist.items.find(
                (item) => {

                    return item.variantId
                        .toString() ===
                        variantId.toString();

                }
            );


        if (variantExistInWishlist) {

            inWishlist = true;

        }

    }


    // =========================================
    // CATEGORY
    // =========================================

    const category =
        await Category.findById(
            product.categoryId
        );


    // =========================================
    // OFFER PRICE
    // =========================================

    const offerPrice =
        await getOfferPriceService({

            productId:
                product._id,

            categoryId:
                product.categoryId,

            salePrice:
                selectedVariant.salePrice

        });


    // =========================================
    // ALL VARIANTS
    // =========================================

    const variants =
        await ProductVariant.find({

            productId:
                product._id,

            list: true

        });


    // =========================================
    // RELATED PRODUCTS
    // =========================================

    let relatedProductsVariants = [];


    const relatedProducts =
        await Product.find({

            categoryId:
                product.categoryId,

            _id: {
                $ne: product._id
            },

            list: true

        }).limit(4);


    for (
        let product of relatedProducts
    ) {

        let tempVariant =
            await ProductVariant.findOne({

                productId:
                    product._id,

                list: true

            });


        if (tempVariant) {

            relatedProductsVariants.push(
                tempVariant
            );

        }

    }


    // =========================================
    // RETURN
    // =========================================

    return {

        success: true,

        product,

        variants,

        selectedVariant,

        category,

        relatedProducts,

        relatedProductsVariants,

        inWishlist,

        offerPrice

    };

};





export const newProductDetailServices = async (
    productId,
    variantId,
    userId
) => {

    const product =
        await Product.findById(productId);


    if (!product || !product.list) {

        return {
            success: false,
            errorMsg:
                "Product is unavailable."
        };

    }


    const selectedVariant =
        await ProductVariant.findOne({

            _id: variantId,

            productId,

            list: true

        });


    if (!selectedVariant) {

        return {
            success: false,
            errorMsg:
                "Variant is unavailable."
        };

    }


    // =========================================
    // WISHLIST
    // =========================================

    let inWishlist = false;


    const userInWishlist =
        await Wishlist.findOne({
            userId
        });


    if (userInWishlist) {

        const variantExistInWishlist =
            userInWishlist.items.find(
                (item) => {

                    return item.variantId
                        .toString() ===
                        variantId.toString();

                }
            );


        if (variantExistInWishlist) {

            inWishlist = true;

        }

    }


    // =========================================
    // VARIANTS
    // =========================================

    const variants =
        await ProductVariant.find({

            productId,

            list: true

        });


    // =========================================
    // CATEGORY
    // =========================================

    const category =
        await Category.findById(
            product.categoryId
        );


    // =========================================
    // OFFER PRICE
    // =========================================

    const offerPrice =
        await getOfferPriceService({

            productId:
                product._id,

            categoryId:
                product.categoryId,

            salePrice:
                selectedVariant.salePrice

        });


    // =========================================
    // RELATED PRODUCTS
    // =========================================

    let relatedProductsVariants = [];


    const relatedProducts =
        await Product.find({

            categoryId:
                product.categoryId,

            _id: {
                $ne: product._id
            },

            list: true

        }).limit(4);


    for (
        let product of relatedProducts
    ) {

        let tempVariant =
            await ProductVariant.findOne({

                productId:
                    product._id,

                list: true

            });


        if (tempVariant) {

            relatedProductsVariants.push(
                tempVariant
            );

        }

    }


    // =========================================
    // RETURN
    // =========================================

    return {

        success: true,

        product,

        variants,

        selectedVariant,

        category,

        relatedProducts,

        relatedProductsVariants,

        inWishlist,

        offerPrice

    };

};


export const addToCartService = async ({ userId, variantId, size, quantity }) => {
    console.log("quantity--->", quantity)
    const variant = await ProductVariant.findById(variantId);

    if (!variant || !variant.list) {
        return { success: false, message: "Variant not available" };
    }

    const product = await Product.findById(variant.productId);

    if (!product || !product.list) {
        return { success: false, message: "Product not available" };
    }

    const sizeObj = variant.sizeAndStock.find(
        s => Number(s.size) === Number(size)
    );

    if (!sizeObj) {
        return { success: false, message: "Invalid size" };
    }
    console.log(sizeObj)

    // if(sizeObj.stock<=0){
    //     return { success: false, message: "NO Stock" };
    // }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
        cart = new Cart({
            userId,
            items: []
        });
    }

    const inWishlist = await Wishlist.findOne({ userId })
    if (inWishlist) {
        const index = inWishlist.items.findIndex((item) => {
            return item.productId.toString() === product._id.toString()
        })
        if (index > -1) {
            inWishlist.items.splice(index, 1)
            await inWishlist.save()
        }
    }

    const existingItem = cart.items.find(
        item =>
            item.variantId.toString() === variantId &&
            Number(item.size) === Number(size)
    );
    // console.log("this is the object of the product details where the product already exist--> ",existingItem)
    if (existingItem) {

        const newQty = existingItem.quantity + quantity;

        if (newQty > sizeObj.stock) {
            return {
                success: false,
                message: "Not enough stock available reduce the stock quantity"
            };
        }

        if (newQty > 5) {
            return {
                success: false,
                message: "Maximum limit per item is 5 per variant"
            };
        }

        existingItem.quantity = newQty;

    } else {

        if (quantity > sizeObj.stock) {
            console.log("HEY I AM  SUPPOSED TO SEE cause NO Stock......")
            return {
                success: false,
                message: "Not enough stock"
            };
        }

        if (quantity > 5) {
            return {
                success: false,
                message: "Maximum limit per item is 5 per variant"
            };
        }

        cart.items.push({
            productId: product._id,
            variantId,
            size,
            quantity
        });
    }
    await cart.save();
    const newTotalCartCount = cart.items.length
    return {
        success: true,
        message: "Added to cart",
        newTotalCartCount
    };
};

export const getCartService = async (userId) => {

    const cart = await Cart.findOne({ userId })

        .populate("items.productId")

        .populate("items.variantId");


    if (!cart) {

        return {
            success: true,
            cartItems: [],
            total: 0,
            totalQuantity: 0,
            totalProducts: 0
        };

    }


    let total = 0;

    let totalQuantity = 0;


    // =========================================
    // CALCULATE CART TOTAL
    // =========================================

    for (const item of cart.items) {

        const product =
            item.productId;

        const variant =
            item.variantId;


        // Safety check
        if (!product || !variant) {
            continue;
        }


        // =========================================
        // GET OFFER PRICE
        // =========================================

        const offerPrice =
            await getOfferPriceService({

                productId:
                    product._id,

                categoryId:
                    product.categoryId,

                salePrice:
                    variant.salePrice

            });


        // =========================================
        // ATTACH PRICE FOR EJS
        // =========================================

        item.offerPrice =
            offerPrice;


        // =========================================
        // USE FINAL PRICE
        // =========================================

        const price =
            offerPrice.finalPrice;


        item.calculatedPrice =
            price;


        item.calculatedSubtotal =
            price * item.quantity;


        // =========================================
        // CART TOTAL
        // =========================================

        total +=
            item.calculatedSubtotal;


        totalQuantity +=
            item.quantity;

    }


    const totalProducts =
        cart.items.length;


    return {

        success: true,

        cartItems:
            cart.items,

        total,

        totalQuantity,

        totalProducts

    };

};

export const updateCartQtyService = async ({
    userId,
    variantId,
    size,
    action
}) => {

    const cart = await Cart.findOne({ userId })

        .populate("items.productId")

        .populate("items.variantId");

    if (!cart) {

        return {
            success: false,
            message: "Cart not found."
        };

    }

    const item = cart.items.find(item =>

        item.variantId._id.toString() === variantId &&
        Number(item.size) === Number(size)

    );

    if (!item) {

        return {
            success: false,
            message: "Item not found."
        };

    }

    const variant = await ProductVariant.findById(variantId);

    if (!variant || !variant.list) {

        return {
            success: false,
            message: "Product unavailable."
        };

    }

    const sizeData = variant.sizeAndStock.find(s => s.size === size);

    if (!sizeData) {

        return {
            success: false,
            message: "Invalid size."
        };

    }

    if (action === "inc") {

        if (item.quantity >= sizeData.stock) {

            return {
                success: false,
                message: "Stock limit reached for this variant, admin has to restock it."
            };

        }

        if (item.quantity >= 5) {

            return {
                success: false,
                message: "Maximum quantity is 5 per variant."
            };

        }

        item.quantity++;

    }

    else if (action === "dec") {

        if (item.quantity > 1) {

            item.quantity--;

        }

    }

    await cart.save();
    let total = 0;

    cart.items.forEach(item => {
        total += item.variantId.salePrice * item.quantity;
    });

    let totalQuantity = 0
    cart.items.forEach((item) => {
        totalQuantity = totalQuantity + item.quantity
    })
    let totalProducts = cart.items.length
    console.log("total,totalQuantity->", total, totalQuantity)
    return {
        success: true,
        quantity: item.quantity,
        subtotal: item.quantity * variant.salePrice,
        total, totalQuantity, totalProducts
    };
};
export const removeFromCartService = async ({ userId, variantId, size }) => {

    const cart = await Cart.findOne({ userId })

        .populate("items.productId")

        .populate("items.variantId");

    if (!cart) {

        return {
            success: false,
            message: "Cart not found"
        };
    }

    const itemIndex = cart.items.findIndex(item =>

        item.variantId._id.toString() === variantId &&
        Number(item.size) === Number(size)

    );

    if (itemIndex === -1) {

        return {
            success: false,
            message: "Item not found in cart"
        };

    }

    // remove 
    cart.items.splice(itemIndex, 1);
    await cart.save();

    let total = 0;

    cart.items.forEach(item => {
        // console.log("item.variantId.salePrice->",item.variantId)
        total += item.variantId.salePrice * item.quantity;
    });

    let totalQuantity = 0
    cart.items.forEach((item) => {
        totalQuantity = totalQuantity + item.quantity
    })
    let totalProducts = cart.items.length
    return {
        success: true,
        message: "Item removed from cart",
        total, totalQuantity, totalProducts
    };

};

//wishlist---------------------------------------------------------------------------------------------------------------------------------------------
export const getWishlistPageService = async (userId) => {
    console.log("services executed")
    const userWishlist = await Wishlist.findOne({ userId: userId })
    console.log("userWishlist->", userWishlist)

    if (!userWishlist) {
        return { success: true, productsOfWishlist: [] }
    }
    const productsOfWishlist = []
    for (let item of userWishlist.items) {
        const variant = await ProductVariant.findById({ _id: item.variantId }).populate({ path: "productId", match: { _id: item.productId } }).sort({ createdAt: -1 })
        productsOfWishlist.push({
            productId: variant.productId,
            variantId: variant,
            size: item.size
        })

    }
    console.log("after pushing the products in productsOfWishlist")
    console.log("productsOfWishlist->", productsOfWishlist)
    // if(productsOfWishlist.length>=1){
    //     return{success:true,productsOfWishlist}
    // }else{
    //     return {success:true,message:"Your wishlist is currently empty."}
    // }
    productsOfWishlist.sort((a, b) => {
        return b.variantId.createdAt - a.variantId.createdAt;
    });
    if (productsOfWishlist.length === 0) {
        return { success: true, productsOfWishlist: [] }
    }
    return { success: true, productsOfWishlist }
}


export const addAndRemoveService = async (userId, variantId, size, action, fromListPage) => {
    console.log("services for addAndRemove wishlist executed")

    let userSWishlist = await Wishlist.findOne({ userId })
    // console.log("userSWishlist->",userSWishlist)

    const variant = await ProductVariant.findById(variantId)
    if (!variant || !variant.list) {
        return { success: false, error: "Variant Unavailable" }
    }
    // console.log("variant->",variant)

    const product = await Product.findOne({ _id: variant.productId })
    if (!product || !product.list) {
        return { success: false, error: "Product Unavailable" }
    }
    // console.log("product->",product)

    if (action === "add") {
        console.log("inside the add action")
        if (!userSWishlist) {

            userSWishlist = new Wishlist({
                userId,
                items: []
            })
            userSWishlist.items.push({ productId: product._id, variantId: variant._id, size: size })
            console.log("after pushing the variantId,productId,size in the userSwishlist->", userSWishlist)
            await userSWishlist.save()
            const newTotalCount = userSWishlist.items.length
            return { success: true, newTotalCount }
        }

        console.log("wishlist if user already have")
        const productInWishlist = userSWishlist.items.findIndex((item) => {
            return item.variantId.toString() === variantId.toString() && item.productId.toString() === product._id.toString()
        })

        if (productInWishlist === -1) {
            userSWishlist.items.push({ variantId: variant._id, productId: product._id, size })
        }
        console.log("wishlist after the user have already a wishlist and after pushing the product", userSWishlist)
        await userSWishlist.save()
        const newTotalCount = userSWishlist.items.length
        return { success: true, newTotalCount }

    } else {
        console.log("else block executed")
        console.log(fromListPage)
        if (fromListPage) {
            console.log("foromListPage->", true)
            if (!userSWishlist) {
                return { success: false, error: "User haven't added any product to wishlist" }
            }
            console.log(product._id.toString())
            const index = userSWishlist.items.findIndex((item) => {
                return item.productId.toString() === product._id.toString()
            })
            console.log("index->", index)
            if (index > -1) {
                console.log("executing splice")
                userSWishlist.items.splice(index, 1)
                await userSWishlist.save()
                const newTotalCount = userSWishlist.items.length
                return { success: true, newTotalCount }
            }
            else {
                return { success: false, error: "Product Not Found" }
            }

        }


        if (!userSWishlist) {
            return { success: false, error: "User haven't added any product to wishlist" }
        }

        const index = userSWishlist.items.findIndex((item) => {
            return item.variantId.toString() === variant._id.toString() && item.productId.toString() === product._id.toString()
        })
        console.log("index->", index)
        if (index > -1) {
            console.log("executing splice")
            userSWishlist.items.splice(index, 1)
            console.log("userSWishlist after the product is removed from the wishlist", userSWishlist)
            await userSWishlist.save()
            const newTotalCount = userSWishlist.items.length
            return { success: true, newTotalCount }
        }
        else {
            return { success: false, error: "Product Not Found" }
        }
    }
}




export const checkoutPageServices = async (userId) => {

    try {

        // ADDRESSES

        const address = await Address.find({
            userId: userId
        });


        // CART

        const userCart = await Cart.findOne({
            userId: userId
        });


        if (!userCart) {

            return {

                cart: [],

                address,

                productAndVariant: [],

                subtotal: 0,

                grandTotal: 0,

                shipping: 0
            };

        }

        const cart = userCart;

        // PRODUCTS

        let productAndVariant = [];

        let subtotal = 0;


        for (const item of userCart.items) {

            const variant =
                await ProductVariant
                    .findOne({
                        _id: item.variantId
                    })
                    .populate("productId");


            if (!variant) {
                continue;
            }


            // OFFER PRICE

            const offerPrice =
                await getOfferPriceService({

                    productId:
                        variant.productId._id,

                    categoryId:
                        variant.productId.categoryId,

                    salePrice:
                        variant.salePrice

                });


            // FINAL PRICE PER ITEM

            const finalPrice =
                offerPrice.finalPrice;


            // ITEM SUBTOTAL

            const itemTotal =
                finalPrice * item.quantity;


            subtotal += itemTotal;


            // SEND OFFER INFORMATION TO EJS

            productAndVariant.push({

                variant,

                offerPrice,

                quantity:
                    item.quantity,

                itemTotal

            });

        }


        // GRAND TOTAL
        const shipping = 50
        const grandTotal =
            subtotal + shipping


        // COUPONS

        const coupons =
            await Coupon.find({

                isActive: true,

                expiryDate: {
                    $gte: new Date()
                },

                $expr: {
                    $lt: [
                        "$usageCount",
                        "$usageLimit"
                    ]
                },

                usedBy: {
                    $nin: [userId]
                }

            });


        console.log("coupons for this user->",coupons)
        return {

            cart,

            address,

            productAndVariant,

            subtotal,

            grandTotal,

            coupons,

            shipping

        };


    } catch (error) {

        console.log(
            "error from checkout service->",
            error
        );

        return {
            success: false
        };

    }

};






export const orderPlaceService = async (
    selectedAddressId,
    paymentMethod,
    userId,
    couponId
) => {

    try {


        // 1. GET ADDRESS

        const address = await Address.findById(selectedAddressId);

        if (!address) {

            return {
                success: false,
                message: "Address not found"
            };

        }



        // 2. GET CART

        const userCart = await Cart.findOne({ userId });

        if (!userCart || userCart.items.length === 0) {
            return {
                success: false,
                message: "Cart is empty"
            };

        }

        // 3. CHECK PRODUCTS / STOCK

        let outOfStock = [];
        let unavailable = [];

        for (const item of userCart.items) {

            const variant = await ProductVariant.findById(item.variantId).populate("productId");


            if (!variant || !variant.list || !variant.productId || !variant.productId.list) {
                unavailable.push(variant);
                continue;
            }


            const sizeStock = variant.sizeAndStock.find(sizeItem => sizeItem.size === item.size);


            if (!sizeStock || sizeStock.stock < item.quantity) {
                outOfStock.push(variant);
            }

        }

        // 4. OUT OF STOCK

        if (outOfStock.length > 0) {

            return {

                success: false,

                type: "outOfStock",

                message:
                    "Some products are out of stock",

                products:
                    outOfStock.map(item => ({

                        name:
                            item.productId.name,

                        variantId:
                            item._id

                    }))

            };

        }

        // 5. UNAVAILABLE PRODUCTS

        if (unavailable.length > 0) {

            return {

                success: false,

                type: "unavailable",

                message:
                    "Some products are unavailable",

                products:
                    unavailable.map(item => ({

                        name:
                            item?.productId?.name ||
                            "Unavailable product",

                        variantId:
                            item?._id

                    }))

            };

        }

        // 6. PREPARE ORDER ITEMS


        const orderItemsData = [];

        let offerSubtotal = 0;


        for (const item of userCart.items) {

            const variant =
                await ProductVariant.findById(
                    item.variantId
                ).populate("productId");


            const product =
                variant.productId;



            // FIND PRODUCT / CATEGORY OFFER


            const offerPrice =
                await calculateOfferPrice(
                    product,
                    variant
                );


            // Price after product/category offer
            const finalOfferPrice =
                offerPrice.finalPrice;


            // =================================================
            // OFFER DISCOUNT AMOUNT
            // =================================================

            const offerDiscountAmount =
                Math.round(
                    (
                        variant.salePrice -
                        finalOfferPrice
                    ) * 100
                ) / 100;


            // =================================================
            // ITEM SUBTOTAL BEFORE COUPON
            // =================================================

            const itemSubtotal =
                Math.round(
                    (
                        finalOfferPrice *
                        item.quantity
                    ) * 100
                ) / 100;


            offerSubtotal += itemSubtotal;


            // =================================================
            // CREATE ORDER ITEM
            // =================================================

            orderItemsData.push({

                productId: product._id,

                variantId: variant._id,

                productName: product.name,

                productImage: variant.images[0],

                size: item.size,

                quantity: item.quantity,

                // Original product price
                regularPrice: variant.regularPrice,

                // Price after product/category offer
                salePrice: finalOfferPrice,

                // Offer information
                offerApplied: offerPrice.offerApplied,

                offerDiscountPercentage:
                    offerPrice.discountPercentage,

                offerDiscountAmount:
                    offerDiscountAmount,

                // Price before coupon
                itemSubtotal: itemSubtotal,

                // Will be updated if coupon exists
                couponDiscount: 0,

                // Will be updated if coupon exists
                paidAmount: itemSubtotal,

                itemStatus: "Confirmed",

                cancelReason: null,

                returnReason: null,

                cancelledAt: null,

                deliveredAt: null,

                returnedAt: null,

                returnRequest: {

                    requested: false,

                    reason: null,

                    status: "Pending"

                },

                paymentStatus: "Pending"

            });

        }


        // 7. COUPON VALIDATION

        let couponDiscount = 0;

        let coupon = null;


        if (couponId) {

            coupon = await Coupon.findById(couponId);


            if (!coupon) {

                return {

                    success: false,

                    message:
                        "Coupon not found"

                };

            }


            // ACTIVE


            if (!coupon.isActive) {

                return {

                    success: false,

                    message:
                        "Coupon is not active"

                };

            }

            // EXPIRY
            if (new Date() > new Date(coupon.expiryDate)) {

                return {

                    success: false,

                    message:
                        "Coupon has expired"

                };
            }


            // USER ALREADY USED

            const alreadyUsed = coupon.usedBy.some(
                id =>
                    id.toString() ===
                    userId.toString()
            );


            if (alreadyUsed) {

                return {

                    success: false,

                    message:
                        "You have already used this coupon"

                };

            }



            // USAGE LIMIT

            if (
                coupon.usageCount >=
                coupon.usageLimit
            ) {

                return {

                    success: false,

                    message:
                        "Coupon usage limit reached"

                };

            }


            // -------------------------------------------------
            // MINIMUM CART VALUE
            // -------------------------------------------------

            if (
                offerSubtotal <
                coupon.minimumCartValue
            ) {

                return {

                    success: false,

                    message:
                        `Minimum cart value should be ₹${coupon.minimumCartValue}`

                };

            }


            // -------------------------------------------------
            // CALCULATE COUPON DISCOUNT
            // -------------------------------------------------

            if (
                coupon.discountType ===
                "percentage"
            ) {

                couponDiscount =
                    offerSubtotal *
                    coupon.discountValue /
                    100;

            }

            else if (
                coupon.discountType ===
                "fixed"
            ) {

                couponDiscount =
                    coupon.discountValue;

            }


            // Coupon cannot exceed subtotal

            if (couponDiscount > offerSubtotal) {

                couponDiscount =
                    offerSubtotal;

            }


            couponDiscount = Math.round(couponDiscount * 100) / 100;

        }


        // =====================================================
        // 8. DISTRIBUTE COUPON AMONG ITEMS
        // =====================================================

        let distributedDiscount = 0;


        if (couponDiscount > 0) {

            orderItemsData.forEach(
                (item, index) => {

                    let itemDiscount;


                    // -----------------------------------------
                    // LAST ITEM GETS REMAINING AMOUNT
                    // -----------------------------------------

                    if (index === orderItemsData.length - 1) {

                        itemDiscount = couponDiscount - distributedDiscount;

                    }

                    else {

                        itemDiscount =
                            (
                                item.itemSubtotal /
                                offerSubtotal
                            ) *
                            couponDiscount;


                        itemDiscount =
                            Math.round(
                                itemDiscount * 100
                            ) / 100;


                        distributedDiscount +=
                            itemDiscount;

                    }


                    itemDiscount =
                        Math.round(
                            itemDiscount * 100
                        ) / 100;


                    // STORE ITEM COUPON DISCOUNT

                    item.couponDiscount = itemDiscount;


                    // ACTUAL AMOUNT USER PAID

                    item.paidAmount = Math.round((item.itemSubtotal - itemDiscount) * 100) / 100;

                }
            );

        }


        // 9. FINAL GRAND TOTAL

        const shipping = 50
        const grandTotal = Math.round(((shipping + offerSubtotal) - couponDiscount) * 100) / 100;


        // 10. CREATE ORDER

        const orderId =
            "ORD-" +
            crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase();


        const newOrder = new Order({

            orderId,

            userId,

            shippingAddress: {

                firstName: address.firstName,
                lastName: address.lastName,
                phoneNumber: address.phoneNumber,
                address: address.address,
                city: address.city,
                state: address.state,
                pincode: address.pincode

            },

            orderItems: orderItemsData,

            subtotal: offerSubtotal,

            couponDetails: coupon ? { discountType: coupon.discountType, discountValue: coupon.discountValue, minimumCartValue: coupon.minimumCartValue } : { discountType: null, discountValue: 0, minimumCartValue: 0 },

            grandTotal,

            paymentMethod,

            paymentStatus: "Pending",

            orderStatus: "Confirmed"

        });


        // 11. REDUCE STOCK

        for (const item of userCart.items) {

            const variant =
                await ProductVariant.findById(
                    item.variantId
                );


            if (!variant) {
                continue;
            }


            const sizeStock =
                variant.sizeAndStock.find(
                    sizeItem =>
                        sizeItem.size ===
                        item.size
                );


            if (sizeStock) {

                sizeStock.stock -=
                    item.quantity;

            }


            await variant.save();

        }


        // 12. SAVE ORDER

        await newOrder.save();


        // 13. UPDATE COUPON USAGE

        if (coupon) {

            await Coupon.findByIdAndUpdate(
                coupon._id,
                {

                    $inc: {
                        usageCount: 1
                    },

                    $addToSet: {
                        usedBy: userId
                    }

                }
            );

        }


        // 14. CLEAR CART

        userCart.items = [];

        await userCart.save();


        // 15. SUCCESS

        return {

            success: true,

            orderId:
                newOrder._id,

            grandTotal,

            couponDiscount

        };


    } catch (error) {

        console.log(
            "Error in orderPlaceService:",
            error
        );


        return {

            success: false,

            message:
                "Unable to place order"

        };

    }

};



export const calculateOfferPrice = async (
    product,
    variant
) => {

    // FIND PRODUCT OFFER

    const productOffer =
        await Offer.findOne({

            offerType: "product",

            productId: product._id,

            isActive: true,

            endDate: {
                $gt: new Date()
            }

        });


    // FIND CATEGORY OFFER

    const categoryOffer =
        await Offer.findOne({

            offerType: "category",

            categoryId: product.categoryId,

            isActive: true,

            endDate: {
                $gt: new Date()
            }

        });


    // GET DISCOUNT PERCENTAGES

    const productDiscount =
        productOffer
            ? productOffer.discountPercentage
            : 0;


    const categoryDiscount =
        categoryOffer
            ? categoryOffer.discountPercentage
            : 0;


    // LARGEST OFFER

    const highestDiscount = Math.max(productDiscount, categoryDiscount);


    // NO OFFER

    if (highestDiscount === 0) {

        return {

            offerApplied: false,

            discountPercentage: 0,

            finalPrice:
                variant.salePrice

        };

    }


    // CALCULATE OFFER PRICE

    const discountAmount = (variant.salePrice * highestDiscount) / 100;


    const finalPrice = Math.round((variant.salePrice - discountAmount) * 100) / 100;


    return {

        offerApplied: true,

        discountPercentage:
            highestDiscount,

        finalPrice

    };

};


export const orderSuccessServices = async (id) => {

    const order = await Order.findById(id)
    console.log("order->", order)

    if (order) {

        return {
            success: true, order
        }
    }
    else {

        console.log("else executed")
        return {
            sucess: false, message: "NO order Places"
        }

    }
}

export const ordersPageService = async ({ userId, search, sort, page }) => {

    const limit = 5;
    const skip = (page - 1) * limit;
    let query = { userId }

    if (search) {
        query.orderId = {
            $regex: search,
            $options: "i"
        };
    }
    let sortQuery = {};
    if (sort === "oldest") {
        sortQuery.createdAt = 1
    }
    else {
        sortQuery.createdAt = -1
    }
    const totalOrders = await Order.countDocuments(query)
    const orders = await Order.find(query).sort(sortQuery).skip(skip).limit(limit)

    return {
        success: true,
        orders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit)
    };

}


export const userOrderDetailsService = async (orderId, userId) => {


    const order = await Order.findOne({ _id: orderId, userId: userId });
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




export const cancelOrderItemService = async (orderId, itemId, reason) => {

    const order = await Order.findById(orderId);
    if (!order) {

        return {
            success: false,
            message: "Order not found"
        };

    }


    const item = order.orderItems.id(itemId);
    if (!item) {

        return {
            success: false,
            message: "Product not found"
        };

    }

    // CHECK CANCELLATION STATUS

    const blockedStatus = [
        "Shipped",
        "Delivered",
        "Cancelled",
        "Returned"
    ];

    if (blockedStatus.includes(item.itemStatus)) {
        return {
            success: false,
            message: "This product cannot be cancelled .product has gone through the shipping"
        };
    }

    //COD
    let refundAmount = 0
    if (order.paymentMethod === "Cash on Delivery") {

        if (order.couponDetails?.discountType) {

            let remainingCartValue = 0;

            for (const eachItem of order.orderItems) {

                if (eachItem._id.toString() === item._id.toString()) {
                    continue;
                }

                if (eachItem.itemStatus === "Cancelled" || eachItem.itemStatus === "Returned") {
                    continue;
                }

                remainingCartValue += eachItem.itemSubtotal;
            }

            if (order.couponDetails.minimumCartValue > remainingCartValue) {
                return {
                    success: false,
                    message: `this order has placed by appliying coupon. cancelling this product is lesser makes the order grandTotal lesser thn the minimun cart value .so cannot able to cancel this product .if you want you can cancel the whole order`
                }
            }

        }

        item.itemStatus = "Cancelled"
        item.cancelledAt = new Date()
        item.cancelReason = reason
        item.paymentStatus = "Pending"

        let grandTotolAfterCancel = Math.max(0, order.grandTotal - item.paidAmount)

        console.log("grandTotolAfterCancel-->", grandTotolAfterCancel)
        order.grandTotal = grandTotolAfterCancel



    } else {

        if (order.couponDetails?.discountType) {

            let remainingCartValue = 0;

            for (const eachItem of order.orderItems) {

                if (eachItem._id.toString() === item._id.toString()) {
                    continue;
                }

                if (eachItem.itemStatus === "Cancelled" || eachItem.itemStatus === "Returned") {
                    continue;
                }

                remainingCartValue += eachItem.itemSubtotal;
            }

            if (order.couponDetails.minimumCartValue > remainingCartValue) {
                return {
                    success: false,
                    message: `this order has placed by appliying coupon. cancelling this product is lesser makes the order grandTotal lesser thn the minimun cart value .so cannot able to cancel this product .if you want you can cancel the whole order`
                }
            }

        }


        // REFUND AMOUNT
        refundAmount = item.paidAmount;


        // CREDIT WALLET
        const walletResult = await creditWalletService({

            userId: order.userId,

            amount: refundAmount,

            orderId: order._id,

            description:
                `Refund for cancelled product - ${item.productName}`

        });


        if (!walletResult.success) {
            return walletResult;
        }



        // UPDATE ITEM

        item.itemStatus = "Cancelled"
        item.cancelledAt = new Date()
        item.cancelReason = reason
        item.paymentStatus = "Refunded"


        // UPDATE ORDER TOTAL

        order.grandTotal = Math.max(0, order.grandTotal - refundAmount)

    }
    // RESTORE STOCK

    const variant = await ProductVariant.findById(item.variantId)

    if (variant) {

        const sizeStock = variant.sizeAndStock.find(stock => stock.size === item.size)
        if (sizeStock) {
            sizeStock.stock += item.quantity
            await variant.save()

        }

    }

    // CHECK ALL ITEMS

    const allItemsCancelled = order.orderItems.every(
        orderItem =>
            orderItem.itemStatus === "Cancelled" ||
            orderItem.itemStatus === "Returned"
    );


    if (allItemsCancelled) {

        // Entire order is cancelled
        order.orderStatus = "Cancelled"

        // Entire order payment is refunded
        order.paymentStatus = "Refunded"

    }

    // SAVE ORDER

    await order.save();


    return {

        success: true,

        message: "Product cancelled successfully",

        refundAmount: refundAmount || 0

    };

};



export const returnOrderItemService = async (orderId, itemId, reason) => {

    const order = await Order.findById(orderId);

    if (!order) {
        return {
            success: false,
            message: "Order not found"
        }
    }

    const item = order.orderItems.id(itemId);

    if (!item) {

        return {
            success: false,
            message: "Product not found"
        }

    }

    if (item.itemStatus !== "Delivered") {

        return {
            success: false,
            message:
                "Only delivered products can be returned"

        }

    }

    if (item.returnRequest.requested) {
        return {
            success: false,
            message: "Return request already submitted"
        }

    }


    if (order.couponDetails?.discountType) {

        let remainingCartValue = 0;

        for (const eachItem of order.orderItems) {

            if (eachItem._id.toString() === item._id.toString()) {
                continue;
            }

            if (eachItem.itemStatus === "Cancelled" || eachItem.itemStatus === "Returned") {
                continue;
            }

            remainingCartValue += eachItem.itemSubtotal;
        }

        if (order.couponDetails.minimumCartValue > remainingCartValue) {
            return {
                success: false,
                message: `this order has placed by appliying coupon. cancelling this product is lesser makes the order grandTotal lesser thn the minimun cart value .so cannot able to cancel this product .if you want you can cancel the whole order`
            }
        }

    }

    item.returnRequest.requested = true;
    item.returnRequest.reason = reason;
    item.returnRequest.status = "Pending";

    await order.save();



    return {
        success: true,
        message: "Return request submitted"
    }

}


export const downloadInvoiceService = async (orderId) => {


    const order = await Order.findById(orderId);



    if (!order) {

        return {

            success: false,

            message: "Order not found"

        }

    }



    // Invoice allowed only after delivery

    if (order.orderStatus !== "Delivered") {


        return {

            success: false,

            message: "Invoice available after delivery"

        }


    }

    return { success: true, order }


}



export const validateCheckoutService = async (userId) => {

    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
        return {
            success: false,
            message: "Your cart is empty."
        };
    }

    const unavailableProducts = [];
    const outOfStockProducts = [];


    for (const item of cart.items) {

        const variant = await ProductVariant
            .findOne({
                _id: item.variantId
            })
            .populate({
                path: "productId",
                populate: {
                    path: "categoryId"
                }
            });


        // --------------------------------
        // VARIANT DOES NOT EXIST
        // --------------------------------

        if (!variant) {

            unavailableProducts.push({
                name: "Unknown product",
                reason: "Product variant no longer exists"
            });

            continue;
        }


        // --------------------------------
        // PRODUCT DOES NOT EXIST
        // --------------------------------

        if (!variant.productId) {

            unavailableProducts.push({
                name: "Unknown product",
                reason: "Product no longer exists"
            });

            continue;
        }


        // --------------------------------
        // VARIANT / PRODUCT / CATEGORY LIST
        // --------------------------------

        if (
            !variant.list ||
            !variant.productId.list ||
            !variant.productId.categoryId?.list
        ) {

            unavailableProducts.push({
                name: variant.productId.name,
                reason: "Product is unavailable"
            });

            continue;
        }


        // --------------------------------
        // FIND SELECTED SIZE
        // --------------------------------

        const sizeData = variant.sizeAndStock.find(
            eachSize =>
                Number(eachSize.size) === Number(item.size)
        );


        if (!sizeData) {

            unavailableProducts.push({
                name: variant.productId.name,
                reason: `Size ${item.size} is no longer available`
            });

            continue;
        }


        // --------------------------------
        // CHECK STOCK AGAINST CART QUANTITY
        // --------------------------------

        if (sizeData.stock < item.quantity) {

            outOfStockProducts.push({
                name: variant.productId.name,
                size: item.size,
                requestedQuantity: item.quantity,
                availableStock: sizeData.stock
            });

            continue;
        }
    }


    // --------------------------------
    // ANY PROBLEMATIC PRODUCTS?
    // --------------------------------

    if (
        unavailableProducts.length > 0 ||
        outOfStockProducts.length > 0
    ) {

        return {
            success: false,

            message:
                "Some products in your cart cannot be purchased.",

            unavailableProducts,

            outOfStockProducts
        };
    }


    // --------------------------------
    // EVERYTHING IS VALID
    // --------------------------------

    return {
        success: true,
        message: "Cart is ready for checkout"
    };
};






export const createRazorpayOrderService = async (
    userId,
    couponId
) => {

    try {

        const cart = await Cart.findOne({ userId }).populate("items.productId").populate("items.variantId");


        if (!cart || cart.items.length === 0) {
            return {
                success: false,
                message: "Cart is empty"
            };
        }


        let subtotal = 0;



        // CALCULATE ITEMS + OFFERS

        for (const item of cart.items) {

            const variant = item.variantId;
            const product = item.productId;


            if (!variant || !variant.list) {

                return {
                    success: false,
                    message: "One or more products are unavailable"
                };

            }



            // STOCK CHECK

            const sizeStock =
                variant.sizeAndStock.find(
                    s => s.size === item.size
                );


            if (
                !sizeStock ||
                sizeStock.stock < item.quantity
            ) {

                return {
                    success: false,
                    message:
                        `Insufficient stock for ${product.name}`
                };

            }


            // OFFER CALCULATION

            const offerResult = await getOfferPriceService({
                productId: product._id,
                categoryId: product.categoryId,
                salePrice: variant.salePrice
            });




            // ITEM FINAL PRICE

            const itemFinalPrice = offerResult.finalPrice;


            // ITEM TOTAL

            const itemTotal = itemFinalPrice * item.quantity;


            subtotal += itemTotal;



        }


        subtotal =
            Math.round(subtotal * 100) / 100;



        // COUPON CALCULATION


        let couponDiscount = 0;

        let coupon = null;


        if (couponId) {

            coupon =
                await Coupon.findById(couponId);


            if (!coupon) {

                return {
                    success: false,
                    message: "Coupon not found"
                };

            }



            // COUPON VALIDATION


            if (!coupon.isActive) {

                return {
                    success: false,
                    message: "Coupon is not active"
                };

            }


            if (
                new Date() >
                new Date(coupon.expiryDate)
            ) {

                return {
                    success: false,
                    message: "Coupon has expired"
                };

            }


            const alreadyUsed =
                coupon.usedBy.some(
                    id =>
                        id.toString() ===
                        userId.toString()
                );


            if (alreadyUsed) {

                return {
                    success: false,
                    message:
                        "You have already used this coupon"
                };

            }


            if (
                coupon.usageCount >=
                coupon.usageLimit
            ) {

                return {
                    success: false,
                    message:
                        "Coupon usage limit reached"
                };

            }



            // MINIMUM CART VALUE


            if (subtotal < coupon.minimumCartValue) {

                return {
                    success: false,
                    message:
                        `Minimum cart value should be ₹${coupon.minimumCartValue}`
                };

            }



            // DISCOUNT


            if (coupon.discountType === "percentage") {

                couponDiscount = subtotal * coupon.discountValue / 100;

            }


            else if (coupon.discountType === "fixed") {

                couponDiscount = coupon.discountValue;

            }


            // Don't exceed subtotal

            if (couponDiscount > subtotal) {

                couponDiscount = subtotal;

            }

            couponDiscount = Math.round(couponDiscount * 100) / 100;

        }


        // =========================================
        // GRAND TOTAL
        // =========================================
        const shipping = 50
        const grandTotal = Math.round(((subtotal + shipping) - couponDiscount) * 100) / 100;


        // =========================================
        // CREATE RAZORPAY ORDER
        // =========================================

        const razorpayOrder =
            await razorpay.orders.create({

                amount:
                    Math.round(
                        grandTotal * 100
                    ),

                currency: "INR",

                receipt:
                    `receipt_${Date.now()}`

            });


        return {

            success: true,

            razorpayOrder,

            subtotal,

            couponDiscount,

            grandTotal

        };


    } catch (error) {

        console.log(
            "Error in createRazorpayOrderService:",
            error
        );


        return {

            success: false,

            message:
                "Unable to create Razorpay order"

        };

    }

};






export const verifyRazorpayPaymentService = async ({
    userId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    selectedAddressId, couponId
}) => {

    try {

        // 1. VERIFY RAZORPAY SIGNATURE


        const body =
            razorpay_order_id + "|" + razorpay_payment_id;


        const expectedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(body)
                .digest("hex");


        if (expectedSignature !== razorpay_signature) {

            return {
                success: false,
                message: "Payment verification failed"
            };

        }


        // 2. GET CART


        const cart = await Cart.findOne({ userId })
            .populate("items.productId")
            .populate("items.variantId");


        if (!cart || cart.items.length === 0) {

            return {
                success: false,
                message: "Cart is empty"
            };

        }

        // 3. GET ADDRESS


        const address = await Address.findOne({ _id: selectedAddressId, userId });


        if (!address) {

            return {
                success: false,
                message: "Address not found"
            };

        }


        // 5. PREPARE ITEMS

        const orderItems = [];

        let subtotal = 0;


        for (const item of cart.items) {

            const variant = item.variantId;
            const product = item.productId;


            if (!variant || !product) {

                return {
                    success: false,
                    message: "Product information unavailable"
                };

            }


            // STOCK CHECK


            const sizeStock = variant.sizeAndStock.find(
                s => s.size === item.size
            );


            if (!sizeStock || sizeStock.stock < item.quantity) {

                return {
                    success: false,
                    message:
                        `${product.name} is out of stock`
                };

            }



            // OFFER CALCULATION


            const offerPrice = await getOfferPriceService({

                productId: product._id,

                categoryId: product.categoryId,

                salePrice: variant.salePrice

            });


            // Price after product/category offer

            const finalOfferPrice = Math.round(offerPrice.finalPrice * 100) / 100;


            // ITEM SUBTOTAL

            const itemSubtotal = finalOfferPrice * item.quantity;

            subtotal += itemSubtotal;

            // PUSH TEMPORARY ITEM

            orderItems.push({

                productId:
                    product._id,

                variantId:
                    variant._id,

                productName:
                    product.name,

                productImage:
                    variant.images?.[0] || "",

                size:
                    item.size,

                quantity:
                    item.quantity,

                regularPrice:
                    variant.regularPrice,

                salePrice:
                    finalOfferPrice,

                offerApplied:
                    offerPrice.offerApplied,

                offerDiscountPercentage: offerPrice.discountPercentage,

                offerDiscountAmount: offerPrice.discountAmount || 0,

                itemSubtotal: itemSubtotal,

                couponDiscount: 0,

                paidAmount: itemSubtotal,

                itemStatus:
                    "Confirmed",

                cancelReason:
                    null,

                returnReason:
                    null,

                cancelledAt:
                    null,

                deliveredAt:
                    null,

                returnedAt:
                    null,

                returnRequest: {

                    requested: false,

                    reason: null,

                    status: "Pending"

                },

                paymentStatus:
                    "Paid"

            });

        }


        subtotal = Math.round(subtotal * 100) / 100;



        // 6. COUPON

        let coupon = null;
        let couponDiscount = 0;


        if (couponId) {

            coupon = await Coupon.findById(couponId);


            if (!coupon) {
                return {
                    success: false,
                    message: "Coupon not found"
                };
            }


            // Active check

            if (!coupon.isActive) {
                return {
                    success: false,
                    message: "Coupon is not active"
                };
            }


            // Expiry check

            if (new Date() > new Date(coupon.expiryDate)) {
                return {
                    success: false,
                    message: "Coupon has expired"
                };
            }


            // Already used check

            const alreadyUsed = coupon.usedBy.some(id => id.toString() === userId.toString());


            if (alreadyUsed) {
                return {
                    success: false,
                    message:
                        "You have already used this coupon"
                };
            }


            // Usage limit

            if (coupon.usageCount >= coupon.usageLimit) {
                return {
                    success: false,
                    message:
                        "Coupon usage limit reached"
                };

            }


            // Minimum cart value

            if (subtotal < coupon.minimumCartValue) {
                return {
                    success: false,
                    message:
                        `Minimum cart value should be ₹${coupon.minimumCartValue}`
                };

            }

            // CALCULATE COUPON


            if (coupon.discountType === "percentage") {

                couponDiscount = Math.min(subtotal * coupon.discountValue / 100, subtotal)

            }
            else if (coupon.discountType === "fixed") {

                couponDiscount = coupon.discountValue;

            }

            if (couponDiscount > subtotal) {
                couponDiscount = subtotal;
            }

            couponDiscount = Math.round(couponDiscount * 100) / 100;



            // DISTRIBUTE COUPON TO ITEMS

            let distributedDiscount = 0;

            orderItems.forEach(
                (item, index) => {

                    let itemCouponDiscount;


                    if (index === orderItems.length - 1) {

                        // Give remaining amount to
                        // last item to avoid rounding issue

                        itemCouponDiscount = Math.min(couponDiscount - distributedDiscount, item.itemSubtotal)

                    }

                    else {

                        itemCouponDiscount = (item.itemSubtotal / subtotal) * couponDiscount;

                        itemCouponDiscount = Math.ceil(itemCouponDiscount)

                    }

                    distributedDiscount += itemCouponDiscount;

                    item.couponDiscount = Math.ceil(itemCouponDiscount);

                    item.paidAmount = Math.ceil(item.itemSubtotal - itemCouponDiscount)

                }
            );

        }



        // 7. SHIPPING

        const shipping = 50;

        // 8. GRAND TOTAL

        const grandTotal = Math.round((subtotal + shipping - couponDiscount) * 100) / 100

        // 9. CREATE ORDER ID


        const orderId = "ORD-" +
            crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase();



        // 10. CREATE ORDER


        const order = await Order.create({

            orderId,

            userId,

            shippingAddress: {

                firstName:
                    address.firstName,

                lastName:
                    address.lastName,

                phoneNumber:
                    address.phoneNumber,

                address:
                    address.address,

                city:
                    address.city,

                state:
                    address.state,

                pincode:
                    address.pincode

            },


            orderItems,


            // ORDER LEVEL SUBTOTAL
            subtotal,

            // COUPON DETAILS

            couponDetails: {

                discountType: coupon ? coupon.discountType : null,
                discountValue: coupon ? coupon.discountValue : 0,
                minimumCartValue: coupon ? coupon.minimumCartValue : 0
            },


            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,


            paymentMethod: "Razorpay",
            paymentStatus: "Paid",
            orderStatus: "Confirmed",

            grandTotal

        });



        // 11. UPDATE COUPON USAGE


        if (coupon) {

            coupon.usageCount += 1;
            coupon.usedBy.push(userId);
            await coupon.save();

        }


        // 12. REDUCE STOCK


        for (const item of cart.items) {

            const variant = await ProductVariant.findById(
                item.variantId._id
            );


            const sizeStock = variant.sizeAndStock.find(
                s => s.size === item.size
            );


            sizeStock.stock -=
                item.quantity;


            await variant.save();

        }

        // 13. CLEAR CART


        cart.items = [];

        await cart.save();



        // 14. RETURN


        return {

            success: true,

            message:
                "Payment verified and order created",

            orderId:
                order._id

        };

    } catch (error) {

        console.log(
            "Error in verifyRazorpayPaymentService:",
            error
        );

        return {

            success: false,

            message:
                "Unable to verify payment"

        };

    }

};

export const applyCouponService = async (userId, couponId) => {

    try {

        // =========================================
        // 1. FIND COUPON
        // =========================================

        const coupon =
            await Coupon.findById(couponId);


        if (!coupon) {

            return {
                success: false,
                message: "Coupon not found"
            };

        }


        // =========================================
        // 2. CHECK ACTIVE
        // =========================================

        if (!coupon.isActive) {

            return {
                success: false,
                message: "Coupon is not active"
            };

        }


        // =========================================
        // 3. CHECK EXPIRY
        // =========================================

        if (
            new Date() >
            new Date(coupon.expiryDate)
        ) {

            return {
                success: false,
                message: "Coupon has expired"
            };

        }


        // =========================================
        // 4. CHECK USER ALREADY USED
        // =========================================

        const alreadyUsed = coupon.usedBy.some(id => id.toString() === userId.toString());


        if (alreadyUsed) {
            return {
                success: false,
                message:
                    "You have already used this coupon"
            };
        }


        // =========================================
        // 5. CHECK USAGE LIMIT
        // =========================================

        if (coupon.usageCount >= coupon.usageLimit) {
            return {
                success: false,
                message:
                    "Coupon usage limit reached"
            };

        }


        // =========================================
        // 6. GET CART
        // =========================================

        const cart = await Cart.findOne({ userId });


        if (!cart || cart.items.length === 0) {
            return {
                success: false,
                message:
                    "Your cart is empty"
            };
        }


        // =========================================
        // 7. GET CART ITEMS
        // =========================================

        const items = [];

        let subtotal = 0;


        for (const item of cart.items) {

            const variant = await ProductVariant.findById(item.variantId).populate("productId");

            if (!variant) {
                continue;
            }

            // =====================================
            // GET PRODUCT/CATEGORY OFFER
            // =====================================

            const offerPrice =
                await getOfferPriceService({

                    productId:
                        variant.productId._id,

                    categoryId:
                        variant.productId.categoryId,

                    salePrice:
                        variant.salePrice

                });


            // =====================================
            // PRICE AFTER OFFER
            // =====================================

            const priceAfterOffer = offerPrice.finalPrice;


            // =====================================
            // ITEM TOTAL AFTER OFFER
            // =====================================

            const itemTotal = priceAfterOffer * item.quantity;


            subtotal += itemTotal;


            items.push({
                itemTotal: Math.round(itemTotal * 100) / 100,
                quantity: item.quantity,
                variantId: item.variantId,
                productId: item.productId,
                offerPrice: offerPrice
            });
        }


        // =========================================
        // 8. MINIMUM CART VALUE
        // =========================================

        if (subtotal < coupon.minimumCartValue) {

            return {

                success: false,

                message:
                    `Minimum cart value should be ₹${coupon.minimumCartValue}`

            };

        }


        // =========================================
        // 9. CALCULATE COUPON DISCOUNT
        // =========================================

        let discount = 0;


        if (coupon.discountType === "percentage") {

            discount = subtotal * coupon.discountValue / 100;

        }
        else if (coupon.discountType === "fixed") {

            discount = coupon.discountValue;

        }


        // Coupon cannot exceed subtotal

        if (discount > subtotal) {
            console.log("this will execute if discount is greater than the subtotal", "subtotal->", subtotal, "discount->", discount)
            discount = subtotal;

        }


        discount = Math.round(discount * 100) / 100;


        // =========================================
        // 10. DISTRIBUTE COUPON DISCOUNT
        // =========================================

        let distributedDiscount = 0;


        items.forEach(
            (item, index) => {

                let itemDiscount;


                // Last item gets remaining amount

                if (index === items.length - 1) {
                    console.log("this is apply when it is last product to apply coupon discount", itemDiscount)
                    itemDiscount = discount - distributedDiscount;


                }

                else {

                    itemDiscount = Math.max(10, (item.itemTotal / subtotal) * discount);

                    itemDiscount = Math.round(itemDiscount * 100) / 100;

                    distributedDiscount += itemDiscount;

                }


                item.discountAmount = Math.round(itemDiscount * 100) / 100;


                item.finalAmount = Math.round((item.itemTotal - item.discountAmount) * 100) / 100

            }
        );


        // =========================================
        // 11. GRAND TOTAL
        // =========================================

        const shipping = 50;


        const grandTotal = Math.round((subtotal + shipping - discount) * 100) / 100


        // =========================================
        // 12. RETURN
        // =========================================

        return {

            success: true,
            coupon,
            items,
            subtotal,
            shipping,
            discount,
            grandTotal

        };


    } catch (error) {

        console.log(
            "Error in applyCouponService:",
            error
        );


        return {

            success: false,

            message:
                "Unable to apply coupon"

        };

    }

};






// GET USER WALLET


export const removeCouponService = async (userId) => {

    try {

        // GET CART

        const cart =
            await Cart.findOne({
                userId: userId
            });


        if (
            !cart ||
            cart.items.length === 0
        ) {

            return {

                success: false,

                message:
                    "Cart is empty"

            };

        }


        // CALCULATE SUBTOTAL AFTER OFFER

        let subtotal = 0;


        for (const item of cart.items) {

            const variant =
                await ProductVariant
                    .findById(item.variantId)
                    .populate("productId");


            if (!variant) {
                continue;
            }


            // GET PRODUCT/CATEGORY OFFER

            const offerPrice =
                await getOfferPriceService({

                    productId:
                        variant.productId._id,

                    categoryId:
                        variant.productId.categoryId,

                    salePrice:
                        variant.salePrice

                });


            // PRICE AFTER OFFER

            const priceAfterOffer =
                offerPrice.finalPrice;


            // ITEM TOTAL

            const itemTotal =
                priceAfterOffer *
                item.quantity;


            subtotal += itemTotal;

        }


        // NO COUPON

const shipping = 50;

const grandTotal = Math.round(
  (subtotal + shipping) * 100
) / 100;


        return {

            success: true,

            subtotal,

            grandTotal,

            discount: 0

        };


    } catch (error) {

        console.log(
            "Error in removeCouponService:",
            error
        );


        return {

            success: false,

            message:
                "Unable to remove coupon"

        };

    }

};


export const getWalletService = async (userId) => {

    const wallet = await Wallet.findOne({
        userId: userId
    }).populate("transactions.orderId");

    if (!wallet) {
        throw new Error("Wallet not found");
    }

    return wallet;
};




// ADD MONEY TO WALLET

export const addMoneyToWalletService = async (userId, amount) => {

    const wallet = await Wallet.findOne({
        userId: userId
    });

    if (!wallet) {
        throw new Error("Wallet not found");
    }


    // Increase existing balance

    wallet.balance += amount;


    // Add transaction

    wallet.transactions.push({

        type: "credit",

        amount: amount,

        description: "Wallet top-up"

    });


    await wallet.save();


    return wallet;
};




export const getOfferPriceService = async ({
    productId,
    categoryId,
    salePrice
}) => {

    try {

        const currentDate = new Date();


        // Find active product/category offers
        const offers = await Offer.find({

            isActive: true,

            endDate: {
                $gt: currentDate
            },

            $or: [
                {
                    offerType: "product",
                    productId: productId
                },
                {
                    offerType: "category",
                    categoryId: categoryId
                }
            ]

        });


        // NO OFFER

        if (offers.length === 0) {

            return {

                offerApplied: false,

                originalPrice: salePrice,

                discountPercentage: 0,

                finalPrice: salePrice

            };

        }


        // FIND HIGHEST OFFER

        const bestOffer = offers.reduce(
            (highest, current) => {

                return current.discountPercentage >
                    highest.discountPercentage
                    ? current
                    : highest;

            }
        );


        // CALCULATE FINAL PRICE

        const discountPercentage = bestOffer.discountPercentage;


        const discountAmount =
            salePrice * discountPercentage / 100;


        const finalPrice =
            salePrice - discountAmount;


        return {

            offerApplied: true,

            offer: bestOffer,

            originalPrice: salePrice,

            discountPercentage,

            discountAmount,

            finalPrice: Math.round(finalPrice)

        };


    } catch (error) {

        console.log(
            "Error in getOfferPriceService:",
            error
        );


        // If offer calculation fails,
        // don't break product page.

        return {

            offerApplied: false,

            originalPrice: salePrice,

            discountPercentage: 0,

            finalPrice: salePrice

        };

    }

};

export const walletPaymentService = async ({ userId, selectedAddressId, couponId }) => {

    try {
        // 1. GET CART

        const cart = await Cart.findOne({ userId }).populate("items.productId").populate("items.variantId");


        if (!cart || cart.items.length === 0) {
            return {
                success: false,
                message: "Cart is empty"
            };

        }


        // 2. GET ADDRESS

        const address = await Address.findOne({ _id: selectedAddressId, userId });


        if (!address) {
            return {
                success: false,
                message: "Address not found"
            };
        }


        // 3. CALCULATE ITEMS + OFFERS

        const orderItems = [];

        let subtotal = 0;


        for (const item of cart.items) {

            const variant = item.variantId;
            const product = item.productId;


            if (!variant || !product || !variant.list) {

                return {
                    success: false,
                    message:
                        "One or more products are unavailable"
                };

            }


            // STOCK

            const sizeStock = variant.sizeAndStock.find(
                s => s.size === item.size
            );


            if (!sizeStock || sizeStock.stock < item.quantity) {

                return {
                    success: false,
                    message:
                        `Insufficient stock for ${product.name}`
                };

            }


            // OFFER

            const offerPrice =
                await getOfferPriceService({

                    productId:
                        product._id,

                    categoryId:
                        product.categoryId,

                    salePrice:
                        variant.salePrice

                });


            const finalOfferPrice =
                Math.round(
                    offerPrice.finalPrice * 100
                ) / 100;


            const itemSubtotal =
                finalOfferPrice *
                item.quantity;


            subtotal += itemSubtotal;


            orderItems.push({

                productId:
                    product._id,

                variantId:
                    variant._id,

                productName:
                    product.name,

                productImage:
                    variant.images?.[0] || "",

                size:
                    item.size,

                quantity:
                    item.quantity,

                regularPrice:
                    variant.regularPrice,

                salePrice:
                    finalOfferPrice,

                offerApplied:
                    offerPrice.offerApplied,

                offerDiscountPercentage:
                    offerPrice.discountPercentage,

                offerDiscountAmount:
                    offerPrice.discountAmount || 0,

                itemSubtotal,

                couponDiscount: 0,

                paidAmount:
                    itemSubtotal,

                itemStatus:
                    "Confirmed",

                paymentStatus:
                    "Paid"

            });

        }


        subtotal = Math.round(subtotal * 100) / 100;


        // 4. COUPON


        let coupon = null;

        let couponDiscount = 0;


        if (couponId) {

            coupon = await Coupon.findById(couponId);


            if (!coupon) {

                return {
                    success: false,
                    message: "Coupon not found"
                };

            }


            if (!coupon.isActive) {

                return {
                    success: false,
                    message: "Coupon is not active"
                };

            }


            if (new Date() > new Date(coupon.expiryDate)) {

                return {
                    success: false,
                    message: "Coupon has expired"
                };

            }


            const alreadyUsed = coupon.usedBy.some(id => id.toString() === userId.toString());


            if (alreadyUsed) {

                return {
                    success: false,
                    message:
                        "You have already used this coupon"
                };

            }


            if (coupon.usageCount >= coupon.usageLimit) {

                return {
                    success: false,
                    message:
                        "Coupon usage limit reached"
                };

            }


            if (
                subtotal <
                coupon.minimumCartValue
            ) {

                return {
                    success: false,
                    message:
                        `Minimum cart value should be ₹${coupon.minimumCartValue}`
                };

            }


            if (
                coupon.discountType ===
                "percentage"
            ) {

                couponDiscount =
                    subtotal *
                    coupon.discountValue /
                    100;

            } else {

                couponDiscount =
                    coupon.discountValue;

            }


            if (couponDiscount > subtotal) {

                couponDiscount =
                    subtotal;

            }


            couponDiscount =
                Math.round(
                    couponDiscount * 100
                ) / 100;



            // DISTRIBUTE COUPON TO ITEMS


            let distributedDiscount = 0;


            orderItems.forEach(
                (item, index) => {

                    let itemCouponDiscount;


                    if (index === orderItems.length - 1) {

                        itemCouponDiscount = couponDiscount - distributedDiscount;

                    } else {

                        itemCouponDiscount = (item.itemSubtotal / subtotal) * couponDiscount;

                        itemCouponDiscount = Math.round(itemCouponDiscount * 100) / 100;

                    }


                    distributedDiscount += itemCouponDiscount;


                    item.couponDiscount = itemCouponDiscount;


                    item.paidAmount = Math.round((item.itemSubtotal - itemCouponDiscount) * 100) / 100;

                }
            );

        }


        // 5. SHIPPING
        const shipping = 50;

        // 6. GRAND TOTAL

        const grandTotal = Math.round((subtotal + shipping - couponDiscount) * 100) / 100;



        // 7. GET WALLET


        const wallet = await Wallet.findOne({ userId });


        if (!wallet) {

            return {
                success: false,
                message:
                    "Wallet not found"
            };

        }



        // 8. CHECK BALANCE


        if (wallet.balance < grandTotal) {

            const requiredAmount = Math.round((grandTotal - wallet.balance) * 100) / 100;


            return {

                success: false,

                insufficientBalance: true,

                message:
                    `Wallet balance is insufficient. Add ₹${requiredAmount} to complete the payment.`,

                requiredAmount,

                walletBalance:
                    wallet.balance,

                grandTotal

            };

        }


        // 9. CREATE ORDER

        const orderId =
            "ORD-" +
            crypto
                .randomBytes(4)
                .toString("hex")
                .toUpperCase();


        const order =
            await Order.create({

                orderId,

                userId,

                shippingAddress: {

                    firstName: address.firstName,

                    lastName: address.lastName,

                    phoneNumber: address.phoneNumber,

                    address: address.address,

                    city: address.city,

                    state: address.state,

                    pincode: address.pincode

                },

                orderItems,

                subtotal,

                couponDetails: {
                    discountType: coupon ? coupon.discountType : null,
                    discountValue: coupon ? coupon.discountValue : 0,
                    minimumCartValue: coupon ? coupon.minimumCartValue : 0
                },

                paymentMethod: "Wallet",

                paymentStatus: "Paid",

                orderStatus: "Confirmed",

                grandTotal

            });


        // 10. DEDUCT WALLET

        wallet.balance -= grandTotal;


        wallet.transactions.push({

            type: "debit",

            amount: grandTotal,

            description: "Payment for order",

            orderId: order._id

        });


        await wallet.save();


        // 11. UPDATE COUPON

        if (coupon) {

            coupon.usageCount += 1;

            coupon.usedBy.push(userId);

            await coupon.save();

        }


        // 12. REDUCE STOCK

        for (const item of cart.items) {

            const variant = await ProductVariant.findById(item.variantId._id);


            const sizeStock = variant.sizeAndStock.find(
                s => s.size === item.size
            );


            sizeStock.stock -= item.quantity;


            await variant.save();

        }


        // 13. CLEAR CART

        cart.items = [];

        await cart.save();


        return {

            success: true,

            message:
                "Wallet payment successful",

            orderId:
                order._id

        };


    } catch (error) {

        console.log(
            "Wallet payment service error:",
            error
        );

        return {

            success: false,

            message:
                "Unable to complete wallet payment"

        };

    }

};



export const creditWalletService = async ({
    userId,
    amount,
    orderId,
    description
}) => {

    try {

        // VALIDATE AMOUNT

        if (!amount || amount <= 0) {

            return {
                success: false,
                message: "Invalid credit amount"
            };

        }


        // FIND USER WALLET

        let wallet =
            await Wallet.findOne({ userId });


        // CREATE WALLET IF NOT EXISTS

        if (!wallet) {

            wallet =
                await Wallet.create({

                    userId,

                    balance: 0,

                    transactions: []

                });

        }


        // CREDIT BALANCE

        wallet.balance += amount;


        // ADD TRANSACTION

        wallet.transactions.push({

            type: "refund",

            amount: amount,

            description: description,

            orderId: orderId,

            createdAt: new Date()

        });


        // SAVE WALLET

        await wallet.save();


        // RETURN SUCCESS

        return {

            success: true,

            message: "Amount credited to wallet",

            balance: wallet.balance,

            amount: amount

        };


    } catch (error) {

        console.error(
            "Credit wallet error:",
            error
        );

        return {

            success: false,

            message:
                "Unable to credit amount to wallet"

        };

    }

};


export const cancelAllOrderItemServices = async (userId, orderId, reason) => {

    try {


        if (!reason.reason) {

            return {
                success: false,
                message: "Cancellation reason is required"

            }
        }

        // console.log("reason->",reason.reason)
        const orders = await Order.findOne({ _id: orderId, userId: userId })

        if (!orders) {

            return {
                success: false,
                message: "order not found"
            }
        }

        // console.log(orders)

        let itIsAlready;

        const allStatus = orders.orderItems.some((item) => {

            if (
                item.itemStatus === "Shipped" ||
                item.itemStatus === "Out for Delivery" ||
                item.itemStatus === "Delivered"
            ) {
                itIsAlready = item.itemStatus;
                return true;
            }

            if (item.itemStatus === "Cancelled") {
                itIsAlready = item.itemStatus;
                return true;
            }

            if (item.itemStatus === "Returned") {
                itIsAlready = item.itemStatus;
                return true;
            }

            return false;
        });

        if (allStatus) {
            return {
                success: false,
                message: `Some of the products are ${itIsAlready}, so you cannot cancel all products. Cancel them individually.`
            };
        }



        for (const order of orders.orderItems) {

            const variant = await ProductVariant.findById(order.variantId);

            if (!variant) {
                return {
                    success: false,
                    message: "Variant not found"
                };
            }

            const size = variant.sizeAndStock.find(
                size => Number(size.size) === Number(order.size)
            );

            if (!size) {
                return {
                    success: false,
                    message: "Cannot find size"
                };
            }
        }


        for (const order of orders.orderItems) {


            //status Updation

            order.cancelReason = reason.reason
            order.cancelledAt = new Date()
            order.itemStatus = "Cancelled"
            order.paymentStatus = "Refunded"
            //stock incremenataion

            if (reason.reason != "Damaged or defective product") {

                console.log("reason for cancellation", reason)

                const variant = await ProductVariant.findById(order.variantId)

                if (!variant) {

                    console.log("failed to find the variant.tried to fetch the variant collection using the variantId in the orderItems array")
                    return {
                        success: false,
                        message: "variant Not Found"
                    }

                }

                const size = variant.sizeAndStock.find(size => Number(size.size) === Number(order.size))

                size.stock += Number(order.quantity)
                // console.log("size->",size)

                await variant.save()
                // console.log(variant)

            }


        }

        //refund implementation if razopay or wallet

        if (orders.paymentMethod != "Cash on Delivery" && orders.paymentStatus === "Paid") {

            let refundAmount = 0
            for (const item of orders.orderItems) {

                refundAmount += item.paidAmount

            }

            const wallet = await Wallet.findOne({ userId: userId })

            if (wallet) {

                wallet.balance += refundAmount
                wallet.transactions.push({
                    type: "refund",
                    amount: refundAmount,
                    description: "Order cancellation refund",
                    orderId: orders._id,
                    createdAt: new Date()
                })

                await wallet.save()
                // console.log(wallet)
            }
            orders.paymentStatus = "Refunded"

        }


        //updating overall status
        const allStaus = orders.orderItems.every(item => item.itemStatus === "Cancelled")

        if (allStaus) {
            orders.orderStatus = "Cancelled"
        }
        // console.log("final orders document--->",orders)

        await orders.save()
        return { success: true }



    } catch (error) {
        console.log("error in sevices, catch bklock executed")
        console.log(error)

        return {
            success: false,
            message: "Something went wrong try again later"
        }
    }


}


export const returnAllOrderItemServices = async (
    userId,
    orderId,
    reason
) => {

    try {

        // 1. Validate reason

        if (!reason.reason) {
            return {
                success: false,
                message: "Return reason is required"
            };
        }


        // 2. Find order belonging to logged-in user

        const order = await Order.findOne({
            _id: orderId,
            userId: userId
        });

        if (!order) {
            return {
                success: false,
                message: "Order not found"
            };
        }


        // 3. Validate every item BEFORE changing anything

        let invalidStatus;

        const hasNonReturnableItem = order.orderItems.some((item) => {

            if (item.itemStatus === "Returned") {
                invalidStatus = "Returned";
                return true;
            }

            if (item.itemStatus === "Cancelled") {
                invalidStatus = "Cancelled";
                return true;
            }

            if (
                item.itemStatus === "Pending" ||
                item.itemStatus === "Confirmed" ||
                item.itemStatus === "Shipped" ||
                item.itemStatus === "Out for Delivery"
            ) {
                invalidStatus = item.itemStatus;
                return true;
            }

            if (item.itemStatus !== "Delivered") {
                invalidStatus = "Invalid";
                return true;
            }

            return false;
        });


        if (hasNonReturnableItem) {

            if (invalidStatus === "Returned") {
                return {
                    success: false,
                    message:
                        "Some of the products are already returned. You cannot request return for all products."
                };
            }

            if (invalidStatus === "Cancelled") {
                return {
                    success: false,
                    message:
                        "Some of the products are cancelled. You cannot request return for all products."
                };
            }

            if (
                invalidStatus === "Pending" ||
                invalidStatus === "Confirmed" ||
                invalidStatus === "Shipped" ||
                invalidStatus === "Out for Delivery"
            ) {
                return {
                    success: false,
                    message:
                        `Some of the products are ${invalidStatus}. Only delivered products can be returned.`
                };
            }

            return {
                success: false,
                message: "Invalid order item status. Contact Admin"
            };
        }


        // 4. PHASE 2
        // Everything is eligible for return.
        // Now create return requests.

        for (const item of order.orderItems) {

            item.returnRequest.requested = true;
            item.returnRequest.reason = reason.reason;
            item.returnRequest.status = "Pending";
        }


        // 5. Save order

        await order.save();


        return {
            success: true,
            message: "Return request submitted successfully"
        };


    } catch (error) {

        console.log("Error in returnAllOrderItemServices:", error);

        return {
            success: false,
            message: "Something went wrong. Please try again later"
        };
    }
};

export const updateCurrentPasswordPageServices=async(userId)=>{
try {
      const user = await User.findOne({ _id: userId })
    if(!user?.googleId){
        return {success:true}
    }else{
        return {success:false,user}
    }
} catch (error) {
    console.log(error)
    return {
            success: false,
            message: "Something went wrong. Please try again later"
        };
}
}

export const getAddressServices=async(userId)=>{
  const address = await Address.findById(userId);
  if(address){
   return {success:true,address}
  }
}





export const generateInvoicePDF = (order, res) => {

    try {

        const doc = new PDFDocument({
            size: "A4",
            margin: 50
        });


        // --------------------------------
        // PDF RESPONSE HEADERS
        // --------------------------------

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=invoice-${order.orderId}.pdf`
        );


        // --------------------------------
        // SEND PDF TO BROWSER
        // --------------------------------

        doc.pipe(res);


        // --------------------------------
        // HELPER FUNCTION
        // --------------------------------

        const formatCurrency = (amount) => {

            return `Rs. ${Number(
                amount || 0
            ).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;

        };


        // =========================================
        // CALCULATE DISCOUNTS
        // =========================================

        let totalOfferDiscount = 0;

        let totalCouponDiscount = 0;

        let totalItemSubtotal = 0;


        order.orderItems.forEach((item) => {

            const quantity =
                Number(item.quantity || 0);

            const offerDiscountPerItem =
                Number(
                    item.offerDiscountAmount || 0
                );

            const couponDiscount =
                Number(
                    item.couponDiscount || 0
                );

            const itemSubtotal =
                Number(
                    item.itemSubtotal || 0
                );


            totalOfferDiscount +=
                offerDiscountPerItem * quantity;

            totalCouponDiscount +=
                couponDiscount;

            totalItemSubtotal +=
                itemSubtotal;

        });


        const totalDiscount =
            totalOfferDiscount +
            totalCouponDiscount;


        // =========================================
        // STORE HEADER
        // =========================================

        doc
            .fillColor("#111111")
            .font("Helvetica-Bold")
            .fontSize(26)
            .text(
                "JORDAN",
                50,
                50
            );


        doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#555555")
            .text(
                "Premium Footwear Store",
                50,
                85
            );


        doc.text(
            "Chennai, Tamil Nadu, India",
            50,
            101
        );


        doc.text(
            "Email: support@jordan.com",
            50,
            117
        );


        // =========================================
        // INVOICE INFORMATION
        // =========================================

        doc
            .fillColor("#111111")
            .font("Helvetica-Bold")
            .fontSize(24)
            .text(
                "INVOICE",
                350,
                55,
                {
                    width: 195,
                    align: "right"
                }
            );


        doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#555555")
            .text(
                `Order ID: ${order.orderId}`,
                350,
                92,
                {
                    width: 195,
                    align: "right"
                }
            );


        doc.text(
            `Order Date: ${new Date(
                order.createdAt
            ).toLocaleDateString("en-IN")}`,
            350,
            108,
            {
                width: 195,
                align: "right"
            }
        );


        doc.text(
            `Payment Method: ${order.paymentMethod}`,
            350,
            124,
            {
                width: 195,
                align: "right"
            }
        );


        doc.text(
            `Payment Status: ${order.paymentStatus}`,
            350,
            140,
            {
                width: 195,
                align: "right"
            }
        );


        // =========================================
        // HEADER LINE
        // =========================================

        doc
            .moveTo(50, 165)
            .lineTo(545, 165)
            .strokeColor("#cccccc")
            .stroke();


        // =========================================
        // SHIPPING ADDRESS
        // =========================================

        doc
            .fillColor("#111111")
            .font("Helvetica-Bold")
            .fontSize(12)
            .text(
                "SHIPPING ADDRESS",
                50,
                188
            );


        const address =
            order.shippingAddress;


        doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#444444")
            .text(
                `${address.firstName} ${address.lastName || ""}`,
                50,
                212
            );


        doc.text(
            `Phone: ${address.phoneNumber}`,
            50,
            228
        );


        doc.text(
            address.address,
            50,
            244,
            {
                width: 270
            }
        );


        doc.text(
            `${address.city}, ${address.state}`,
            50,
            276
        );


        doc.text(
            `Pincode: ${address.pincode}`,
            50,
            292
        );


        // =========================================
        // PRODUCT TABLE HEADER
        // =========================================

        let tableY = 335;


        doc
            .rect(
                50,
                tableY,
                495,
                30
            )
            .fill("#111111");


        doc
            .fillColor("#ffffff")
            .font("Helvetica-Bold")
            .fontSize(8);


        doc.text(
            "PRODUCT",
            60,
            tableY + 10,
            {
                width: 130
            }
        );


        doc.text(
            "SIZE",
            190,
            tableY + 10,
            {
                width: 35,
                align: "center"
            }
        );


        doc.text(
            "QTY",
            225,
            tableY + 10,
            {
                width: 35,
                align: "center"
            }
        );


        doc.text(
            "PRICE",
            265,
            tableY + 10,
            {
                width: 65,
                align: "right"
            }
        );


        doc.text(
            "STATUS",
            335,
            tableY + 10,
            {
                width: 85,
                align: "center"
            }
        );


        doc.text(
            "PAID",
            425,
            tableY + 10,
            {
                width: 110,
                align: "right"
            }
        );


        tableY += 30;


        // =========================================
        // PRODUCT TABLE ROWS
        // =========================================

        order.orderItems.forEach(
            (item, index) => {

                const quantity =
                    Number(item.quantity || 0);


                const salePrice =
                    Number(
                        item.salePrice +
                        (item.offerDiscountAmount || 0) || 0
                    );


                const itemSubtotal =
                    Number(
                        item.itemSubtotal || 0
                    );


                const offerDiscount =
                    Number(
                        item.offerDiscountAmount || 0
                    ) * quantity;


                const couponDiscount =
                    Number(
                        item.couponDiscount || 0
                    );


                const paidAmount =
                    Number(
                        item.paidAmount || 0
                    );


                const rowHeight = 70;


                // ALTERNATE ROW BACKGROUND

                if (index % 2 === 0) {

                    doc
                        .rect(
                            50,
                            tableY,
                            495,
                            rowHeight
                        )
                        .fill("#f3f4f6");

                }


                // PRODUCT NAME

                doc
                    .fillColor("#222222")
                    .font("Helvetica")
                    .fontSize(9);


                doc.text(
                    item.productName,
                    60,
                    tableY + 12,
                    {
                        width: 125
                    }
                );


                // SIZE

                doc.text(
                    String(item.size),
                    190,
                    tableY + 12,
                    {
                        width: 35,
                        align: "center"
                    }
                );


                // QUANTITY

                doc.text(
                    String(quantity),
                    225,
                    tableY + 12,
                    {
                        width: 35,
                        align: "center"
                    }
                );


                // SALE PRICE

                doc.text(
                    formatCurrency(salePrice),
                    265,
                    tableY + 12,
                    {
                        width: 65,
                        align: "right"
                    }
                );


                // ITEM STATUS

                doc
                    .font("Helvetica-Bold")
                    .fontSize(7.5)
                    .fillColor("#222222");


                doc.text(
                    item.itemStatus || "Unknown",
                    335,
                    tableY + 12,
                    {
                        width: 85,
                        align: "center"
                    }
                );


                // PAID AMOUNT

                doc
                    .font("Helvetica-Bold")
                    .fontSize(9)
                    .fillColor("#222222");


                doc.text(
                    formatCurrency(paidAmount),
                    425,
                    tableY + 12,
                    {
                        width: 110,
                        align: "right"
                    }
                );


                // DISCOUNT DETAILS

                doc
                    .font("Helvetica")
                    .fontSize(8)
                    .fillColor("#666666");


                doc.text(
                    `Item Subtotal: ${formatCurrency(
                        itemSubtotal
                    )}`,
                    60,
                    tableY + 35,
                    {
                        width: 150
                    }
                );


                if (offerDiscount > 0) {

                    doc.text(
                        `Offer: -${formatCurrency(
                            offerDiscount
                        )}`,
                        215,
                        tableY + 35,
                        {
                            width: 80
                        }
                    );

                }


                if (couponDiscount > 0) {

                    doc.text(
                        `Coupon: -${formatCurrency(
                            couponDiscount
                        )}`,
                        300,
                        tableY + 35,
                        {
                            width: 85
                        }
                    );

                }


                tableY += rowHeight;

            }
        );


        // =========================================
        // ORDER SUMMARY
        // =========================================

        tableY += 25;


        doc
            .moveTo(330, tableY)
            .lineTo(545, tableY)
            .strokeColor("#cccccc")
            .stroke();


        tableY += 18;


        // SUBTOTAL

        doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#444444");


        doc.text(
            "Subtotal",
            340,
            tableY,
            {
                width: 90
            }
        );


        doc.text(
            formatCurrency(order.subtotal),
            430,
            tableY,
            {
                width: 115,
                align: "right"
            }
        );


        tableY += 22;


        // OFFER DISCOUNT

        doc
            .fillColor("#d9534f");


        doc.text(
            "Offer Discount",
            340,
            tableY,
            {
                width: 90
            }
        );


        doc.text(
            `-${formatCurrency(
                totalOfferDiscount
            )}`,
            430,
            tableY,
            {
                width: 115,
                align: "right"
            }
        );


        tableY += 22;


        // COUPON DISCOUNT

        doc
            .fillColor("#d9534f");


        doc.text(
            "Coupon Discount",
            340,
            tableY,
            {
                width: 90
            }
        );


        doc.text(
            `-${formatCurrency(
                totalCouponDiscount
            )}`,
            430,
            tableY,
            {
                width: 115,
                align: "right"
            }
        );


        tableY += 22;


        // TOTAL DISCOUNT

        doc
            .font("Helvetica-Bold")
            .fillColor("#d9534f");


        doc.text(
            "Total Discount",
            340,
            tableY,
            {
                width: 90
            }
        );


        doc.text(
            `-${formatCurrency(
                totalDiscount
            )}`,
            430,
            tableY,
            {
                width: 115,
                align: "right"
            }
        );


        tableY += 28;


        // =========================================
        // GRAND TOTAL
        // =========================================

        doc
            .moveTo(330, tableY)
            .lineTo(545, tableY)
            .strokeColor("#111111")
            .stroke();


        tableY += 15;


        doc
            .font("Helvetica-Bold")
            .fontSize(14)
            .fillColor("#111111");


        doc.text(
            "GRAND TOTAL",
            340,
            tableY,
            {
                width: 90
            }
        );


        doc.text(
            formatCurrency(
                order.grandTotal
            ),
            430,
            tableY,
            {
                width: 115,
                align: "right"
            }
        );


        // =========================================
        // COUPON INFORMATION
        // =========================================

        if (
            order.couponDetails &&
            order.couponDetails.discountValue > 0
        ) {

            tableY += 40;


            doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#555555");


            let couponText =
                "Coupon Applied: ";


            if (
                order.couponDetails.discountType ===
                "percentage"
            ) {

                couponText +=
                    `${order.couponDetails.discountValue}%`;

            } else {

                couponText +=
                    formatCurrency(
                        order.couponDetails.discountValue
                    );

            }


            doc.text(
                couponText,
                340,
                tableY,
                {
                    width: 205,
                    align: "right"
                }
            );

        }


        // =========================================
        // FOOTER
        // =========================================

        doc
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#666666")
            .text(
                "Thank you for shopping with JORDAN!",
                50,
                735,
                {
                    width: 495,
                    align: "center"
                }
            );


        doc.text(
            "This is a computer-generated invoice.",
            50,
            751,
            {
                width: 495,
                align: "center"
            }
        );


        // =========================================
        // FINISH PDF
        // =========================================

        doc.end();

    } catch (error) {

        console.log(
            "Invoice error:",
            error
        );

        if (!res.headersSent) {

            return res.status(500).json({
                success: false,
                message: "Unable to generate invoice"
            });

        }

    }

};