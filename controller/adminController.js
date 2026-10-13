import {loginServices,userDetails,createProductVariant,saveProductVariantService,updateProductVariantService,deactivateProductVariantService,activateProductVariantService,adminCouponServices,getAllOffersService,getAdminDashboardService,deleteCouponService,generateSalesReportPDF,getCreateOfferPageServices,adminEditCouponServices,adminPostEditCouponServices,
    adminOrdersService,adminOrderDetailsService,updateOrderStatusService,updatePaymentStatusService,adminReturnAcceptService,adminCancelRejectService,adminCancelAcceptService,adminReturnRejectService,downloadInvoiceService,getAllCouponsService,adminOfferServices,getEditOfferService,updateOfferService,deleteOfferService,getSalesReportService,getSalesReportPDFService,
    blockUserServices,unblockUserServices,addProductVariantPageServices,editProductVariantPageServices,productVarientPageServices,generateInvoicePDF,generateSalesReportExcelService} from "../services/adminServices.js";



export const adminLoginPage=(req,res)=>{
     console.log("login page executing")
    res.render("admin-signin-page",{error:null})
}

export const loginAdmin=async(req,res)=>{
    const {email,password}=req.body
    const result=await loginServices(email,password)
    if(result.success){
        console.log("redirect  to dash")
        req.session.adminEmail=email
        return res.redirect("/admin/dashboard")
    }else{
        res.render("admin-signin-page",{error:result.error})
    }
    
}

export const adminDashboard = async (req, res) => {
    console.log(req.path)
  const page = parseInt(req.query.page) || 1
  const search = req.query.search || ""
  const result = await userDetails(page, search)

  if (result.success) {
    res.render("admin-dashboard", {
      users: result.users,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      search,
      currentSideBar:"users",
      cancelDetails:result.cancelDetails
    })
  }
}

export const blockUser = async (req, res) => {
    console.log("block user executed")
    const userId=req.params.id
    const result=await blockUserServices(userId)

    if(!result.success){
     return res.render("admin-dashboard",{error:result.error})
    }

            req.session.alert={
            type:"success",
            message: "user Blocked"
        }
  res.redirect("/admin/userManagement");
}

       
export const unblockUser = async (req, res) => {
        console.log("unblock user executed")
        const userId=req.params.id
            const result=await unblockUserServices(userId)

    if(!result.success){

     return res.render("admin-dashboard",{error:result.error})

        }

            req.session.alert={
                type:"success",
                message: "user unBlocked"
            }

    return res.redirect("/admin/userManagement");

}













export const addProductVariant = async (req, res) => {

    try {
        console.log("post controller")
        const result =await createProductVariant(req.body,req.files);

        if(!result.success){

            return res.render(
                "admin-addvariant",
                {
                    errorMsg: result.message
                }
            );

        }

        return res.redirect(
            `/admin/productVarient/${req.body.productId}`
        );

    } catch(error){

        console.log(error);

        return res.render(
            "admin-addvariant",
            {
                errorMsg: "Something went wrong"
            }
        );

    }

};

export const addProductVariantPage=async (req, res) => {
    try {
        console.log("get add variant page executed")
        const productId=req.params.id
        const result=await addProductVariantPageServices(productId)
        console.log(result)
        if(result.success){
            console.log(result.product._id)
            return res.render("admin-addVariant", {
                product:result.product,
                currentSideBar: "variant",
                errorMsg: null
            })
            
        }
        else{
            return res.redirect("/admin/products")
        }

    } catch (error) {
        console.log(error);
        res.redirect("/admin/products");
    }}


export const addNewProductVariant = async (req, res) => {
    try {
        console.log("post controller")
        const productId = req.params.id;

        await createProductVariant(
            productId,
            req.body
        );

        res.redirect(
            `/admin/productVarient/${productId}`
        );

    } catch (error) {

        console.log(error);
        const productId = req.params.id;
        res.render(
            "admin-addVariant",
            {
                errorMsg: error.message,
                productId
            }
        );

    }

};

export const saveProductVariantController = async (req, res) => {

    try {
        // console.log("saveProductVariantController executing")
        console.log("this if from controller",req.files);
        const result = await saveProductVariantService(req.body,req.files);
        console.log("productId from req.body",req.body.productId)
        console.log("SERVICE RESULT:", result)
        if (!result.success) {
             console.log("❌ FAILED VARIANT CREATION")
            return res.json({success:false,errorMsg: result.message,product:result.product,currentSideBar: "variant"});
        }
        // return res.redirect( `/admin/productVariant/${req.body.productId}`);
        console.log("✅ CONTROLLER SUCCESS")

        return res.json({
        success: true,
         productId: req.body.productId
});
    } catch (error) {
      console.log("ERROR TYPE:", typeof error);
        console.log("ERROR:", error);
        console.log("ERROR STRING:", String(error))

           return res.status(500).json({
            success: false,
            errorMsg: "Something went wrong"
        });
    }

};

export const editProductVariantPage = async (req,res)=>{

    try{
        console.log("executing editProductVariant")
        const varaintId=req.params.id
        const result=await editProductVariantPageServices(varaintId)
        console.log(result.success)
        if(result.success){
        res.render("admin-editVariant",{product:result.product,variant:result.variant,currentSideBar:"variant",errorMsg:null});
         }
        else{
            req.session.alert={
                type:"error",
                message:"cannot edit variant ,try again later"
            }
            return res.redirect("/admin/product/products")
        }

    }catch(error){

        console.log(error);

        res.redirect("/admin/product/products");

    }

}

export const updateProductVariantController = async (req, res) => {
    try {
        console.log("CONTROLLER OF UPDATEVARAIANT")
        const result = await updateProductVariantService(
            req.params.id,
            req.body,
            req.files
        );

                if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        return res.json({
            success: true,
            productId: result.productId
        })

    } catch (error) {
        console.log(error);
        return res.redirect("/admin/products");
    }
};
export const productVarientPage=async (req, res) => {

    console.log("product variant executed");

    const productId = req.params.id;

    const page = Number(req.query.page) || 1;

const result=await productVarientPageServices(productId,page)

        if(result.success){

            res.render("admin-productvariant", {
                product:result.product,
                variants:result.variants,
                currentPage: page,
                totalPages:result.product,
                currentSideBar: "variant"
            });

        }
}

export const activateProductVariantController = async (req, res) => {

    try {

        const productId =await activateProductVariantService(req.params.id);
        res.redirect(`/admin/productVariant/${productId}`);

    } catch (error) {

        console.log(error);

        res.redirect("/admin/products");

    }

};

export const deactivateProductVariantController = async (req, res) => {

    try {

        const productId =await deactivateProductVariantService(req.params.id);

        res.redirect(`/admin/productVariant/${productId}`);

    } catch (error) {

        console.log(error);

        res.redirect("/admin/products");

    }

};

export const logout=(req, res) => {

    console.log("Before destroy:", req.session.adminEmail)

    req.session.destroy((err) => {

        if (err) {
            console.log("Logout error:", err)
            return res.redirect("/admin/dashboard")
        }
        res.clearCookie("connect.sid")
        console.log("session destroyed redirecting to signin page")
        return res.redirect("/admin/login")

    })
}




export const adminOrdersController = async(req,res)=>{

    try{
        const {search,sort="newest",status="",page=1} = req.query;

        const result = await adminOrdersService({search,sort,status,page:Number(page)});
// console.log("result->",result.orders)
        res.render("admin-orders",{

            orders:result.orders,
            currentPage:result.currentPage,
            totalPages:result.totalPages,
            search:search || "",
              sort,
            status,
            currentSideBar:"orders"
        });

    }catch(error){
        console.log(error);
        res.status(500).send("Server Error");
    }
};

export const adminOrderDetailsController = async(req,res)=>{

    try{

        const orderId=req.params.id;
        const result=await adminOrderDetailsService(orderId);

        if(result.success){
            res.render("admin-order-details",{order:result.order,currentSideBar:"orders"})
        }else{
            console.log("sucess false from the order details controller",result)
            res.redirect("/admin/orders");
        }
    }catch(error){
        console.log("Admin order details error:",error);
        res.redirect("/admin/orders");
    }
}

export const adminUpdateOrderStatusController = async (req, res) => {

    try {
        console.log("order changing controller")
        const orderId = req.params.id;

        const { status } = req.body;

        const result = await updateOrderStatusService(orderId, status);

        if (result.success) {

            return res.redirect(`/admin/orders/${orderId}`);

        }

            req.session.alert={
                type:"error",
                message:result?.message
            }
        return res.redirect(`/admin/orders/${orderId}`);

    } catch (error) {

        console.log(error);

        return res.redirect(`/admin/orders/${req.params.id}`);

    }

}

export const adminPaymentStatusController=async(req,res)=>{

try{

const orderId=req.params.id;

const {paymentStatus}=req.body;


const result=await updatePaymentStatusService(orderId,paymentStatus);


    if(result.success){
        return res.redirect(`/admin/orders/${orderId}`);
    }
    req.session.alert={
        type:"error",
        message:result.message
    }
    return res.redirect(`/admin/orders/${orderId}`);

    }catch(error){

    console.log(error);

    return res.redirect(`/admin/orders/${req.params.id}`);

    }

}


export const adminReturnAcceptController = async (req, res) => {
    try {

        const { orderId, itemId } = req.params;

        const result = await adminReturnAcceptService(
            orderId,
            itemId
        );

        if(result.success){
            return res.redirect(`/admin/orders/${orderId}`);
        }

        res.redirect(`/admin/orders/${orderId}`);

    } catch (error) {

        console.log(error);

        res.redirect(`/admin/orders/${req.params.orderId}`);

    }
}

export const adminReturnRejectController = async (req,res)=>{

    try{

        const {orderId,itemId}=req.params;

        await adminReturnRejectService(orderId,itemId);

        res.redirect(`/admin/orders/${orderId}`);

    }catch(error){

        console.log(error);

        res.redirect(`/admin/orders/${req.params.orderId}`);

    }

}

export const adminCancelAcceptController = async(req,res)=>{

    try{

        const {orderId,itemId}=req.params;

        await adminCancelAcceptService(orderId,itemId);

        res.redirect(`/admin/orders/${orderId}`);

    }catch(error){

        console.log(error);

        res.redirect(`/admin/orders/${req.params.orderId}`);

    }

}

export const adminCancelRejectController = async(req,res)=>{

    try{

        const {orderId,itemId}=req.params;

        await adminCancelRejectService(orderId,itemId);

        res.redirect(`/admin/orders/${orderId}`);

    }catch(error){

        console.log(error);

        res.redirect(`/admin/orders/${req.params.orderId}`);

    }

}






export const adminDownloadInvoiceController = async (req, res) => {

    try {

        const orderId = req.params.orderId;

        const order = await downloadInvoiceService(orderId);

        if (!order) {
            return res.status(404).send("Order not found");
        }

        generateInvoicePDF(order, res);

    } catch (error) {

        console.log(error);

        res.status(500).send(error.message);

    }

};


export const adminCouponPage=(req,res)=>{
    res.render("addCoupon",{currentSideBar:"coupons"})
}

export const adminCouponController = async (req, res) => {

    try {

        const {
            couponCode,
            discountType,
            discountValue,
            minimumCartValue,
            usageLimit,
            isActive,
            expiryDate
        } = req.body;

        console.log(
            couponCode,
            discountType,
            discountValue,
            minimumCartValue,
            usageLimit,
            isActive,
            expiryDate
        );

        const result = await adminCouponServices({
            couponCode,
            discountType,
            discountValue,
            minimumCartValue,
            usageLimit,
            isActive,
            expiryDate
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(201).json({
            success: true,
            message: "Coupon created successfully"
        });

    } catch (error) {

        console.log("Error in adminCouponController:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating coupon"
        });
    }
};


export const adminCouponsController = async (req, res) => {

    try {

        const page = Number(req.query.page) || 1;
        const search=req.query.search||""
        const status=req.query.status||""
        const discountType=req.query.discountType||""

        const result = await getAllCouponsService(page,search,status,discountType);
// console.log(result)

        if (!result.success) {

            req.session.alert = {
                type: "error",
                message: result.message
            };

            return res.redirect("/admin/dashboard");
        }

        return res.render("coupons", {

            coupons: result.coupons,

            currentPage: result.currentPage,

            totalPages: result.totalPages,

            currentSideBar: "coupons",
            search

        });

    } catch (error) {

        console.log("Error in adminCouponController:", error);

        req.session.alert = {
            type: "error",
            message: "Something went wrong while fetching coupons"
        };

        return res.redirect("/admin/dashboard");
    }
};



export const createOffer = async (req, res) => {

    try {

        const {
            offerName,
            offerType,
            productIds,
            categoryIds,
            discountPercentage,
            endDate,
            isActive
        } = req.body;

        console.log(          offerName,
            offerType,
            productIds,
            categoryIds,
            discountPercentage,
            endDate,
            isActive)

        const result = await adminOfferServices({

            offerName,
            offerType,
            productIds,
            categoryIds,
            discountPercentage,
            endDate,
            isActive

        });


        if (!result.success) {





            return res.status(400).render(
                "admin/createOffer",
                {

                    offerName,
                    offerType,
                    productIds,
                    categoryIds,
                    discountPercentage,
                    endDate,
                    isActive,

                    products:result.products,
                    categories:result.categories,

                    currentSideBar: "offers",

                    error: result.message

                }
            );

        }

        req.session.alert ={
            info:"success",
            message:"offer created succesfully"
        }
        return res.redirect(
            "/admin/offers/list"
        );


    } catch (error) {

        console.log(
            "Error in createOffer:",
            error
        );


        return res.status(500).send(
            "Internal Server Error"
        );

    }

};

export const getCreateOfferPage = async (req, res) => {

    try {

        const result= await getCreateOfferPageServices()


if(result.success){
console.log(result.products)
        return res.render("create-Offer",
            {
                categories:result.categories,
                products:result.products,
                productIds:result.productIds,
                categoryIds:result.categoryIds,
                currentSideBar: "offers"
            }
        );

    }else{

        req.session.alert={
            type:"error",
            message:"error in fetching categories and products id's"
        }
        res.redirect("/offers/list")

    }


    } catch (error) {

        console.log(
            "Error loading create offer page:",
            error
        );


        return res.status(500).send(
            "Internal Server Error"
        );

    }

};




export const getAllOffers = async (req, res) => {

    try {
        const page=Number(req.query.page)||1
        const result =
            await getAllOffersService(page);


        if (!result.success) {

            return res.status(500).render(
                "admin/offers",
                {
                    offers: [],
                    currentSideBar: "offers",
                    error: result.message,
                    totalPages:result.totalPages||1
                }
            );

        }


        return res.render(
            "offers-listing",
            {
                offers: result.offers,
                currentSideBar: "offers",
                totalPages:result.totalPages||1,
                currentPage:result.currentPage||1
            }
        );


    } catch (error) {

        console.log(
            "Error in getAllOffers controller:",
            error
        );


        return res.status(500).send(
            "Internal Server Error"
        );

    }

};

// =====================================================
// GET EDIT OFFER PAGE
// =====================================================

export const getEditOfferPage = async (req, res) => {

    try {

        const { id } =
            req.params;
console.log(`the edit route is hit the controller is`)

        const result =
            await getEditOfferService(id);


        if (!result.success) {

            return res.status(404).redirect(
                `/admin/offers/${id}`
            );

        }


        return res.render(
            "edit-Offer",
            {
                offer: result.offer,

                products: result.products,
                productIds:result.productIds,
                categoryIds:result.categoryIds,
                categories: result.categories,

                currentSideBar: "offers"
            }
        );


    } catch (error) {

        console.log(
            "Error in getEditOfferPage:",
            error
        );


        return res.status(500).send(
            "Internal Server Error"
        );

    }

};


// =====================================================
// UPDATE OFFER
// =====================================================

export const updateOffer = async (req, res) => {

    try {

        console.log("update offer controller executed...");

        const { id } = req.params;

        const {
            offerName,
            offerType,
            productIds,
            categoryIds,
            discountPercentage,
            endDate,
            isActive
        } = req.body;


        // =============================================
        // UPDATE OFFER SERVICE
        // =============================================

        const result = await updateOfferService({

            offerId: id,

            offerName,

            offerType,

            productIds,

            categoryIds,

            discountPercentage,

            endDate,

            isActive

        });


        // =============================================
        // IF UPDATE FAILED
        // =============================================

        if (!result.success) {

            console.log(
                "success is false, the result is ",
                result
            );


            const editData =
                await getEditOfferService(id);


            // Normalize values so the edit page
            // can show the selected checkboxes again

            const selectedProductIds =Array.isArray(productIds)
                    ? productIds
                    : productIds
                        ? [productIds]
                        : [];


            const selectedCategoryIds =
                Array.isArray(categoryIds)
                    ? categoryIds
                    : categoryIds
                        ? [categoryIds]
                        : [];


            return res.status(400).render(
                "edit-Offer",
                {

                    offer: {

                        _id: id,
                        offerName,
                        offerType,
                        productId:selectedProductIds,
                        categoryId:selectedCategoryIds,
                        discountPercentage,
                        endDate,
                        isActive

                    },

                    products:editData.products,

                    categories:editData.categories,

                    productIds:selectedProductIds,

                    categoryIds:selectedCategoryIds,

                    currentSideBar:"offers",

                    error: result.message

                }
            );

        }


        // =============================================
        // SUCCESS
        // =============================================

        return res.redirect(
            "/admin/offers/list"
        );


    } catch (error) {

        console.log(
            "catch block in updateOffer controller executed"
        );

        console.log(
            "Error in updateOffer:",
            error
        );


        return res.status(500).send(
            "Internal Server Error"
        );

    }

};


// =====================================================
// DELETE OFFER
// =====================================================

export const deleteOffer = async (req, res) => {

    try {

        const { id } = req.params;


        const result = await deleteOfferService(id);


        if (!result.success) {

            return res.status(404).send(
                result.message
            );

        }

                    req.session.alert={
                type:"success",
                message:"offer status is changed to  inactive"
            }

        return res.redirect("/admin/offers/list");


    } catch (error) {

        console.log(
            "Error in deleteOffer:",
            error
        );


        return res.status(500).send(
            "Internal Server Error"
        );

    }

};






export const getSalesReport = async (req, res) => {

    try {

        const {
            filter,
            startDate,
            endDate
        } = req.query;



        const report =
            await getSalesReportService(
                filter,
                startDate,
                endDate
            );


        return res.render("salesReport", {

            report: report,
            orders:report.orders,
            selectedFilter: filter || "today",

            startDate: startDate || "",

            endDate: endDate || "",
            currentSideBar: "salesReport"

        });


    } catch (error) {

        console.error(
            "Error loading sales report:",
            error
        );

        return res.status(500).send(
            "Unable to load sales report"
        );

    }

};









// ==================================================
// DELETE COUPON CONTROLLER
// ==================================================


export const adminDashboardController = async (req, res) => {
    try {

        let filter = req.query.filter || "yearly";

        const allowedFilters = [
            "yearly",
            "monthly",
            "weekly",
            "daily"
        ];

        if (!allowedFilters.includes(filter)) {
            filter = "yearly";
        }

        const result = await getAdminDashboardService(filter);

        console.log("result from service -->", result);

        return res.render("dashboard", {
            currentSideBar: "dashboard",
            error: null,

            dashboard: result
        });

    } catch (error) {

        console.log("Dashboard Controller Error:", error);

        return res.status(500).render("dashboard", {

            currentSideBar: "dashboard",

            error: "Something went wrong while loading dashboard.",

            dashboard: {
                filter: "yearly",

                totalOrders: 0,
                totalUsers: 0,
                totalItems: 0,

                chart: {
                    labels: [],
                    sales: []
                },

                bestSellingProducts: [],
                bestSellingBrands: []
            }
        });
    }
};


export const adminDeleteCouponController = async (req,res) => {

    try {
console.log("delete controller exeuted")
        const couponId =req.params.id;


        const result =await deleteCouponService(couponId);


        if (!result.success) {

            req.session.alert = {

                type: "error",

                message: result.message

            };

                req.session.alert={
                 type: "success",
                message: result.message

                }
            return res.redirect(
                "/admin/coupons"
            );

        }


        return res.status(200).json({

            type: "success",

            message: "Coupon deleted successfully"

        });


       

    }

    catch (error) {

        console.log(
            "Error in adminDeleteCouponController:",
            error
        );


        req.session.alert = {

            type: "error",

            message: "Something went wrong while deleting coupon"

        };


        return res.redirect(
            "/admin/coupons"
        );

    }

};



// =====================================================
// SALES REPORT PDF
// =====================================================




export const downloadSalesReportPDF = async (req, res) => {

    try {

        const {
            filter,
            startDate,
            endDate
        } = req.query;

        const report =
            await getSalesReportPDFService(
                filter,
                startDate,
                endDate
            );

        generateSalesReportPDF(
            report,
            res
        );

    }  catch (error) {

        console.error(
            "Error generating sales report PDF:",
            error
        );


        if (!res.headersSent) {

            return res.status(500).send(
                "Unable to generate PDF"
            );

        }

    }

};





export const downloadSalesReportExcel = async (req, res) => {

    try {

        const {
            filter,
            startDate,
            endDate
        } = req.query;


        const buffer =
            await generateSalesReportExcelService(
                filter,
                startDate,
                endDate
            );


        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=sales-report.xlsx"
        );


        return res.send(buffer);

    } catch (error) {

        console.error(
            "Error generating Excel:",
            error
        );

        if (!res.headersSent) {

            return res
                .status(500)
                .send("Unable to generate Excel");

        }

    }

};

export const adminEditCouponController=async(req,res)=>{
    const couponId=req.params.id
    const result=await adminEditCouponServices(couponId)

    if(!result.success){

        return{result}
    }
    res.render("editCoupon",{Coupon:result.coupon,currentSideBar:"Coupon"})
}


export const adminPostEditCouponController=async(req,res)=>{
    const couponId=req.params.id

            const {
            couponCode,
            discountType,
            discountValue,
            minimumCartValue,
            usageLimit,
            isActive,
            expiryDate
        } = req.body;

console.log("status",isActive)

        const result=await adminPostEditCouponServices( {couponId,couponCode,
            discountType,
            discountValue,
            minimumCartValue,
            usageLimit,
            isActive,
            expiryDate})
console.log(result)

            if(!result.success){


                return res.status(400).send({
                    currentSideBar:"Coupon",
                    success:false,
                    message:result.message,
                    Coupon:result.coupon
                })
            }
            else{


                return res.send({success:true})
            }

}