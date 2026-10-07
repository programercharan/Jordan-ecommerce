import Product from "../models/product.model.js"
import Category from "../models/category.model.js"


export const getAllProducts = async(
    search,
    sort,
    page
)=>{

    const limit = 10

    const skip =(page - 1) * limit

    let sortOption = {createdAt:-1}

    if(sort === "Newest First"){

        sortOption = {
            createdAt:-1
        }

    }else if(sort === "Oldest First"){

        sortOption = {
            createdAt:1
        }

    }else if(sort === "A - Z"){

        sortOption = {
            name:1
        }

    }else if(sort === "Z - A"){

        sortOption = {
            name:-1
        }

    }

    const searchQuery = {
        
        $or:[

            {
                name:{
                    $regex:search,
                    $options:"i"
                }
            },

            {
                brand:{
                    $regex:search,
                    $options:"i"
                }
            },
            {
                gender:{
                    $regex:search,
                    $options:"i"
                }
                // gender:"women"
            }
            
        ]

    }
console.log(JSON.stringify(searchQuery))
    const products =await Product.find(searchQuery).populate("categoryId").sort(sortOption).skip(skip).limit(limit)
    console.log("products->",products)
    const totalProducts =await Product.countDocuments(searchQuery)

    const totalPages =Math.ceil(totalProducts / limit)

    return {
        success:true,
        products,
        totalPages
    }

}

export const getCategoriesForProduct =async()=>{

    const categories =await Category.find({list:true})
    return categories
}

export const addNewProduct = async(categoryId,name,description,brand,gender,stockStatus,list)=>{

    const existing =await Product.findOne({name:{$regex:new RegExp(`^${name}$`,"i")},gender:{$regex:new RegExp(`^${gender}$`,"i")}})
console.log("existing-->",existing)
    if(existing){

        return {

            success:false,
            errorMsg:
            "Product Already Exists"

        }

    }

    const newProduct =new Product({categoryId,name,description, brand,gender,stockStatus,list})
    await newProduct.save()

    return {

        success:true

    }

}

export const getProductById =async(productId)=>{

    const product =await Product.findById(productId)

    if(!product){

        return {
            success:false
        }
    }

    return {

        success:true,
        product

    }

}

export const editProduct = async(productId,categoryId,name,description,brand,gender,stockStatus,list)=>{

    const existing =await Product.findOne({name, _id:{$ne:productId}})

    if(existing){

        return {

            success:false,
            errorMsg: "Product Already Exists"

        }

    }

    await Product.findByIdAndUpdate( productId,{categoryId,name,description,brand,gender,stockStatus,list})

    return {
        success:true
    }

}

export const activateProductService =async(productId)=>{

    await Product.findByIdAndUpdate(productId,{list:true})

    return {

        success:true

    }

}

export const deactivateProductService =async(productId)=>{

    await Product.findByIdAndUpdate( productId,{list:false})

    return {

        success:true

    }

}