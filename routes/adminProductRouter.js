import express from "express"
const Router=express.Router()
import { Checksession } from "../middleware/AdminAuth.js"
import {getProducts,getAddProductPage,addProduct,getEditProductPage,updateProduct,activateProduct,deactivateProduct} from "../controller/adminproductController.js"
Router.get("/products",Checksession,getProducts)
Router.get("/addProduct",Checksession,getAddProductPage)
Router.post("/addProduct",Checksession,addProduct)
Router.get("/editProduct/:id",Checksession, getEditProductPage)
Router.post("/editProduct/:id",Checksession,updateProduct)
Router.post("/activateProduct/:id",Checksession,activateProduct)
Router.post("/deactivateProduct/:id",Checksession,deactivateProduct)

export default Router