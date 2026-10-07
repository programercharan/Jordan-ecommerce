

export const Checksession = (req, res, next) => {
console.log("this is the middleware to check the email in req.session")
    if (req.session.userId) {
        console.log(req.session)
        console.log("middleware from home to check email,yes")
        console.log("req.session.userId->",req.session.userId)
        next()
    } else {
        console.log("this executed ,right?")
        return res.redirect("/user/login")
    }
}

export const restrictPage = (req, res, next) => {
    if(req.session.userId && req.session.home) {
        console.log("req.session.email->",req.session.email)
        console.log("middleware when <- is clicked ")
        return res.redirect("/user/home")
    } else{

         next()
    }
}

export const verifyEmail=(req,res,next)=>{
    if(!req.session.email){
        console.log("middleware checking weather the session has email->",req.session.email)
  
        req.session.alert={
            type:"info",
            message:"user haven't logged in signIn"
        }
        return res.redirect("/user/login")
    }
    console.log("middleware checking weather the session has email->",req.session.email)
    console.log("VERIFY EMAIL MIDDLEWARE EXECUTED SUCESSFULLY")
    next()

}

export const restrictVerifyOtpPage=(req,res,next)=>{
    if(!req.session.AllowVerifyOtpPage){
         console.log("middleware to restrict the verifyOtp page by checking req.session.signup->",req.session.signup) 
    return res.redirect("/user/home")
    } 
     next()
}



export const allowChangePassword=(req,res,next)=>{
    if(!req.session.allowChangePassword){
        return res.redirect("/user/login")
    }
    next()
}

export const pageSession=(req,res,next)=>{
    if(req.session.userId && req.session.home){
        next()

    }else{
        res.redirect("/user/login")
    }

}

export const restrictAddToCart=(req,res,next)=>{
    if(!req.session.userId){
        console.log("middleware to resitrict ADD TO CART without Login->",req.session.email)
        return res.json({success:false})
    }
    next()
}

// export const restrictUpdateAndRemoveCart=(req,res,next)=>{
//     if(!req.session.email){
//         console.log("middleware to resitrict ADD TO CART without Login->",req.session.email)
//         return res.json({success:false,redirect:true,title:"User Haven't Logged In",text:"Would You Like To Login"})
//     }
// }

export const restrictAddToWishList=(req,res,next)=>{
    if(!req.session.userId){
        console.log("middleware to check the email in session to add to cart")
        return res.json({alert:true})
    }
    next()
}

export const setBreadcrumbs = (req, res, next) => {
console.log("Breadcrumb middleware executed");
    res.locals.breadcrumbs = [
        { name: "Home", url: "/user/home" },
        { name: "Shoes", url: "/user/shop" }
    ];

     next();
};

export const orderSuccessMiddleware=(req,res,next)=>{
    if (!req.session.lastOrderId ||
    req.session.lastOrderId !== req.params.id) {
    return res.redirect("/user/cart");
}
next()
}

export const paymentFailureSesssion=(req,res,next)=>{
    if(!req.session.paymentFailurePage){
       return  res.redirect("/user/cart")
    }
    next()
}