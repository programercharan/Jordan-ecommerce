// middleware/wishlistCount.js

import Wishlist from"../models/wishlist.model.js"

export const wishlistCount = async (req, res, next) => {


        if (!req.session.userId) {

            res.locals.wishlistCount = 0;

            return next();

        }

        const wishlist = await Wishlist.findOne({
            userId: req.session.userId
        });

        res.locals.wishlistCount =
            wishlist?.items?.length || 0;

        next();

    
};