import{addNewCategory,getCategoryById,editCategory,activateCategoryService,deactivateCategoryService,getAllCategories} from "../services/adminCategoryService.js"

export const getCategories = async (req,res) => {
    const search = req.query.search || ""
    const sort = req.query.sort || ""
    const page = Number(req.query.page) || 1
    const result = await getAllCategories(search,sort,page)
    res.render("admin-category",{
        categories: result.categories,
        currentPage: page,
        totalPages: result.totalPages,
        search,
        sort,
        currentSideBar:"Category"
    })

}

export const addCategory=async(req,res)=>{
    const {categoryName,description,list}=req.body
    const result=await addNewCategory(categoryName,description,list)
    if(result.success){
    req.session.alert={
         type:"success",
         message: "Category Added Sucessfully"
    }
    res.redirect("/admin/category/categories")    }
    else{
     req.session.alert={
         type:"error",
         message: "category already exist"
    }
    res.redirect("/admin/category/categories")   
    }
}

export const getEditCategoryPage = async(req,res)=>{

    const categoryId = req.params.id

    const result = await getCategoryById(categoryId)

    if(result.success){
        res.render("edit-category",{
            category: result.category,
            currentSideBar:"Category"
        })
    }else{
        res.redirect("/admin/categories")
    }
}

export const updateCategory = async(req,res)=>{

    const categoryId = req.params.id

    const {categoryName,description,list} = req.body

    const result = await editCategory(categoryId,categoryName,description,list)

    if(result.success){

        req.session.alert={
            type:"success",
            message:"Category Updated Successfully"
        }

        return res.redirect("/admin/category/categories")
    }
    console.log(result)
    req.session.alert={
        type:"error",
        message: result.errorMsg
    }

    res.redirect(`/admin/category/editCategory/${categoryId}`)
}


export const activateCategory = async (req, res) => {
const categoryId = req.params.id
const page=req.query.page
console.log("page",page)
await activateCategoryService(categoryId)

req.session.alert = {
    type: "success",
    message: "Category Activated Successfully"
}

res.redirect(`/admin/category/categories?page=${page}`)
}

export const deactivateCategory = async (req, res) => {
const categoryId = req.params.id
const page=req.query.page
console.log("page",page)
await deactivateCategoryService(categoryId)

req.session.alert = {
    type: "success",
    message: "Category Deactivated Successfully"
}

// res.redirect("/admin/category/categories")
res.redirect(`/admin/category/categories?page=${page}`)
}

export const getAddCategory=(req,res)=>{
    res.render("admin-addCategory",{currentSideBar:"category"})
}