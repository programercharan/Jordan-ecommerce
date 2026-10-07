import Cart from "../models/addToCart.model.js"

export const cartCount=async(req,res,next)=>{
    if(!req.session.userId){
        res.locals.cartCount=0
        return next()
    }

        const userCart=await Cart.findOne({userId:req.session.userId})
        res.locals.cartCount=userCart?.items?.length||0
         next()
}