import User from "../models/user.model.js";

export const blockCheckMiddleware= async(req,res,next)=>{
  console.log("middleware to check userId in session",req.session.userId,req.originalUrl)

  const userId=req.session.userId||null

  if(userId){
    const user=await User.findOne({_id:userId})

    if(user.isBlocked && user.role==="user"){
      return req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.redirect("/user/login");
      });
    }
  }  

  next()


};