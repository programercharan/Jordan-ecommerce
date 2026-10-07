import express from "express"
// import { Checksession } from "../middleware/AdminAuth.js"
import { Checksession} from "../middleware/AdminAuth.js"
  import {addCategory,getEditCategoryPage,updateCategory,activateCategory,deactivateCategory,getCategories,getAddCategory} from "../controller/adminCategoryController.js"
const Router=express.Router()

Router.get("/categories",Checksession,getCategories)
Router.get("/addCategory",Checksession,getAddCategory)
Router.post("/addCategory",Checksession,addCategory)
Router.get("/editCategory/:id",Checksession,getEditCategoryPage)
Router.post("/editCategory/:id",Checksession,updateCategory)
Router.post("/activateCategory/:id",Checksession,activateCategory)
Router.post("/deactivateCategory/:id",Checksession,deactivateCategory)


export default Router