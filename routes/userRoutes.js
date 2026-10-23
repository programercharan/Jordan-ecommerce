import express from "express"

const Router = express.Router()
import { loginUser, userLoginPage, userSignUpPage, signupUser, homePage, forgotPasswordPage, generateOtp, forgotPasswordOtpPage, verifyOtp, changePasswordPage, updatePassword, resendOtp,profile,updateProfileEmailPage,updateProfileEmail,addressPage,addAddressPage,addAddress,updateProfile,editAddress,updateAddress,deleteAddress,updateCurrentPasswordPage,updateCurrentPassword,forgotcurrentpassword
  ,productDetail,getAllProductsPage,newProductDetail,addToCart,getCart,updateCartQty,removeFromCart,logout,googleCallbackController,getWishlistPage,addAndRemove,applyCoupon,removeCoupon,getWallet,
    addMoneyToWallet,walletPaymentController,cancelAllOrderItemController,returnAllOrderItemController,
checkoutPage,getAddress,orderPlaceController,orderSuccessPage,ordersPage,userOrderDetails,cancelOrderItemController,returnOrderItemController,downloadInvoiceController,validateCheckout,verifyRazorpayPaymentController,createRazorpayOrderController,paymentFailurePage,retryRazorpayPaymentController,paymentFailedController} from "../controller/userController.js"

import { Checksession, restrictPage,verifyEmail,allowChangePassword,pageSession,setBreadcrumbs,restrictAddToCart,restrictAddToWishList,orderSuccessMiddleware,paymentFailureSesssion,restrictVerifyOtpPage } from "../middleware/userAuth.js"

import { signupRules,handleSignupErrors } from "../validator/validators.js"
import passport from "../config/passport.js"


Router.get("/login",restrictPage,userLoginPage)
Router.post("/login", restrictPage, loginUser)

Router.get("/signup",restrictPage, userSignUpPage)
Router.post("/signup",signupRules, handleSignupErrors,signupUser)

Router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
Router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/user/signup?error=something went wrong" }),googleCallbackController);

Router.get("/forgotpassword",forgotPasswordPage)
Router.post("/forgotpassword", generateOtp)
Router.get("/verifyotp",verifyEmail,restrictVerifyOtpPage, forgotPasswordOtpPage)
Router.post("/verifyotp",verifyEmail,restrictVerifyOtpPage, verifyOtp)
Router.get("/changepassword",allowChangePassword, changePasswordPage)
Router.post("/changepassword", updatePassword)
Router.post("/resendotp", resendOtp);

Router.get("/profile",profile)
Router.get("/updateProfileEmail",pageSession,updateProfileEmailPage)
Router.post("/updateProfileEmail",updateProfileEmail)
Router.get("/updateProfilePassword",pageSession,updateCurrentPasswordPage)
Router.post("/changeCurrentPassword",updateCurrentPassword)
Router.get("/forgotcurrentpassword",forgotcurrentpassword)
Router.post("/forgotcurrentpassword",forgotPasswordOtpPage)
Router.post("/updateProfile",updateProfile)

Router.get("/home", homePage)

//address
Router.get("/address",pageSession,addressPage)
Router.get("/addaddress",pageSession,addAddressPage)
Router.post("/addaddress",addAddress)
Router.get("/editAddress/:id",pageSession,editAddress)
Router.post("/updateAddress/:id",updateAddress)
Router.post("/deleteAddress/:id",deleteAddress)


Router.get("/shop", getAllProductsPage);
Router.get("/product/:id",setBreadcrumbs,productDetail)
Router.get("/product/:productId/:variantId", setBreadcrumbs, newProductDetail);

//cart
Router.post("/cart/add",restrictAddToCart, addToCart);
Router.get("/cart", Checksession, getCart);
Router.post("/cart/update", Checksession, updateCartQty);
Router.post("/cart/remove", Checksession, removeFromCart)

//wishlist
Router.get("/wishlist",Checksession,getWishlistPage)
Router.post("/wishlist/addAndRemove",restrictAddToWishList,addAndRemove)
Router.get("/checkout",checkoutPage)
Router.post("/validate-checkout", validateCheckout); //executes from cart page before proceeding to checkout page

Router.post("/payment/create-order",Checksession,createRazorpayOrderController);
Router.post("/payment/verify",Checksession,verifyRazorpayPaymentController);
Router.get("/payment/failure",Checksession,paymentFailureSesssion,paymentFailurePage);
Router.post("/payment/retry",Checksession,retryRazorpayPaymentController);


Router.post("/payment/wallet",walletPaymentController);

Router.get("/getAddress/:id",getAddress)//edit address
Router.post("/order/place",orderPlaceController)//COD

Router.get("/orders",Checksession, ordersPage);
Router.get("/orders/:id", Checksession, userOrderDetails);//order-details-page
Router.get("/order/success/:id", Checksession,orderSuccessMiddleware, orderSuccessPage);
Router.post("/orders/item/cancel/:orderId/:itemId",Checksession,cancelOrderItemController);
Router.post("/orders/item/all/cancel/:orderId",Checksession,cancelAllOrderItemController)//cancel All items 
Router.post("/orders/item/return/:orderId/:itemId",Checksession,returnOrderItemController);
Router.post( "/orders/item/all/return/:orderId",Checksession,returnAllOrderItemController);//return all items
Router.get("/order/invoice/:orderId", Checksession,downloadInvoiceController);

Router.post( "/payment/failed",Checksession,paymentFailedController);

Router.post("/coupon/apply", applyCoupon);
Router.post("/coupon/remove", removeCoupon);



// Wallet page
Router.get("/wallet",getWallet);
// Add money
Router.post("/wallet/add-money",addMoneyToWallet);



Router.get("/logout",logout)
export default Router

