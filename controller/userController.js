import {
  login, signup, forgotPasswordGenerateOtp, verifyingOtp, resetPassword, resendOtpService, loadHome, profileInfo, forgotcurrentpasswordOtp, verifyForgotCurrentPassword, addToCartService, getCartService, updateCartQtyService, removeFromCartService, getWishlistPageService,
  updateProfileEmailOtp, addressDetails, newaddress, updateProfileDetails, findEditAddress, findUpdateAddress, DeleteAddressService, resetCurrentPassword, fetchAllProducts, getAllProductsPageService, productDetailServices, newProductDetailServices,
  addAndRemoveService, checkoutPageServices, orderPlaceService, orderSuccessServices, ordersPageService, userOrderDetailsService, cancelOrderItemService, downloadInvoiceService, returnOrderItemService, validateCheckoutService, walletPaymentService,
  createRazorpayOrderService, verifyRazorpayPaymentService, applyCouponService, removeCouponService, getWalletService, cancelAllOrderItemServices, returnAllOrderItemServices,
  addMoneyToWalletService,updateProfileEmailPageServices,getAddressServices,generateInvoicePDF,updateCurrentPasswordPageServices
} from "../services/userServices.js";


export const userLoginPage = (req, res) => {
  console.log("controller of userLoginPage")
  const error = req.session.error || null
  req.session.error = null
  console.log("error while rendering the get ?login  Page->", error)
  console.log("req.session.email->", req.session.email)
  const success = req.query?.success || null
  res.render("signin-page", { error, success });
};

export const userSignUpPage = (req, res) => {
  console.log("req.session.email->", req.session.email)
  res.render("signup-page", { error: null });
};

export const homePage = async (req, res) => {
  try {
    let userId = req.session.userId
    if (userId) {
      const result = await loadHome(userId)
      if (result.success) {
        req.session.home = true
        console.log(result.user.firstName)
        return res.render("home", { products: result.products, username: result.user.firstName })
      } else {
        return res.redirect("/user/signin", { error: "something went wrong please try again later" })
      }
    }
    else {
      userId = null
      const result = await loadHome(userId)
      if (result.success) {
        console.log("home page rendering without login")
        req.session.home = true
        // req.session.userId=result.userId
        // console.log("from home route",req.session.userId)
        res.render("home", { products: result.products, username: null });
      } else {
        res.redirect("/user/signin", { error: "something went wrong please try again later" })
      }
    }
  } catch (error) {
    console.log(error)
  }
}


export const loginUser = async (req, res) => {
  try {
    console.log("req body=>" + req.body.email + req.body.password)
    const { email, password } = req.body;
    console.log(email, password);
    const result = await login(email, password);
    if (result.success) {
      req.session.userId = result.user._id
      res.redirect("/user/home");
    } else {
      req.session.error = result.error;
      return res.redirect("/user/login");
      //   res.render("signin-page", { error: result.error });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send("something went wrong try again later");
  }
};

export const signupUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, referralCode, isBlocked } = req.body;

    const result = await signup(firstName, lastName, email, password, phoneNumber, referralCode, isBlocked);
    if (result.success) {
      req.session.email = email;
      req.session.AllowVerifyOtpPage = true
      console.log("inside the post method controller✅")
      console.log("req.session.email is stored", req.session.email)
      req.session.purpose = "signupVerification";
      res.redirect("/user/verifyotp");
    } else {
      res.render("signup-page", { error: result.error });
    }
  } catch (error) {
    console.log(error);
  }
};

export const logout = (req, res) => {
  delete req.session.email
  console.log(req.session)
  delete req.session.userId;
  res.redirect("/user/login")
}
export const googleCallbackController = (req, res) => {

  req.session.userId = req.user._id;
  req.session.email = req.user.email;

  console.log("--------redirecting to home page--------");

  res.redirect("/user/home");
};
// <!---------------------------------forgotPassword------------------------------------------------------------!>
export const forgotPasswordPage = (req, res) => {
  res.render("forgot-password", { error: null });
};

export const generateOtp = async (req, res) => {
  try {
    console.log("generate otp CONTROLLER executed")
    console.log(req.body);
    const { email } = req.body;
    const result = await forgotPasswordGenerateOtp(email);
    if (result.success) {
      req.session.email = email;
      req.session.purpose = "forgotPassword"
      console.log("redirecting to verifyOtp")
      req.session.AllowVerifyOtpPage = true
      res.redirect("/user/verifyotp");
    } else {
      res.render("forgot-password", { error: result.error });
    }
  } catch (error) {
    console.log(error);
  }
};

export const forgotPasswordOtpPage = (req, res) => {
  console.log("get method controller....")
  const purpose = req.session.purpose;
  const error = req.session.error;
  console.log(error)
  req.session.error = null;

  res.render("verify-otp", {
    purpose,
    error,
  });
};

export const verifyOtp = async (req, res) => {
  console.log("post method controller....")
  try {
    const { otp, purpose } = req.body;
    console.log(otp, purpose)

    if (purpose === "forgotPassword") {
      console.log(purpose, otp);
      const email = req.session.email;
      const result = await verifyingOtp(otp, email, purpose);
      if (result.success) {
        req.session.allowChangePassword = true
        // res.redirect("/user/changepassword");
        console.log("req.session.email--->", req.session.email)
        res.json({ success: true, message: "Otp Verified Sucessfully", redirect: "/user/changepassword" })

      } else {
        // req.session.error = result.error;
        // res.redirect("/user/verifyotp");
        res.json({ success: false, message: "Otp Verified Sucessfully", error: result.error })
      }
    }

    //**<----signupVerification---->**//
    else if (purpose === "signupVerification") {
      console.log("signupVerification")
      const email = req.session.email;
      console.log("enter controller for signUp verification")
      const result = await verifyingOtp(otp, email, purpose);
      if (result.success) {
        req.session.AllowVerifyOtpPage = false
        req.session.userId = result.newUser._id
        res.json({
          success: true,
          message: "Account created successfully.",
          redirect: "/user/home"
        })

      } else {
        // req.session.error = result.error;
        // res.redirect("/user/verifyotp");
        res.json({ success: false, message: "Otp Verified Sucessfully", error: result.error })
      }
    }

    //**<----updateProfileEmail---->**//
    else if (purpose === "updateProfileEmail") {
      const email = req.session.email
      const updateEmail = req.session.updateEmail
      console.log("in the controller before passiong service", updateEmail)
      const result = await verifyingOtp(otp, email, purpose, updateEmail);
      if (result.success) {
        req.session.email = updateEmail
        //     req.session.alert={
        //     type:"success",
        //     message: "Email Updated"
        // }
        // return res.redirect("/user/profile")
        res.json({ success: true, message: "Otp Verified Sucessfully", redirect: "/user/profile" })

      } else {
        // req.session.error = result.error;
        // res.redirect("/user/verifyotp");
        res.json({ success: false, error: result.error })
      }
    }
    else if (purpose === "forgotCurrentPassword") {
      console.log("otp check executing...")
      const email = req.session.email
      console.log(otp, email)
      const result = await verifyForgotCurrentPassword(otp, purpose, email)
      console.log(result)
      if (result.success) {
        console.log("redirecting to change Password Page")
        req.session.allowChangePassword = true
        // return res.redirect("/user/changepassword")
        res.json({ success: true, redirect: "/user/changepassword" })
      } else {
        // req.session.error=result.error
        // res.redirect("/user/verifyotp")
        res.json({ success: false, error: result.error })
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const changePasswordPage = (req, res) => {
  console.log("this is from rendering chnage password")
  delete req.session.AllowVerifyOtpPage
  res.render("change-Password", { error: null });
};

export const updatePassword = async (req, res) => {
  try {

    const { password, confirmPassword } = req.body;
    const email = req.session.email;
    const result = await resetPassword(password, confirmPassword, email);
    if (result.success) {
      req.session.destroy((err) => {
        if (err) console.log(err);
        res.clearCookie("connect.sid");
        res.redirect("/user/login?success=passwordUpdated")
      });

    }
  } catch (error) {
    console.log(error);
  }
};

export const resendOtp = async (req, res) => {
  try {
    const email = req.session.email;

    if (!email) {
      req.session.error = "Session expired. Please try again.";
      return res.redirect("/user/forgotpassword");
    }

    const result = await resendOtpService(email);

    if (!result.success) {
      req.session.error = result.error;

      return res.redirect("/user/verifyotp");
    }

    res.redirect("/user/verifyotp");
  } catch (error) {
    console.log(error);
    res.redirect("/user/verifyotp");
  }
};

export const profile = async (req, res) => {
  console.log("profile controller executed!!!!!")
  const userId = req.session.userId
  // if(!userId){
  //   console.log("user id dont exist redirect ot /login")
  //   return res.redirect("/user/login")
  // }
  console.log("userId--->", userId)
  const result = await profileInfo(userId)
  if (result.success) {
    res.render("profile", { error: null, user: result.user, currentPage: "profile" })
  } else {
    req.session.alert = { message: "User Haven't Logged IN ,Login", type: "error", redirect: "/user/login" }
    // res.render("profile",{error:null,user:null,currentPage:"profile"})
    res.redirect("/user/login")
  }
}

export const updateProfileEmailPage = async (req, res) => {
  const userId = req.session.userId
  // console.log(userEmail)
const result=await updateProfileEmailPageServices(userId)

if(!result.success){
      return res.render("profile", { error: "user signed up using Google Auth cannot change password", currentPage: "profile", user: { email: result.user.email, password: result.user.googleId } })
}
return res.render("update-profileEmail", { error: null })
}

export const updateProfileEmail = async (req, res) => {
  const { email } = req.body
  req.session.updateEmail = email
  req.session.purpose = "updateProfileEmail"
    const userId = req.session.userId
  const result = await updateProfileEmailOtp(email,userId)
  if (result.success) {

    if (result.user) {
      req.session.email = result.user.email
    }

    console.log("post response for  updateprofile Email is done redirecting to verifyOtp")
    req.session.AllowVerifyOtpPage = true
    res.redirect("/user/verifyotp")

  } else {
    console.log("result.success->", result.success)
    req.session.error = result.error;
    return res.redirect("/user/verifyotp");

  }

}


export const updateCurrentPasswordPage = async (req, res) => {
  req.session.allowChangeCurrentPassword = true
  req.session.purpose = "updatePassword"
  const userId = req.session.userId
  const result=await updateCurrentPasswordPageServices(userId)
  
  if (result.success) {
    res.render("change-currentPassword", { error: null })
  } else {
    res.render("profile", { error: "user signed up using Google Auth cannot change password", currentPage: "profile", user: { email: result.user.email, password: result.user.googleId } })
  }


}

export const updateCurrentPassword = async (req, res) => {
  try {
    const purpose = req.session.purpose
    if (purpose === "updatePassword") {
      const { currentPassword, password, confirmPassword } = req.body;
      console.log(currentPassword, password, confirmPassword)
      const userId = req.session.userId;
      console.log("the email of the user to change the password-->", userId)
      const result = await resetCurrentPassword(currentPassword, password, confirmPassword, userId);

      if (result.success) {
        req.session.purpose = null
        req.session.allowChangePassword = null
        req.session.alert = {
          type: "success",
          message: "Password Updated."
        }
        return res.redirect("/user/profile")
      } else {
        res.render("change-currentPassword", { error: result.error })
        // res.redirect("/user/profile")
      }
    }
  } catch (error) {
    console.log(error)
  }
}

export const forgotcurrentpassword = async (req, res) => {
  console.log("forgot current password controller executed !!!")
  const userId = req.session.userId
  console.log("userId:", userId)
  const result = await forgotcurrentpasswordOtp(userId)
  console.log(result)
  if (result.success) {
    req.session.purpose = "forgotCurrentPassword"
    req.session.AllowVerifyOtpPage = true
    req.session.email = result.userEmail
    res.redirect("/user/verifyOtp")
  }
}

export const updateProfile = async (req, res) => {
  const userId = req.session.userId
  const { firstName, lastName, phoneNumber } = req.body
  const result = await updateProfileDetails(userId, firstName, lastName, phoneNumber)
  if (result.success) {
    req.session.alert = {
      type: "success",
      message: "profile updated Sucessfully"
    }
    res.redirect("/user/profile")
  }
  else {
    req.session.alert = {
      type: "error",
      message: result.errormsg
    }
    res.redirect("/user/profile")
  }
}

export const addressPage = async (req, res) => {
  try {
    console.log("address executed")
    const userId = req.session.userId
    const result = await addressDetails(userId)
    if (result.success) {
      res.render("address", { addresses: result.addresses, currentPage: "address" })
    }
  } catch (error) {
    console.log(error)
  }
}

export const addAddressPage = (req, res) => {
  res.render("address-add", { currentPage: "address" })
}

export const addAddress = async (req, res) => {
  console.log("post request of add address")
  const { firstName, lastName, address, city, state, pincode, phoneNumber } = req.body
  console.log(firstName, lastName, address, city, state, pincode, phoneNumber)
  const userId = req.session.userId
  const result = await newaddress(firstName, lastName, address, city, state, pincode, phoneNumber, userId)
  if (result.success) {
    req.session.alert = {
      type: "success",
      message: "Address Added Sucessfully"
    }
    if (req.body.redirectPage === "checkout") {
      res.redirect("/user/checkout");
    } else {
      res.redirect("/user/address");
    }
  }
}

export const editAddress = async (req, res) => {
  const addressId = req.params.id
  const result = await findEditAddress(addressId)
  if (result.success) {
    console.log(result.address)
    res.render("address-edit", { address: result.address, currentPage: "address" })
  }
}

export const updateAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const { firstName, lastName, address, city, state, pincode, phoneNumber } = req.body;
    const result = await findUpdateAddress(addressId, firstName, lastName, address, city, state, pincode, phoneNumber)
    if (result.success) {
      req.session.alert = {
        type: "success",
        message: "Address Updated Sucessfully"
      }
      if (req.body.redirectPage === "checkout") {
        res.redirect("/user/checkout");
      } else {
        res.redirect("/user/address");
      }

    }
  } catch (error) {
    console.log(error)
    return res.redirect("/user/shop");
  }
}

export const deleteAddress = async (req, res) => {
  const addressId = req.params.id
  const result = await DeleteAddressService(addressId)
  if (result.success) {
    req.session.alert = {
      type: "success",
      message: "Address deleted Sucessfully"
    }
    res.redirect("/user/address")
  }
}



export const productDetail = async (req, res) => {

  try {
    const variantId = req.params.id;
    const userId = req.session.userId
    const result = await productDetailServices(variantId, userId);

    if (!result.success) {
      console.log(result)
      req.session.alert = {
        type: "error",
        message: result.errorMsg
      };

      return res.redirect("/user/shop");
    }

    const {
      product,
      variants,
      selectedVariant,
      category,
      relatedProducts,
      relatedProductsVariants,
      inWishlist,
      offerPrice
    } = result;


    res.locals.breadcrumbs = [
      { name: "Home", url: "/user/home" },
      { name: "Shoes", url: "/user/shop" },
      { name: category.categoryName, url: `/shop?category=${category._id}` },
      { name: product.name, url: null }
    ];
    console.log("inWishlist->", inWishlist)
    return res.render("productDetail", {
      product,
      variants,
      selectedVariant, relatedProducts, relatedProductsVariants, inWishlist, offerPrice

    });

  } catch (err) {
    console.log(err);
    return res.redirect("/user/shop");
  }
};

export const allProducts = async (req, res) => {
  const result = await fetchAllProducts()
  if (result.success) {
    res.render("productList", { genders: ["male", "female"], colors: [], sizes: [], products: [], priceRanges: [], shoeTypes: [] })
  }

}

// controllers/product.controller.js


export const getAllProductsPage = async (req, res) => {
  try {
    const { search, sort, page, category, brand, color, price } = req.query;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    const userId = req.session.userId

    const result = await getAllProductsPageService({ search, sort, page, category, brand, color, price, userId, minPrice, maxPrice });

    
  
    delete req.session.lastOrderId
    return res.render("productList", {
      offersOfEachProduct: result.offersOfEachProduct,
      products: result.products,
      eachProductVariant: result.eachProductVariant,
      categories:result.categories,
      sortAlphabeticOrder: result.sortAlphabeticOrder,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      wishedProductIndexes: result.wishedProductIndexes
    });

  } catch (err) {
    console.error("Error fetching products:", err);
    return res.status(500).send("Server Error");
  }
};
//-------------------------------------------------------------




export const newProductDetail = async (req, res) => {

  try {

    const {
      productId,
      variantId
    } = req.params;


    const userId =
      req.session.userId;


    const result =
      await newProductDetailServices(
        productId,
        variantId,
        userId
      );


    if (!result.success) {

      req.session.alert = {

        type: "error",

        message: result.errorMsg

      };

      return res.redirect(
        "/user/shop"
      );

    }


    const {
      product,
      variants,
      selectedVariant,
      relatedProducts,
      category,
      relatedProductsVariants,
      inWishlist,
      offerPrice
    } = result;


    res.locals.breadcrumbs.push(

      {
        name:
          category.categoryName,

        url:
          `/user/shop?category=${category._id}`
      },

      {
        name:
          product.name,

        url: null
      }

    );


    return res.render(
      "productDetail",
      {

        product,

        variants,

        selectedVariant,

        relatedProducts,

        relatedProductsVariants,

        inWishlist,

        offerPrice

      }
    );

  } catch (error) {

    console.log(
      "Error in newProductDetail:",
      error
    );

    return res.redirect(
      "/user/shop"
    );

  }

};

//Cart------------------------------------------------------------------------------------------------------------------
export const addToCart = async (req, res) => {
  console.log("add to card controller")
  try {
    console.log("executing add to cart controller")
    const userId = req.session.userId;

    const { variantId, size, quantity } = req.body;

    const result = await addToCartService({
      userId,
      variantId,
      size: Number(size),
      quantity: quantity || 1
    });

    if (!result.success) {
      console.log("result--->", result)
      return res.json(result);
    }

    return res.json({
      success: true,
      message: "Added to cart",
      newTotalCartCount: result.newTotalCartCount
    });

  } catch (err) {
    console.log(err);
    return res.json({
      success: false,
      message: "Server error"
    });
  }
};

export const getCart = async (req, res) => {

  try {
    const userId = req.session.userId;

    const result = await getCartService(userId);

    if (!result.success) {

      req.session.alert = {
        type: "error",
        message: result.message
      };

      return res.redirect("/user/home");
    }


    return res.render("cart", {
      cartItems: result.cartItems,
      total: result.total,
      totalQuantity: result.totalQuantity
    });

  } catch (err) {

    console.log(err);

    req.session.alert = {
      type: "error",
      message: "Something went wrong."
    };

    return res.redirect("/user/home");
  }

};

export const updateCartQty = async (req, res) => {

  try {

    const userId = req.session.userId;

    const { variantId, size, action } = req.body;

    const result = await updateCartQtyService({
      userId,
      variantId,
      size: Number(size),
      action
    });

    return res.json(result);

  } catch (err) {

    console.log(err);

    return res.json({
      success: false,
      message: "Something went wrong."
    });

  }

};

export const removeFromCart = async (req, res) => {

  try {

    const userId = req.session.userId;

    const { variantId, size, redirectPage } = req.body;

    const result = await removeFromCartService({
      userId,
      variantId,
      size: Number(size)
    });
    if (redirectPage === "checkout") {
      return res.json({
        success: true,
        message: "Item removed from cart"
      });
    }
    return res.json(result);

  } catch (err) {

    console.log(err);

    return res.json({
      success: false,
      message: "Something went wrong."
    });

  }

};

//wishlist------------------------------------------------------------------------------------------------------------------
export const getWishlistPage = async (req, res) => {
  console.log("controller executed")
  const userId = req.session.userId
  console.log("userId->", userId)
  const result = await getWishlistPageService(userId)
  if (result.success) {
    console.log("result.success", result.success)
    console.log("result.productsOfWishlist.length()->", result.productsOfWishlist)
    res.render("wishlist", {
      productsOfWishlist: result.productsOfWishlist, selectedPage: 1, totalPages: 1,

      currentPage: "wishlist"
    })
  } else {
    console.log(result)
    res.redirect("/user/home")
  }
}

export const addAndRemove = async (req, res) => {

  const userId = req.session.userId
  console.log("wihshlist request body req.body-->", req.body)
  const { variantId, size, action, fromListPage } = req.body
  console.log("variantId,size,action->", variantId, size, action)
  const result = await addAndRemoveService(userId, variantId, size, action, fromListPage)
  if (result.success) {
    return res.json({ success: true, newTotalCount: result.newTotalCount })
  } else {
    return res.json({ success: false, error: result.error })
  }

}

export const checkoutPage = async (req, res) => {
  if (req.session.lastOrderId) {
    return res.redirect(`/user/orders/${req.session.lastOrderId}`);
  }
  const userId = req.session.userId
  const result = await checkoutPageServices(userId)
  delete req.session.couponId;
  // console.log(result)
  if (result) {
    result.razorpayKeyId = process.env.RAZORPAY_KEY_ID
    res.render("checkout", result)
  } else {
    res.redirect()
  }
}

export const getAddress = async (req, res) => {

  const userId=req.params.id
  const result=await getAddressServices(userId)

if(result.success){
  res.json(result.address);
}

}




export const orderPlaceController = async (req, res) => {

  try {

    const userId = req.session.userId;

    const {
      selectedAddressId,
      paymentMethod,
      couponId
    } = req.body;


    const result = await orderPlaceService(
      selectedAddressId,
      paymentMethod,
      userId,
      couponId
    );


    console.log(
      "result in controller:",
      result
    );


    if (result.success) {

      req.session.lastOrderId =
        result.orderId.toString();

    }


    return res.json(result);


  } catch (error) {

    console.log(
      "Error in orderPlaceController:",
      error
    );


    return res.json({

      success: false,

      message: "Something went wrong"

    });

  }
};


export const orderSuccessPage = async (req, res) => {
  try {
    console.log("inide the order sucess controller ")
    const id = req.params.id
    const result = await orderSuccessServices(id)
    if (result.success) {
      req.session.paymentFailurePage = false
      console.log(result)
      res.render("order-sucess-page", { order: result.order })
    }
  } catch (error) {
    console.log(error)
  }
}

export const ordersPage = async (req, res) => {

  try {
    const userId = req.session.userId;
    const search = req.query.search || "";
    const sort = req.query.sort || "newest";
    const page = Number(req.query.page) || 1;

    const result = await ordersPageService({ userId, search, sort, page });

    if (!result.success) {
      return res.render("orders", {
        orders: [],
        currentPage: 1,
        totalPages: 1,
        search,
        sort
      });
    }
    return res.render("orders", {

      orders: result.orders,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      search,
      sort
    })
  }
  catch (error) {
    console.log(error);
    res.redirect("/user/home");
  }

}


export const userOrderDetails = async (req, res) => {

  try {
    console.log("order details page executed✅")
    delete req.session.lastOrderId;
    const orderId = req.params.id;
    const userId = req.session.userId;
    const result = await userOrderDetailsService(orderId, userId);

    if (result.success) {
      console.log("result.sucess is true")
      console.log("result.order.orderStatus-->", result.order.orderStatus)
      return res.render("order-details-page", {
        order: result.order
      });

    } else {

      return res.status(404).render("error", {
        message: result.message
      });

    }


  } catch (error) {

    console.log(error);

    res.status(500).render("error", {
      message: "Something went wrong"
    });

  }

}


export const cancelOrderItemController = async (req, res) => {

  try {

    const { orderId, itemId } = req.params;

    const { reason } = req.body;


    const result = await cancelOrderItemService(orderId, itemId, reason);
    console.log(result)

    res.json(result);


  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message
    });

  }

}


export const returnOrderItemController = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;
    const result = await returnOrderItemService(orderId, itemId, reason);
    res.json(result);
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message
    })
  }
}

export const downloadInvoiceController = async (req, res) => {

    try {

        const { orderId } = req.params;

        const result = await downloadInvoiceService(orderId);

        if (!result.success) {
            return res.status(400).json(result);
        }

        const order = result.order;

        generateInvoicePDF(order, res);

    } catch (error) {

        console.log("Invoice error:", error);

        if (!res.headersSent) {

            return res.status(500).json({
                success: false,
                message: "Unable to generate invoice"
            });

        }

    }

};







// export const downloadInvoiceController = async (req, res) => {

//   try {

//     const { orderId } = req.params;


//     // --------------------------------
//     // GET ORDER
//     // --------------------------------

//     const result =
//       await downloadInvoiceService(orderId);


//     if (!result.success) {

//       return res.status(400).json(result);

//     }


//     const order = result.order;


//     // --------------------------------
//     // CREATE PDF
//     // --------------------------------

//     const doc = new PDFDocument({

//       size: "A4",

//       margin: 50

//     });


//     // --------------------------------
//     // PDF RESPONSE HEADERS
//     // --------------------------------

//     res.setHeader(
//       "Content-Type",
//       "application/pdf"
//     );


//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=invoice-${order.orderId}.pdf`
//     );


//     // --------------------------------
//     // SEND PDF TO BROWSER
//     // --------------------------------

//     doc.pipe(res);


//     // --------------------------------
//     // HELPER FUNCTION
//     // --------------------------------

//     const formatCurrency = (amount) => {

//       return `Rs. ${Number(
//         amount || 0
//       ).toLocaleString("en-IN", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2
//       })}`;

//     };


//     // ==================================================
//     // CALCULATE DISCOUNTS
//     // ==================================================

//     let totalOfferDiscount = 0;

//     let totalCouponDiscount = 0;

//     let totalItemSubtotal = 0;


//     order.orderItems.forEach((item) => {

//       const quantity =
//         Number(item.quantity || 0);


//       const offerDiscountPerItem =
//         Number(
//           item.offerDiscountAmount || 0
//         );


//       const couponDiscount =
//         Number(
//           item.couponDiscount || 0
//         );


//       const itemSubtotal =
//         Number(
//           item.itemSubtotal || 0
//         );


//       totalOfferDiscount +=
//         offerDiscountPerItem * quantity;


//       totalCouponDiscount +=
//         couponDiscount;


//       totalItemSubtotal +=
//         itemSubtotal;

//     });


//     const totalDiscount =
//       totalOfferDiscount +
//       totalCouponDiscount;


//     // ==================================================
//     // STORE HEADER
//     // ==================================================

//     doc
//       .fillColor("#111111")
//       .font("Helvetica-Bold")
//       .fontSize(26)
//       .text(
//         "JORDAN",
//         50,
//         50
//       );


//     doc
//       .font("Helvetica")
//       .fontSize(10)
//       .fillColor("#555555")
//       .text(
//         "Premium Footwear Store",
//         50,
//         85
//       );


//     doc.text(
//       "Chennai, Tamil Nadu, India",
//       50,
//       101
//     );


//     doc.text(
//       "Email: support@jordan.com",
//       50,
//       117
//     );


//     // ==================================================
//     // INVOICE INFORMATION
//     // ==================================================

//     doc
//       .fillColor("#111111")
//       .font("Helvetica-Bold")
//       .fontSize(24)
//       .text(
//         "INVOICE",
//         350,
//         55,
//         {
//           width: 195,
//           align: "right"
//         }
//       );


//     doc
//       .font("Helvetica")
//       .fontSize(10)
//       .fillColor("#555555")
//       .text(
//         `Order ID: ${order.orderId}`,
//         350,
//         92,
//         {
//           width: 195,
//           align: "right"
//         }
//       );


//     doc.text(
//       `Order Date: ${new Date(
//         order.createdAt
//       ).toLocaleDateString("en-IN")}`,
//       350,
//       108,
//       {
//         width: 195,
//         align: "right"
//       }
//     );


//     doc.text(
//       `Payment Method: ${order.paymentMethod}`,
//       350,
//       124,
//       {
//         width: 195,
//         align: "right"
//       }
//     );


//     doc.text(
//       `Payment Status: ${order.paymentStatus}`,
//       350,
//       140,
//       {
//         width: 195,
//         align: "right"
//       }
//     );


//     // --------------------------------
//     // HEADER LINE
//     // --------------------------------

//     doc
//       .moveTo(50, 165)
//       .lineTo(545, 165)
//       .strokeColor("#cccccc")
//       .stroke();


//     // ==================================================
//     // SHIPPING ADDRESS
//     // ==================================================

//     doc
//       .fillColor("#111111")
//       .font("Helvetica-Bold")
//       .fontSize(12)
//       .text(
//         "SHIPPING ADDRESS",
//         50,
//         188
//       );


//     const address =
//       order.shippingAddress;


//     doc
//       .font("Helvetica")
//       .fontSize(10)
//       .fillColor("#444444")
//       .text(
//         `${address.firstName} ${address.lastName || ""
//         }`,
//         50,
//         212
//       );


//     doc.text(
//       `Phone: ${address.phoneNumber}`,
//       50,
//       228
//     );


//     doc.text(
//       address.address,
//       50,
//       244,
//       {
//         width: 270
//       }
//     );


//     doc.text(
//       `${address.city}, ${address.state}`,
//       50,
//       276
//     );


//     doc.text(
//       `Pincode: ${address.pincode}`,
//       50,
//       292
//     );


//     // ==================================================
//     // PRODUCT TABLE HEADER
//     // ==================================================

//     let tableY = 335;


//     doc
//       .rect(
//         50,
//         tableY,
//         495,
//         30
//       )
//       .fill("#111111");


//     doc
//       .fillColor("#ffffff")
//       .font("Helvetica-Bold")
//       .fontSize(8);


//     // PRODUCT
//     doc.text(
//       "PRODUCT",
//       60,
//       tableY + 10,
//       {
//         width: 130
//       }
//     );


//     // SIZE
//     doc.text(
//       "SIZE",
//       190,
//       tableY + 10,
//       {
//         width: 35,
//         align: "center"
//       }
//     );


//     // QTY
//     doc.text(
//       "QTY",
//       225,
//       tableY + 10,
//       {
//         width: 35,
//         align: "center"
//       }
//     );


//     // PRICE
//     doc.text(
//       "PRICE",
//       265,
//       tableY + 10,
//       {
//         width: 65,
//         align: "right"
//       }
//     );


//     // STATUS
//     doc.text(
//       "STATUS",
//       335,
//       tableY + 10,
//       {
//         width: 85,
//         align: "center"
//       }
//     );


//     // PAID
//     doc.text(
//       "PAID",
//       425,
//       tableY + 10,
//       {
//         width: 110,
//         align: "right"
//       }
//     );


//     tableY += 30;


//     // ==================================================
//     // PRODUCT TABLE ROWS
//     // ==================================================

//     order.orderItems.forEach(
//       (item, index) => {


//         const quantity =
//           Number(item.quantity || 0);


//         const salePrice =
//           Number(
//             item.salePrice + (item.offerDiscountAmount || 0) || 0
//           );


//         const itemSubtotal =
//           Number(
//             item.itemSubtotal || 0
//           );


//         const offerDiscount =
//           Number(
//             item.offerDiscountAmount || 0
//           ) * quantity;


//         const couponDiscount =
//           Number(
//             item.couponDiscount || 0
//           );


//         const paidAmount =
//           Number(
//             item.paidAmount || 0
//           );


//         const rowHeight = 70;


//         // --------------------------------
//         // ALTERNATE ROW BACKGROUND
//         // --------------------------------

//         if (index % 2 === 0) {

//           doc
//             .rect(
//               50,
//               tableY,
//               495,
//               rowHeight
//             )
//             .fill("#f3f4f6");

//         }


//         // --------------------------------
//         // PRODUCT NAME
//         // --------------------------------

//         doc
//           .fillColor("#222222")
//           .font("Helvetica")
//           .fontSize(9);


//         doc.text(
//           item.productName,
//           60,
//           tableY + 12,
//           {
//             width: 125
//           }
//         );


//         // --------------------------------
//         // SIZE
//         // --------------------------------

//         doc.text(
//           String(item.size),
//           190,
//           tableY + 12,
//           {
//             width: 35,
//             align: "center"
//           }
//         );


//         // --------------------------------
//         // QUANTITY
//         // --------------------------------

//         doc.text(
//           String(quantity),
//           225,
//           tableY + 12,
//           {
//             width: 35,
//             align: "center"
//           }
//         );


//         // --------------------------------
//         // SALE PRICE
//         // --------------------------------

//         doc.text(
//           formatCurrency(
//             salePrice
//           ),
//           265,
//           tableY + 12,
//           {
//             width: 65,
//             align: "right"
//           }
//         );


//         // --------------------------------
//         // ITEM STATUS
//         // --------------------------------

//         doc
//           .font("Helvetica-Bold")
//           .fontSize(7.5)
//           .fillColor("#222222");


//         doc.text(
//           item.itemStatus || "Unknown",
//           335,
//           tableY + 12,
//           {
//             width: 85,
//             align: "center"
//           }
//         );


//         // --------------------------------
//         // PAID AMOUNT
//         // --------------------------------

//         doc
//           .font("Helvetica-Bold")
//           .fontSize(9)
//           .fillColor("#222222");


//         doc.text(
//           formatCurrency(
//             paidAmount
//           ),
//           425,
//           tableY + 12,
//           {
//             width: 110,
//             align: "right"
//           }
//         );


//         // --------------------------------
//         // DISCOUNT DETAILS
//         // --------------------------------

//         doc
//           .font("Helvetica")
//           .fontSize(8)
//           .fillColor("#666666");


//         doc.text(
//           `Item Subtotal: ${formatCurrency(
//             itemSubtotal
//           )}`,
//           60,
//           tableY + 35,
//           {
//             width: 150
//           }
//         );


//         if (offerDiscount > 0) {

//           doc.text(
//             `Offer: -${formatCurrency(
//               offerDiscount
//             )}`,
//             215,
//             tableY + 35,
//             {
//               width: 80
//             }
//           );

//         }


//         if (couponDiscount > 0) {

//           doc.text(
//             `Coupon: -${formatCurrency(
//               couponDiscount
//             )}`,
//             300,
//             tableY + 35,
//             {
//               width: 85
//             }
//           );

//         }


//         tableY += rowHeight;

//       }
//     );


//     // ==================================================
//     // ORDER SUMMARY
//     // ==================================================

//     tableY += 25;


//     doc
//       .moveTo(
//         330,
//         tableY
//       )
//       .lineTo(
//         545,
//         tableY
//       )
//       .strokeColor("#cccccc")
//       .stroke();


//     tableY += 18;


//     // --------------------------------
//     // SUBTOTAL
//     // --------------------------------

//     doc
//       .font("Helvetica")
//       .fontSize(10)
//       .fillColor("#444444");


//     doc.text(
//       "Subtotal",
//       340,
//       tableY,
//       {
//         width: 90
//       }
//     );


//     doc.text(
//       formatCurrency(
//         order.subtotal
//       ),
//       430,
//       tableY,
//       {
//         width: 115,
//         align: "right"
//       }
//     );


//     tableY += 22;


//     // --------------------------------
//     // OFFER DISCOUNT
//     // --------------------------------

//     doc
//       .fillColor("#d9534f");


//     doc.text(
//       "Offer Discount",
//       340,
//       tableY,
//       {
//         width: 90
//       }
//     );


//     doc.text(
//       `-${formatCurrency(
//         totalOfferDiscount
//       )}`,
//       430,
//       tableY,
//       {
//         width: 115,
//         align: "right"
//       }
//     );


//     tableY += 22;


//     // --------------------------------
//     // COUPON DISCOUNT
//     // --------------------------------

//     doc
//       .fillColor("#d9534f");


//     doc.text(
//       "Coupon Discount",
//       340,
//       tableY,
//       {
//         width: 90
//       }
//     );


//     doc.text(
//       `-${formatCurrency(
//         totalCouponDiscount
//       )}`,
//       430,
//       tableY,
//       {
//         width: 115,
//         align: "right"
//       }
//     );


//     tableY += 22;


//     // --------------------------------
//     // TOTAL DISCOUNT
//     // --------------------------------

//     doc
//       .font("Helvetica-Bold")
//       .fillColor("#d9534f");


//     doc.text(
//       "Total Discount",
//       340,
//       tableY,
//       {
//         width: 90
//       }
//     );


//     doc.text(
//       `-${formatCurrency(
//         totalDiscount
//       )}`,
//       430,
//       tableY,
//       {
//         width: 115,
//         align: "right"
//       }
//     );


//     tableY += 28;


//     // ==================================================
//     // GRAND TOTAL
//     // ==================================================

//     doc
//       .moveTo(
//         330,
//         tableY
//       )
//       .lineTo(
//         545,
//         tableY
//       )
//       .strokeColor("#111111")
//       .stroke();


//     tableY += 15;


//     doc
//       .font("Helvetica-Bold")
//       .fontSize(14)
//       .fillColor("#111111");


//     doc.text(
//       "GRAND TOTAL",
//       340,
//       tableY,
//       {
//         width: 90
//       }
//     );


//     doc.text(
//       formatCurrency(
//         order.grandTotal
//       ),
//       430,
//       tableY,
//       {
//         width: 115,
//         align: "right"
//       }
//     );


//     // ==================================================
//     // COUPON INFORMATION
//     // ==================================================

//     if (
//       order.couponDetails &&
//       order.couponDetails.discountValue > 0
//     ) {

//       tableY += 40;


//       doc
//         .font("Helvetica")
//         .fontSize(9)
//         .fillColor("#555555");


//       let couponText =
//         "Coupon Applied: ";


//       if (
//         order.couponDetails.discountType ===
//         "percentage"
//       ) {

//         couponText +=
//           `${order.couponDetails.discountValue}%`;

//       } else {

//         couponText +=
//           formatCurrency(
//             order.couponDetails.discountValue
//           );

//       }


//       doc.text(
//         couponText,
//         340,
//         tableY,
//         {
//           width: 205,
//           align: "right"
//         }
//       );

//     }


//     // ==================================================
//     // FOOTER
//     // ==================================================

//     doc
//       .font("Helvetica")
//       .fontSize(9)
//       .fillColor("#666666")
//       .text(
//         "Thank you for shopping with JORDAN!",
//         50,
//         735,
//         {
//           width: 495,
//           align: "center"
//         }
//       );


//     doc.text(
//       "This is a computer-generated invoice.",
//       50,
//       751,
//       {
//         width: 495,
//         align: "center"
//       }
//     );


//     // ==================================================
//     // FINISH PDF
//     // ==================================================

//     doc.end();


//   } catch (error) {

//     console.log(
//       "Invoice error:",
//       error
//     );


//     if (!res.headersSent) {

//       return res.status(500).json({

//         success: false,

//         message:
//           "Unable to generate invoice"

//       });

//     }

//   }

// };


export const validateCheckout = async (req, res) => {

  try {

    const userId = req.session.userId;

    if (!userId) {

      return res.status(401).json({
        success: false,
        message: "Please login to continue"
      });
    }


    const result = await validateCheckoutService(userId);


    if (!result.success) {

      return res.status(400).json(result);
    }


    return res.status(200).json(result);


  } catch (error) {

    console.error("Validate checkout controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while validating your cart"
    });
  }
};




export const createRazorpayOrderController = async (req, res) => {

  try {

    console.log("create order controller executing");

    const userId = req.session.userId;
console.log("Coupon ID in session:", req.session.couponId);
    const { selectedAddressId, paymentMethod } = req.body;

    // Coupon stored when user clicked Apply
    const couponId = req.session.couponId || null;

    const result = await createRazorpayOrderService(userId, couponId);

console.log("Grand total from service:", result.grandTotal);
console.log("Coupon discount from service:", result.couponDiscount);
console.log("Razorpay amount in rupees:", result.razorpayOrder?.amount / 100);
    if (!result.success) {
      req.session.paymentFailurePage = true;
      return res.json(result);
    }

    req.session.razorpayOrderId = result.razorpayOrder.id;
    req.session.razorpayAmount = result.razorpayOrder.amount;
    req.session.razorpayCurrency = result.razorpayOrder.currency;
    req.session.selectedAddressId = selectedAddressId;
    req.session.paymentMethod = paymentMethod;

    return res.json(result);

  } catch (error) {

    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};




export const verifyRazorpayPaymentController = async (req, res) => {

  try {

    const userId = req.session.userId;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const selectedAddressId = req.body.selectedAddressId || req.session.selectedAddressId;

    const paymentMethod = req.body.paymentMethod || req.session.paymentMethod;

    // GET COUPON FROM SESSION
    const couponId = req.session.couponId || null;


    const result =
      await verifyRazorpayPaymentService({

        userId,

        razorpay_order_id,

        razorpay_payment_id,

        razorpay_signature,

        selectedAddressId,

        paymentMethod,

        couponId

      });


    if (result.success) {
      req.session.couponId = null;
      req.session.lastOrderId =
        result.orderId;

      return res.json(result);

    } else {

      req.session.paymentFailurePage = true;

      return res.json(result);

    }

  } catch (error) {

    console.log(
      "Verify Razorpay Controller Error:",
      error
    );

    return res.status(500).json({

      success: false,

      message: error.message

    });

  }

};

export const paymentFailurePage = async (req, res) => {

  try {

    res.render("payment-failure", {

      razorpayKeyId: process.env.RAZORPAY_KEY_ID

    });

  } catch (error) {

    console.log(error);

    res.send("Something went wrong");

  }

};


export const retryRazorpayPaymentController = async (req, res) => {

  try {

    const razorpayOrderId = req.session.razorpayOrderId;

    const amount = req.session.razorpayAmount;

    const currency = req.session.razorpayCurrency;


    if (!razorpayOrderId) {
      return res.json({

        success: false,

        message: "Payment session expired. Please return to checkout."

      });

    }


    return res.json({

      success: true,

      razorpayOrder: {

        id: razorpayOrderId,

        amount: amount,

        currency: currency

      }

    });


  } catch (error) {

    console.log(error);

    res.json({

      success: false,

      message: error.message

    });

  }

};


export const paymentFailedController = async (req, res) => {

  req.session.paymentFailurePage = true;

  return res.json({
    success: true
  });
};




export const applyCoupon = async (req, res) => {

  try {

    const userId = req.session.userId;

    const { couponId } = req.body;


    const result = await applyCouponService(
      userId,
      couponId
    );


    if (!result.success) {

      return res.json(result);

    }


    // Store coupon in session
    req.session.couponId = couponId;

    console.log("GRAND TOTAL", result.grandTotal)
    return res.json({

      success: true,

      couponDiscount: result.discount,

      grandTotal: result.grandTotal,

      items: result.items

    });


  } catch (error) {

    console.log(
      "Apply coupon controller error:",
      error
    );

    return res.status(500).json({

      success: false,

      message: "Something went wrong"

    });

  }

};


export const removeCoupon = async (req, res) => {

  try {

    const userId = req.session.userId;

    const result = await removeCouponService(userId);

    if (!result.success) {

      return res.json(result);

    }


// Remove applied coupon from session
req.session.couponId = null;

req.session.save((error) => {
  if (error) {
    console.log("Session save error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove coupon from session"
    });
  }

  return res.json({
    success: true,
    message: "Coupon removed successfully",
    couponDiscount: 0,
    grandTotal: result.grandTotal
  });
});

  } catch (error) {

    console.log(
      "Remove coupon controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });

  }
};






// ======================================
// GET WALLET PAGE
// ======================================

export const getWallet = async (req, res) => {

  try {

    const userId = req.session.userId;


    const wallet = await getWalletService(userId);


    res.render("wallet", {
      wallet: wallet,
      currentPage: "Wallet"
    });


  } catch (error) {

    console.error("Error loading wallet:", error);

    res.status(500).send("Something went wrong");

  }
};



// ======================================
// ADD MONEY
// ======================================

export const addMoneyToWallet = async (req, res) => {

  try {

    const userId = req.session.userId;

    const amount = Number(req.body.amount);


    // Validate amount

    if (!amount || amount <= 0) {

      return res.status(400).json({

        success: false,

        message: "Please enter a valid amount"

      });

    }


    // Optional decimal restriction

    if (!Number.isFinite(amount)) {

      return res.status(400).json({

        success: false,

        message: "Invalid amount"

      });

    }


    await addMoneyToWalletService(
      userId,
      amount
    );


    return res.json({

      success: true,

      message: `₹${amount} added to your wallet`

    });


  } catch (error) {

    console.error("Error adding money:", error);

    return res.status(500).json({

      success: false,

      message: "Unable to add money"

    });

  }
};



export const walletPaymentController = async (req, res) => {

  try {

    const userId = req.session.userId;

    const { selectedAddressId } = req.body;


    const couponId = req.session.couponId || null;


    const result = await walletPaymentService({
      userId,
      selectedAddressId,
      couponId
    });


    if (!result.success) {

      return res.json(result);

    }


    req.session.lastOrderId =
      result.orderId;


    // Coupon no longer needed
    req.session.couponId = null;


    return res.json(result);


  } catch (error) {

    console.log(
      "Wallet controller error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Something went wrong"

    });

  }

};

export const cancelAllOrderItemController = async (req, res) => {

  try {
    console.log("camcell all items cont exec")
    const orderId = req.params.orderId

    const userId = req.session.userId;

    const reason = req.body

    const result = await cancelAllOrderItemServices(userId, orderId, reason)

    if (!result.success) {
      return res.status(400).json(result)
    }

    return res.status(200).json(result)

  } catch (error) {

    return res.status(500).json({

      success: false,
      message: "Something went Wrong try Again Later"

    })

  }


}


export const returnAllOrderItemController = async (req, res) => {
  try {

    const orderId = req.params.orderId;
    const userId = req.session.userId;
    const reason = req.body;

    const result = await returnAllOrderItemServices(
      userId,
      orderId,
      reason
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {

    console.log("Error in return all controller:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later"
    });
  }
};

export const redirectToLoginController = (req, res) => {
    return res.redirect("/user/login");
};