import User from "../models/user.model.js";
import bcrypt from "bcrypt"

export const restrictPage = (req, res, next) => {
    if(req.session.adminEmail && req.path==="/login") {
        console.log("middleware when <- is clicked ")
        return res.redirect("/admin/dashboard")
    } else{
    console.log(req.session.email+"  is it? email ")
        next()
    }
}


export const Checksession = (req, res, next) => {

    if(!req.session.adminEmail){
       return  res.redirect("/admin/login")
    }
    console.log("session exist",req.session.adminEmail)
    next()
}

export const createAdmin = async () => {
  const existing = await User.findOne({ email: "admin@gmail.com" });

  if (existing) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("AdminLogin@123", 10);

  await User.create({
    email: "admin@gmail.com",
    password: hashedPassword,
    role: "admin"
  });

  console.log("Admin created");
};