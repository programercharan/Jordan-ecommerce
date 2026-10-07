import Category from "../models/category.model.js"


export const addNewCategory=async(categoryName,description,list)=>{
    console.log("add category service executing....")
    console.log(categoryName)
const existing=await Category.findOne({categoryName:{$regex:new RegExp(`^${categoryName}$`,"i")}})
console.log("exisitng..?",existing)
if(!existing){
    const  newCategory=new Category({categoryName,description,list})
    await newCategory.save()
    return {success:true}
}else{
return{success:false,errormsg:"category already exist"}
}
}

export const getCategoryById = async(categoryId)=>{

    const categoryData = await Category.findById(categoryId)

    if(!categoryData){
        return {
            success:false
        }
    }

    return {
        success:true,
        category: categoryData
    }
}

export const editCategory = async(
    categoryId,
    categoryName,
    description,
    list
)=>{

    const existing = await Category.findOne({
        categoryName:{$regex:new RegExp("^"+categoryName+"$","i")},
        _id:{$ne:categoryId}
    })

    if(existing){
        return {
            success:false,
            errorMsg:"Category Already Exists"
        }
    }

    await Category.findByIdAndUpdate(categoryId,{categoryName,description,list})

    return {
        success:true
    }
}

export const activateCategoryService = async (categoryId) => {
await Category.findByIdAndUpdate(categoryId,{list: true})
return {
    success: true
}
}

export const deactivateCategoryService = async (categoryId) => {
await Category.findByIdAndUpdate(categoryId,{list: false})
return {
    success: true
}
}

export const getAllCategories = async (search,sort,page) => {
    console.log("servoice executing")
    const limit = 3
    const skip = (page - 1) * limit
    let sortOption = {createdAt: -1}

    if(sort === "Newest First"){
        sortOption = { createdAt: -1 }
    }else if(sort === "Oldest First"){
        sortOption = { createdAt: 1 }
    }else if(sort === "A - Z"){
        sortOption = { categoryName: 1 }
    }else if(sort === "Z - A"){
        sortOption = { categoryName: -1 }
    }

    const categories = (await Category.find({categoryName:{$regex: search,$options:"i"}}).sort(sortOption).skip(skip).limit(limit))

    const totalCategories = await Category.countDocuments({categoryName:{$regex: search,$options:"i"}})

    const totalPages = Math.ceil(totalCategories / limit)

    return {success: true,categories,totalPages}
}