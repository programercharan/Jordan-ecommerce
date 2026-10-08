import {getAllProducts,addNewProduct,getProductById,getCategoriesForProduct,editProduct,activateProductService,deactivateProductService} from "../services/adminProductServices.js"

export const getProducts =async(req,res)=>{

    const search =req.query.search || ""
console.log("serarch->",search)
    const sort =req.query.sort || ""

    const page =Number(req.query.page) || 1

    const result =await getAllProducts(search,sort,page)

    res.render(
        "admin-products",
        {
            products:result.products,
            currentPage:page,
            totalPages:result.totalPages,
            search,sort,currentSideBar:"products"

        }
    )

}

export const getAddProductPage =async(req,res)=>{

    console.log("rendering the add product page")
    const categories =await getCategoriesForProduct()

    res.render("admin-addproduct",{categories,currentSideBar:"products"})

}

export const addProduct =async(req,res)=>{
    console.log("add product variant executed")

    const {categoryId,name,description,brand,gender,stockStatus,list} = req.body
    console.log("name--->",name)
    const result =await addNewProduct(categoryId,name,description,brand,gender,stockStatus,list)

    if(result.success){
        req.session.alert = {
            type:"success",
            message:
            "Product Added Successfully"
        }
        return res.redirect(
            "/admin/product/products"
        )
    }
    req.session.alert = {
        type:"error",
        message:
        result.errorMsg
    }
    res.redirect(
        "/admin/product/products"
    )

}

export const getEditProductPage =async(req,res)=>{
    const productId = req.params.id
    const result =await getProductById(productId)
    const categories =await getCategoriesForProduct()
    if(result.success){
        return res.render("edit-product",{product:result.product,categories,currentSideBar:"products"})
    }
    res.redirect("/admin/product/products")
}

export const updateProduct =async(req,res)=>{
    console.log("update controleer working...")
    const productId =req.params.id

    const {categoryId,name,description,brand,gender,stockStatus,list} = req.body
    const result =await editProduct(productId,categoryId,name,description,brand,gender,stockStatus,list)
    if(result.success){
        req.session.alert = {
            type:"success",
            message:
            "Product Updated Successfully"
        }
        return res.redirect(
            "/admin/product/products"
        )

    }

    req.session.alert = {

        type:"error",
        message:result.errorMsg

    }

    res.redirect(
        `/admin/product/editProduct/${productId}`
    )

}

export const activateProduct =async(req,res)=>{

    await activateProductService(
        req.params.id
    )

    req.session.alert = {

        type:"success",
        message:
        "Product Activated"

    }

    res.redirect(
        "/admin/product/products"
    )

}

export const deactivateProduct =async(req,res)=>{

    await deactivateProductService(
        req.params.id
    )

    req.session.alert = {

        type:"success",
        message:
        "Product Deactivated"

    }

    res.redirect(
        "/admin/product/products"
    )

}
