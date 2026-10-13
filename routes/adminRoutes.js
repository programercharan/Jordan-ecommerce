import express from "express"
import upload from "../config/multer.js";
import variantUpload from "../middleware/variantUpload.js"

const Router = express.Router()
 import{adminLoginPage,loginAdmin,adminDashboard,blockUser,unblockUser,addProductVariantPage,adminCouponsController,
    saveProductVariantController,editProductVariantPage,updateProductVariantController,productVarientPage,adminPostEditCouponController,
    activateProductVariantController,deactivateProductVariantController,adminOrdersController,adminOrderDetailsController,
    adminUpdateOrderStatusController,adminPaymentStatusController,logout,adminReturnAcceptController,adminReturnRejectController,
    adminCancelAcceptController,adminCancelRejectController,adminDownloadInvoiceController,adminCouponPage,adminCouponController,createOffer,getCreateOfferPage,
    getAllOffers,  getEditOfferPage, updateOffer,deleteOffer,getSalesReport,adminDashboardController,adminDeleteCouponController,  downloadSalesReportPDF,
    downloadSalesReportExcel,adminEditCouponController}  from "../controller/adminController.js"


import { restrictPage,Checksession} from "../middleware/AdminAuth.js"
Router.get("/login",restrictPage,adminLoginPage)
Router.post("/login",loginAdmin)
Router.get("/userManagement",Checksession,adminDashboard)
Router.post("/block/:id", blockUser);
Router.post("/unblock/:id", unblockUser);


Router.get("/addproductVariant/:id",Checksession,addProductVariantPage)
Router.get("/productVariant/:id",Checksession,productVarientPage)




Router.post("/addProductVarient",Checksession, variantUpload.array("images", 4),saveProductVariantController)
Router.get("/editExistingProductVarient/:id",Checksession,editProductVariantPage);
Router.post("/editExistingProductVarient/:id",Checksession, variantUpload.array("images", 4),updateProductVariantController);
Router.post("/activateExistingProductVarient/:id",Checksession,activateProductVariantController);
Router.post("/deactivateExistingProductVarient/:id",Checksession,deactivateProductVariantController);


Router.get("/orders",Checksession,adminOrdersController);
Router.get("/orders/:id",Checksession,adminOrderDetailsController);
Router.post("/orders/status/:id",Checksession,adminUpdateOrderStatusController);
Router.post("/orders/payment-status/:id",Checksession,adminPaymentStatusController);

//return
Router.post("/orders/return/accept/:orderId/:itemId",Checksession,adminReturnAcceptController);
Router.post("/orders/return/reject/:orderId/:itemId",Checksession,adminReturnRejectController);

Router.post("/orders/cancel/accept/:orderId/:itemId",Checksession,adminCancelAcceptController);
Router.post("/orders/cancel/reject/:orderId/:itemId",Checksession,adminCancelRejectController);
Router.get("/orders/invoice/:orderId",Checksession,adminDownloadInvoiceController);

Router.get("/coupons",Checksession, adminCouponsController);
Router.get("/coupon/add",Checksession,adminCouponPage)
Router.post("/coupons/add",Checksession,adminCouponController)
Router.post( "/coupons/delete/:id",Checksession, adminDeleteCouponController);
Router.get("/coupons/edit/:id",Checksession,adminEditCouponController)
Router.post("/coupons/edit/:id",Checksession,adminPostEditCouponController)

Router.get("/sales-report",Checksession, getSalesReport);
Router.get("/sales-report/pdf",Checksession,downloadSalesReportPDF);
Router.get("/sales-report/excel",Checksession,downloadSalesReportExcel);

Router.get( "/dashboard", Checksession,adminDashboardController );

Router.get("/offers/list",Checksession,getAllOffers);//offer listing page
Router.get("/offers",Checksession,getCreateOfferPage);//create offer page (GET method)
Router.post("/offers/create",createOffer);//create offer page (POST method)
Router.get( "/offers/edit/:id",Checksession,getEditOfferPage);
// UPDATE OFFER
Router.post("/offers/edit/:id",Checksession,updateOffer);
// DELETE OFFER
Router.post("/offers/delete/:id",Checksession,deleteOffer);




Router.get("/logout", logout)








export default Router