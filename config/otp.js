// import dotenv from "dotenv"
// dotenv.config({path:"./env/.env"})
import "dotenv/config"

import nodemailer from "nodemailer";

export const sendMail = async (to, subject, text) => {
    try{
        console.log(process.env.MAIL_USER)
        console.log(process.env.MAIL_PASS? "yes hidden":"no not yet")
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  })
  console.log("to",to)
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    text
  })
}
    catch(error){
        console.log(error)
}
};



// {search,sort,page,category,brand,color,price}



// export const getProductsList=async(search,sort,page,category,brand,color,price)=>{

// const searchQueryCategory{}

// if(search&&!brand){
// searchQueryCategory.brand={$regex:new Regexp("^",search,"$","i")}
// }

// const ExistInCategory=await category.find({category,searchQueryCategory})
// }